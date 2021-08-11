import {
    Card,
    Suit,
    GameState,
    Name,
    PublicPlayerDoc,
    PotDoc,
    PrivatePlayerDoc,
    GameDoc,
    DeckDoc,
} from "../src/model"
import { NotStartedGame, FinishedHandGame, InHandGame } from "../src/types"
import { ASet } from "../src/util"

export function createTestPlayers(
    players: {
        name: Name
        chips: number
        bet?: number
        isFolded?: boolean
        isDealtIn?: boolean
        isAllIn?: boolean
        isStanding?: boolean
        seat?: number
        chipsWon?: number
    }[]
): Record<Name, PublicPlayerDoc> {
    const result = {} as Record<Name, PublicPlayerDoc>
    players.forEach(p => {
        result[p.name] = {
            name: p.name,
            id: p.name + "Id",
            chips: p.chips,
            bet: p.bet === undefined ? 0 : p.bet,
            isFolded: p.isFolded === undefined ? false : p.isFolded,
            isAllIn: p.isAllIn === undefined ? false : p.isAllIn,
            isDealtIn: p.isDealtIn === undefined ? false : p.isDealtIn,
            isStanding: p.isStanding === undefined ? false : p.isStanding,
            seat: p.seat,
            chipsWon: p.chipsWon,
        }
    })
    return result
}

export function createTestPot(
    chips: number,
    maxBet: number,
    players: Name[]
): PotDoc {
    const set = ASet.create<Name>()
    for (const p of players) ASet.add(set, p)
    return {
        chips,
        maxBet,
        players: set,
    }
}

export const TEST_DECK1: Card[] = [
    { suit: Suit.Club, rank: 7 },
    { suit: Suit.Heart, rank: 6 },
    { suit: Suit.Diamond, rank: 6 },
    { suit: Suit.Heart, rank: 8 },
    { suit: Suit.Diamond, rank: 7 },
    { suit: Suit.Spade, rank: 12 },
    { suit: Suit.Diamond, rank: 3 },
    { suit: Suit.Club, rank: 6 },
    { suit: Suit.Diamond, rank: 12 },
    { suit: Suit.Diamond, rank: 13 },
    { suit: Suit.Heart, rank: 10 },
    { suit: Suit.Heart, rank: 7 },
    { suit: Suit.Spade, rank: 7 },
    { suit: Suit.Heart, rank: 5 },
    { suit: Suit.Heart, rank: 14 },
    { suit: Suit.Heart, rank: 2 },
    { suit: Suit.Spade, rank: 13 },
    { suit: Suit.Spade, rank: 10 },
    { suit: Suit.Diamond, rank: 10 },
    { suit: Suit.Diamond, rank: 8 },
    { suit: Suit.Diamond, rank: 11 },
    { suit: Suit.Club, rank: 8 },
    { suit: Suit.Club, rank: 9 },
    { suit: Suit.Club, rank: 2 },
    { suit: Suit.Diamond, rank: 14 },
    { suit: Suit.Heart, rank: 12 },
    { suit: Suit.Diamond, rank: 9 },
    { suit: Suit.Spade, rank: 5 },
    { suit: Suit.Club, rank: 5 },
    { suit: Suit.Heart, rank: 13 },
    { suit: Suit.Heart, rank: 11 },
    { suit: Suit.Club, rank: 11 },
    { suit: Suit.Club, rank: 12 },
    { suit: Suit.Club, rank: 13 },
    { suit: Suit.Club, rank: 14 },
    { suit: Suit.Spade, rank: 9 },
    { suit: Suit.Spade, rank: 6 },
    { suit: Suit.Spade, rank: 4 },
    { suit: Suit.Spade, rank: 2 },
    { suit: Suit.Diamond, rank: 2 },
    { suit: Suit.Diamond, rank: 4 },
    { suit: Suit.Diamond, rank: 5 },
    { suit: Suit.Spade, rank: 8 },
    { suit: Suit.Heart, rank: 3 },
    { suit: Suit.Heart, rank: 4 },
    { suit: Suit.Spade, rank: 11 },
    { suit: Suit.Spade, rank: 14 },
    { suit: Suit.Club, rank: 3 },
    { suit: Suit.Club, rank: 4 },
    { suit: Suit.Spade, rank: 3 },
    { suit: Suit.Heart, rank: 9 },
    { suit: Suit.Club, rank: 10 },
]

export interface TestData<G extends GameDoc> {
    game: G
}

export interface TestDataWithStub<G extends GameDoc> extends TestData<G> {
    game: G
    deck: DeckDoc
    pData: PrivatePlayerDoc[]
}

export const TEST_NOT_STARTED_GAME1 = (): TestData<NotStartedGame> => {
    const game = {
        state: GameState.NOT_STARTED,
        roomId: "roomId",
        hostName: "Luc",
        players: createTestPlayers([
            { name: "Luc", chips: 100, seat: 0 },
            { name: "Sandy", chips: 100, seat: 1 },
        ]),
        seats: ["Luc", "Sandy"].concat(Array(8).fill("")),
        options: {
            defaultChips: 100,
            bigBlind: 20,
            smallBlind: 10,
            straddleEnabled: true
        },
    } as NotStartedGame

    return { game }
}

/**
 * Sandy bet 10, Bob raised to 20, and it is now Luc's turn to decide to call or fold.
 * The flop is down.
 */
export const TEST_IN_HAND_GAME1 = (): TestDataWithStub<InHandGame> => {
    const game = {
        state: GameState.IN_HAND,
        roomId: "roomId",
        hostName: "Luc",
        players: createTestPlayers([
            { name: "Luc", chips: 100, seat: 0, bet: 0, isDealtIn: true },
            { name: "Sandy", chips: 100, seat: 1, bet: 10, isDealtIn: true },
            { name: "Bob", chips: 100, seat: 2, bet: 20, isDealtIn: true },
        ]),
        seats: ["Luc", "Sandy", "Bob"].concat(Array(8).fill("")),
        options: {
            defaultChips: 100,
            bigBlind: 20,
            smallBlind: 10,
            straddleEnabled: true,
        },
        currentHand: {
            community: TEST_DECK1.slice(0, 3),
            bet: 20,
            activeSeat: 0,
            roundEndSeat: 0,
            dealerSeat: 0,
            smallBlindSeat: 1,
            bigBlindSeat: 2,
            pots: [],
        },
        timeout: {
            expiry: 0,
            uid: "LucId",
        },
    } as InHandGame

    const pData = [
        {
            id: "LucId",
            name: "Luc",
            hand: TEST_DECK1.slice(3, 5),
        },
        {
            id: "SandyId",
            name: "Sandy",
            hand: TEST_DECK1.slice(5, 7),
        },
        {
            id: "BobId",
            name: "Bob",
            hand: TEST_DECK1.slice(7, 9),
        },
    ]
    const deck = { deck: TEST_DECK1.slice(9) }

    return {
        game,
        deck,
        pData,
    }
}

/**
 * Sandy has bet 10, Bob raised to 20, Luc folded, and it is now Sandy's turn again.
 * The flop is down and Sandy gets to decide whether to call or to fold.
 */
export const TEST_IN_HAND_GAME2 = (): TestDataWithStub<InHandGame> => {
    const game = {
        state: GameState.IN_HAND,
        roomId: "roomId",
        hostName: "Luc",
        players: createTestPlayers([
            {
                name: "Luc",
                chips: 100,
                seat: 0,
                bet: 0,
                isFolded: true,
                isDealtIn: true,
            },
            { name: "Sandy", chips: 100, seat: 1, bet: 10, isDealtIn: true },
            { name: "Bob", chips: 100, seat: 2, bet: 20, isDealtIn: true },
        ]),
        seats: ["Luc", "Sandy", "Bob"].concat(Array(8).fill("")),
        options: {
            defaultChips: 100,
            bigBlind: 20,
            smallBlind: 10,
            straddleEnabled: true,
        },
        currentHand: {
            community: TEST_DECK1.slice(0, 3),
            bet: 20,
            activeSeat: 1,
            roundEndSeat: 1,
            dealerSeat: 0,
            smallBlindSeat: 1,
            bigBlindSeat: 2,
            pots: [],
        },
        timeout: {
            expiry: 0,
            uid: "SandyId",
        },
    } as InHandGame

    const pData = [
        {
            id: "LucId",
            name: "Luc",
            hand: TEST_DECK1.slice(3, 5),
        },
        {
            id: "SandyId",
            name: "Sandy",
            hand: TEST_DECK1.slice(5, 7),
        },
        {
            id: "BobId",
            name: "Bob",
            hand: TEST_DECK1.slice(7, 9),
        },
    ]
    const deck = { deck: TEST_DECK1.slice(9) }

    return {
        game,
        deck,
        pData,
    }
}

/**
 * Luc and Sandy went all in for 1000 pre-flop (no cards out),
 * so remaining play is with Bob who is the current player.
 */
export const TEST_IN_HAND_GAME3 = (): TestDataWithStub<InHandGame> => {
    const game = {
        state: GameState.IN_HAND,
        roomId: "roomId",
        hostName: "Luc",
        players: createTestPlayers([
            {
                name: "Luc",
                chips: 1000,
                seat: 0,
                bet: 1000,
                isDealtIn: true,
                isAllIn: true,
            },
            {
                name: "Sandy",
                chips: 0,
                seat: 1,
                bet: 1000,
                isDealtIn: true,
                isAllIn: true,
            },
            { name: "Bob", chips: 980, seat: 2, bet: 20, isDealtIn: true },
        ]),
        seats: ["Luc", "Sandy", "Bob"].concat(Array(8).fill("")),
        options: {
            defaultChips: 1000,
            bigBlind: 20,
            smallBlind: 10,
            straddleEnabled: true,
        },
        currentHand: {
            community: [],
            bet: 1000,
            activeSeat: 2,
            roundEndSeat: 2,
            dealerSeat: 0,
            smallBlindSeat: 1,
            bigBlindSeat: 2,
            pots: [],
        },
        timeout: {
            expiry: 0,
            uid: "BobId",
        },
    } as InHandGame

    const pData = [
        {
            id: "LucId",
            name: "Luc",
            hand: TEST_DECK1.slice(0, 2),
        },
        {
            id: "SandyId",
            name: "Sandy",
            hand: TEST_DECK1.slice(2, 4),
        },
        {
            id: "BobId",
            name: "Bob",
            hand: TEST_DECK1.slice(4, 6),
        },
    ]
    const deck = { deck: TEST_DECK1.slice(6) }

    return {
        game,
        deck,
        pData,
    }
}

/**
 * The flop is down, and Sandy gets to decide whether to check or to raise. No one
 * has bet anything yet.
 */
export const TEST_IN_HAND_GAME4 = (): TestDataWithStub<InHandGame> => {
    const game = {
        state: GameState.IN_HAND,
        roomId: "roomId",
        hostName: "Luc",
        players: createTestPlayers([
            {
                name: "Luc",
                chips: 100,
                seat: 0,
                bet: 0,
                isDealtIn: true,
            },
            { name: "Sandy", chips: 100, seat: 1, bet: 0, isDealtIn: true },
            { name: "Bob", chips: 100, seat: 2, bet: 0, isDealtIn: true },
        ]),
        seats: ["Luc", "Sandy", "Bob"].concat(Array(8).fill("")),
        options: {
            defaultChips: 100,
            bigBlind: 20,
            smallBlind: 10,
            straddleEnabled: true,
        },
        currentHand: {
            community: TEST_DECK1.slice(0, 3),
            bet: 20,
            activeSeat: 1,
            roundEndSeat: 1,
            dealerSeat: 0,
            smallBlindSeat: 1,
            bigBlindSeat: 2,
            pots: [],
        },
        timeout: {
            expiry: 0,
            uid: "SandyId",
        },
    } as InHandGame

    const pData = [
        {
            id: "LucId",
            name: "Luc",
            hand: TEST_DECK1.slice(3, 5),
        },
        {
            id: "SandyId",
            name: "Sandy",
            hand: TEST_DECK1.slice(5, 7),
        },
        {
            id: "BobId",
            name: "Bob",
            hand: TEST_DECK1.slice(7, 9),
        },
    ]
    const deck = { deck: TEST_DECK1.slice(9) }

    return {
        game,
        deck,
        pData,
    }
}

export const TEST_FINISHED_HAND_GAME1 = (): TestDataWithStub<
    FinishedHandGame
> => {
    const game = {
        state: GameState.FINISHED_HAND,
        roomId: "roomId",
        hostName: "Luc",
        players: createTestPlayers([
            { name: "Luc", chips: 100, seat: 0, chipsWon: 60, isDealtIn: true },
            { name: "Sandy", chips: 100, seat: 1, isDealtIn: true },
            { name: "Bob", chips: 100, seat: 2, isDealtIn: true },
        ]),
        seats: ["Luc", "Sandy", "Bob"].concat(Array(8).fill("")),
        options: {
            defaultChips: 100,
            bigBlind: 20,
            smallBlind: 10,
            straddleEnabled: true,
        },
        currentHand: {
            community: TEST_DECK1.slice(0, 5),
            bet: 0,
            activeSeat: 1,
            roundEndSeat: 1,
            dealerSeat: 0,
            smallBlindSeat: 1,
            bigBlindSeat: 2,
            pots: [createTestPot(60, 20, ["Luc", "Sandy", "Bob"])],
        },
    } as FinishedHandGame

    const pData = [
        {
            id: "LucId",
            name: "Luc",
            hand: TEST_DECK1.slice(5, 7),
        },
        {
            id: "SandyId",
            name: "Sandy",
            hand: TEST_DECK1.slice(7, 9),
        },
        {
            id: "BobId",
            name: "Bob",
            hand: TEST_DECK1.slice(9, 11),
        },
    ]
    const deck = { deck: TEST_DECK1.slice(11) }

    return { game, deck, pData }
}

export const TEST_FINISHED_HAND_GAME2 = (): TestDataWithStub<
    FinishedHandGame
> => {
    const game = {
        state: GameState.FINISHED_HAND,
        roomId: "roomId",
        hostName: "Luc",
        players: createTestPlayers([
            { name: "Luc", chips: 100, seat: 0, chipsWon: 60, isDealtIn: true },
            { name: "Sandy", chips: 100, seat: 1, isDealtIn: true },
            { name: "Bob", chips: 100, seat: 2, isDealtIn: true },
            { name: "Ron", chips: 100 },
        ]),
        seats: ["Luc", "Sandy", "Bob", "Ron"].concat(Array(8).fill("")),
        options: {
            defaultChips: 100,
            bigBlind: 20,
            smallBlind: 10,
        },
        currentHand: {
            community: TEST_DECK1.slice(0, 5),
            bet: 0,
            activeSeat: 1,
            roundEndSeat: 1,
            dealerSeat: 0,
            smallBlindSeat: 1,
            bigBlindSeat: 2,
            pots: [createTestPot(60, 20, ["Luc", "Sally", "Bob"])],
        },
    } as FinishedHandGame

    const pData = [
        {
            id: "LucId",
            name: "Luc",
            hand: TEST_DECK1.slice(5, 7),
        },
        {
            id: "SandyId",
            name: "Sandy",
            hand: TEST_DECK1.slice(7, 9),
        },
        {
            id: "BobId",
            name: "Bob",
            hand: TEST_DECK1.slice(9, 11),
        },
    ]
    const deck = { deck: TEST_DECK1.slice(11) }

    return {
        game,
        pData,
        deck,
    }
}
