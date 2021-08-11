/* eslint-disable no-case-declarations */
import { GAME_STATE_UPDATE, KICKED_FROM_GAME } from "../actions"
import { ReduxState } from "../store"

export const checkKickedMiddleware = store => next => action => {
    const state: ReduxState = store.getState()

    if (
        action.type === GAME_STATE_UPDATE.ops.action &&
        state.user.authenticated &&
        !(state.user.name in state.players)
    ) {
        return next(KICKED_FROM_GAME.ops.create())
    }

    return next(action)
}
