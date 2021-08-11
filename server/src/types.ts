/* eslint-disable @typescript-eslint/no-empty-interface */
import { GameDoc } from "@pokerweb-app/game/src/model"

export type Game = GameDoc

export interface Result {
    json: any
}

export type Response = Result | Promise<Result>

export type LazyPromise<T> = () => T | Promise<T>

export function lazy<T>(p: T) {
    return () => p
}

export async function lazyEval<T>(p: LazyPromise<T>) {
    return await p()
}

export interface SaveGameTopicMessage {
    json: GameDoc
}

export function isSaveGameTopicMessage(
    data: unknown
): data is SaveGameTopicMessage {
    return (
        (data as SaveGameTopicMessage).json !== undefined &&
        typeof (data as SaveGameTopicMessage).json === "object"
    )
}
