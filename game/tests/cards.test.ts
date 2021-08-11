import { describe, it } from "mocha"
import { expect } from "chai"
import { Card } from "../src/model"
import { rankHand, HandType, parseCards, printCard } from "../src/cards"

describe("rankHand", function () {
    it("should return a hand type and value for any number of cards between 5 and 7, inclusive", function () {
        const hand: Card[] = parseCards(
            "c7",
            "h8",
            "d10",
            "dQ",
            "sQ",
            "hQ",
            "c10"
        )

        const [hType1, hValue1] = rankHand(hand)
        hand.pop()
        const [hType2, hValue2] = rankHand(hand)
        hand.pop()
        const [hType3, hValue3] = rankHand(hand)

        expect(hType1).to.equal("full-house")
        expect(hType2).to.equal("three-of-a-kind")
        expect(hType3).to.equal("one-pair")

        expect(hValue1).to.be.lessThan(hValue2)
        expect(hValue2).to.be.lessThan(hValue3)
    })

    it("should properly handle hand type ties", function () {
        const h1: Card[] = parseCards("c2", "c6", "c9", "h3", "sQ", "sA", "s6")
        const h2: Card[] = parseCards("c2", "c6", "c9", "h3", "sQ", "dJ", "s2")
        const h3: Card[] = parseCards("c2", "c6", "c9", "h3", "sQ", "sJ", "hJ")

        const [hType1, hValue1] = rankHand(h1)
        const [hType2, hValue2] = rankHand(h2)
        const [hType3, hValue3] = rankHand(h3)

        expect(hType1).to.equal("one-pair")
        expect(hType2).to.equal("one-pair")
        expect(hType3).to.equal("one-pair")

        expect(hValue1).to.be.lessThan(hValue2)
        expect(hValue3).to.be.lessThan(hValue1)
    })

    it("should return 'invalid' for a hand that does not have between 5 and 7 cards, inclusive", function () {
        const hand: Card[] = parseCards("d7", "d8", "d9", "d10")

        const hType = rankHand(hand)[0]

        expect(hType).to.equal("invalid")
    })

    it("it should rank even hands type based on off high card", () => {
        const common: Card[] = parseCards("s2", "s9", "h4", "d8", "s3")

        const hSally: Card[] = parseCards("s5", "h5").concat(common)
        const hLuc: Card[] = parseCards("hK", "h5").concat(common)
        const hBob: Card[] = parseCards("c10", "h10").concat(common)

        const sallyRank = rankHand(hSally)
        const lucRank = rankHand(hLuc)
        const bobRank = rankHand(hBob)

        expect(sallyRank[0]).to.equal("one-pair")
        expect(lucRank[0]).to.equal("high-card")
        expect(bobRank[0]).to.equal("one-pair")

        expect(bobRank[1]).to.be.lessThan(sallyRank[1])
    })

    it("should rank straights with high and low ace", () => {
        const lowAce: Card[] = parseCards("s2", "h3", "c4", "s5", "dA")
        const highAce: Card[] = parseCards("sA", "sK", "hQ", "dJ", "s10")

        const lowRank = rankHand(lowAce)
        const highRank = rankHand(highAce)

        expect(lowRank[0]).to.equal("straight")
        expect(highRank[0]).to.equal("straight")

        expect(highRank[1]).to.be.lessThan(lowRank[1])
    })

    it("should rank same hand types with different values", () => {
        const common = parseCards("d7", "s8", "h3", "sA", "hJ")

        const hPotPot: Card[] = parseCards("sJ", "s6").concat(common)
        const hPatSucks: Card[] = parseCards("hA", "s5").concat(common)

        const potPotRank = rankHand(hPotPot)
        const patSucksRank = rankHand(hPatSucks)

        expect(potPotRank[0]).to.equal("one-pair")
        expect(patSucksRank[0]).to.equal("one-pair")

        expect(patSucksRank[1]).to.be.lessThan(potPotRank[1])
    })

    it("should rank equal hands with equal values", () => {
        const common = parseCards("d7", "s8", "h3", "sA", "hJ")

        const handA = parseCards("sJ", "s6").concat(common)
        const handB = parseCards("hJ", "h6").concat(common)

        const rankA = rankHand(handA)
        const rankB = rankHand(handB)

        expect(rankA[0]).to.equal("one-pair")
        expect(rankB[0]).to.equal("one-pair")

        expect(rankA[1]).to.equal(rankB[1])
    })

    it("should pass the baseline set of common tests", () => {
        let lastRankValue = 0

        for (const hType of HAND_TYPES_IN_ORDER) {
            const handRanks = COMMON_HANDS[hType].map(rankHand)

            handRanks.forEach((rank, idx, arr) => {
                expect(
                    rank[0],
                    `Expected hand type of '${rank[2].map(
                        printCard
                    )}' to be '${hType}'`
                ).to.equal(hType)

                if (idx > 0) {
                    // Expect the current rank value to be greater (read: a worse hand) or equal to the previous hand
                    expect(
                        rank[1],
                        `Expected '${rank[2].map(
                            printCard
                        )}' to rank worse than '${arr[idx - 1][2].map(
                            printCard
                        )}'`
                    ).to.be.at.least(arr[idx - 1][1])
                } else {
                    // When swapping from one hand type to the next, check that the value is always increasing
                    expect(
                        rank[1],
                        `Expected '${rank[2].map(
                            printCard
                        )}' to rank worse than previous value '${lastRankValue}'`
                    ).to.be.greaterThan(lastRankValue)
                }

                lastRankValue = rank[1]
            })
        }
    })

    it("should not depend on one pair card ordering", () => {
        const h1 = parseCards("d8", "s8", "h3", "sA", "hJ")
        const h2 = parseCards("s8", "sA", "h3", "d8", "hJ")

        const rank1 = rankHand(h1)
        const rank2 = rankHand(h2)

        expect(rank1[0]).to.equal("one-pair")
        expect(rank2[0]).to.equal("one-pair")

        expect(rank1[1]).to.equal(rank1[1])
    })

    it("should not depend on two pair card ordering", () => {
        const h1 = parseCards("s7", "d7", "h4", "s4", "hJ")
        const h2 = parseCards("s4", "hJ", "d7", "h4", "s7")

        const rank1 = rankHand(h1)
        const rank2 = rankHand(h2)

        expect(rank1[0]).to.equal("two-pair")
        expect(rank2[0]).to.equal("two-pair")

        expect(rank1[1]).to.equal(rank1[1])
    })

    it("should not depend on straight card ordering", () => {
        const h1 = parseCards("sA", "d2", "h3", "s4", "h5")
        const h2 = parseCards("h3", "sA", "d2", "h5", "s4")

        const rank1 = rankHand(h1)
        const rank2 = rankHand(h2)

        expect(rank1[0]).to.equal("straight")
        expect(rank2[0]).to.equal("straight")

        expect(rank1[1]).to.equal(rank1[1])
    })

    describe("regression tests", () => {
        it("2020-05-17: high flush failed to win", () => {
            const common = parseCards("h8", "c2", "h5", "hA", "h4")
            const lukeCards = parseCards("h10", "h9").concat(common)
            const patPadCards = parseCards("dQ", "hQ").concat(common)

            const lukeRank = rankHand(lukeCards)
            const patPadRank = rankHand(patPadCards)

            expect(lukeRank[0]).to.equal("flush")
            expect(patPadRank[0]).to.equal("flush")
            expect(patPadRank[1]).to.be.lessThan(lukeRank[1])
        })

        it("2020-05-23: Pot distribution failed to give pair of queens all. Issue #182", () => {
            const common = parseCards("c9", "cK", "cQ", "s5", "d3")
            const decCards = parseCards("sQ", "dJ").concat(common)
            const oziarchCards = parseCards("c2", "d6").concat(common)

            const decRank = rankHand(decCards)
            const oziarchRank = rankHand(oziarchCards)

            expect(decRank[0]).to.equal("one-pair")
            expect(oziarchRank[0]).to.equal("high-card")
            expect(decRank[1]).to.be.lessThan(oziarchRank[1])
        })

        it("2020-05-23: Incorrect ranking of pairs. Issue #191", () => {
            const common = parseCards("dK", "dQ", "h2", "sK", "d3")
            const lucCards = parseCards("h4", "s2").concat(common)
            const thePadCards = parseCards("hQ", "sA").concat(common)

            const lucRank = rankHand(lucCards)
            const thePadRank = rankHand(thePadCards)

            expect(lucRank[0]).to.equal("two-pair")
            expect(thePadRank[0]).to.equal("two-pair")
            expect(thePadRank[1]).to.be.lessThan(lucRank[1])
        })
    })
})

const HAND_TYPES_IN_ORDER: HandType[] = [
    "straight-flush",
    "four-of-a-kind",
    "full-house",
    "flush",
    "straight",
    "three-of-a-kind",
    "two-pair",
    "one-pair",
    "high-card",
    "invalid",
]

// Within each set of common hands, the hands are ranked from best to worst
const COMMON_HANDS: Record<HandType, Card[][]> = {
    invalid: [],
    "straight-flush": [
        parseCards("cA", "cJ", "cK", "cQ", "c10"),
        parseCards("d7", "d6", "d8", "d4", "d5"),
        parseCards("sA", "s2", "s3", "s4", "s5"),
    ],
    "four-of-a-kind": [
        parseCards("cA", "sA", "dA", "hA", "c3"),
        parseCards("cA", "sA", "dA", "hA", "c2"),
        parseCards("c2", "s2", "d2", "h2", "c4"),
        parseCards("c2", "s2", "d2", "h2", "c3"),
    ],
    "full-house": [
        parseCards("cA", "sA", "dA", "sK", "dK"),
        parseCards("cQ", "sQ", "dQ", "sA", "dA"),
        parseCards("cQ", "sQ", "dQ", "sK", "dK"),
        parseCards("c2", "s2", "d2", "sK", "dK"),
        parseCards("c2", "s2", "d2", "s10", "d10"),
        parseCards("c2", "s2", "d2", "s3", "d3"),
    ],
    flush: [
        parseCards("cA", "cQ", "cK", "cJ", "c9"),
        parseCards("h4", "h5", "h8", "hQ", "hA"),
        parseCards("dA", "dJ", "d2", "d5", "d7"),
        parseCards("h5", "h8", "h9", "h10", "hA"),
        parseCards("dQ", "dJ", "d2", "d5", "d7"),
        parseCards("d2", "d3", "d4", "d5", "d7"),
    ],
    straight: [
        parseCards("cA", "hJ", "dK", "sQ", "c10"),
        parseCards("cJ", "hK", "s10", "dQ", "c9"),
        parseCards("c10", "hQ", "hJ", "c9", "s8"),
        parseCards("s8", "hJ", "c10", "c9", "d7"),
        parseCards("s7", "c6", "c9", "s8", "h10"),
        parseCards("d7", "h6", "c8", "s4", "d5"),
        parseCards("d6", "h5", "c4", "s3", "d2"),
        parseCards("sA", "h2", "c3", "d4", "s5"),
    ],
    "three-of-a-kind": [
        parseCards("cA", "sA", "dA", "sK", "dQ"),
        parseCards("cA", "sA", "dA", "sK", "dJ"),
        parseCards("dJ", "sK", "cJ", "sJ", "h5"),
        parseCards("dJ", "sK", "cJ", "sJ", "h4"),
        parseCards("dJ", "s10", "cJ", "sJ", "h4"),
        parseCards("d5", "s5", "cJ", "h5", "h4"),
        parseCards("c2", "s2", "d2", "s3", "d4"),
    ],
    "two-pair": [
        parseCards("cA", "sA", "dK", "sK", "dQ", "s2", "h2"),
        parseCards("cA", "sA", "dK", "sK", "dJ", "s2", "h2"),
        parseCards("cA", "sA", "d4", "s4", "dJ"),
        parseCards("cA", "sA", "d2", "s2", "dJ"),
        parseCards("cA", "sA", "d4", "s3", "d10", "s2", "h2"),
        parseCards("cK", "sA", "d2", "sK", "s2"),
        parseCards("c2", "s2", "dQ", "sQ", "d6"),
        parseCards("c9", "s7", "d2", "s9", "s2", "c3", "d8"),
        parseCards("c5", "s5", "d4", "s4", "d3"),
        parseCards("c5", "s5", "d4", "s4", "d2"),
        parseCards("c2", "s2", "d3", "s3", "d4"),
    ],
    "one-pair": [
        parseCards("cA", "sA", "dK", "sQ", "d5"),
        parseCards("cA", "sA", "dJ", "sQ", "d6"),
        parseCards("cA", "sA", "dJ", "s4", "d3"),
        parseCards("dK", "h8", "dA", "sQ", "c7", "s4", "d8"),
        parseCards("dK", "h8", "d5", "sQ", "c7", "s4", "d8"),
        parseCards("d3", "h7", "dA", "sQ", "c7"),
        parseCards("dK", "s6", "dA", "sQ", "c6"),
        parseCards("c6", "s6", "dK", "sQ", "dJ"),
        parseCards("c5", "s5", "dA", "sQ", "dK"),
        parseCards("dJ", "s5", "dK", "h5", "d2"),
        parseCards("c2", "s2", "d3", "s4", "d5"),
    ],
    "high-card": [
        parseCards("cA", "sQ", "dK", "sJ", "d9"),
        parseCards("cK", "sQ", "d8", "sJ", "d9"),
        parseCards("c2", "s8", "d4", "s5", "d7"),
        parseCards("c2", "s3", "d4", "s5", "d7"),
    ],
}
