import React from "react"

import styles from "./button.module.scss"

interface Props {
    borderColor: "green" | "teal" | "red" | "magenta" | "purple"
    active: boolean
    onClick: () => void
    className?: string
    inactiveClassName?: string
    children: JSX.Element
}

const colorMap = {
    green: styles.green,
    red: styles.red,
    teal: styles.teal,
    magenta: styles.magenta,
    purple: styles.purple,
}

export const Button: React.FC<Props> = (props: Props) => (
    <div
        className={[
            colorMap[props.borderColor],
            styles.button,
            props.active ? "" : styles.buttonInactive,
            props.active ? "" : props.inactiveClassName,
            props.className,
        ].join(" ")}
        onClick={props.active ? props.onClick : undefined}
    >
        <div>{props.children}</div>
    </div>
)
