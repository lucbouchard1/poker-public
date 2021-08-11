import React from "react"

import styles from "./loading-ring.module.scss"

export interface Props {
    className?: string
}

export const LoadingRing: React.FC<Props> = (props: Props) => (
    <div className={[styles.loadingRing, props.className].join(" ")}>
        <div />
        <div />
        <div />
        <div />
    </div>
)
