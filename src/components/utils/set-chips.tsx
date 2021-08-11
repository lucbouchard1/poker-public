import React, { useState } from "react"
import { GiveChipsButton } from "../buttons/give-chips"
import { ChipInput } from "./chip-input"

import styles from "./set-chips.module.scss"

export interface Props {
    id: string
    chips: number
    setChips: (amount: number) => void
}

export const SetChips: React.FC<Props> = (props: Props) => {
    const [chips, setChips] = useState(props.chips.toString())
    const amount = parseInt(chips)

    return (
        <div className={styles.container}>
            <ChipInput
                className={styles.input}
                id={"setChips-" + props.id}
                chips={chips}
                onChange={val => setChips(val)}
            />
            <GiveChipsButton
                isActive={!isNaN(amount) && amount !== props.chips}
                isSet={true}
                onClick={() => props.setChips(amount)}
            />
        </div>
    )
}
