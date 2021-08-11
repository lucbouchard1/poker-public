import React, { useState } from "react"
import * as verify from "@pokerweb-app/game/src/request-params"

import styles from "./name-input.module.scss"

export interface Props {
    id: string
    label: string
    className?: string
    onChange: (val: string) => void
    name: string
}

export const NameInput: React.FC<Props> = (props: Props) => {
    const [focused, setFoucused] = useState(false)

    return (
        <div className={[styles.container, props.className].join(" ")}>
            <div className={styles.nameContainer}>
                <label
                    className={[
                        styles.name,
                        focused || props.name.length !== 0
                            ? styles.nameOffset
                            : "",
                    ].join(" ")}
                >
                    {props.label}
                </label>
            </div>
            <input
                autoFocus
                autoComplete={"off"}
                id={"name"}
                type="text"
                value={props.name}
                placeholder={""}
                onChange={e => {
                    const val = `${e.target.value}`
                    const { res: check } = verify.verifyPlayerName(
                        e.target.value
                    )
                    if (check !== verify.PlayerNameResults.TOO_LONG)
                        props.onChange(val)
                }}
                onFocus={() => setFoucused(true)}
                onBlur={() => setFoucused(false)}
            />
        </div>
    )
}
