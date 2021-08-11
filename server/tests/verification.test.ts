import { describe, it, before } from "mocha"
import chai, { expect } from "chai"
import chaiAsPromised from "chai-as-promised"
import { DEFAULT_SEATS } from "@pokerweb-app/game/src/controller"
import { InHandGame, FinishedHandGame } from "@pokerweb-app/game/src/types"
import {
    TEST_NOT_STARTED_GAME1,
    TEST_IN_HAND_GAME1,
    TEST_FINISHED_HAND_GAME1,
    TestDataWithStub,
} from "@pokerweb-app/game/tests/utils"
import { OptionsDoc } from "@pokerweb-app/game/src/model"
import { disableProfiling } from "../src/profiling"
import {
    checkSitDownArgsValid,
    checkCanShowHand,
    checkRequesterIsCurrentPlayer,
    checkRequesterIsHost,
    checkSetChipsArgsValid,
    checkCreateRoomArgsValid,
    verifyOptionsDoc,
    checkUpdateOptionsArgValid,
} from "../src/verification"

chai.use(chaiAsPromised)
disableProfiling()

const stubHandler = () => Promise.resolve({ json: {} })

describe("checkCreateRoomArgsValid", () => {
    it("should reject small blind larger than big blind", async () => {
        const verifier = checkCreateRoomArgsValid(stubHandler)

        await expect(
            verifier({
                reqArgs: {
                    options: {
                        defaultChips: 1000,
                        bigBlind: 10,
                        smallBlind: 20,
                        straddleEnabled: true,
                    },
                    hostName: "Rex",
                },
            })
        ).to.be.rejected
    })

    it("should reject small blind or big blind or default chips less than zero", async () => {
        const verifier = checkCreateRoomArgsValid(stubHandler)

        await expect(
            verifier({
                reqArgs: {
                    hostName: "Rex",
                    options: {
                        defaultChips: 1000,
                        bigBlind: 20,
                        smallBlind: -10,
                        straddleEnabled: true,
                    }
                },
            })
        ).to.be.rejected
        await expect(
            verifier({
                reqArgs: {
                    hostName: "Rex",
                    options: {
                        defaultChips: 1000,
                        bigBlind: -20,
                        smallBlind: 10,
                        straddleEnabled: true,
                    }
                },
            })
        ).to.be.rejected
        await expect(
            verifier({
                reqArgs: {
                    hostName: "Rex",
                    options: {
                        defaultChips: -1000,
                        bigBlind: 20,
                        smallBlind: 10,
                        straddleEnabled: true,
                    }
                },
            })
        ).to.be.rejected
    })

    it("should reject small blind or big blind or default chips less or equal to zero", async () => {
        const verifier = checkCreateRoomArgsValid(stubHandler)

        await expect(
            verifier({
                reqArgs: {
                    hostName: "Rex",
                    options: {
                        defaultChips: 1000,
                        bigBlind: 20,
                        smallBlind: -10,
                        straddleEnabled: true,
                    }
                },
            })
        ).to.be.rejected
        await expect(
            verifier({
                reqArgs: {
                    hostName: "Rex",
                    options: {
                        defaultChips: 1000,
                        bigBlind: -20,
                        smallBlind: 10,
                        straddleEnabled: true,
                    }
                },
            })
        ).to.be.rejected
        await expect(
            verifier({
                reqArgs: {
                    options: {
                        defaultChips: -1000,
                        bigBlind: 20,
                        smallBlind: 10,
                        straddleEnabled: true,
                    },
                    hostName: "Rex",
                },
            })
        ).to.be.rejected
        await expect(
            verifier({
                reqArgs: {
                    options: {
                        defaultChips: 0,
                        bigBlind: 20,
                        smallBlind: 10,
                        straddleEnabled: true,
                    },
                    hostName: "Rex",
                },
            })
        ).to.be.rejected
    })

    it("should accept properly structured data with valid values", async () => {
        const verifier = checkCreateRoomArgsValid(stubHandler)

        await expect(verifier({
            reqArgs: {
                options: {
                    defaultChips: 1000,
                    bigBlind: 20,
                    smallBlind: 10,
                    straddleEnabled: true
                },
                hostName: "Rex"
            }
        })).to.be.fulfilled
    })
})

describe("checkSitDownArgsValid", () => {
    it("should reject seat values less than 0", async () => {
        const verifier = checkSitDownArgsValid(stubHandler)

        await expect(
            verifier({
                reqArgs: {
                    playerName: "Bob",
                    seat: -1,
                },
            })
        ).to.be.rejected

        await expect(
            verifier({
                reqArgs: {
                    playerName: "Bob",
                    seat: -10.67,
                },
            })
        ).to.be.rejected

        await expect(
            verifier({
                reqArgs: {
                    playerName: "Bob",
                    seat: -0.001,
                },
            })
        ).to.be.rejected
    })

    it("should reject seat values greater than the maximum", async () => {
        const verifier = checkSitDownArgsValid(stubHandler)

        await expect(
            verifier({
                reqArgs: {
                    playerName: "Bob",
                    seat: DEFAULT_SEATS.length,
                },
            })
        ).to.be.rejected

        await expect(
            verifier({
                reqArgs: {
                    playerName: "Bob",
                    seat: DEFAULT_SEATS.length + 10,
                },
            })
        ).to.be.rejected
    })
})

describe("checkCanShowHand", () => {
    describe("when not in 'finishedHand' state", () => {
        let testData: TestDataWithStub<InHandGame>
        before(() => {
            testData = TEST_IN_HAND_GAME1()
        })

        it("should reject", async () => {
            const verifier = checkCanShowHand(stubHandler)
            const { game: notStartedGame } = TEST_NOT_STARTED_GAME1()

            await expect(verifier({ uid: "LucId", game: notStartedGame })).to.be
                .rejected
            await expect(verifier({ uid: "LucId", game: testData.game })).to.be
                .rejected
        })
    })

    describe("when the player is not seated", () => {
        let testData: TestDataWithStub<FinishedHandGame>

        before(() => {
            testData = TEST_FINISHED_HAND_GAME1()
        })

        it("should reject", async () => {
            const verifier = checkCanShowHand(stubHandler)

            await expect(verifier({ uid: "RonId", game: testData.game })).to.be
                .rejected
        })
    })
})

describe("checkRequesterIsCurrentPlayer", () => {
    let testData: TestDataWithStub<InHandGame>

    before(() => {
        testData = TEST_IN_HAND_GAME1()
    })

    it("should reject when the requesting player is not the current player", async () => {
        const verifier = checkRequesterIsCurrentPlayer(stubHandler)

        await expect(verifier({ game: testData.game, uid: "SandyId" })).to.be
            .rejected
        await expect(verifier({ game: testData.game, uid: "BobId" })).to.be
            .rejected
    })
})

describe("checkRequesterIsHost", () => {
    it("should reject when the requesting player is not the host", async () => {
        const verifier = checkRequesterIsHost(stubHandler)
        const { game } = TEST_NOT_STARTED_GAME1()

        await expect(verifier({ game, uid: "SandyId" })).to.be.rejected
    })
})

describe("checkSetChipsArgsValid", () => {
    it("should reject when part of the args are missing", async () => {
        const verifier = checkSetChipsArgsValid(stubHandler)
        const { game } = TEST_NOT_STARTED_GAME1()

        await expect(verifier({ reqArgs: {} })).to.be.rejected
        await expect(
            verifier({
                reqArgs: {
                    roomId: game.roomId,
                },
            })
        ).to.be.rejected
        await expect(
            verifier({
                reqArgs: {
                    roomId: game.roomId,
                    amount: 0,
                },
            })
        ).to.be.rejected
        await expect(
            verifier({
                reqArgs: {
                    roomId: game.roomId,
                    playerName: "Luc",
                },
            })
        ).to.be.rejected
    })

    it("should reject when the chip value is less than zero or invalid in some other way", async () => {
        const verifier = checkSetChipsArgsValid(stubHandler)
        const { game } = TEST_NOT_STARTED_GAME1()

        await expect(
            verifier({
                reqArgs: {
                    roomId: game.roomId,
                    amount: -20,
                    playerName: "Luc",
                },
            })
        ).to.be.rejected
        await expect(
            verifier({
                reqArgs: {
                    roomId: game.roomId,
                    amount: 3.14159268,
                    playerName: "Luc",
                },
            })
        ).to.be.rejected
        await expect(
            verifier({
                reqArgs: {
                    roomId: game.roomId,
                    amount: Number.NaN,
                    playerName: "Luc",
                },
            })
        ).to.be.rejected
        await expect(
            verifier({
                reqArgs: {
                    roomId: game.roomId,
                    amount: Number.MAX_SAFE_INTEGER + 1,
                    playerName: "Luc",
                },
            })
        ).to.be.rejected
        await expect(
            verifier({
                reqArgs: {
                    roomId: game.roomId,
                    amount: 0,
                    playerName: "Luc",
                },
            })
        ).to.be.rejected
    })

    it("should reject when the player name is invalid", async () => {
        const verifier = checkSetChipsArgsValid(stubHandler)
        const { game } = TEST_NOT_STARTED_GAME1()

        await expect(
            verifier({
                reqArgs: {
                    roomId: game.roomId,
                    amount: -20,
                    playerName: "",
                },
            })
        ).to.be.rejected
        await expect(
            verifier({
                reqArgs: {
                    roomId: game.roomId,
                    amount: -20,
                    playerName:
                        "this player name is far too long to be accepted",
                },
            })
        ).to.be.rejected
    })
})

describe("checkUpdateOptionsArgValid", () => {
    it("should reject when any of the chip values is invalid", async () => {
        const verifier = checkUpdateOptionsArgValid(stubHandler)

        await expect(
            verifier({
                reqArgs: {
                    bigBlind: 3.14159268,
                },
            })
        ).to.be.rejected
        await expect(
            verifier({
                reqArgs: {
                    smallBlind: Number.NaN,
                },
            })
        ).to.be.rejected
        await expect(
            verifier({
                reqArgs: {
                    bigBlind: Number.MAX_SAFE_INTEGER + 1,
                },
            })
        ).to.be.rejected
        await expect(
            verifier({
                reqArgs: {
                    defaultChips: 0,
                },
            })
        ).to.be.rejected
        await expect(
            verifier({
                reqArgs: {
                    smallBlind: -237128937,
                },
            })
        ).to.be.rejected
    })

    it("should reject when if all the options are undefined", async () => {
        const verifier = checkUpdateOptionsArgValid(stubHandler)

        await expect(
            verifier({
                reqArgs: {},
            })
        ).to.be.rejected
    })
})

describe("verifyOptionsDoc", () => {
    const verifier = (arg: Partial<OptionsDoc>) => () => verifyOptionsDoc(arg)

    it("should reject if any chip value has an invalid amount", () => {
        expect(
            verifier({
                bigBlind: 2.1234,
            })
        ).to.throw()
        expect(
            verifier({
                smallBlind: -20000,
            })
        ).to.throw()
        expect(
            verifier({
                defaultChips: Number.MAX_SAFE_INTEGER + 1,
            })
        ).to.throw()
    })

    it("should reject if the small blind is larger than the big blind", () => {
        expect(
            verifier({
                bigBlind: 10,
                smallBlind: 20,
            })
        ).to.throw()
    })
})
