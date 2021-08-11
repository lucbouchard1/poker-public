import {
    CREATE_ROOM,
    JOIN_ROOM,
    GAME_STATE_UPDATE,
    PRIVATE_DATA_UPDATE,
    TOGGLE_SOUND,
    KICKED_FROM_GAME,
} from "../actions"
import { FAILURE_ACTION } from "../errors"

export interface UserState {
    name: string
    authenticating: boolean
    authenticated: boolean
    readGameDoc: boolean
    isSoundEnabled: boolean
    createdRoom: boolean
}

const initialState: UserState = {
    name: null,
    authenticating: false,
    authenticated: false,
    readGameDoc: false,
    isSoundEnabled: true,
    createdRoom: false,
}

export const user = (state = initialState, action): UserState => {
    switch (action.type) {
        case FAILURE_ACTION:
            if (
                action.failedAction === CREATE_ROOM.ops.action ||
                action.JOIN_ROOM === JOIN_ROOM.ops.action
            ) {
                return Object.assign({}, state, {
                    authenticating: false,
                    createdRoom: false,
                })
            }
            return state

        case CREATE_ROOM.ops.action:
            return Object.assign({}, state, {
                name: action.playerName,
                authenticating: true,
                createdRoom: true,
            })

        case JOIN_ROOM.ops.action:
            return Object.assign({}, state, {
                name: action.playerName,
                authenticating: true,
            })

        case GAME_STATE_UPDATE.ops.action:
            if (state.authenticated || !(state.name in action.players))
                return state

            return Object.assign({}, state, {
                readGameDoc: true,
                authenticated: state.name !== null,
            })

        case PRIVATE_DATA_UPDATE.ops.action:
            return Object.assign({}, state, {
                name: action.name,
                authenticated: state.readGameDoc,
            })

        case TOGGLE_SOUND.ops.action:
            return Object.assign({}, state, {
                isSoundEnabled: !state.isSoundEnabled,
            })

        case KICKED_FROM_GAME.ops.action:
            return initialState

        default:
            return state
    }
}
