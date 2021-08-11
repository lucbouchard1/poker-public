import React, { useState } from "react"
import { connect } from "react-redux"
import { ReduxState } from "../../redux/store"
import { SET_CHIPS, KICK_OUT_PLAYER } from "../../redux/actions"
import { GiveChipsButton } from "../buttons/give-chips"
import { KickOutButton } from "../buttons/kick-out"
import { ChipInput } from "../utils/chip-input"

import styles from "./give-chips.module.scss"

export interface Props {
    name: string
    currentPlayer: string
    defaultChips: number
    host: string
    setChips: (d: SET_CHIPS.Action) => void
    kickOut: (d: KICK_OUT_PLAYER.Action) => void
}

const GiveChipsInternal: React.FC<Props> = (props: Props) => {
    const [chips, setChips] = useState(props.defaultChips.toString())
    const amount = parseInt(chips)

    return (
        <div>
            <div className={styles.container}>
                <ChipInput
                    id={"giveChips"}
                    className={styles.input}
                    chips={chips}
                    onChange={val => setChips(val)}
                />
                <div className={styles.buttons}>
                    <GiveChipsButton
                        isActive={!isNaN(amount)}
                        isSet={false}
                        onClick={() =>
                            props.setChips({
                                playerName: props.name,
                                chips: amount,
                            })
                        }
                    />
                    <KickOutButton
                        onClick={() =>
                            props.kickOut({ playerName: props.name })
                        }
                        isHost={props.name === props.host}
                    />
                </div>
            </div>
        </div>
    )
}

const mapStateToProps = (state: ReduxState) => ({
    defaultChips: state.game.defaultChips,
    currentPlayer: state.user.name,
    host: state.game.host,
})

const mapDispatchToProps = dispatch => ({
    setChips: (d: SET_CHIPS.Action) => dispatch(SET_CHIPS.ops.create(d)),
    kickOut: (d: KICK_OUT_PLAYER.Action) =>
        dispatch(KICK_OUT_PLAYER.ops.create(d)),
})

export const GiveChips = connect(
    mapStateToProps,
    mapDispatchToProps
)(GiveChipsInternal)
