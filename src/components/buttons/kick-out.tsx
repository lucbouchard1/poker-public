import React from "react"
import icon from "../img/sign-out-alt-solid.svg"
import { Button } from "./button"

import styles from "./kick-out.module.scss"

export interface Props {
    onClick: () => void
    isHost: boolean
}

export const KickOutButton: React.FC<Props> = (props: Props) => {
    return (
        <Button
            borderColor="red"
            active={!props.isHost}
            className={styles.button}
            onClick={props.onClick}
        >
            <img src={icon} alt={"Stand Up"} className={styles.icon} />
        </Button>
    )
}
