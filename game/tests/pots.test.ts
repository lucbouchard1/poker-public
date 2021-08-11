import { describe, it } from "mocha"
import { expect } from "chai"
import { Name } from "../src/model"
import { updatePots, splitPots } from "../src/pots"
import { BASE_HAND_VALUE } from "../src/cards"
import { createTestPlayers } from "./utils"

describe("updatePots", function () {
    it("should handle normal bets", function () {
        const players = createTestPlayers([
            { name: "Patrick", chips: 1000, bet: 20, isDealtIn: true },
            { name: "Declan", chips: 1000, bet: 20, isDealtIn: true },
            { name: "Luc", chips: 1000, bet: 20, isDealtIn: true },
        ])

        const newPots = updatePots(Object.keys(players).map(p => players[p]))

        expect(newPots.length).to.equal(1)

        const newPot = newPots[0]
        expect(newPot.maxBet).to.equal(20)
        expect(newPot.chips).to.equal(60)
        expect(newPot.players).to.contain("Luc")
        expect(newPot.players).to.contain("Patrick")
        expect(newPot.players).to.contain("Declan")
    })

    it("should handle all int bets", function () {
        const players = createTestPlayers([
            {
                name: "Patrick",
                chips: 1000,
                bet: 19,
                isAllIn: true,
                isDealtIn: true,
            },
            { name: "Declan", chips: 1000, bet: 20, isDealtIn: true },
            { name: "Luc", chips: 1000, bet: 20, isDealtIn: true },
        ])

        const newPots = updatePots(Object.keys(players).map(p => players[p]))

        expect(newPots.length).to.equal(2)

        const allInPot = newPots[0]
        expect(allInPot.maxBet).to.equal(19)
        expect(allInPot.chips).to.equal(57)
        expect(allInPot.players).to.contain("Luc")
        expect(allInPot.players).to.contain("Patrick")
        expect(allInPot.players).to.contain("Declan")

        const remainderPot = newPots[1]
        expect(remainderPot.maxBet).to.equal(1)
        expect(remainderPot.chips).to.equal(2)
        expect(remainderPot.players).to.contain("Luc")
        expect(remainderPot.players).to.contain("Declan")
    })

    it("should handle folded bets", function () {
        const players = createTestPlayers([
            {
                name: "Patrick",
                chips: 1000,
                bet: 19,
                isFolded: true,
                isDealtIn: true,
            },
            { name: "Declan", chips: 1000, bet: 20, isDealtIn: true },
            { name: "Luc", chips: 1000, bet: 20, isDealtIn: true },
        ])

        const newPots = updatePots(Object.keys(players).map(p => players[p]))

        expect(newPots.length).to.equal(1)

        const pot = newPots[0]
        expect(pot.maxBet).to.equal(20)
        expect(pot.chips).to.equal(59)
        expect(pot.players).to.contain("Luc")
        expect(pot.players).to.contain("Declan")
    })

    it("handles the ultra test", function () {
        const players = createTestPlayers([
            {
                name: "A",
                chips: 1000,
                bet: 19,
                isFolded: true,
                isDealtIn: true,
            },
            { name: "B", chips: 1000, bet: 20, isAllIn: true, isDealtIn: true },
            { name: "C", chips: 1000, bet: 21, isDealtIn: true },
            { name: "D", chips: 1000, bet: 21, isDealtIn: true },
            { name: "E", chips: 1000, bet: 18, isAllIn: true, isDealtIn: true },
            {
                name: "F",
                chips: 1000,
                bet: 19,
                isFolded: true,
                isDealtIn: true,
            },
        ])

        const newPots = updatePots(Object.keys(players).map(p => players[p]))

        expect(newPots.length).to.equal(3)
        const [mainPot, middlePot, topPot] = newPots

        // { size: 108, maxBet: 18, seats: Set { 1, 2, 3, 4 } },
        expect(mainPot.maxBet).to.equal(18)
        expect(mainPot.chips).to.equal(108)
        expect(mainPot.players).to.contain("B")
        expect(mainPot.players).to.contain("C")
        expect(mainPot.players).to.contain("D")
        expect(mainPot.players).to.contain("E")

        // { size:   8, maxBet:  2, seats: Set { 1, 2, 3 } },
        expect(middlePot.maxBet).to.equal(2)
        expect(middlePot.chips).to.equal(8)
        expect(middlePot.players).to.contain("B")
        expect(middlePot.players).to.contain("C")
        expect(middlePot.players).to.contain("D")

        // { size:   2, maxBet:  1, seats: Set { 2, 3 }, }
        expect(topPot.maxBet).to.equal(1)
        expect(topPot.chips).to.equal(2)
        expect(topPot.players).to.contain("C")
        expect(topPot.players).to.contain("D")
    })
})

describe("splitPots", function () {
    const players = createTestPlayers([
        { name: "A", chips: 1000, bet: 19, isFolded: true, isDealtIn: true },
        { name: "B", chips: 1000, bet: 20, isAllIn: true, isDealtIn: true },
        { name: "C", chips: 1000, bet: 21, isDealtIn: true },
        { name: "D", chips: 1000, bet: 21, isDealtIn: true },
        { name: "E", chips: 1000, bet: 18, isAllIn: true, isDealtIn: true },
        { name: "F", chips: 1000, bet: 19, isFolded: true, isDealtIn: true },
    ])

    const pots = updatePots(Object.keys(players).map(p => players[p]))

    it("should allocate all the pots to the best hand", function () {
        const handValues: Map<Name, number> = new Map()

        handValues.set("A", BASE_HAND_VALUE["high-card"])
        handValues.set("B", BASE_HAND_VALUE["straight"])
        handValues.set("C", BASE_HAND_VALUE["flush"])
        handValues.set("D", BASE_HAND_VALUE["full-house"])
        handValues.set("E", BASE_HAND_VALUE["two-pair"])
        handValues.set("F", BASE_HAND_VALUE["one-pair"])

        const seatChipAllocation = splitPots(handValues, pots)

        expect(seatChipAllocation.get("A")).to.equal(0)
        expect(seatChipAllocation.get("B")).to.equal(0)
        expect(seatChipAllocation.get("C")).to.equal(0)
        expect(seatChipAllocation.get("D")).to.equal(118)
        expect(seatChipAllocation.get("E")).to.equal(0)
        expect(seatChipAllocation.get("F")).to.equal(0)
    })

    it("should handle ties", function () {
        const handValues: Map<Name, number> = new Map()

        handValues.set("A", BASE_HAND_VALUE["high-card"])
        handValues.set("B", BASE_HAND_VALUE["straight"])
        handValues.set("C", BASE_HAND_VALUE["flush"])
        handValues.set("D", BASE_HAND_VALUE["flush"])
        handValues.set("E", BASE_HAND_VALUE["two-pair"])
        handValues.set("F", BASE_HAND_VALUE["one-pair"])

        const seatChipAllocation = splitPots(handValues, pots)

        expect(seatChipAllocation.get("A")).to.equal(0)
        expect(seatChipAllocation.get("B")).to.equal(0)
        expect(seatChipAllocation.get("C")).to.equal(59)
        expect(seatChipAllocation.get("D")).to.equal(59)
        expect(seatChipAllocation.get("E")).to.equal(0)
        expect(seatChipAllocation.get("F")).to.equal(0)
    })

    it("should handle ties with all-in", function () {
        const handValues: Map<Name, number> = new Map()

        handValues.set("A", BASE_HAND_VALUE["high-card"])
        handValues.set("B", BASE_HAND_VALUE["flush"])
        handValues.set("C", BASE_HAND_VALUE["flush"])
        handValues.set("D", BASE_HAND_VALUE["flush"])
        handValues.set("E", BASE_HAND_VALUE["two-pair"])
        handValues.set("F", BASE_HAND_VALUE["one-pair"])

        const seatChipAllocation = splitPots(handValues, pots)

        expect(seatChipAllocation.get("A")).to.equal(0)
        expect(seatChipAllocation.get("B")).to.equal(39) // the main pot splits 116 into (39, 39, 38)
        expect(seatChipAllocation.get("C")).to.equal(40) // then these two get an extra one each
        expect(seatChipAllocation.get("D")).to.equal(39)
        expect(seatChipAllocation.get("E")).to.equal(0)
        expect(seatChipAllocation.get("F")).to.equal(0)
    })

    it("should handle all-in with a secondary pot", function () {
        const handValues: Map<Name, number> = new Map()

        handValues.set("A", BASE_HAND_VALUE["high-card"])
        handValues.set("B", BASE_HAND_VALUE["flush"])
        handValues.set("C", BASE_HAND_VALUE["straight"])
        handValues.set("D", BASE_HAND_VALUE["straight"])
        handValues.set("E", BASE_HAND_VALUE["two-pair"])
        handValues.set("F", BASE_HAND_VALUE["one-pair"])

        const seatChipAllocation = splitPots(handValues, pots)

        expect(seatChipAllocation.get("A")).to.equal(0)
        expect(seatChipAllocation.get("B")).to.equal(116)
        expect(seatChipAllocation.get("C")).to.equal(1)
        expect(seatChipAllocation.get("D")).to.equal(1)
        expect(seatChipAllocation.get("E")).to.equal(0)
        expect(seatChipAllocation.get("F")).to.equal(0)
    })

    it("should throw an error if the map of hand values is empty", function () {
        const handValues: Map<Name, number> = new Map()

        expect(() => {
            splitPots(handValues, pots)
        }).to.throw(Error)
    })
})
