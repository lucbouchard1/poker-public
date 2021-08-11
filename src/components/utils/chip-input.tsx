import React, { useState } from "react"

import coins from "../game/img/coins-solid.svg"

import styles from "./chip-input.module.scss"

export interface Props {
    id: string
    className?: string
    chips: string
    label?: string
    onChange: (val: string) => void
}

export const ChipInput: React.FC<Props> = (props: Props) => {
    const [focused, setFoucused] = useState(false)

    return (
        <div className={[styles.container, props.className].join(" ")}>
            {props.label && (
                <div className={styles.labelContainer}>
                    <label
                        className={[
                            styles.label,
                            focused || props.chips.length !== 0
                                ? styles.labelOffset
                                : "",
                        ].join(" ")}
                    >
                        {props.label}
                    </label>
                </div>
            )}
            <img src={coins} className={styles.coins} />
            <input
                value={props.chips}
                autoComplete={"off"}
                id={props.id}
                onChange={e => {
                    const val = e.target.value
                    if (/[^\d]/.test(val)) return
                    props.onChange(val)
                }}
                onFocus={() => setFoucused(true)}
                onBlur={() => setFoucused(false)}
            />
        </div>
    )
}
