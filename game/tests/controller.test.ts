import { describe, it, before } from "mocha"
import { expect } from "chai"
import { FinishedHandGame, InHandGame, lazy } from "../src/types"
import * as controller from "../src/controller"
import {
    TEST_NOT_STARTED_GAME1,
    TEST_FINISHED_HAND_GAME1,
    TEST_IN_HAND_GAME1,
    TEST_IN_HAND_GAME2,
    TEST_DECK1,
    TEST_FINISHED_HAND_GAME2,
    TestDataWithStub,
    TEST_IN_HAND_GAME3,
    TEST_IN_HAND_GAME4,
} from "./utils"

describe("createGame", function () {
    it("should create a 'not started' game document with the correct host", async function () {
        const { game, player } = await controller.createGame(
            "testName",
            "testId",
            {
                smallBlind: 100,
                bigBlind: 200,
                defaultChips: 2000,
                straddleEnabled: false
            }
        )

        expect(game.state).to.equal("notStarted")
        expect(game.hostName).to.equal("testName")
        expect(game.options.defaultChips).to.equal(2000)
        expect(game.options.bigBlind).to.equal(200)
        expect(game.options.smallBlind).to.equal(100)
        expect(game.options.straddleEnabled).to.equal(false)
        expect(Object.keys(game.players).length).to.equal(1)
        expect(game.players["testName"].id).to.equal("testId")
        expect(game.players["testName"].chips).to.equal(2000)
        expect(game.players["testName"].name).to.equal("testName")
        expect(game.seats.length).to.equal(10)
        expect(game.seats).to.deep.equal(Array(10).fill(""))
        expect(player.name).to.equal("testName")
        expect(player.id).to.equal("testId")
    })
})

describe("addPlayer", function () {
    it("should add a player to the players object", async function () {
        const g = TEST_NOT_STARTED_GAME1().game

        const { game, player } = await controller.addPlayer(
            lazy(g),
            "Bob",
            "BobID"
        )

        expect(game.seats).to.not.deep.contain("Bob")
        expect(Object.keys(game.players).length).to.equal(3)
        expect(game.players["Bob"].id).to.equal("BobID")
        expect(game.players["Bob"].chips).to.equal(100)
        expect(game.players["Bob"].name).to.equal("Bob")
        expect(game.players["Bob"].isAllIn).to.equal(false)
        expect(game.players["Bob"].isFolded).to.equal(false)
        expect(game.players["Bob"].bet).to.equal(0)
        expect(game.players["Bob"].seat).to.equal(undefined)
        expect(player.name).to.equal("Bob")
        expect(player.id).to.equal("BobID")
    })
})

describe("seatPlayer", function () {
    it("should seat a player in the seats array", async function () {
        const g = TEST_NOT_STARTED_GAME1().game
        g.players["Bob"] = {
            name: "Bob",
            id: "BobId",
            chips: 100,
            bet: 0,
            isFolded: false,
            isAllIn: false,
            isDealtIn: false,
            isStanding: false,
        }

        const game = await controller.seatPlayer(lazy(g), "Bob", 7)
        expect(game.seats[7]).to.equal("Bob")
        expect(game.players["Bob"].seat).to.equal(7)
    })
})

describe("startHand", function () {
    describe("with a finished hand", () => {
        let testData: TestDataWithStub<FinishedHandGame>

        before(() => {
            testData = TEST_FINISHED_HAND_GAME1()
        })

        it("should transform into an 'in hand' game", async function () {
            const { game, deck, pData } = await controller.startHand(
                lazy(testData.game)
            )
            const result = game
            const deckDoc = deck
            const hands = pData

            // Check that deck has no duplicates
            deckDoc.deck.forEach((v, i) => {
                const d = [...deckDoc.deck]
                d.splice(i)
                expect(d).to.not.deep.include(v)
            })

            const hand0 = hands[0]
            const hand1 = hands[1]
            const hand2 = hands[2]
            if (!hand0.hand || !hand1.hand || !hand2.hand) {
                expect(false).to.equal(true)
                return
            }

            expect(deckDoc.deck).to.not.have.deep.include(hand0.hand[0])
            expect(deckDoc.deck).to.not.have.deep.include(hand0.hand[1])
            expect(deckDoc.deck).to.not.have.deep.include(hand1.hand[0])
            expect(deckDoc.deck).to.not.have.deep.include(hand1.hand[1])
            expect(deckDoc.deck).to.not.have.deep.include(hand2.hand[0])
            expect(deckDoc.deck).to.not.have.deep.include(hand2.hand[1])
            expect(hand0).to.not.deep.include(hand1.hand[0])
            expect(hand0).to.not.deep.include(hand1.hand[1])
            expect(hand2).to.not.deep.include(hand1.hand[0])
            expect(hand2).to.not.deep.include(hand1.hand[1])
            expect(hand2).to.not.deep.include(hand0.hand[0])
            expect(hand2).to.not.deep.include(hand0.hand[1])

            expect(deckDoc.deck.length).to.equal(46)
            expect(hands.length).to.equal(3)
            expect(hand0.hand?.length).to.equal(2)
            expect(hand0.id).to.equal("LucId")
            expect(hand0.name).to.equal("Luc")
            expect(hand1.hand?.length).to.equal(2)
            expect(hand1.id).to.equal("SandyId")
            expect(hand1.name).to.equal("Sandy")
            expect(hand2.hand?.length).to.equal(2)
            expect(hand2.id).to.equal("BobId")
            expect(hand2.name).to.equal("Bob")

            expect(result.state).to.equal("inHand")
            expect(result.currentHand.dealerSeat).to.equal(1)
            expect(result.currentHand.smallBlindSeat).to.equal(2)
            expect(result.currentHand.bigBlindSeat).to.equal(0)
            expect(result.currentHand.roundEndSeat).to.equal(1)
            expect(result.players["Luc"].chips).to.equal(140)
            expect(result.players["Luc"].isDealtIn).to.equal(true)
            expect(result.players["Bob"].chips).to.equal(90)
            expect(result.players["Bob"].isDealtIn).to.equal(true)
            expect(result.players["Sandy"].chips).to.equal(100)
            expect(result.players["Sandy"].isDealtIn).to.equal(true)
            expect(result.players["Sandy"].bet).to.equal(0)
            expect(result.players["Luc"].bet).to.equal(20)
            expect(result.players["Bob"].bet).to.equal(10)
            expect(result.players["Luc"].chipsWon).to.equal(undefined)
            expect(result.currentHand.pots).to.deep.equal([])
            expect(result.currentHand.bet).to.equal(20)
        })
    })

    it("should transform a 'notStarted' game into an 'in hand' game", async () => {
        const { game } = TEST_NOT_STARTED_GAME1()

        const result = await controller.startHand(lazy(game))

        expect(result.game.state).to.equal("inHand")
    })
})

describe("call", function () {
    /**
     * 1) If the player calls to an "all-in" value, and they are the 'roundEndSeat', then
     * the 'roundEndSeat' needs to advance to the next active player.
     */
    describe("when all players are all-in", () => {
        let testData: TestDataWithStub<InHandGame>

        before(() => {
            testData = TEST_IN_HAND_GAME3()
        })

        it("should handle the case", async function () {
            const { game } = await controller.call(
                lazy(testData.game),
                lazy(testData.deck),
                lazy(testData.pData)
            )

            expect(game.state).to.equal("finishedHand")
            expect(game.players["Bob"].isAllIn).to.equal(true)
            expect(game.currentHand.roundEndSeat).to.equal(2)
            expect(game.currentHand.activeSeat).to.equal(2)
            expect(game.currentHand.bet).to.equal(1000)
            expect(game.currentHand.community.length).to.equal(5)
            expect(game.players["Luc"].isAllIn).to.equal(true)
            expect(game.players["Sandy"].isAllIn).to.equal(true)
        })
    })
})

describe("fold", function () {
    /**
     * 1) If the player folds and they are the 'seatRoundEndsOn', then
     * the 'seatRoundEndsOn' needs to advance to the next active player.
     * If the game is in the Pre-Flop round, and the next active player
     * is the Big Blind, we need to advance by an additional player so
     * the Big Blind player gets a chance to raise.
     */
    describe("when the its the last player in the round", () => {
        let testData: TestDataWithStub<InHandGame>

        before(() => {
            testData = TEST_IN_HAND_GAME1()
        })

        it("should handle the case", async function () {
            const { game, deck } = await controller.fold(
                lazy(testData.game),
                lazy(testData.deck),
                lazy(testData.pData)
            )

            expect(game.state).to.equal("inHand")
            expect(game.currentHand.roundEndSeat).to.equal(1)
            expect(game.currentHand.activeSeat).to.equal(1)
            expect(game.currentHand.bet).to.equal(20)
            expect(game.players["Luc"].isFolded).to.equal(true)
            expect(deck).to.be.undefined
        })
    })

    describe("when only player is left", () => {
        let testData: TestDataWithStub<InHandGame>

        before(() => {
            testData = TEST_IN_HAND_GAME2()
        })

        it("should end the game", async function () {
            let { game } = await controller.fold(
                lazy(testData.game),
                lazy(testData.deck),
                lazy(testData.pData)
            )
            game = game as FinishedHandGame

            expect(game.state).to.equal("finishedHand")
            // Make sure we didn't run out the remaining community cards
            expect(game.currentHand.community.length).to.equal(3)
            expect(game.players["Sandy"].isFolded).to.equal(true)
            expect(game.players["Bob"].chipsWon).to.equal(30)
            // It should not necessarily show the hand of the winning player if they won via all
            // folding
            expect(game.players["Bob"]).to.not.have.property("shownHand")
        })
    })
})

describe("standUp", function () {
    describe("when only player is left", () => {
        let testData: TestDataWithStub<InHandGame>

        before(() => {
            testData = TEST_IN_HAND_GAME2()
        })

        it("should end the game", async function () {
            let { game } = await controller.togglePlayerStanding(
                lazy(testData.game),
                testData.game.seats[testData.game.currentHand.activeSeat],
                lazy(testData.deck),
                lazy(testData.pData)
            )
            game = game as FinishedHandGame

            expect(game.state).to.equal("finishedHand")
            expect(game.players["Sandy"].isStanding).to.equal(true)
            expect(game.players["Sandy"].isFolded).to.equal(false)
            expect(game.players["Sandy"].isDealtIn).to.equal(false)
            expect(game.players["Bob"].chipsWon).to.equal(30)
            // It should not necessarily show the hand of the winning player if they won via all
            // folding
            expect(game.players["Bob"]).to.not.have.property("shownHand")
        })
    })
})

describe("raise", function () {
    let testData: TestDataWithStub<InHandGame>

    before(() => {
        testData = TEST_IN_HAND_GAME1()
    })

    it("should properly advance 'seatRoundEndsOn' when player goes all in", async function () {
        const { game } = await controller.raise(lazy(testData.game), 80)

        expect(game.state).to.equal("inHand")
        expect(game.currentHand.roundEndSeat).to.equal(1)
        expect(game.currentHand.activeSeat).to.equal(1)
        expect(game.currentHand.bet).to.equal(100)
        expect(game.players["Luc"].isAllIn).to.equal(true)
        expect(game.players["Luc"].chips).to.equal(0)
    })
})

describe("showHand", () => {
    let testData: TestDataWithStub<FinishedHandGame>

    before(() => {
        testData = TEST_FINISHED_HAND_GAME2()
    })

    it("should write the players private hand to the public document", async () => {
        const result = (await controller.showHand(
            lazy(testData.game),
            lazy(testData.pData[0])
        )) as FinishedHandGame

        expect(result.players["Luc"]).to.have.property("shownHand")
        expect(result.players["Luc"].shownHand).to.deep.equal(
            TEST_DECK1.slice(5, 7)
        )
    })
})

describe("setChips", () => {
    let testData: TestDataWithStub<FinishedHandGame>

    before(() => {
        testData = TEST_FINISHED_HAND_GAME2()
    })

    it("should write the players private hand to the public document", async () => {
        const result = await controller.setChips(
            lazy(testData.game),
            "Luc",
            20000
        )

        expect(result.players["Luc"].chips).to.equal(20000)
    })
})

describe("setHost", () => {
    let testData: TestDataWithStub<FinishedHandGame>

    before(() => {
        testData = TEST_FINISHED_HAND_GAME2()
    })

    it("should change the host to the specified player name", async () => {
        const result = await controller.setHost(lazy(testData.game), "Ron")

        expect(result.hostName).to.equal("Ron")
    })
})

describe("updateOptions", () => {
    let testData: TestDataWithStub<FinishedHandGame>

    before(() => {
        testData = TEST_FINISHED_HAND_GAME1()
    })

    it("should update defined options", async () => {
        const result = await controller.updateOptions(lazy(testData.game), {
            bigBlind: 40,
            smallBlind: 20,
        })

        expect(result.options.bigBlind).to.equal(40)
        expect(result.options.smallBlind).to.equal(20)
        expect(result.options.defaultChips).to.equal(100)
        expect(result.options.straddleEnabled).to.equal(true)
    })
})

describe("processTimeout", () => {
    it("should fold if check is not possible", async () => {
        const testData = TEST_IN_HAND_GAME1()

        const result = await controller.processTimeout(
            lazy(testData.game),
            lazy(testData.deck),
            lazy(testData.pData)
        )

        expect(result.game.players["Luc"].isFolded).to.be.true
        expect(result.game.currentHand.activeSeat).to.equal(1)
        expect(result.game.timeout!.uid).to.equal("SandyId")
    })

    it("should check if possible", async () => {
        const testData = TEST_IN_HAND_GAME4()

        const result = await controller.processTimeout(
            lazy(testData.game),
            lazy(testData.deck),
            lazy(testData.pData)
        )

        expect(result.game.players["Sandy"].bet).to.equal(0)
        expect(result.game.currentHand.activeSeat).to.equal(2)
        expect(result.game.timeout!.uid).to.equal("BobId")
    })
})
