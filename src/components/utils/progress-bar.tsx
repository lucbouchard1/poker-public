import React from "react"

import styles from "./progress-bar.module.scss"

export interface Props {
    className?: string
    percent: number
}

export const ProgressBar: React.FC<Props> = (props: Props) => (
    <div className={[styles.container, props.className].join(" ")}>
        <div className={styles.barContainer}>
            <div
                className={styles.bar}
                style={{
                    width: `${props.percent}%`,
                    display: props.percent === 0 ? "none" : "",
                }}
            />
            <div
                className={styles.remain}
                style={{
                    width: `${100 - props.percent}%`,
                }}
            />
        </div>
    </div>
)
