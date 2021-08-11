import React from "react"
import { Helmet } from "react-helmet"
import { connect } from "react-redux"
import { Link } from "react-router-dom"
import { ReduxState } from "../redux/store"
import { TOGGLE_PLAYER_STANDING, TOGGLE_SOUND } from "../redux/actions"

import infoIcon from "./img/info-circle-solid.svg"
import standIcon from "./game/img/persons.svg"
import sitIcon from "./game/img/people.svg"
import muteIcon from "./img/volume-mute-solid.svg"
import soundIcon from "./img/volume-up-solid.svg"

import styles from "./header.module.scss"

interface Props {
    inGame: boolean
    isStanding: boolean
    isPlayersTurn: boolean
    isSoundEnabled: boolean
    infoClicked?: () => void
    fixed: boolean
    spacerHeight?: number
    standUp: () => void
    toggleSound: () => void
    host: string
    className?: string
}

const HeaderInternal: React.FC<Props> = (props: Props) => {
    let titleText = undefined

    if (props.inGame) {
        if (props.isPlayersTurn) titleText = "Your Turn  · PokerTable.app"
        else titleText = props.host + "'s Poker Table · PokerTable.app"
    }

    return (
        <div className={props.className}>
            {titleText && (
                <Helmet>
                    <title>{titleText}</title>
                    {props.isPlayersTurn ? (
                        <link rel="icon" href="/yourturn.ico" />
                    ) : (
                        <link rel="icon" href="/favicon.ico" />
                    )}
                </Helmet>
            )}
            <div
                className={styles.container}
                style={props.fixed ? { position: "fixed" } : {}}
            >
                <Link to={"/"} className={styles.link}>
                    <h1 className={styles.logo}>PokerTable.app</h1>
                </Link>
                {props.inGame ? (
                    <div className={styles.controls}>
                        <img
                            className={styles.stand}
                            src={props.isStanding ? sitIcon : standIcon}
                            alt={props.isStanding ? "Sit Down" : "Stand Up"}
                            onClick={() => props.standUp()}
                        />
                        <img
                            className={
                                props.isSoundEnabled
                                    ? styles.sound
                                    : styles.mute
                            }
                            src={props.isSoundEnabled ? soundIcon : muteIcon}
                            alt={"Toggle Sound"}
                            onClick={props.toggleSound}
                        />
                        <img
                            className={styles.info}
                            src={infoIcon}
                            alt={"Room Information"}
                            onClick={props.infoClicked}
                        />
                    </div>
                ) : (
                    <Link to={"/about"} className={styles.link}>
                        <p className={styles.buttonText}>About</p>
                    </Link>
                )}
            </div>
            {props.fixed && <div style={{ height: props.spacerHeight }} />}
        </div>
    )
}

const mapStateToProps = (state: ReduxState) => {
    const player =
        state.user.name in state.players
            ? state.players[state.user.name]
            : undefined

    return {
        inGame: state.game.state !== null,
        isStanding: player ? player.isStanding : false,
        isPlayersTurn:
            state.game.state === "inHand"
                ? state.game.currentHand.activeSeat === player?.seat
                : false,
        isSoundEnabled: state.user.isSoundEnabled,
        host: state.game.host,
    }
}

const mapDispatchToProps = dispatch => ({
    standUp: () => dispatch(TOGGLE_PLAYER_STANDING.ops.create()),
    toggleSound: () => dispatch(TOGGLE_SOUND.ops.create({})),
})

export const Header = connect(
    mapStateToProps,
    mapDispatchToProps
)(HeaderInternal)
