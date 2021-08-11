/* eslint-disable no-case-declarations */
import { analytics } from "../../firebase"
import { CREATE_ROOM, JOIN_ROOM, START_HAND } from "../actions"
import { ReduxState } from "../store"

export const analyticsMiddleware = store => next => action => {
    const state: ReduxState = store.getState()

    switch (action.type) {
        case CREATE_ROOM.ops.success:
            analytics.logEvent("create_room", { roomId: action.roomId })
            break

        case JOIN_ROOM.ops.success:
            analytics.logEvent("join_room", { roomId: action.roomId })
            break

        case START_HAND.ops.success:
            analytics.logEvent("start_hand", { roomId: state.game.roomId })
            break
    }

    return next(action)
}
