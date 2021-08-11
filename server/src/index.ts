import express from "express"
import cors from "cors"
import * as admin from "firebase-admin"
import * as controller from "@pokerweb-app/game/src/controller"
import {
    getPlayerForUid,
    isGameExpired,
    getPlayerforName,
    isGameTimedOut,
    isCurrentPlayerId,
} from "@pokerweb-app/game/src/game"
import { lazyEval, isInHandGame } from "@pokerweb-app/game/src/types"
import * as database from "./db"
import { profilePromise, enableProfiling } from "./profiling"
import { lazy, Result, Response } from "./types"
import {
    checkGameInHand,
    checkGameCallable,
    checkGameCheckable,
    checkGameStartable,
    checkCreateRoomArgsValid,
    checkJoinRoomArgsValid,
    checkSitDownArgsValid,
    checkRaiseArgsValid,
    checkCanShowHand,
    checkRequesterIsCurrentPlayer,
    checkRequesterIsHost,
    checkNameNotDuplicate,
    checkSetChipsArgsValid,
    checkPlayerNameArgValid,
    checkUpdateOptionsArgValid,
} from "./verification"
import {
    BadRequestError,
    InvalidTokenError,
    UnknownPlayerError,
    TransactionError,
} from "./errors"
import { errorHandler } from "./error-handler"
import firestoreHandle from "./firebase_setup"
import { getLogger } from "./logging"

const LOG = getLogger()

const app = express()
app.use(cors())
app.use(express.urlencoded({ extended: true }))
app.use(express.json())
enableProfiling()

function checkAuthenticated(
    handler: (data: { uid: string; reqArgs: unknown }) => Response
) {
    return async (req: express.Request) => {
        const token = req.headers?.authtoken
        if (!token || typeof token !== "string")
            throw new BadRequestError("Request missing authentication token")

        const user = await admin.auth().verifyIdToken(token)
        if (!user) throw new InvalidTokenError()

        return handler({ uid: user.uid, reqArgs: req.body.data })
    }
}

function makeAsyncRoute(
    route: string,
    handler: (req: express.Request) => Promise<Result>
) {
    app.post(route, (req, res, next) => {
        handler(req)
            .then(result => {
                res.send(result.json)
            })
            .catch(err => next(err))
    })
}

app.get("/", (req, res) => {
    res.send("OK")
})

app.get("/api/cleanup", async (req, res) => {
    if (req.get("X-Appengine-Cron") !== "true") {
        await LOG.warn("Cleanup request was missing App Engine header")
        res.send("Fail")
        return
    }

    await database.forEachExpiredGameDocs(async g => {
        if (isGameExpired(g)) {
            await database.deleteGameAndSubDocs(g.roomId)
        }
    })
    res.send("OK")
})

makeAsyncRoute(
    "/api/create-game",
    checkAuthenticated(
        checkCreateRoomArgsValid(async c => {
            const { hostName, options } = c.reqArgs
            const result = await profilePromise(
                "createGame",
                controller.createGame(hostName, c.uid, options)
            )

            // create room must await to ensure
            // client doesn't have synchronization issues
            //
            // technically this doesn't need a transaction as it never reads
            // but this was the quickest way to introduce transactions
            await firestoreHandle.runTransaction(async tx => {
                database.saveGame(tx, result.game)
                database.savePrivatePlayerData(
                    tx,
                    result.player,
                    result.game.roomId
                )
            })

            return { json: { roomId: result.game.roomId } }
        })
    )
)

makeAsyncRoute(
    "/api/join-game",
    checkAuthenticated(
        checkJoinRoomArgsValid(
            database.checkGameInDb(
                checkNameNotDuplicate(async c => {
                    const result = await profilePromise(
                        "addPlayer",
                        controller.addPlayer(
                            lazy(c.game),
                            c.reqArgs.name,
                            c.uid
                        )
                    )

                    database.saveGame(c.tx, result.game)
                    database.savePrivatePlayerData(
                        c.tx,
                        result.player,
                        result.game.roomId
                    )

                    return { json: { roomId: result.game.roomId } }
                })
            )
        )
    )
)

makeAsyncRoute(
    "/api/start-hand",
    checkAuthenticated(
        database.checkGameInDb(
            checkRequesterIsHost(
                checkGameStartable(async c => {
                    const { game, deck, pData } = await profilePromise(
                        "startHand",
                        controller.startHand(lazy(c.game))
                    )

                    database.saveDeck(c.tx, deck, game.roomId)
                    for (const pDoc of pData) {
                        database.savePrivatePlayerData(
                            c.tx,
                            pDoc,
                            c.game.roomId
                        )
                    }
                    database.saveGame(c.tx, game)

                    return { json: game }
                })
            )
        )
    )
)

makeAsyncRoute(
    "/api/seat-player",
    checkAuthenticated(
        checkSitDownArgsValid(
            database.checkGameInDb(async c => {
                const { seat } = c.reqArgs

                const player = getPlayerForUid(c.game, c.uid)
                if (player === undefined) {
                    throw new UnknownPlayerError()
                }

                const result = await profilePromise(
                    "seatPlayer",
                    controller.seatPlayer(lazy(c.game), player.name, seat)
                )

                database.saveGame(c.tx, result)

                return { json: result }
            })
        )
    )
)

makeAsyncRoute(
    "/api/toggle-player-standing",
    checkAuthenticated(
        database.checkGameInDb(async ({ game, uid, tx, deck, pData }) => {
            const player = getPlayerForUid(game, uid)
            if (player === undefined) {
                throw new UnknownPlayerError()
            }

            const result = await profilePromise(
                "togglePlayerStanding",
                controller.togglePlayerStanding(
                    lazy(game),
                    player.name,
                    deck,
                    pData
                )
            )

            database.saveGame(tx, result.game, result.deck)

            return { json: {} }
        })
    )
)

makeAsyncRoute(
    "/api/kick-out-player",
    checkAuthenticated(
        checkPlayerNameArgValid(
            database.checkGameInDb(
                checkRequesterIsHost(
                    async ({ game, tx, reqArgs, deck, pData }) => {
                        const player = getPlayerforName(
                            game,
                            reqArgs.playerName
                        )
                        if (player === undefined) {
                            throw new UnknownPlayerError()
                        }

                        if (player.name === game.hostName) {
                            throw new BadRequestError(
                                "Host cannot be kicked from game"
                            )
                        }

                        const p = await lazyEval(pData)
                        const curr = p.filter(d => d.name === player.name)[0]

                        const result = await profilePromise(
                            "kickOutPlayer",
                            controller.kickOutPlayer(
                                lazy(game),
                                player.name,
                                deck,
                                lazy(p)
                            )
                        )

                        database.saveGame(tx, result.game, result.deck)
                        database.deletePrivatePlayerData(
                            tx,
                            curr,
                            result.game.roomId
                        )

                        return { json: {} }
                    }
                )
            )
        )
    )
)

makeAsyncRoute(
    "/api/raise",
    checkAuthenticated(
        database.checkGameInDb(
            checkGameInHand(
                checkRaiseArgsValid(
                    checkRequesterIsCurrentPlayer(async c => {
                        const { amount } = c.reqArgs
                        const result = await controller.raise(
                            lazy(c.game),
                            amount
                        )

                        database.saveGame(c.tx, result.game)
                        return { json: {} }
                    })
                )
            )
        )
    )
)

makeAsyncRoute(
    "/api/fold",
    checkAuthenticated(
        database.checkGameInDb(
            checkGameInHand(
                checkRequesterIsCurrentPlayer(async c => {
                    const { game, deck } = await profilePromise(
                        "fold",
                        controller.fold(lazy(c.game), c.deck, c.pData)
                    )

                    database.saveGame(c.tx, game, deck)
                    return { json: {} }
                })
            )
        )
    )
)

makeAsyncRoute(
    "/api/check",
    checkAuthenticated(
        database.checkGameInDb(
            checkGameInHand(
                checkRequesterIsCurrentPlayer(
                    checkGameCheckable(async c => {
                        const { game, deck } = await profilePromise(
                            "check",
                            controller.check(lazy(c.game), c.deck, c.pData)
                        )

                        database.saveGame(c.tx, game, deck)
                        return { json: {} }
                    })
                )
            )
        )
    )
)

makeAsyncRoute(
    "/api/call",
    checkAuthenticated(
        database.checkGameInDb(
            checkGameInHand(
                checkRequesterIsCurrentPlayer(
                    checkGameCallable(async c => {
                        const { game, deck } = await profilePromise(
                            "call",
                            controller.call(lazy(c.game), c.deck, c.pData)
                        )

                        database.saveGame(c.tx, game, deck)
                        return { json: {} }
                    })
                )
            )
        )
    )
)

makeAsyncRoute(
    "/api/show-hand",
    checkAuthenticated(
        database.checkGameInDb(
            database.checkPlayerHasHand(
                checkCanShowHand(async c => {
                    const player = getPlayerForUid(c.game, c.uid)
                    if (player === undefined) {
                        throw new UnknownPlayerError()
                    }

                    const result = await controller.showHand(
                        lazy(c.game),
                        lazy(c.pData)
                    )

                    database.saveGame(c.tx, result)

                    return { json: result }
                })
            )
        )
    )
)

makeAsyncRoute(
    "/api/set-chips",
    checkAuthenticated(
        checkSetChipsArgsValid(
            database.checkGameInDb(
                checkRequesterIsHost(async c => {
                    const { amount, playerName } = c.reqArgs

                    const player = getPlayerforName(c.game, playerName)
                    if (player === undefined) {
                        throw new UnknownPlayerError()
                    }

                    const result = await controller.setChips(
                        lazy(c.game),
                        playerName,
                        amount
                    )

                    database.saveGame(c.tx, result)
                    return { json: {} }
                })
            )
        )
    )
)

makeAsyncRoute(
    "/api/set-host",
    checkAuthenticated(
        checkPlayerNameArgValid(
            database.checkGameInDb(
                checkRequesterIsHost(async c => {
                    const {
                        reqArgs: { playerName },
                    } = c

                    const player = getPlayerforName(c.game, playerName)
                    if (player === undefined) {
                        throw new UnknownPlayerError()
                    }

                    const result = await controller.setHost(
                        lazy(c.game),
                        player.name
                    )

                    database.saveGame(c.tx, result)
                    return { json: {} }
                })
            )
        )
    )
)

makeAsyncRoute(
    "/api/update-options",
    checkAuthenticated(
        database.checkGameInDb(
            checkUpdateOptionsArgValid(
                checkRequesterIsHost(async c => {
                    const result = await controller.updateOptions(
                        lazy(c.game),
                        c.reqArgs
                    )

                    database.saveGame(c.tx, result)
                    return { json: {} }
                })
            )
        )
    )
)

app.use(errorHandler)

const PORT = process.env.PORT || 9000
app.listen(PORT, async () => {
    await LOG.log(`App listening on port ${PORT}`)
    await LOG.log("Press Ctrl+C to quit.")
})

async function processTimeouts() {
    const now = Date.now()
    await database.forEachTimedOutGameDocs(now, async (tx, roomId) => {
        const { game, deck, pData } = await database.getGameFromRoomId(
            tx,
            roomId
        )
        const g = await lazyEval(game)
        if (!g) {
            throw new Error("Invalid room ID")
        }

        if (
            // Check that the document is still timed-out out relative to the first recorded time
            !isGameTimedOut(g, now) ||
            // Can't timeout a game that finished
            !isInHandGame(g) ||
            // Check that the recorded player id in the timeout is the same as the current player
            !isCurrentPlayerId(g, g.timeout.uid)
        ) {
            throw new TransactionError()
        }

        const result = await controller.processTimeout(lazy(g), deck, pData)
        database.saveGame(tx, result.game, result.deck)
    })
}

// 10 seconds in milliseconds
const TIMEOUT_INTERVAL_MILLIS = 2_000

setInterval(processTimeouts, TIMEOUT_INTERVAL_MILLIS)
