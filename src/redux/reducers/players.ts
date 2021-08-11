import { PublicPlayerDoc } from "@pokerweb-app/game/src/model"
import { GAME_STATE_UPDATE } from "../actions"

export interface PlayersState {
    [key: string]: PublicPlayerDoc
}

const initialState: PlayersState = {}

export const players = (state = initialState, action): PlayersState => {
    switch (action.type) {
        case GAME_STATE_UPDATE.ops.action:
            for (const k of Object.keys(action.players))
                if (action.players[k].seat === undefined)
                    action.players[k].seat = -1
            return action.players

        default:
            return state
    }
}
