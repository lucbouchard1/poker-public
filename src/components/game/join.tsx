import React from "react"
import { connect } from "react-redux"
import * as verify from "@pokerweb-app/game/src/request-params"
import { JOIN_ROOM } from "../../redux/actions"
import { PlayersState } from "../../redux/reducers/players"
import { FrontendError } from "../../redux/errors"
import { ReduxState } from "../../redux/store"
import { JoinButton } from "../buttons/join"
import { NameInput } from "../utils/name-input"

import styles from "./join.module.scss"

interface Props {
    joinRoom: (d: JOIN_ROOM.Action) => void
    players: PlayersState
    roomId: string
    authenticating: boolean
    authenticated: boolean
    error?: FrontendError
}

interface State {
    name: string
    stateValid: boolean
    error?: string
}

class JoinRoom extends React.Component<Props, State> {
    constructor(props: Props) {
        super(props)
        this.state = { name: "", stateValid: false }

        this.handleSubmit = this.handleSubmit.bind(this)
    }

    isStateValid(
        state: State,
        props: Props
    ): {
        valid: boolean
        name?: string
        error?: string
    } {
        const { name, res } = verify.verifyPlayerName(state.name)
        if (res !== verify.PlayerNameResults.VALID) return { valid: false }

        if (state.name in props.players) {
            return { valid: false, error: "That name is taken! Try another..." }
        }

        return {
            valid: true,
            name,
        }
    }

    handleSubmit() {
        const { valid, name } = this.isStateValid(this.state, this.props)

        if (!valid) return

        this.props.joinRoom({
            playerName: name,
            roomId: this.props.roomId,
        })
    }

    componentDidUpdate(prevProps: Props, prevState: State) {
        const { valid, error } = this.isStateValid(this.state, this.props)

        if (prevState.stateValid !== valid)
            this.setState({
                stateValid: valid,
                error,
            })
    }

    render() {
        return (
            <div className={styles.container}>
                <div className={styles.form}>
                    {!this.props.authenticating &&
                        !this.props.authenticated &&
                        this.state.error && (
                            <p className={styles.error}>{this.state.error}</p>
                        )}
                    {this.props.error &&
                        this.props.error.name !== "InvalidRoomError" && (
                            <p className={styles.error}>{this.state.error}</p>
                        )}
                    {this.props.error?.name === "InvalidRoomError" && (
                        <p className={styles.error}>This room does not exist</p>
                    )}
                    <NameInput
                        id={"joinRoomNameInput"}
                        label={"Enter Display Name To Join"}
                        onChange={name => this.setState({ name })}
                        name={this.state.name}
                        className={styles.name}
                    />
                    <JoinButton
                        innerClassName={styles.button}
                        isAuthenticating={this.props.authenticating}
                        isActive={this.state.stateValid}
                        isCreate={false}
                        onClick={this.handleSubmit}
                    />
                </div>
            </div>
        )
    }
}

const mapDispatchToProps = dispatch => ({
    joinRoom: (d: JOIN_ROOM.Action) => dispatch(JOIN_ROOM.ops.create(d)),
})

const mapStateToProps = (state: ReduxState) => ({
    players: state.players,
    roomId: state.game.roomId,
    authenticating: state.user.authenticating,
    authenticated: state.user.authenticated,
    error: state.error.error,
})

export default connect(mapStateToProps, mapDispatchToProps)(JoinRoom)
