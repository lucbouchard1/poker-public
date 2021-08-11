import React from "react"
import icon from "../game/img/coins-solid-white.svg"
import { Button } from "./button"

import styles from "./call.module.scss"

export interface Props {
    isPlayersTurn: boolean
    gameState: "notStarted" | "inHand" | "finishedHand"
    userBet: number
    userChips: number
    tableBet?: number
    call: () => void
}

export const CallButton: React.FC<Props> = (props: Props) => {
    let active = false
    let isAllIn = false

    if (props.isPlayersTurn && props.gameState === "inHand") {
        active = props.userBet < props.tableBet
        isAllIn = active && props.tableBet - props.userBet >= props.userChips
    }

    let text = "Call"
    if (active) {
        if (isAllIn) text += ": All In"
        else text += ": " + props.tableBet
    }

    return (
        <Button
            borderColor="green"
            active={active}
            className={styles.button}
            onClick={props.call}
        >
            <div className={styles.buttonContent}>
                <img src={icon} className={styles.icon} />
                <p>{text}</p>
            </div>
        </Button>
    )
}
