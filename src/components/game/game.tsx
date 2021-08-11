import React from "react"
import { connect } from "react-redux"
import { Card } from "@pokerweb-app/game/src/model"
import { CurrentHand } from "../../redux/reducers/game"
import { ReduxState } from "../../redux/store"
import { PlayersState } from "../../redux/reducers/players"
import { Layout } from "../layout"
import { ConnectedControls } from "./controls"
import { Player } from "./player"
import { Community } from "./community"

interface Props {
    roomId: string
    host: string
    gameState: "notStarted" | "inHand" | "finishedHand"
    name: string
    players: PlayersState
    currentHand?: CurrentHand
    hand: Card[]
    isHost: boolean
    timeoutExpiry?: number
}

const Game: React.FC<Props> = (props: Props) => {
    const curPlayer = props.players[props.name]
    const community = props.currentHand ? props.currentHand.community : []

    const seats = Object.keys(props.players)
        .filter(k => props.players[k].seat != -1)
        .reduce((o, k) => {
            const v = props.players[k]
            const shiftedSeat = (v.seat + (10 - curPlayer.seat)) % 10

            let hand = v.shownHand
            if (v.name == curPlayer.name) hand = props.hand

            o[shiftedSeat] = (
                <Player
                    key={k}
                    seat={shiftedSeat}
                    chips={v.chips}
                    name={v.name}
                    bet={v.bet}
                    gameState={props.gameState}
                    isActive={
                        props.gameState === "inHand" &&
                        v.seat === props.currentHand?.activeSeat
                    }
                    isDealtIn={v.isDealtIn}
                    isBigBlind={v.name === props.currentHand?.bigBlindName}
                    isSmallBlind={v.name === props.currentHand?.smallBlindName}
                    isDealer={v.name === props.currentHand?.dealerName}
                    isFolded={v.isFolded}
                    isAllIn={v.isAllIn}
                    isStanding={v.isStanding}
                    isHost={props.isHost}
                    hand={hand}
                    chipsWon={v.chipsWon}
                    timeoutExpiry={props.timeoutExpiry}
                />
            )
            return o
        }, {})

    const pot = props.currentHand
        ? props.currentHand.pots.reduce((tot, p) => {
              return tot + p.chips
          }, 0)
        : 0
    const center = (
        <Community cards={community} pot={pot} gameState={props.gameState} />
    )

    return (
        <Layout
            hasJoinedRoom={true}
            gameData={{
                roomId: props.roomId,
            }}
            seatElements={seats}
            centerElement={center}
            footerElement={<ConnectedControls />}
        />
    )
}

const mapStateToProps = (state: ReduxState): Props => ({
    name: state.user.name,
    host: state.game.host,
    gameState: state.game.state,
    hand: state.game.hand,
    players: state.players,
    roomId: state.game.roomId,
    currentHand: state.game.currentHand,
    isHost: state.user.name === state.game.host,
    timeoutExpiry: state.game.timeoutExpiry,
})

export const ConnectedGame = connect(mapStateToProps)(Game)
