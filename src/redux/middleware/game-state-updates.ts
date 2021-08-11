/* eslint-disable no-case-declarations */
import {
    raise,
    call,
    fold,
    check,
    setChips,
    showHand,
    seatPlayer,
    togglePlayerStanding,
} from "@pokerweb-app/game/src/controller"
import { PrivatePlayerDoc } from "@pokerweb-app/game/src/model"
import {
    lazy,
    InHandGame,
    CheckableInHandGame,
    CallableInHandGame,
    FinishedHandGame,
} from "@pokerweb-app/game/src/types"
import {
    RAISE,
    FOLD,
    CALL,
    CHECK,
    SET_CHIPS,
    SHOW_HAND,
    GAME_STATE_UPDATE,
    PICK_SEAT,
    TOGGLE_PLAYER_STANDING,
} from "../actions"
import { ReduxState } from "../store"

export const gameStateMiddleware = store => next => action => {
    const state: ReduxState = store.getState()
    let result = undefined

    switch (action.type) {
        case PICK_SEAT.ops.action:
            const p = action as PICK_SEAT.Action
            result = seatPlayer(
                lazy(state.game.serverState as InHandGame),
                state.user.name,
                p.seat
            ).then(val => ({
                game: val,
            }))
            break

        case TOGGLE_PLAYER_STANDING.ops.action:
            result = togglePlayerStanding(
                lazy(state.game.serverState as InHandGame),
                state.user.name
            )
            break

        case RAISE.ops.action:
            const a = action as RAISE.Action
            result = raise(lazy(state.game.serverState as InHandGame), a.amount)
            break

        case FOLD.ops.action:
            result = fold(lazy(state.game.serverState as InHandGame))
            break

        case CHECK.ops.action:
            result = check(lazy(state.game.serverState as CheckableInHandGame))
            break

        case CALL.ops.action:
            result = call(lazy(state.game.serverState as CallableInHandGame))
            break

        case SET_CHIPS.ops.action:
            result = setChips(
                lazy(state.game.serverState),
                action.playerName,
                action.chips
            )
            break

        case SHOW_HAND.ops.action:
            result = showHand(
                lazy(state.game.serverState as FinishedHandGame),
                lazy({ hand: state.game.hand } as PrivatePlayerDoc)
            )
            break
    }

    if (result) {
        return result
            .then(val => {
                next({
                    ...val.game,
                    type: GAME_STATE_UPDATE.ops.action,
                })
            })
            .catch(() => {
                next(action)
            })
    }
    return next(action)
}
