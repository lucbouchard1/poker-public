import React from "react"
import { Button } from "./button"

import pause from "./img/pause-solid.svg"

import styles from "./cancel-autostart.module.scss"

export interface Props {
    onClick: () => void
}

export const CancelAutostartButton: React.FC<Props> = (props: Props) => (
    <Button
        borderColor="magenta"
        active={true}
        className={styles.button}
        onClick={props.onClick}
    >
        <img src={pause} alt={"Cancel Autostart"} />
    </Button>
)
