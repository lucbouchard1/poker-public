import React from "react"
import { connect } from "react-redux"
import { ReduxState } from "../../redux/store"
import { PlayersState } from "../../redux/reducers/players"
import { FrontendError } from "../../redux/errors"
import { PICK_SEAT, CHECK_ROOM_EXISTS, JOIN_ROOM } from "../../redux/actions"
import { getRoomId, isRoomPath } from "../../path"
import { ConnectedGame } from "./game"
import { PickSeat } from "./pick-seat"

interface DataProps {
    roomId: string
    gameState: "notStarted" | "inHand" | "finishedHand"
    name: string
    players: PlayersState
    authenticated: boolean
    authenticating: boolean
    createdRoom: boolean
    isHost: boolean
    error?: FrontendError
}

interface FunctionProps {
    pickSeat: (d: PICK_SEAT.Action) => void
    joinRoom: (d: JOIN_ROOM.Action) => void
    checkRoomExists: (roomId: string) => void
}

interface Props extends DataProps, FunctionProps {
    location: any
}

class GameTable extends React.Component<Props, {}> {
    componentDidMount() {
        const path = this.props.location.pathname as string

        if (
            (this.props.roomId === "" || !this.props.authenticated) &&
            isRoomPath(path)
        ) {
            const roomId = getRoomId(path)
            this.setState({ roomId })
            this.props.checkRoomExists(getRoomId(path))
        }
    }

    render() {
        const props = this.props
        const curr = props.players[props.name]

        if (!curr || curr.seat == -1)
            return (
                <PickSeat
                    hasJoinedRoom={
                        (props.authenticated && props.name in props.players) ||
                        props.createdRoom
                    }
                    isHost={props.isHost}
                    gameState={props.gameState}
                    players={props.players}
                    pickSeat={props.pickSeat}
                    roomId={props.roomId}
                />
            )
        else return <ConnectedGame />
    }
}

const mapDispatchToProps = (dispatch): FunctionProps => ({
    pickSeat: (d: PICK_SEAT.Action) => dispatch(PICK_SEAT.ops.create(d)),
    joinRoom: (d: JOIN_ROOM.Action) => dispatch(JOIN_ROOM.ops.create(d)),
    checkRoomExists: (roomId: string) =>
        dispatch(CHECK_ROOM_EXISTS.ops.create({ roomId: roomId })),
})

const mapStateToProps = (state: ReduxState): DataProps => ({
    name: state.user.name,
    gameState: state.game.state,
    isHost: state.game.host === state.user.name,
    players: state.players,
    roomId: state.game.roomId,
    authenticated: state.user.authenticated,
    authenticating: state.user.authenticating,
    createdRoom: state.user.createdRoom,
    error: state.error.error,
})

export default connect(mapStateToProps, mapDispatchToProps)(GameTable)
