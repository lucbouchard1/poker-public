import React from "react"
import icon from "../game/img/fold.svg"
import { Button } from "./button"

import styles from "./fold.module.scss"

export interface Props {
    isPlayersTurn: boolean
    gameState: "notStarted" | "inHand" | "finishedHand"
    fold: () => void
}

export const FoldButton: React.FC<Props> = (props: Props) => {
    const active = props.isPlayersTurn && props.gameState === "inHand"

    return (
        <Button
            borderColor="red"
            active={active}
            className={styles.button}
            onClick={props.fold}
        >
            <div className={styles.buttonContent}>
                <img src={icon} className={styles.icon} />
                <p>Fold</p>
            </div>
        </Button>
    )
}
