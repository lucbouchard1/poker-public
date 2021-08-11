import React from "react"
import { Card, Suit, Rank } from "@pokerweb-app/game/src/model"

import styles from "./card.module.scss"

const suitColor = (suit: Suit) => {
    switch (suit) {
        case "c":
            return "black"
        case "d":
            return "red"
        case "h":
            return "red"
        case "s":
            return "black"
        default:
            return ""
    }
}

const textForRank = (rank: Rank) => {
    switch (rank) {
        case Rank.Ace:
            return "A"
        case Rank.Two:
            return "2"
        case Rank.Three:
            return "3"
        case Rank.Four:
            return "4"
        case Rank.Five:
            return "5"
        case Rank.Six:
            return "6"
        case Rank.Seven:
            return "7"
        case Rank.Eight:
            return "8"
        case Rank.Nine:
            return "9"
        case Rank.Ten:
            return "10"
        case Rank.Jack:
            return "J"
        case Rank.Queen:
            return "Q"
        case Rank.King:
            return "K"
        default:
            ""
    }
}

export interface Props {
    card?: Card
    className?: string
    faceUp: boolean
    placeholder?: boolean
}

export const PlayingCard: React.FC<Props> = (props: Props) => {
    if (!props.card && props.faceUp)
        throw "Playing card needs value to be face up"

    const text = props.card ? textForRank(props.card.rank) : ""
    const suit = props.card ? props.card.suit : null
    const color = suitColor(suit)
    const className = props.faceUp ? "" : styles.showBack

    return (
        <div className={[styles.container, props.className].join(" ")}>
            {!props.placeholder && (
                <div className={[styles.innerContainer, className].join(" ")}>
                    <div className={styles.face} style={{ color }}>
                        <div className={styles.infoContainer}>
                            <div className={styles.info}>
                                <h1 className={styles.cardText}>{text}</h1>
                                <div className={styles.cardSuit}>
                                    <CardSuit
                                        suit={suit}
                                        className={styles.smallSuit}
                                    />
                                </div>
                            </div>
                        </div>
                        <CardSuit suit={suit} className={styles.suit} />
                    </div>
                    <div className={styles.back}>
                        <div>
                            <p>PT</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

const suitClassName = (suit: Suit) => {
    switch (suit) {
        case "c":
            return styles.club
        case "d":
            return styles.diamond
        case "h":
            return styles.heart
        case "s":
            return styles.spade
        default:
            return styles.none
    }
}

export interface CardSuitProps {
    className?: string
    suit?: Suit
}

const CardSuit: React.FC<CardSuitProps> = (props: CardSuitProps) => {
    const suit = props.suit ? props.suit : null
    const className = suitClassName(suit)

    return (
        <div className={props.className}>
            <div className={[styles.innerSuit, className].join(" ")} />
        </div>
    )
}
