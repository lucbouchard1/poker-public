/* eslint-disable no-case-declarations */
import { GameDoc, GameState } from "@pokerweb-app/game/src/model"
import {
    CREATE_ROOM,
    JOIN_ROOM,
    GAME_STATE_UPDATE,
    PICK_SEAT,
    START_HAND,
    RAISE,
    FOLD,
    CALL,
    CHECK,
} from "../actions"
import { ReduxState } from "../store"

import bet from "./sounds/Bet.mp3"
import win from "./sounds/Win.mp3"
import fold from "./sounds/Fold.mp3"
import deal from "./sounds/Deal.mp3"
import check from "./sounds/Check.mp3"
import yourTurn from "./sounds/YourTurnSound.mp3"

const betAudio = new Audio(bet)
const winAudio = new Audio(win)
const foldAudio = new Audio(fold)
const dealAudio = new Audio(deal)
const checkAudio = new Audio(check)
const yourTurnAudio = new Audio(yourTurn)

function playSound(sound: HTMLAudioElement) {
    setTimeout(() => sound.play(), 0)
}

export const playSoundMiddleware = store => next => action => {
    const oldState: ReduxState = store.getState()

    if (!oldState.user.isSoundEnabled) return next(action)

    switch (action.type) {
        case CREATE_ROOM.ops.action:
        case JOIN_ROOM.ops.action:
        case PICK_SEAT.ops.action:
        case START_HAND.ops.action:
            break
        case RAISE.ops.action:
            playSound(betAudio)
            break
        case FOLD.ops.action:
            playSound(foldAudio)
            break
        case CALL.ops.action:
            playSound(betAudio)
            break
        case CHECK.ops.action:
            playSound(checkAudio)
            break
        case GAME_STATE_UPDATE.ops.action:
            const state: GameDoc = action as GameDoc
            const seat = state.players[oldState.user.name]?.seat
            const isNewRound =
                oldState.game.currentHand !== undefined &&
                state.currentHand !== undefined &&
                oldState.game.currentHand.community.filter(v => v !== null)
                    .length < state.currentHand.community.length

            if (
                state.state == GameState.IN_HAND &&
                (oldState.game.state === GameState.NOT_STARTED ||
                    oldState.game.state === GameState.FINISHED_HAND)
            ) {
                playSound(dealAudio)
            }
            if (
                oldState.game.state === GameState.IN_HAND &&
                state.state === GameState.FINISHED_HAND
            ) {
                playSound(winAudio)
            }
            if (
                seat !== undefined &&
                (oldState.game.currentHand?.activeSeat !== seat ||
                    isNewRound) &&
                state.currentHand?.activeSeat === seat
            ) {
                playSound(yourTurnAudio)
            }
            break
    }

    return next(action)
}
