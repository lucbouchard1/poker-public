import React from "react"
import icon from "../game/img/bet.svg"
import { Button } from "./button"

import styles from "./bet.module.scss"

export interface Props {
    isActive: boolean
    isRaise: boolean
    betVal: number
    maxBet: number
    isOpen: boolean
    raise: ({ amount: number }) => void
}

export const BetButton: React.FC<Props> = (props: Props) => {
    const t = props.isRaise ? "Raise" : "Bet"

    let text
    if (!props.isOpen) {
        text = t
    } else {
        text = props.betVal < props.maxBet ? `${props.betVal}` : "All In"
    }

    return (
        <Button
            borderColor="purple"
            active={props.isActive}
            onClick={() => props.raise({ amount: props.betVal })}
            className={styles.button}
        >
            <div className={styles.buttonContent}>
                <img src={icon} className={styles.icon} />
                <p>{text}</p>
            </div>
        </Button>
    )
}
