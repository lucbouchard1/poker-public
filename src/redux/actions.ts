/* eslint-disable @typescript-eslint/no-empty-interface */
/* eslint-disable import/export */
/* eslint-disable @typescript-eslint/no-namespace */
import {
    GameDoc as GameDocument,
    PrivatePlayerDoc as PrivateDataDocument,
} from "@pokerweb-app/game/src/model"
import { CreateRoomArgs } from "@pokerweb-app/game/src/types"
import { CreateAction, CreateFallibleAction } from "./utils"

/**
 * Toggle the game sound
 */
export namespace TOGGLE_SOUND {
    export const ops = new CreateAction<{}>("TOGGLE_SOUND")
}

/**
 * Create a new room
 */
export namespace CREATE_ROOM {
    export interface Action extends CreateRoomArgs {}

    export interface Success {
        roomId: string
    }

    export const ops = new CreateFallibleAction<Action, Success>("CREATE_ROOM")
}

/**
 * Check if a room exists
 */
export namespace CHECK_ROOM_EXISTS {
    export interface Action {
        roomId: string
    }

    export interface Success extends GameDocument {}

    export const ops = new CreateFallibleAction<Action, Success>(
        "CHECK_ROOM_EXISTS"
    )
}

/**
 * Show the user's hand
 */
export namespace SHOW_HAND {
    export const ops = new CreateFallibleAction<{}, {}>("SHOW_HAND")
}

/**
 * Join a room
 */
export namespace JOIN_ROOM {
    export interface Action {
        playerName: string
        roomId: string
    }

    export interface Success {
        roomId: string
    }

    export const ops = new CreateFallibleAction<Action, Success>("JOIN_ROOM")
}

/**
 * Pick a table seat
 */
export namespace PICK_SEAT {
    export interface Action {
        seat: number
    }

    export interface Success extends GameDocument {}

    export const ops = new CreateFallibleAction<Action, Success>("PICK_SEAT")
}

/**
 * Toggle player standing
 */
export namespace TOGGLE_PLAYER_STANDING {
    export const ops = new CreateFallibleAction<{}, {}>(
        "TOGGLE_PLAYER_STANDING"
    )
}

/**
 * Kick out player
 */
export namespace KICK_OUT_PLAYER {
    export interface Action {
        playerName?: string
    }

    export const ops = new CreateFallibleAction<Action, {}>("KICK_OUT_PLAYER")
}

/**
 * Set the number of chips a user has. Can
 * only be performed by hast.
 */
export namespace SET_CHIPS {
    export interface Action {
        playerName: string
        chips: number
    }

    export interface Success extends GameDocument {}

    export const ops = new CreateFallibleAction<Action, Success>("SET_CHIPS")
}

/**
 * Game state changed
 */
export namespace GAME_STATE_UPDATE {
    export interface Action extends GameDocument {}

    export const ops = new CreateAction<Action>("GAME_STATE_UPDATE")
}

/**
 * Kicked from game
 */
export namespace KICKED_FROM_GAME {
    export const ops = new CreateAction<{}>("KICKED_FROM_GAME")
}

/**
 * Private data changed
 */
export namespace PRIVATE_DATA_UPDATE {
    export interface Action extends PrivateDataDocument {}

    export const ops = new CreateAction<Action>("PRIVATE_DATA_UPDATE")
}

/**
 * Start hand
 */
export namespace START_HAND {
    export const ops = new CreateFallibleAction<{}, {}>("START_HAND")
}

/**
 * Bet/Raise
 */
export namespace RAISE {
    export interface Action {
        amount: number
    }

    export const ops = new CreateFallibleAction<Action, {}>("RAISE")
}

/**
 * Fold
 */
export namespace FOLD {
    export const ops = new CreateFallibleAction<{}, {}>("FOLD")
}

/**
 * Call
 */
export namespace CALL {
    export const ops = new CreateFallibleAction<{}, {}>("CALL")
}

/**
 * Check
 */
export namespace CHECK {
    export const ops = new CreateFallibleAction<{}, {}>("CHECK")
}
