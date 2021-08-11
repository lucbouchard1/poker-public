import React from "react"
import { Rank, Suit } from "@pokerweb-app/game/src/model"
import * as verify from "@pokerweb-app/game/src/request-params"
import { CREATE_ROOM } from "../../redux/actions"
import { JoinButton } from "../buttons/join"
import { PlayingCard } from "../game/playing-card"
import { ChipInput } from "../utils/chip-input"
import { NameInput } from "../utils/name-input"

import styles from "./create-room.module.scss"

interface Props {
    createRoom: (data: CREATE_ROOM.Action) => void
    authenticating: boolean
    error?: string
}

interface State {
    name: string
    bigBlind: string
    smallBlind: string
    startingStack: string
    stateValid: boolean
    nameFocused: boolean
    waitingForServer: boolean
}

export class CreateRoomForm extends React.Component<Props, State> {
    constructor(props) {
        super(props)
        this.state = {
            name: "",
            smallBlind: "10",
            bigBlind: "20",
            startingStack: "1000",
            stateValid: false,
            nameFocused: false,
            waitingForServer: false,
        }

        this.handleSubmit = this.handleSubmit.bind(this)
    }

    isStateValid(
        state: State
    ): {
        valid: boolean
        name?: string
        big?: number
        small?: number
        stack?: number
    } {
        // Ignoring the name result here?
        const { name, res } = verify.verifyPlayerName(state.name)
        if (res !== verify.PlayerNameResults.VALID) return { valid: false }

        const sb = verify.verifyChipValue(state.smallBlind)
        if (sb.res !== verify.ChipValueResults.VALID) return { valid: false }

        const bb = verify.verifyChipValue(state.bigBlind)
        if (bb.res !== verify.ChipValueResults.VALID) return { valid: false }

        const s = verify.verifyChipValue(state.startingStack)
        if (s.res !== verify.ChipValueResults.VALID) return { valid: false }

        return {
            valid: true,
            name,
            big: bb.val,
            small: sb.val,
            stack: s.val,
        }
    }

    componentDidUpdate(prevProps: Props, prevState: State) {
        const { valid } = this.isStateValid(this.state)

        if (prevState.stateValid !== valid)
            this.setState({
                stateValid: valid,
            })

        if (!prevProps.authenticating && this.props.authenticating)
            this.waitingForServer = (setTimeout(() => {
                this.waitingForServer = undefined
                this.setState({ waitingForServer: true })
            }, 2000) as unknown) as number
    }

    componentWillUnmount() {
        if (this.waitingForServer) clearTimeout(this.waitingForServer)
    }

    handleSubmit() {
        const { valid, small, big, stack, name } = this.isStateValid(this.state)

        if (!valid) return

        this.props.createRoom({
            hostName: name,
            options: {
                defaultChips: stack,
                smallBlind: small,
                bigBlind: big,
                straddleEnabled: true
            },
        })
    }

    render() {
        return (
            <div className={styles.container}>
                <div className={styles.form}>
                    {this.props.error && (
                        <p className={styles.error}>{this.props.error}</p>
                    )}
                    <NameInput
                        id={"createRoomNameInput"}
                        label={"Display Name"}
                        onChange={name => this.setState({ name })}
                        name={this.state.name}
                        className={styles.name}
                    />
                    <div className={styles.blindContainer}>
                        <ChipInput
                            label={"Small Blind"}
                            id={"smallBlind"}
                            className={styles.blind}
                            chips={this.state.smallBlind}
                            onChange={val => this.setState({ smallBlind: val })}
                        />
                        <div className={styles.blindSpacer} />
                        <ChipInput
                            label={"Big Blind"}
                            id={"bigBlind"}
                            className={styles.blind}
                            chips={this.state.bigBlind}
                            onChange={val => this.setState({ bigBlind: val })}
                        />
                    </div>
                    <ChipInput
                        label={"Starting Stack"}
                        id={"startingStack"}
                        className={styles.chipInput}
                        chips={this.state.startingStack}
                        onChange={val => this.setState({ startingStack: val })}
                    />
                    <JoinButton
                        isAuthenticating={this.props.authenticating}
                        isActive={this.state.stateValid}
                        isCreate={true}
                        className={styles.button}
                        onClick={this.handleSubmit}
                    />
                    {!this.props.authenticating && (
                        <div className={styles.cards}>
                            <PlayingCard
                                className={styles.leftCard}
                                faceUp={true}
                                card={{ rank: Rank.Ace, suit: Suit.Heart }}
                            />
                            <PlayingCard
                                className={styles.rightCard}
                                faceUp={true}
                                card={{ rank: Rank.Ace, suit: Suit.Spade }}
                            />
                        </div>
                    )}
                    {this.state.waitingForServer && (
                        <p className={styles.waiting}>
                            Waiting for servers to wake up...
                        </p>
                    )}
                </div>
            </div>
        )
    }

    waitingForServer: number = undefined
}
