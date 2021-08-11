import { GameDoc, OptionsDoc } from "@pokerweb-app/game/src/model"
import {
    InHandGame,
    CallableInHandGame,
    CheckableInHandGame,
    NotStartedGame,
    FinishedHandGame,
    JoinRoomArgs,
    isJoinRoomArgs,
    CreateRoomArgs,
    isCreateRoomArgs,
    SitDownArgs,
    isSitDownArgs,
    RaiseArgs,
    isRaiseArgs,
    isInHandGame,
    isFinishedHandGame,
    isSetChipsArgs,
    SetChipsArgs,
    PlayerNameArg,
    isPlayerNameArg,
    isCheckableInHandGame,
    isUpdateOptionsArg,
    UpdateOptionsArg,
} from "@pokerweb-app/game/src/types"
import { DEFAULT_SEATS } from "@pokerweb-app/game/src/controller"
import {
    activePlayer,
    getPlayerForUid,
    isCurrentPlayerId,
    minimumRaise,
    numSeatedPlayers,
} from "@pokerweb-app/game/src/game"
import {
    PlayerNameResults,
    verifyPlayerName,
    verifyChipValue,
    ChipValueResults,
} from "@pokerweb-app/game/src/request-params"
import { Response } from "./types"
import { InvalidNameError, DuplicateNameError } from "./errors"

export function checkGameInHand<CTX extends { game: GameDoc }>(
    handler: (ctx: CTX & { game: InHandGame }) => Response
) {
    return async (c: CTX) => {
        if (isInHandGame(c.game)) {
            return handler({ game: c.game, ...c })
        }

        throw new Error("Game is not currently running")
    }
}

export function checkRequesterIsCurrentPlayer<
    CTX extends { uid: string; game: InHandGame }
>(handler: (ctx: CTX) => Response) {
    return async (c: CTX) => {
        if (!isCurrentPlayerId(c.game, c.uid)) {
            throw new Error("Cannot perform action when not the current player")
        }

        return handler(c)
    }
}

export function checkRequesterIsHost<
    CTX extends { uid: string; game: GameDoc }
>(handler: (ctx: CTX) => Response) {
    return async (c: CTX) => {
        if (c.game.players[c.game.hostName].id !== c.uid) {
            throw new Error("Cannot perform action when not the current player")
        }

        return handler(c)
    }
}

export function checkNameNotDuplicate<
    CTX extends { reqArgs: { name: string }; game: GameDoc }
>(handler: (ctx: CTX) => Response) {
    return async (c: CTX) => {
        if (c.reqArgs.name in c.game.players) {
            throw new DuplicateNameError(name)
        }

        return handler(c)
    }
}

export function checkGameStartable<CTX extends { game: GameDoc }>(
    handler: (
        ctx: CTX & { game: NotStartedGame | FinishedHandGame }
    ) => Response
) {
    return async (c: CTX) => {
        if (isInHandGame(c.game)) {
            throw new Error("Game not startable")
        }

        if (numSeatedPlayers(c.game) < 2) {
            throw new Error("Insufficient players to start game")
        }

        return handler({
            game: c.game as NotStartedGame | FinishedHandGame,
            ...c,
        })
    }
}

export function checkGameCallable<CTX extends { game: InHandGame }>(
    handler: (game: CTX & { game: CallableInHandGame }) => Response
) {
    return async (c: CTX) => {
        const player = activePlayer(c.game)
        if (c.game.currentHand.bet <= player.bet) {
            throw new Error("Game is not callable")
        }

        return handler({ game: c.game as CallableInHandGame, ...c })
    }
}

export function checkGameCheckable<CTX extends { game: InHandGame }>(
    handler: (game: CTX & { game: CheckableInHandGame }) => Response
) {
    return async (c: CTX) => {
        if (!isCheckableInHandGame(c.game)) {
            throw new Error("Game is not checkable")
        }

        return handler({ game: c.game, ...c })
    }
}

export function checkCreateRoomArgsValid<CTX extends { reqArgs: unknown }>(
    handler: (ctx: CTX & { reqArgs: CreateRoomArgs }) => Response
) {
    return async (c: CTX) => {
        if (isCreateRoomArgs(c.reqArgs)) {
            const { name, res } = verifyPlayerName(c.reqArgs.hostName)
            if (res !== PlayerNameResults.VALID) throw new InvalidNameError(res)
            c.reqArgs.hostName = name

            verifyOptionsDoc(c.reqArgs.options)

            return handler({ reqArgs: c.reqArgs, ...c })
        } else {
            throw new Error("Invalid 'createRoom' arguments.")
        }
    }
}

export function checkJoinRoomArgsValid<CTX extends { reqArgs: unknown }>(
    handler: (ctx: CTX & { reqArgs: JoinRoomArgs }) => Response
) {
    return async (c: CTX) => {
        if (isJoinRoomArgs(c.reqArgs)) {
            if (c.reqArgs.roomId.length === 0) {
                throw new Error("Cannot join a room with an empty room id.")
            }

            const { name, res } = verifyPlayerName(c.reqArgs.name)
            if (res !== PlayerNameResults.VALID) throw new InvalidNameError(res)
            c.reqArgs.name = name

            return handler({ reqArgs: c.reqArgs, ...c })
        } else {
            throw new Error("Invalid 'createRoom' arguments.")
        }
    }
}

export function checkSitDownArgsValid<CTX extends { reqArgs: unknown }>(
    handler: (ctx: CTX & { reqArgs: SitDownArgs }) => Response
) {
    return async (c: CTX) => {
        if (isSitDownArgs(c.reqArgs)) {
            if (c.reqArgs.seat < 0 || c.reqArgs.seat >= DEFAULT_SEATS.length) {
                throw new Error("Cannot sit at invalid seat index")
            }

            return handler({ reqArgs: c.reqArgs, ...c })
        } else {
            throw new Error("Invalid 'sitDown' arguments.")
        }
    }
}

export function checkPlayerNameArgValid<CTX extends { reqArgs: unknown }>(
    handler: (ctx: CTX & { reqArgs: PlayerNameArg }) => Response
) {
    return async (c: CTX) => {
        if (isPlayerNameArg(c.reqArgs)) {
            return handler({ reqArgs: c.reqArgs, ...c })
        } else {
            throw new Error("Invalid 'sitDown' arguments.")
        }
    }
}

export function checkRaiseArgsValid<
    CTX extends { reqArgs: unknown; game: InHandGame }
>(handler: (ctx: CTX & { reqArgs: RaiseArgs }) => Response) {
    return async (c: CTX) => {
        if (isRaiseArgs(c.reqArgs)) {
            const { val, res: chipValRes } = verifyChipValue(
                c.reqArgs.amount.toString()
            )
            if (chipValRes !== ChipValueResults.VALID)
                throw new Error("Invalid chip value passed")
            c.reqArgs.amount = val

            if (c.reqArgs.amount < minimumRaise(c.game)) {
                throw new Error(
                    "Cannot raise amount that is less than the minimum bet."
                )
            }

            return handler({ reqArgs: c.reqArgs, ...c })
        } else {
            throw new Error("Invalid 'raise' arguments.")
        }
    }
}

export function checkSetChipsArgsValid<CTX extends { reqArgs: unknown }>(
    handler: (reqArgs: CTX & { reqArgs: SetChipsArgs }) => Response
) {
    return async (c: CTX) => {
        if (isSetChipsArgs(c.reqArgs)) {
            const { val, res: chipValRes } = verifyChipValue(
                c.reqArgs.amount.toString()
            )
            if (chipValRes !== ChipValueResults.VALID)
                throw new Error("Invalid chip value passed")
            c.reqArgs.amount = val

            const { name, res: nameRes } = verifyPlayerName(
                c.reqArgs.playerName
            )
            if (nameRes !== PlayerNameResults.VALID)
                throw new InvalidNameError(nameRes)
            c.reqArgs.playerName = name

            return handler({ reqArgs: c.reqArgs, ...c })
        } else {
            throw new Error("Invalid set chips arguments.")
        }
    }
}

export function checkCanShowHand<CTX extends { uid: string; game: GameDoc }>(
    handler: (ctx: CTX & { game: FinishedHandGame }) => Response
) {
    return async (c: CTX) => {
        if (isFinishedHandGame(c.game)) {
            const player = getPlayerForUid(c.game, c.uid)
            if (player === undefined) {
                // This may be possible to assert the impossibility of
                throw new Error("Player is not in this game")
            }

            if (player.seat === undefined) {
                throw new Error("Cannot show hand of player that is not seated")
            }

            return handler({ game: c.game, ...c })
        } else {
            throw new Error("Cannot show hand at this game state.")
        }
    }
}

export function checkUpdateOptionsArgValid<CTX extends { reqArgs: unknown }>(
    handler: (reqArgs: CTX & { reqArgs: UpdateOptionsArg }) => Response
) {
    return async (c: CTX) => {
        if (isUpdateOptionsArg(c.reqArgs)) {
            if (
                c.reqArgs.bigBlind === undefined &&
                c.reqArgs.smallBlind === undefined &&
                c.reqArgs.defaultChips === undefined
            ) {
                throw new Error(
                    "Cannot set options when all arguments are undefined"
                )
            }

            verifyOptionsDoc(c.reqArgs)

            return handler({ reqArgs: c.reqArgs, ...c })
        } else {
            throw new Error("Invalid set blinds argument.")
        }
    }
}

export function verifyOptionsDoc(opts: Partial<OptionsDoc>) {
    if (opts.smallBlind !== undefined) {
        const { val: smallBlind, res: smallBlindRes } = verifyChipValue(
            opts.smallBlind.toString()
        )
        if (smallBlindRes !== ChipValueResults.VALID)
            throw new Error(
                `Invalid value for new small blind chips: ${opts.smallBlind}`
            )
        opts.smallBlind = smallBlind
    }

    if (opts.bigBlind !== undefined) {
        const { val: bigBlind, res: bigBlindRes } = verifyChipValue(
            opts.bigBlind.toString()
        )
        if (bigBlindRes !== ChipValueResults.VALID)
            throw new Error(
                `Invalid value for new big blind chips: ${opts.bigBlind}`
            )
        opts.bigBlind = bigBlind
    }

    if (opts.defaultChips !== undefined) {
        const { val: defaultChips, res: defaultChipsRes } = verifyChipValue(
            opts.defaultChips.toString()
        )
        if (defaultChipsRes !== ChipValueResults.VALID)
            throw new Error(
                `Invalid value for default chips: ${opts.defaultChips}`
            )
        opts.defaultChips = defaultChips
    }

    if (opts.smallBlind && opts.bigBlind && opts.smallBlind > opts.bigBlind) {
        throw new Error("Cannot make the small blind larger than the big blind")
    }
}
