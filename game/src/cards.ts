import { Card, Suit, Rank } from "./model"

export type HandType =
    | "invalid"
    | "straight-flush"
    | "four-of-a-kind"
    | "full-house"
    | "flush"
    | "straight"
    | "three-of-a-kind"
    | "two-pair"
    | "one-pair"
    | "high-card"

export function isHandType(val: unknown): val is HandType {
    return (
        typeof val === "string" &&
        (val === "invalid" ||
            val === "straight-flush" ||
            val === "four-of-a-kind" ||
            val === "full-house" ||
            val === "flush" ||
            val === "straight" ||
            val === "three-of-a-kind" ||
            val === "two-pair" ||
            val === "one-pair" ||
            val === "high-card")
    )
}

export const rankHand = function (cards: Card[]): [HandType, number, Card[]] {
    if (cards.length < 5 || 7 < cards.length) {
        // Short circuit for invalid lengths
        return ["invalid", BASE_HAND_VALUE["invalid"], []]
    }

    const allCardCombinations = kCombinations(cards, POKER_HAND_SIZE)

    const allHands = allCardCombinations.map(cardsSubset => {
        const hType = handType(cardsSubset)
        const hValue = handValue(cardsSubset, hType)

        return [hType, hValue, cardsSubset] as [HandType, number, Card[]]
    })

    let minHType: HandType = "invalid"
    let minHValue = BASE_HAND_VALUE["invalid"]
    let minHand: Card[] = []

    allHands.forEach(handInfo => {
        if (handInfo[1] < minHValue) {
            minHType = handInfo[0]
            minHValue = handInfo[1]
            minHand = handInfo[2]
        }
    })

    return [minHType, minHValue, minHand]
}

function handType(hand: Card[]): HandType {
    if (isInvalid(hand)) {
        return "invalid"
    }

    const flush = isFlush(hand)
    const straight = isStraight(hand)
    const duplicateReport = countDuplicateHandType(hand)

    if (straight && flush) {
        return "straight-flush"
    }

    if (duplicateReport.quad !== undefined) {
        return "four-of-a-kind"
    }

    if (
        duplicateReport.triple !== undefined &&
        duplicateReport.pairs.length > 0
    ) {
        return "full-house"
    }

    if (flush) {
        return "flush"
    }

    if (straight) {
        return "straight"
    }

    if (duplicateReport.triple !== undefined) {
        return "three-of-a-kind"
    }

    if (duplicateReport.pairs.length > 1) {
        return "two-pair"
    }

    if (duplicateReport.pairs.length > 0) {
        return "one-pair"
    } else {
        return "high-card"
    }
}

function isInvalid(hand: Card[]): boolean {
    return hand.length !== POKER_HAND_SIZE
}

function isFlush(hand: Card[]): boolean {
    return hand.every(card => card.suit === hand[0].suit)
}

function isStraight(hand: Card[]): boolean {
    const sortedHand = hand.sort((a, b) => a.rank - b.rank)

    if (isLowAceStraight(sortedHand)) {
        return true
    }

    // Check that every adjacent card is off by a rank of 1
    return sortedHand.every((card, idx, arr) => {
        if (idx < arr.length - 1) {
            return card.rank + 1 === arr[idx + 1].rank
        } else {
            return true
        }
    })
}

/**
 * Get the ranks of each pair, triple, and quad in a hand.
 *
 * @param hand The hand the analyze.
 */
function countDuplicateHandType(
    hand: Card[]
): { pairs: number[]; triple: number | undefined; quad: number | undefined } {
    const counter: Map<number, number> = new Map()

    hand.forEach(card => {
        const prevCount = counter.get(card.rank)
        if (prevCount) {
            counter.set(card.rank, prevCount + 1)
        } else {
            counter.set(card.rank, 1)
        }
    })

    const pairs: number[] = []
    let triple: number | undefined = undefined
    let quad: number | undefined = undefined

    for (const rank of counter.keys()) {
        const count = counter.get(rank)

        if (!count) {
            continue
        }

        if (count >= 4) {
            quad = rank
        } else if (count >= 3) {
            triple = rank
        } else if (count >= 2) {
            pairs.push(rank)
        }
    }

    return { pairs, triple, quad }
}

const POKER_HAND_SIZE = 5
const MAX_RANK = 14
const RANK_BASE = 14

const HTYPE_SPACE_SIZE = Math.pow(RANK_BASE, POKER_HAND_SIZE)
// loose justification: there are max 5 "degrees of freedom" in a poker hand (less than that actually)
// so clearing out 14 ^ 5 space for each hand type should make sure they never overlap
export const BASE_HAND_VALUE: Record<HandType, number> = {
    "straight-flush": 1 * HTYPE_SPACE_SIZE,
    "four-of-a-kind": 2 * HTYPE_SPACE_SIZE,
    "full-house": 3 * HTYPE_SPACE_SIZE,
    flush: 4 * HTYPE_SPACE_SIZE,
    straight: 5 * HTYPE_SPACE_SIZE,
    "three-of-a-kind": 6 * HTYPE_SPACE_SIZE,
    "two-pair": 7 * HTYPE_SPACE_SIZE,
    "one-pair": 8 * HTYPE_SPACE_SIZE,
    "high-card": 9 * HTYPE_SPACE_SIZE,
    invalid: Number.MAX_SAFE_INTEGER,
}

function handValue(hand: Card[], hType: HandType): number {
    const baseValue = BASE_HAND_VALUE[hType]
    // highest rank card first
    const revSortedHand = sortByInvRank(hand)
    const duplicateReport = countDuplicateHandType(hand)

    if (hType === "straight-flush") {
        const convertedHandRanks = sortByInvRank(convertAceToLow(hand)).map(
            card => card.rank
        )

        return kickerRankValue(...convertedHandRanks) + baseValue
    }

    if (hType === "four-of-a-kind") {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        const quadRank = duplicateReport.quad!
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        const kickerRank = hand.find(card => {
            return card.rank !== quadRank
        })!.rank

        return (
            kickerRankValue(
                quadRank,
                quadRank,
                quadRank,
                quadRank,
                kickerRank
            ) + baseValue
        )
    }

    if (hType === "full-house") {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        const tripleRank = duplicateReport.triple!
        const pairRank = duplicateReport.pairs.sort(
            // Invert the ranking
            (a, b) => b - a
        )[0]

        return (
            kickerRankValue(
                tripleRank,
                tripleRank,
                tripleRank,
                pairRank,
                pairRank
            ) + baseValue
        )
    }

    if (hType === "flush" || hType === "high-card") {
        const convertedHandRanks = revSortedHand.map(card => card.rank)

        return kickerRankValue(...convertedHandRanks) + baseValue
    }

    if (hType === "straight") {
        const convertedHandRanks = sortByInvRank(convertAceToLow(hand)).map(
            card => card.rank
        )

        return kickerRankValue(...convertedHandRanks) + baseValue
    }

    if (hType === "three-of-a-kind") {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        const tripleRank = duplicateReport.triple!

        const kickerRanks = revSortedHand
            .filter(card => card.rank !== tripleRank)
            .map(card => card.rank)

        return (
            kickerRankValue(
                tripleRank,
                tripleRank,
                tripleRank,
                ...kickerRanks
            ) + baseValue
        )
    }

    if (hType === "two-pair") {
        const pairRanks = duplicateReport.pairs.sort(
            // Invert the ranking
            (a, b) => b - a
        )
        const kickerRanks = revSortedHand
            .filter(card => !pairRanks.some(pairRank => pairRank === card.rank))
            .map(card => card.rank)

        return (
            kickerRankValue(
                pairRanks[0],
                pairRanks[0],
                pairRanks[1],
                pairRanks[1],
                ...kickerRanks
            ) + baseValue
        )
    }

    if (hType === "one-pair") {
        const pairRank = duplicateReport.pairs.sort(
            // Invert the ranking
            (a, b) => b - a
        )[0]
        const kickerRanks = revSortedHand
            .filter(card => card.rank !== pairRank)
            .map(card => card.rank)

        return kickerRankValue(pairRank, pairRank, ...kickerRanks) + baseValue
    }

    if (hType === "invalid") {
        return baseValue
    }

    throw new Error(`Unknown hand type: ${hType}`)
}

/**
 * Sort hand from highest ranking card to
 * lowest ranking card. Ace is highest rank.
 *
 * @param hand The hand to sort.
 */
function sortByInvRank(hand: Card[]): Card[] {
    return hand.sort((a, b) => {
        return invRank(a.rank) - invRank(b.rank)
    })
}

/**
 * Convert ranks of cards in winning hand to kicker values hands of the same type can
 * be compared. Higher ranks lead to smaller kicker values. Smaller kicker values beat
 * larger ones.
 *
 * The minimum value of `index n` must be greater than the maximum value of `index
 * n+1`
 *
 * Ex:
 *   idx 0: max = 13 * 14^4, min = 1 * 14^4
 *   idx 1: max = 13 * 14^3, min = 1 * 14^3
 *   idx 2: max = 13 * 14^2, min = 1 * 14^2
 *   idx 3: max = 13 * 14^1, min = 1 * 14^1
 *   idx 4: max = 13 * 14^0, min = 1 * 14^0
 *
 * @param ranks The card ranks to analyze
 */
function kickerRankValue(...ranks: number[]) {
    if (ranks.length !== POKER_HAND_SIZE)
        throw new Error(`Cannot have more than ${POKER_HAND_SIZE} kicker ranks`)

    return ranks.reduce((accum, rank, idx) => {
        return (
            accum +
            (1 + invRank(rank)) * Math.pow(RANK_BASE, POKER_HAND_SIZE - 1 - idx)
        )
    }, 0)
}

function isLowAceStraight(hand: Card[]): boolean {
    const sortedHand = hand.sort((a, b) => a.rank - b.rank)

    return (
        sortedHand[0].rank === Rank.Two &&
        sortedHand[1].rank === Rank.Three &&
        sortedHand[2].rank === Rank.Four &&
        sortedHand[3].rank === Rank.Five &&
        sortedHand[4].rank === Rank.Ace
    )
}

function convertAceToLow(hand: Card[]): Card[] {
    if (isLowAceStraight(hand)) {
        return hand.map(card => {
            if (card.rank === Rank.Ace) {
                return { rank: 1, suit: card.suit }
            } else {
                return card
            }
        })
    } else {
        return hand
    }
}

function invRank(rank: number): number {
    return MAX_RANK - rank
}

export const FULL_DECK: Card[] = [
    { suit: Suit.Diamond, rank: 2 },
    { suit: Suit.Diamond, rank: 3 },
    { suit: Suit.Diamond, rank: 4 },
    { suit: Suit.Diamond, rank: 5 },
    { suit: Suit.Diamond, rank: 6 },
    { suit: Suit.Diamond, rank: 7 },
    { suit: Suit.Diamond, rank: 8 },
    { suit: Suit.Diamond, rank: 9 },
    { suit: Suit.Diamond, rank: 10 },
    { suit: Suit.Diamond, rank: 11 },
    { suit: Suit.Diamond, rank: 12 },
    { suit: Suit.Diamond, rank: 13 },
    { suit: Suit.Diamond, rank: 14 },
    { suit: Suit.Heart, rank: 2 },
    { suit: Suit.Heart, rank: 3 },
    { suit: Suit.Heart, rank: 4 },
    { suit: Suit.Heart, rank: 5 },
    { suit: Suit.Heart, rank: 6 },
    { suit: Suit.Heart, rank: 7 },
    { suit: Suit.Heart, rank: 8 },
    { suit: Suit.Heart, rank: 9 },
    { suit: Suit.Heart, rank: 10 },
    { suit: Suit.Heart, rank: 11 },
    { suit: Suit.Heart, rank: 12 },
    { suit: Suit.Heart, rank: 13 },
    { suit: Suit.Heart, rank: 14 },
    { suit: Suit.Spade, rank: 2 },
    { suit: Suit.Spade, rank: 3 },
    { suit: Suit.Spade, rank: 4 },
    { suit: Suit.Spade, rank: 5 },
    { suit: Suit.Spade, rank: 6 },
    { suit: Suit.Spade, rank: 7 },
    { suit: Suit.Spade, rank: 8 },
    { suit: Suit.Spade, rank: 9 },
    { suit: Suit.Spade, rank: 10 },
    { suit: Suit.Spade, rank: 11 },
    { suit: Suit.Spade, rank: 12 },
    { suit: Suit.Spade, rank: 13 },
    { suit: Suit.Spade, rank: 14 },
    { suit: Suit.Club, rank: 2 },
    { suit: Suit.Club, rank: 3 },
    { suit: Suit.Club, rank: 4 },
    { suit: Suit.Club, rank: 5 },
    { suit: Suit.Club, rank: 6 },
    { suit: Suit.Club, rank: 7 },
    { suit: Suit.Club, rank: 8 },
    { suit: Suit.Club, rank: 9 },
    { suit: Suit.Club, rank: 10 },
    { suit: Suit.Club, rank: 11 },
    { suit: Suit.Club, rank: 12 },
    { suit: Suit.Club, rank: 13 },
    { suit: Suit.Club, rank: 14 },
]

/**
 * Fisher-Yates array shuffle
 *
 * @param arr the array to shuffle
 */
export function shuffleArrayInPlace<T>(arr: T[]) {
    for (let i = arr.length - 1; i > 0; i--) {
        const index = Math.floor(Math.random() * (i + 1))
        const tempCard = arr[index]
        arr[index] = arr[i]
        arr[i] = tempCard
    }
}

// Cribbed from https://gist.github.com/axelpale/3118596
function kCombinations<T>(set: T[], k: number): T[][] {
    let i, j, combs, head, tailcombs

    // There is no way to take e.g. sets of 5 elements from
    // a set of 4.
    if (k > set.length || k <= 0) {
        return []
    }

    // K-sized set has only one K-sized subset.
    if (k === set.length) {
        return [set]
    }

    // There is N 1-sized subsets in a N-sized set.
    if (k === 1) {
        combs = []
        for (i = 0; i < set.length; i++) {
            combs.push([set[i]])
        }
        return combs
    }

    // Assert {1 < k < set.length}

    // Algorithm description:
    // To get k-combinations of a set, we want to join each element
    // with all (k-1)-combinations of the other elements. The set of
    // these k-sized sets would be the desired result. However, as we
    // represent sets with lists, we need to take duplicates into
    // account. To avoid producing duplicates and also unnecessary
    // computing, we use the following approach: each element i
    // divides the list into three: the preceding elements, the
    // current element i, and the subsequent elements. For the first
    // element, the list of preceding elements is empty. For element i,
    // we compute the (k-1)-computations of the subsequent elements,
    // join each with the element i, and store the joined to the set of
    // computed k-combinations. We do not need to take the preceding
    // elements into account, because they have already been the i:th
    // element so they are already computed and stored. When the length
    // of the subsequent list drops below (k-1), we cannot find any
    // (k-1)-combs, hence the upper limit for the iteration:
    combs = []
    for (i = 0; i < set.length - k + 1; i++) {
        // head is a list that includes only our current element.
        head = set.slice(i, i + 1)
        // We take smaller combinations from the subsequent elements
        tailcombs = kCombinations(set.slice(i + 1), k - 1)
        // For each (k-1)-combination we join it with the current
        // and store it to the set of k-combinations.
        for (j = 0; j < tailcombs.length; j++) {
            combs.push(head.concat(tailcombs[j]))
        }
    }

    return combs
}

export function parseCards(...cardReprs: string[]): Card[] {
    return cardReprs.map(parseCard)
}

export function parseCard(repr: string): Card {
    if (!(repr.length === 2 || repr.length === 3)) {
        throw new Error("Incorrect length")
    }

    const suitChar = repr[0]
    const rankStr = repr.substring(1)

    let suit: Suit
    switch (suitChar) {
        case Suit.Spade:
            suit = Suit.Spade
            break
        case Suit.Heart:
            suit = Suit.Heart
            break
        case Suit.Diamond:
            suit = Suit.Diamond
            break
        case Suit.Club:
            suit = Suit.Club
            break
        default:
            throw new Error(`Unable to parse suit: ${suitChar}`)
    }

    let rank: Rank
    switch (rankStr) {
        case "2":
            rank = Rank.Two
            break
        case "3":
            rank = Rank.Three
            break
        case "4":
            rank = Rank.Four
            break
        case "5":
            rank = Rank.Five
            break
        case "6":
            rank = Rank.Six
            break
        case "7":
            rank = Rank.Seven
            break
        case "8":
            rank = Rank.Eight
            break
        case "9":
            rank = Rank.Nine
            break
        case "10":
            rank = Rank.Ten
            break
        case "J":
            rank = Rank.Jack
            break
        case "Q":
            rank = Rank.Queen
            break
        case "K":
            rank = Rank.King
            break
        case "A":
            rank = Rank.Ace
            break
        default:
            throw new Error(`Unable to parse rank: ${rankStr}`)
    }

    return { suit, rank }
}

export function printCard(card: Card): string {
    const suitChar = card.suit as string
    let rankStr: string
    switch (card.rank) {
        case Rank.Two:
            rankStr = "2"
            break
        case Rank.Three:
            rankStr = "3"
            break
        case Rank.Four:
            rankStr = "4"
            break
        case Rank.Five:
            rankStr = "5"
            break
        case Rank.Six:
            rankStr = "6"
            break
        case Rank.Seven:
            rankStr = "7"
            break
        case Rank.Eight:
            rankStr = "8"
            break
        case Rank.Nine:
            rankStr = "9"
            break
        case Rank.Ten:
            rankStr = "10"
            break
        case Rank.Jack:
            rankStr = "J"
            break
        case Rank.Queen:
            rankStr = "Q"
            break
        case Rank.King:
            rankStr = "K"
            break
        case Rank.Ace:
            rankStr = "A"
            break
        default:
            throw new Error(`Unable to print rank: ${card.rank}`)
    }

    return `${suitChar}${rankStr}`
}
