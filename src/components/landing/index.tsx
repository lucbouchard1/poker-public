import React, { useEffect } from "react"
import { connect } from "react-redux"
import { ReduxState } from "../../redux/store"
import { CREATE_ROOM, JOIN_ROOM } from "../../redux/actions"
import { FrontendError } from "../../redux/errors"
import { getRoomPath } from "../../path"
import { Header } from "../header"
import { CreateRoomForm } from "./create-room"

import styles from "./index.module.scss"

interface Props {
    createRoom: (data: CREATE_ROOM.Action) => void
    joinRoom: (data: JOIN_ROOM.Action) => void
    authenticating: boolean
    error?: FrontendError
    roomId?: string
    history: any
}

const Landing: React.FC<Props> = (props: Props) => {
    useEffect(() => {
        if (props.roomId) {
            props.history.push(getRoomPath(props.roomId))
        }
    })

    return (
        <div className={styles.container}>
            <Header />
            <div className={styles.main}>
                <h1>Play Poker with Friends</h1>
                <p>Just send them a link!</p>
                <div className={styles.form}>
                    {props.error && (
                        <p className={styles.error}>{props.error.name}</p>
                    )}
                    <div className={styles.content}>
                        <CreateRoomForm
                            createRoom={props.createRoom}
                            authenticating={props.authenticating}
                            error={props.error?.data}
                        />
                    </div>
                </div>
            </div>
            <div className={styles.footer} />
        </div>
    )
}

const mapDispatchToProps = dispatch => ({
    createRoom: (d: CREATE_ROOM.Action) => dispatch(CREATE_ROOM.ops.create(d)),
})

const mapStateToProps = (state: ReduxState) => ({
    authenticating: state.user.authenticating,
    error: state.error.error,
    roomId: state.game.roomId !== "" ? state.game.roomId : undefined,
})

export default connect(mapStateToProps, mapDispatchToProps)(Landing)
