import React from "react"
import { PICK_SEAT } from "../../redux/actions"

import styles from "./empty-seat.module.scss"

export interface Props {
    seat: number
    pick: (d: PICK_SEAT.Action) => void
}

export const EmptySeat: React.FC<Props> = (props: Props) => {
    if (props.seat < 0 || props.seat > 9)
        throw "Invalid seat value " + props.seat

    return (
        <div className={styles.container}>
            <div
                className={styles.box}
                onClick={() => props.pick({ seat: props.seat })}
            >
                <p className={styles.text}>Take Seat</p>
            </div>
        </div>
    )
}
