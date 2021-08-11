import React from "react"
import { PICK_SEAT } from "../../redux/actions"
import { PlayersState } from "../../redux/reducers/players"
import { Layout } from "../layout"
import { EmptySeat } from "./empty-seat"
import { Player } from "./player"

interface Props {
    pickSeat: (d: PICK_SEAT.Action) => void
    players: PlayersState
    gameState: "notStarted" | "inHand" | "finishedHand"
    roomId: string
    isHost: boolean
    hasJoinedRoom: boolean
}

export const PickSeat: React.FC<Props> = (props: Props) => {
    const takenSeats = Object.values(props.players)
        .filter(v => v.seat != -1)
        .map(v => v.seat)

    let seats = Object.keys(props.players)
        .filter(k => props.players[k].seat != -1)
        .reduce((o, k) => {
            const v = props.players[k]
            o[v.seat] = (
                <Player
                    gameState={props.gameState}
                    key={k}
                    seat={v.seat}
                    chips={v.chips}
                    name={v.name}
                    isActive={false}
                    bet={0}
                />
            )
            return o
        }, {})

    seats = Array.from(Array(10).keys())
        .filter(i => !takenSeats.includes(i))
        .reduce((o, i) => {
            o[i] = <EmptySeat key={i} seat={i} pick={props.pickSeat} />
            return o
        }, seats)

    return (
        <Layout
            hasJoinedRoom={props.hasJoinedRoom}
            isHost={props.isHost}
            gameData={{
                roomId: props.roomId,
            }}
            seatElements={seats}
        />
    )
}
