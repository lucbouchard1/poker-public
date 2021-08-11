/* eslint-disable @typescript-eslint/no-empty-interface */
import {
    GameDoc,
    CurrentHandDoc,
    GameState,
    TimeoutDoc,
    OptionsDoc,
} from "./model"
import { activePlayer } from "./game"

export type Game = GameDoc

interface Result {
    json: unknown
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

/** The host has not started the game for the first time yet */
export interface NotStartedGame extends Game {
    state: GameState.NOT_STARTED
}

/** Cards have been dealt and the game is currently running */
export interface InHandGame extends Game {
    state: GameState.IN_HAND
    currentHand: CurrentHandDoc
    timeout: TimeoutDoc
}

export function isInHandGame(game: GameDoc): game is InHandGame {
    return game.state === "inHand"
}

/** The final bet has been made and all cards have been dealt */
export interface FinishedHandGame extends Game {
    state: GameState.FINISHED_HAND
    currentHand: CurrentHandDoc
}

export function isFinishedHandGame(game: GameDoc): game is FinishedHandGame {
    return game.state === "finishedHand"
}

/** The hand when the current player has the option to check */
export interface CheckableHand extends CurrentHandDoc {
    currentBet: 0
}

/** The game is running and the current player has the option to check */
export interface CheckableInHandGame extends InHandGame {
    currentHand: CheckableHand
}

export function isCheckableInHandGame(g: InHandGame): g is CheckableInHandGame {
    const player = activePlayer(g)
    return g.currentHand.bet === 0 || g.currentHand.bet === player.bet
}

/** The game is running and the current player has the option to call */
// tslint:disable-next-line:no-empty-interface
export interface CallableInHandGame extends InHandGame { }

export interface GameCallArgs {
    roomId: string
}

export function isGameCallArgs(data: unknown): data is GameCallArgs {
    return (
        (data as GameCallArgs).roomId !== undefined &&
        typeof (data as GameCallArgs).roomId === "string"
    )
}

/** Type of data passed in the 'joinRoom' API call */
export interface JoinRoomArgs extends GameCallArgs {
    name: string
}

export function isJoinRoomArgs(data: unknown): data is JoinRoomArgs {
    return (
        isGameCallArgs(data as JoinRoomArgs) &&
        (data as JoinRoomArgs).name !== undefined &&
        typeof (data as JoinRoomArgs).name === "string"
    )
}

/** Type of data passed in the 'createRoom' API call */
export interface CreateRoomArgs {
    hostName: string
    options: OptionsDoc
}

export function isCreateRoomArgs(data: unknown): data is CreateRoomArgs {
    return (
        (data as CreateRoomArgs).hostName !== undefined &&
        typeof (data as CreateRoomArgs).hostName === "string" &&
        isOptionsDoc((data as CreateRoomArgs).options)
    )
}

/** Type of data passed in the 'sitDown' API call */
export interface SitDownArgs extends GameCallArgs {
    seat: number
}

export function isSitDownArgs(data: unknown): data is SitDownArgs {
    return (
        isGameCallArgs(data as SitDownArgs) &&
        (data as SitDownArgs).seat !== undefined &&
        typeof (data as SitDownArgs).seat === "number"
    )
}

/** Type of data passed in the 'raise' API call */
export interface RaiseArgs extends GameCallArgs {
    amount: number
}

export function isRaiseArgs(data: unknown): data is RaiseArgs {
    return (
        isGameCallArgs(data as RaiseArgs) &&
        (data as RaiseArgs).amount !== undefined &&
        typeof (data as RaiseArgs).amount === "number"
    )
}

export interface SetChipsArgs extends GameCallArgs {
    playerName: string
    amount: number
}

export function isSetChipsArgs(data: unknown): data is SetChipsArgs {
    return (
        isGameCallArgs(data as SetChipsArgs) &&
        (data as SetChipsArgs).playerName !== undefined &&
        typeof (data as SetChipsArgs).playerName === "string" &&
        (data as SetChipsArgs).amount !== undefined &&
        typeof (data as SetChipsArgs).amount === "number"
    )
}

export interface PlayerNameArg extends GameCallArgs {
    playerName: string
}

export function isPlayerNameArg(data: unknown): data is PlayerNameArg {
    return (
        isGameCallArgs(data as PlayerNameArg) &&
        (data as PlayerNameArg).playerName !== undefined &&
        typeof (data as PlayerNameArg).playerName === "string"
    )
}

export interface UpdateOptionsArg extends GameCallArgs, Partial<OptionsDoc> { }

export function isUpdateOptionsArg(data: unknown): data is UpdateOptionsArg {
    return (
        isGameCallArgs(data as UpdateOptionsArg) &&
        isPartialOptionsDoc(data as UpdateOptionsArg)
    )
}

export function isOptionsDoc(data: unknown): data is OptionsDoc {
    return (
        (data as OptionsDoc).defaultChips !== undefined &&
        typeof (data as OptionsDoc).defaultChips === "number" &&
        (data as OptionsDoc).bigBlind !== undefined &&
        typeof (data as OptionsDoc).bigBlind === "number" &&
        (data as OptionsDoc).smallBlind !== undefined &&
        typeof (data as OptionsDoc).smallBlind === "number" &&
        (data as OptionsDoc).straddleEnabled !== undefined &&
        typeof (data as OptionsDoc).straddleEnabled === "boolean"
    )
}

export function isPartialOptionsDoc(
    data: unknown
): data is Partial<OptionsDoc> {
    return (
        ((data as Partial<OptionsDoc>).bigBlind === undefined ||
            typeof (data as Partial<OptionsDoc>).bigBlind === "number") &&
        ((data as Partial<OptionsDoc>).smallBlind === undefined ||
            typeof (data as Partial<OptionsDoc>).smallBlind === "number") &&
        ((data as Partial<OptionsDoc>).defaultChips === undefined ||
            typeof (data as Partial<OptionsDoc>).defaultChips === "number") &&
        ((data as Partial<OptionsDoc>).straddleEnabled === undefined ||
            typeof (data as Partial<OptionsDoc>).straddleEnabled === "boolean")
    )
}
