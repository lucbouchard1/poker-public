/* eslint-disable no-case-declarations */
import { GameDoc, CurrentHandDoc, Card } from "@pokerweb-app/game/src/model"
import { GAME_STATE_UPDATE, PRIVATE_DATA_UPDATE } from "../actions"

export interface CurrentHand extends CurrentHandDoc {
    dealerName: string
    bigBlindName: string
    smallBlindName: string
    activePlayerName: string
}

export interface GameState {
    serverState?: GameDoc
    roomId: string
    host: string
    state: "notStarted" | "inHand" | "finishedHand"
    bigBlind: number
    smallBlind: number
    defaultChips: number
    hand: Card[]
    currentHand?: CurrentHand
    activePlayers: number
    timeoutExpiry?: number
}

const initialState: GameState = {
    roomId: "",
    host: "",
    state: null,
    bigBlind: 0,
    smallBlind: 0,
    defaultChips: 0,
    hand: [],
    activePlayers: 0,
}

export const game = (state = initialState, action): GameState => {
    switch (action.type) {
        case GAME_STATE_UPDATE.ops.action:
            let dealerName = ""
            let smallBlindName = ""
            let bigBlingName = ""
            let activePlayerName = ""
            let currentHand = undefined
            if (action.currentHand) {
                dealerName = action.seats[action.currentHand.dealerSeat]
                smallBlindName =
                    action.currentHand.smallBlindSeat !== undefined
                        ? action.seats[action.currentHand.smallBlindSeat]
                        : ""
                bigBlingName = action.seats[action.currentHand.bigBlindSeat]
                activePlayerName = action.seats[action.currentHand.activeSeat]
                currentHand = {
                    ...action.currentHand,
                    dealerName: dealerName,
                    bigBlindName: bigBlingName,
                    smallBlindName: smallBlindName,
                    activePlayerName: activePlayerName,
                }
            }

            return Object.assign({}, state, {
                serverState: action,
                roomId: action.roomId,
                host: action.hostName,
                state: action.state,
                bigBlind: action.options.bigBlind,
                smallBlind: action.options.smallBlind,
                defaultChips: action.options.defaultChips,
                currentHand: currentHand,
                activePlayers: action.seats.filter(p => {
                    if (p === "") return false

                    const player = action.players[p]
                    const chipsWon = player.chipsWon ? player.chipsWon : 0
                    const chips = player.chips + chipsWon
                    return chips > 0 && !player.isStanding
                }).length,
                timeoutExpiry: action.timeout?.expiry,
            })

        case PRIVATE_DATA_UPDATE.ops.action:
            return Object.assign({}, state, {
                hand: action.hand ? action.hand : [],
            })

        default:
            return state
    }
}
