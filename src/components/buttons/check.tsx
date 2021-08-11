import React from "react"
import icon from "../game/img/hand-rock-solid.svg"
import { Button } from "./button"

import styles from "./check.module.scss"

export interface Props {
    isPlayersTurn: boolean
    gameState: "notStarted" | "inHand" | "finishedHand"
    userBet: number
    tableBet?: number
    check: () => void
}

export const CheckButton: React.FC<Props> = (props: Props) => {
    const checkActive =
        props.isPlayersTurn &&
        props.gameState === "inHand" &&
        props.userBet === props.tableBet

    return (
        <Button
            borderColor="teal"
            active={checkActive}
            className={styles.button}
            onClick={props.check}
        >
            <div className={styles.buttonContent}>
                <img src={icon} className={styles.icon} />
                <p>Check</p>
            </div>
        </Button>
    )
}
