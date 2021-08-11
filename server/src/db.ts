import {
    PrivatePlayerDoc,
    DeckDoc,
    GameDoc,
} from "@pokerweb-app/game/src/model"
import { isGameCallArgs } from "@pokerweb-app/game/src/types"
import { GAME_EXPIRATION_DURATION } from "@pokerweb-app/game/src/game"
import firestoreHandle from "./firebase_setup"
import { Game, Response, LazyPromise, lazyEval } from "./types"
import { profileAsync, profileSync, profilePromise } from "./profiling"
import { TransactionError } from "./errors"

export const GAME_COLLECTION_NAME = "prod-games"
export const GAME_PRIVATE_DATA_COLLECTION_NAME = "private-data"
export const DECK_PRIVATE_DATA_ID = "deck"

function gameRef(roomId: string) {
    return firestoreHandle.collection(GAME_COLLECTION_NAME).doc(roomId)
}

function deckRef(roomId: string) {
    return gameRef(roomId)
        .collection(GAME_PRIVATE_DATA_COLLECTION_NAME)
        .doc(DECK_PRIVATE_DATA_ID)
}

function playerDataRef(roomId: string) {
    return gameRef(roomId).collection(GAME_PRIVATE_DATA_COLLECTION_NAME)
}

function timedOutGamesRef(now?: number) {
    const actualNow = now || Date.now()
    return firestoreHandle
        .collection(GAME_COLLECTION_NAME)
        .where("timeout.expiry", "<=", actualNow)
}

function expiredGamesRef() {
    return firestoreHandle
        .collection(GAME_COLLECTION_NAME)
        .where("updatedTime", "<", Date.now() - GAME_EXPIRATION_DURATION)
}

export function checkGameInDb<CTX extends { uid: string; reqArgs: unknown }>(
    handler: (
        ctx: CTX & {
            tx: FirebaseFirestore.Transaction
            game: GameDoc
            deck: LazyPromise<DeckDoc>
            pData: LazyPromise<PrivatePlayerDoc[]>
        }
    ) => Response
) {
    return async (c: CTX) => {
        if (isGameCallArgs(c.reqArgs)) {
            const { reqArgs } = c
            const txResult = firestoreHandle.runTransaction(async tx => {
                const { game, deck, pData } = await getGameFromRoomId(
                    tx,
                    reqArgs.roomId
                )
                const g = await lazyEval(game)
                if (!g) {
                    throw new Error("Invalid room ID")
                }

                return handler({
                    reqArgs: c.reqArgs,
                    tx,
                    game: g,
                    deck,
                    pData,
                    ...c,
                })
            })

            return await profilePromise("firestoreTransaction", txResult)
        } else {
            throw new Error("Request had no room ID")
        }
    }
}

export function checkPlayerHasHand<
    CTX extends {
        tx: FirebaseFirestore.Transaction
        uid: string
        game: GameDoc
    }
>(handler: (ctx: CTX & { pData: PrivatePlayerDoc }) => Response) {
    return async (c: CTX) => {
        const pData = await getPrivatePlayerData(c.tx, c.game.roomId, c.uid)
        if (pData.length !== 1) {
            throw new Error("Invalid user ID")
        }
        return handler({ ...c, pData: pData[0] })
    }
}

export const getGameFromRoomId = profileSync(
    "getGameFromRoomId",
    (
        tx: FirebaseFirestore.Transaction,
        roomId: string
    ): {
        game: LazyPromise<GameDoc | undefined>
        deck: LazyPromise<DeckDoc>
        pData: LazyPromise<PrivatePlayerDoc[]>
    } => {
        return {
            game: () =>
                tx.get(gameRef(roomId)).then(doc => {
                    return doc.data() as GameDoc | undefined
                }),
            deck: () => getDeck(tx, roomId),
            pData: () => getPrivatePlayerData(tx, roomId),
        }
    }
)

export const getDeck = profileAsync(
    "getDeck",
    async (
        tx: FirebaseFirestore.Transaction,
        roomId: string
    ): Promise<DeckDoc> => {
        const data = await deckRef(roomId).get()
        return data.data() as DeckDoc
    }
)

export const getPrivatePlayerData = profileAsync(
    "getPrivatePlayerData",
    async (
        tx: FirebaseFirestore.Transaction,
        roomId: string,
        uid?: string
    ): Promise<PrivatePlayerDoc[]> => {
        const ref = playerDataRef(roomId)
        let data
        if (uid) {
            data = await tx.get(ref.where("id", "==", uid))
        } else {
            data = await tx.get(ref)
        }

        const res: PrivatePlayerDoc[] = []
        data.forEach(d => {
            res.push(d.data() as PrivatePlayerDoc)
        })
        return res
    }
)

export const saveGame = (
    tx: FirebaseFirestore.Transaction,
    g: Game,
    deck?: DeckDoc
) => {
    if (deck) {
        saveDeck(tx, deck, g.roomId)
    }

    g.updatedTime = Date.now()

    tx.set(gameRef(g.roomId), g)
}

export const saveDeck = (
    tx: FirebaseFirestore.Transaction,
    deck: DeckDoc,
    roomId: string
) => {
    deck.updatedTime = Date.now()

    tx.set(deckRef(roomId), deck)
}

export const savePrivatePlayerData = (
    tx: FirebaseFirestore.Transaction,
    data: PrivatePlayerDoc,
    roomId: string
) => {
    data.updatedTime = Date.now()

    tx.set(playerDataRef(roomId).doc(data.id), data)
}

export const deletePrivatePlayerData = (
    tx: FirebaseFirestore.Transaction,
    data: PrivatePlayerDoc,
    roomId: string
) => {
    data.updatedTime = Date.now()

    tx.delete(playerDataRef(roomId).doc(data.id))
}

export const forEachTimedOutGameDocs = profileAsync(
    "forEachExpiredGameDocs",
    async (
        now: number,
        func: (
            tx: FirebaseFirestore.Transaction,
            roomId: string
        ) => Promise<void>
    ) => {
        // We read opportunistically with no assurance later that
        // these documents will still be in the timed-out state
        const gameDocRefs = await timedOutGamesRef(now).get()

        for (const gameDocRef of gameDocRefs.docs) {
            const game: GameDoc = gameDocRef.data() as GameDoc
            try {
                await firestoreHandle.runTransaction(tx =>
                    func(tx, game.roomId)
                )
            } catch (err) {
                if (err instanceof TransactionError) {
                    continue
                } else {
                    throw err
                }
            }
        }
    }
)

export const forEachExpiredGameDocs = profileAsync(
    "forEachExpiredGameDocs",
    async (func: (g: GameDoc) => Promise<void>) => {
        const gameDocRefs = await expiredGamesRef().get()

        for (const gameDocRef of gameDocRefs.docs) {
            const game: GameDoc = gameDocRef.data() as GameDoc

            await func(game)
        }
    }
)

const DELETE_BATCH_SIZE = 20

export const deleteGameAndSubDocs = profileAsync(
    "deleteGameAndSubDocs",
    async (roomId: string) => {
        // Delete private documents in subcollections
        await deleteCollection(
            firestoreHandle,
            gameRef(roomId).collection(GAME_PRIVATE_DATA_COLLECTION_NAME),
            DELETE_BATCH_SIZE
        )

        // Delete game document
        await gameRef(roomId).delete()
    }
)

function deleteCollection(
    db: FirebaseFirestore.Firestore,
    collectionRef: FirebaseFirestore.CollectionReference<
        FirebaseFirestore.DocumentData
    >,
    batchSize: number
) {
    const query = collectionRef.orderBy("__name__").limit(batchSize)

    return new Promise(
        (resolve: () => void, reject: (reason: unknown) => void) => {
            deleteQueryBatch(db, query, resolve, reject)
        }
    )
}

function deleteQueryBatch(
    db: FirebaseFirestore.Firestore,
    query: FirebaseFirestore.Query<FirebaseFirestore.DocumentData>,
    resolve: () => void,
    reject: (reason: unknown) => void
) {
    query
        .get()
        .then(snapshot => {
            // When there are no documents left, we are done
            if (snapshot.size === 0) {
                return 0
            }

            // Delete documents in a batch
            const batch = db.batch()
            snapshot.docs.forEach(doc => {
                batch.delete(doc.ref)
            })

            return batch.commit().then(() => {
                return snapshot.size
            })
        })
        .then(numDeleted => {
            if (numDeleted === 0) {
                resolve()
                return
            }

            // Recurse on the next process tick, to avoid
            // exploding the stack.
            process.nextTick(() => {
                deleteQueryBatch(db, query, resolve, reject)
            })
        })
        .catch(reject)
}
