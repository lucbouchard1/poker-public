import { describe, it } from "mocha"
import { expect } from "chai"
import {
    verifyChipValue,
    verifyPlayerName,
    PlayerNameResults,
    ChipValueResults,
} from "../src/request-params"

describe("verifyPlayerName", () => {
    it("should reject names which are too long or too short", () => {
        expect(
            verifyPlayerName(
                "this name is far tooo long I think this should be shorter"
            ).res
        ).to.equal(PlayerNameResults.TOO_LONG)
        expect(verifyPlayerName("").res).to.equal(PlayerNameResults.EMPTY)
    })

    it("should reject whitespace-only names", () => {
        expect(verifyPlayerName("          ").res).to.equal(
            PlayerNameResults.EMPTY
        )
        expect(verifyPlayerName("  \t ").res).to.equal(PlayerNameResults.EMPTY)
        expect(verifyPlayerName("\t\n\n\n").res).to.equal(
            PlayerNameResults.EMPTY
        )
        expect(verifyPlayerName("\t\n\n\n").res).to.equal(
            PlayerNameResults.EMPTY
        )
    })

    it("should strip leading and trailing whitespace from given name", () => {
        expect(verifyPlayerName("   this    space  ").name).to.equal(
            "this    space"
        )
        expect(verifyPlayerName("\tthis    space\t").name).to.equal(
            "this    space"
        )
        expect(verifyPlayerName("\tthis    space\t\n\n").name).to.equal(
            "this    space"
        )
    })

    it("should reject name which are not 'simple'", () => {
        expect(verifyPlayerName("weird <><^&*").res).to.equal(
            PlayerNameResults.NOT_SIMPLE
        )
        expect(verifyPlayerName("_++_)(@&!!&@").res).to.equal(
            PlayerNameResults.NOT_SIMPLE
        )
        expect(verifyPlayerName("!!Hello my is").res).to.equal(
            PlayerNameResults.NOT_SIMPLE
        )
        expect(verifyPlayerName("tab\tin\tname").res).to.equal(
            PlayerNameResults.NOT_SIMPLE
        )
        expect(verifyPlayerName("newline\nname").res).to.equal(
            PlayerNameResults.NOT_SIMPLE
        )
    })

    it("should accept simple names which are not too long and not empty", () => {
        expect(verifyPlayerName("Hello ran").res).to.equal(
            PlayerNameResults.VALID
        )
        expect(verifyPlayerName("Hello 12345").res).to.equal(
            PlayerNameResults.VALID
        )

        expect(verifyPlayerName("  Hello 123490  ").res).to.equal(
            PlayerNameResults.VALID
        )
        expect(verifyPlayerName("  Hello 123490  ").name).to.equal(
            "Hello 123490"
        )
        expect(verifyPlayerName("Hello, World").res).to.equal(
            PlayerNameResults.VALID
        )
        expect(verifyPlayerName("Hello. 1 World").res).to.equal(
            PlayerNameResults.VALID
        )
    })
})

describe("verifyChipValue", () => {
    it("should reject non-numeric numbers", () => {
        expect(verifyChipValue(Number.NaN.toString()).res).to.equal(
            ChipValueResults.NON_NUMERIC
        )
        expect(
            verifyChipValue(Number.NEGATIVE_INFINITY.toString()).res
        ).to.equal(ChipValueResults.NON_NUMERIC)
        expect(
            verifyChipValue(Number.POSITIVE_INFINITY.toString()).res
        ).to.equal(ChipValueResults.NON_NUMERIC)
    })

    it("should reject negative numbers and 0", () => {
        expect(verifyChipValue((-203941029384).toString()).res).to.equal(
            ChipValueResults.NEGATIVE
        )
        expect(verifyChipValue((-1).toString()).res).to.equal(
            ChipValueResults.NEGATIVE
        )
        expect(
            verifyChipValue(Number.MIN_SAFE_INTEGER.toString()).res
        ).to.equal(ChipValueResults.NEGATIVE)
        expect(verifyChipValue((-0).toString()).res).to.equal(
            ChipValueResults.ZERO
        )
        expect(verifyChipValue((0).toString()).res).to.equal(
            ChipValueResults.ZERO
        )
    })

    it("should reject numbers that are too big", () => {
        expect(verifyChipValue(Number.MAX_VALUE.toString()).res).to.equal(
            ChipValueResults.TOO_BIG
        )
        expect(
            verifyChipValue((Number.MAX_SAFE_INTEGER + 1).toString()).res
        ).to.equal(ChipValueResults.TOO_BIG)
    })

    it("should reject non-integer numbers", () => {
        expect(verifyChipValue((1.23456789).toString()).res).to.equal(
            ChipValueResults.DECIMAL
        )
        expect(verifyChipValue(Number.EPSILON.toString()).res).to.equal(
            ChipValueResults.DECIMAL
        )
        expect(verifyChipValue(Number.MIN_VALUE.toString()).res).to.equal(
            ChipValueResults.DECIMAL
        )
    })

    it("should accept positive integer numbers that aren't too large", () => {
        expect(verifyChipValue((1).toString()).res).to.equal(
            ChipValueResults.VALID
        )
        expect(verifyChipValue((1234567890).toString()).res).to.equal(
            ChipValueResults.VALID
        )
        expect(verifyChipValue((1234567890).toString()).res).to.equal(
            ChipValueResults.VALID
        )
        expect(
            verifyChipValue(Number.MAX_SAFE_INTEGER.toString()).res
        ).to.equal(ChipValueResults.VALID)
    })
})
