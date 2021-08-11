import React from "react"
import { connect } from "react-redux"
import { SET_CHIPS, KICK_OUT_PLAYER } from "../redux/actions"
import { PlayersState } from "../redux/reducers/players"
import { ReduxState } from "../redux/store"
import { getRoomPath } from "../path"
import { KickOutButton } from "./buttons/kick-out"
import { CopyableLink } from "./utils/copyable-link"
import { SetChips } from "./utils/set-chips"

import close from "./img/times-solid.svg"

import styles from "./game-info.module.scss"

export interface Props {
    roomId: string
    name: string
    host: string
    smallBlind: number
    bigBlind: number
    players: PlayersState
    setChips: (d: SET_CHIPS.Action) => void
    kickOut: (d: KICK_OUT_PLAYER.Action) => void
    close: () => void
}

const Info: React.FC<Props> = (props: Props) => (
    <div className={styles.container}>
        <div className={styles.main}>
            <div className={styles.content}>
                <img
                    className={styles.close}
                    src={close}
                    alt={"close"}
                    onClick={props.close}
                />
                <h3>Game Link</h3>
                <div className={styles.link}>
                    <CopyableLink
                        link={location.origin + getRoomPath(props.roomId)}
                    />
                </div>
                <h3>Game Info</h3>
                <div className={styles.info}>
                    <div className={styles.section}>
                        <p>Host</p>
                        <p>Luc</p>
                    </div>
                    <div className={styles.section}>
                        <p>Big Blind</p>
                        <p>{props.bigBlind}</p>
                    </div>
                    <div className={[styles.section, styles.last].join(" ")}>
                        <p>Small Blind</p>
                        <p>{props.smallBlind}</p>
                    </div>
                </div>
                {props.name === props.host && (
                    <div>
                        <h3>Players</h3>
                        <div className={styles.players}>
                            {Object.keys(props.players).map((n, i) => (
                                <div
                                    className={[
                                        styles.player,
                                        i ===
                                        Object.keys(props.players).length - 1
                                            ? styles.last
                                            : "",
                                    ].join(" ")}
                                    key={n}
                                >
                                    <p className={styles.name}>{n}</p>
                                    <SetChips
                                        id={n}
                                        chips={
                                            props.players[n].chips +
                                            (props.players[n].chipsWon
                                                ? props.players[n].chipsWon
                                                : 0)
                                        }
                                        setChips={v =>
                                            props.setChips({
                                                playerName: n,
                                                chips: v,
                                            })
                                        }
                                    />
                                    <KickOutButton
                                        onClick={() =>
                                            props.kickOut({
                                                playerName: n,
                                            })
                                        }
                                        isHost={n === props.host}
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                )}
                <p className={styles.email}>
                    Found a bug? Want a feature?{" "}
                    <a
                        href={"mailto:pokertableapp@gmail.com"}
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        Send us an email.
                    </a>
                </p>
            </div>
        </div>
    </div>
)

const mapStateToProps = (state: ReduxState) => ({
    roomId: state.game.roomId,
    name: state.user.name,
    host: state.game.host,
    smallBlind: state.game.smallBlind,
    bigBlind: state.game.bigBlind,
    players: state.players,
})

const mapDispatchToProps = dispatch => ({
    setChips: (d: SET_CHIPS.Action) => dispatch(SET_CHIPS.ops.create(d)),
    kickOut: (d: KICK_OUT_PLAYER.Action) =>
        dispatch(KICK_OUT_PLAYER.ops.create(d)),
})

export const GameInfo = connect(mapStateToProps, mapDispatchToProps)(Info)
