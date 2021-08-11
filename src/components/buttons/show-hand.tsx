import React from "react"
import { Button } from "./button"

import styles from "./show-hand.module.scss"

export interface Props {
    onClick: () => void
    isShown: boolean
}

export const ShowHandButton: React.FC<Props> = (props: Props) => (
    <Button
        borderColor="teal"
        active={!props.isShown}
        className={styles.button}
        onClick={props.onClick}
    >
        <p>{props.isShown ? "Hand Shown" : "Show Hand"}</p>
    </Button>
)
