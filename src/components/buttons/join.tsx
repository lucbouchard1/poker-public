import React from "react"
import { LoadingRing } from "../utils/loading-ring"
import { Button } from "./button"

import styles from "./join.module.scss"

export interface Props {
    className?: string
    innerClassName?: string
    isAuthenticating: boolean
    isCreate: boolean
    isActive: boolean
    onClick: () => void
}

export const JoinButton: React.FC<Props> = (props: Props) => (
    <div className={props.className}>
        {props.isAuthenticating ? (
            <LoadingRing className={styles.loading} />
        ) : (
            <Button
                borderColor="teal"
                active={props.isActive}
                className={[styles.button, props.innerClassName].join(" ")}
                onClick={props.onClick}
            >
                <p>{props.isCreate ? "Create Game" : "Join Game"}</p>
            </Button>
        )}
    </div>
)
