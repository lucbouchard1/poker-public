import React from "react"
import { connect } from "react-redux"
import { CurrentHandDoc, Card } from "@pokerweb-app/game/src/model"
import { ReduxState } from "../../../redux/store"
import {
    START_HAND,
    RAISE,
    CHECK,
    CALL,
    FOLD,
    SHOW_HAND,
} from "../../../redux/actions"
import { CallButton } from "../../buttons/call"
import { CheckButton } from "../../buttons/check"
import { FoldButton } from "../../buttons/fold"
import { ShowHandButton } from "../../buttons/show-hand"
import { CancelAutostartButton } from "../../buttons/cancel-autostart"
import { StartHandButton } from "../../buttons/startHand"

import { BetControls } from "./bet"

import styles from "./index.module.scss"

const START_HAND_TIMEOUT_DURATION_SEC = 10

export interface DataProps {
    name: string
    host: string
    chips: number
    activePlayers: number
    isPlayersTurn: boolean
    gameState: "notStarted" | "inHand" | "finishedHand"
    hand: Card[]
    bet: number
    minRaise: number
    blind: number
    currentHand: CurrentHandDoc
    activePlayerName?: string
    isHandShown: boolean
    isDealtIn: boolean
}

interface FunctionProps {
    startHand: () => void
    showHand: () => void
    raise: (d: RAISE.Action) => void
    check: () => void
    fold: () => void
    call: () => void
}

interface Props extends DataProps, FunctionProps {}

export interface State {
    betValue: number
    startHandTimeRemaining: number
}

class Controls extends React.Component<Props, State> {
    constructor(props: Props) {
        super(props)

        this.state = {
            betValue: props.minRaise,
            startHandTimeRemaining: -1,
        }

        this.onSliderChange = this.onSliderChange.bind(this)
    }

    onSliderChange(value) {
        this.setState({
            betValue: value,
        })
    }

    componentDidUpdate(prevProps: Props) {
        if (
            this.props.activePlayers >= 2 &&
            this.props.gameState === "finishedHand" &&
            prevProps.gameState === "inHand" &&
            this.props.name === this.props.host
        ) {
            this.startHandTimeout = (setInterval(() => {
                if (Math.floor(this.state.startHandTimeRemaining) === 0) {
                    clearInterval(this.startHandTimeout)
                    this.props.startHand()
                }
                this.setState({
                    startHandTimeRemaining:
                        this.state.startHandTimeRemaining - 1,
                })
            }, 1000) as unknown) as number

            this.setState({
                startHandTimeRemaining: START_HAND_TIMEOUT_DURATION_SEC,
            })
        }

        if (this.props.activePlayers < 2 && this.startHandTimeout) {
            clearTimeout(this.startHandTimeout)
            this.startHandTimeout = undefined
        }

        if (prevProps.minRaise !== this.props.minRaise)
            this.setState({ betValue: this.props.minRaise })
    }

    render() {
        const p = this.props
        const pot = p.currentHand
            ? p.currentHand.pots.reduce((tot, p) => {
                  return tot + p.chips
              }, 0)
            : 0
        const isRaise = p.gameState === "inHand" && p.currentHand?.bet !== 0
        const minRaise = p.minRaise
        const maxRaise =
            p.chips - ((p.currentHand ? p.currentHand.bet : 0) - p.bet)

        return (
            <div className={styles.container}>
                <div
                    className={[
                        styles.controls,
                        p.isPlayersTurn ? styles.active : "",
                    ].join(" ")}
                >
                    <div className={styles.gameFlow}>
                        <StartHandButton
                            isPlayersTurn={p.isPlayersTurn}
                            host={p.host}
                            activePlayerName={p.activePlayerName}
                            isHost={p.name === p.host}
                            activePlayers={p.activePlayers}
                            gameState={p.gameState}
                            startHandTimeRemaining={
                                this.state.startHandTimeRemaining
                            }
                            startHandTimeoutDuration={
                                START_HAND_TIMEOUT_DURATION_SEC
                            }
                            startHand={() => {
                                if (this.startHandTimeout) {
                                    clearInterval(this.startHandTimeout)
                                    this.startHandTimeout = undefined
                                    this.setState({
                                        startHandTimeRemaining: -1,
                                    })
                                }
                                p.startHand()
                            }}
                        />
                        {this.state.startHandTimeRemaining !== -1 && (
                            <CancelAutostartButton
                                onClick={() => {
                                    if (this.startHandTimeout) {
                                        clearInterval(this.startHandTimeout)
                                        this.startHandTimeout = undefined
                                    }
                                    this.setState({
                                        startHandTimeRemaining: -1,
                                    })
                                }}
                            />
                        )}
                    </div>
                    <div className={styles.buttons}>
                        {p.gameState === "finishedHand" && p.isDealtIn && (
                            <div className={styles.showHand}>
                                <ShowHandButton
                                    onClick={p.showHand}
                                    isShown={p.isHandShown}
                                />
                            </div>
                        )}
                        <div className={styles.staticButtons}>
                            <CheckButton
                                isPlayersTurn={p.isPlayersTurn}
                                gameState={p.gameState}
                                userBet={p.bet}
                                tableBet={p.currentHand?.bet}
                                check={p.check}
                            />
                            <BetControls
                                pot={pot}
                                isRaise={isRaise}
                                sliderChanged={this.onSliderChange}
                                betValue={this.state.betValue}
                                isActive={
                                    p.gameState === "inHand" &&
                                    p.isPlayersTurn &&
                                    minRaise < maxRaise
                                }
                                raise={p.raise}
                                minBet={minRaise}
                                maxBet={maxRaise}
                                blind={p.blind}
                            />
                            <CallButton
                                isPlayersTurn={p.isPlayersTurn}
                                gameState={p.gameState}
                                userBet={p.bet}
                                userChips={p.chips}
                                tableBet={p.currentHand?.bet}
                                call={p.call}
                            />
                            <FoldButton
                                isPlayersTurn={p.isPlayersTurn}
                                gameState={p.gameState}
                                fold={p.fold}
                            />
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    startHandTimeout: number = undefined
}

const mapDispatchToProps = (dispatch): FunctionProps => ({
    startHand: () => dispatch(START_HAND.ops.create()),
    showHand: () => dispatch(SHOW_HAND.ops.create()),
    raise: (d: RAISE.Action) => dispatch(RAISE.ops.create(d)),
    check: () => dispatch(CHECK.ops.create()),
    fold: () => dispatch(FOLD.ops.create()),
    call: () => dispatch(CALL.ops.create()),
})

const mapStateToProps = (state: ReduxState): DataProps => {
    const p = state.players[state.user.name]
    return {
        name: state.user.name,
        host: state.game.host,
        gameState: state.game.state,
        chips: p.chips,
        minRaise: !state.game.currentHand?.bet
            ? state.game.bigBlind
            : state.game.currentHand.bet,
        blind: state.game.bigBlind,
        isPlayersTurn: p.seat === state.game.currentHand?.activeSeat,
        hand: state.game.hand,
        bet: p.bet,
        currentHand: state.game.currentHand,
        activePlayerName: state.game.currentHand?.activePlayerName,
        activePlayers: state.game.activePlayers,
        isHandShown: p.shownHand !== undefined,
        isDealtIn: p.isDealtIn,
    }
}

export const ConnectedControls = connect(
    mapStateToProps,
    mapDispatchToProps
)(Controls)
