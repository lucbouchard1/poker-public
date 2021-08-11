import React from "react"
import { Card } from "@pokerweb-app/game/src/model"
import { PlayingCard } from "./playing-card"

import styles from "./community.module.scss"

export interface Props {
    gameState: "notStarted" | "inHand" | "finishedHand"
    cards: Card[]
    pot?: number
}

export const Community: React.FC<Props> = (props: Props) => {
    if (props.cards.length > 5) throw "Too many community cards"

    return (
        <div className={styles.container}>
            <div className={styles.pot}>
                {props.pot !== 0 && props.gameState !== "finishedHand" && (
                    <p>Pot: {props.pot}</p>
                )}
            </div>
            <div className={styles.cards}>
                {props.cards.map((c, i) => (
                    <PlayingCard
                        key={i}
                        card={c === null ? undefined : c}
                        faceUp={c !== null}
                        className={styles.card}
                    />
                ))}
                {Array.from(Array(5 - props.cards.length).keys()).map(i => (
                    <PlayingCard
                        key={i + props.cards.length}
                        faceUp={false}
                        className={styles.card}
                        placeholder={true}
                    />
                ))}
            </div>
        </div>
    )
}
