import React from "react"
import { Button } from "./button"

import styles from "./give-chips.module.scss"

export interface Props {
    isActive: boolean
    isSet: boolean
    onClick: () => void
}

export const GiveChipsButton: React.FC<Props> = (props: Props) => (
    <Button
        borderColor="teal"
        active={props.isActive}
        className={styles.button}
        onClick={props.onClick}
    >
        <p>{props.isSet ? "Set " : "Give "}Chips</p>
    </Button>
)
