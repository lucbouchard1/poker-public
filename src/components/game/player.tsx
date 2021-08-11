import React, { useState, useEffect } from "react"
import { Card } from "@pokerweb-app/game/src/model"
import { ProgressBar } from "../utils/progress-bar"
import { PlayingCard } from "./playing-card"
import { GiveChips } from "./give-chips"

import waitingIcon from "./img/clock-regular.svg"
import standingIcon from "./img/persons.svg"

import styles from "./player.module.scss"

const positions = [
    { betX: 180, betY: 65 },
    { betX: 220, betY: 70 },
    { betX: 240, betY: 90 },
    { betX: 220, betY: 180 },
    { betX: 200, betY: 190 },
    { betX: 90, betY: 200 },
    { betX: 20, betY: 200 },
    { betX: -70, betY: 170 },
    { betX: -50, betY: 70 },
    { betX: -45, betY: 70 },
]

export interface Props {
    seat: number
    chips: number
    name: string
    bet: number
    gameState: "notStarted" | "inHand" | "finishedHand"
    isActive: boolean
    isDealtIn?: boolean
    isDealer?: boolean
    isBigBlind?: boolean
    isSmallBlind?: boolean
    isFolded?: boolean
    isAllIn?: boolean
    isHost?: boolean
    isStanding?: boolean
    hand?: Card[]
    chipsWon?: number
    timeoutExpiry?: number
}

export const Player: React.FC<Props> = (props: Props) => {
    if (props.seat < 0 || props.seat > 9)
        throw "Invalid seat value " + props.seat

    const [percent, changePercent] = useState(100)

    useEffect(() => {
        if (!props.isActive || !props.timeoutExpiry) return
        const start = Date.now()
        let cleared = false

        const intv = setInterval(() => {
            const t = Date.now()
            if (t > props.timeoutExpiry) {
                changePercent(0)
                clearInterval(intv)
                cleared = true
                return
            }
            const p = (100 * (t - start)) / (props.timeoutExpiry - start)
            changePercent(100 - p)
        }, 50)

        return () => {
            if (!cleared) clearInterval(intv)
        }
    }, [props.isActive, props.timeoutExpiry])

    const hand = props.hand && props.hand.length == 2 ? props.hand : undefined
    const style = props.seat === 0 ? { transform: "scale(1.25)" } : {}
    const totalChips = props.chips + (props.chipsWon ? props.chipsWon : 0)

    return (
        <div className={styles.container} style={style}>
            {props.isDealtIn && !props.isStanding && (
                <div className={styles.cards}>
                    <PlayingCard
                        faceUp={hand !== undefined}
                        className={
                            props.hand ? styles.leftCardShow : styles.leftCard
                        }
                        card={props.hand ? props.hand[0] : undefined}
                    />
                    <PlayingCard
                        faceUp={hand !== undefined}
                        className={
                            props.hand ? styles.rightCardShow : styles.rightCard
                        }
                        card={props.hand ? props.hand[1] : undefined}
                    />
                </div>
            )}
            <div
                className={[
                    styles.gameInfoContainer,
                    props.isActive ? styles.active : "",
                    props.isFolded ? styles.foldedContainer : "",
                ].join(" ")}
            >
                {props.isActive && <ProgressBar percent={percent} />}
                <div
                    className={[
                        styles.gameInfo,
                        props.isFolded || props.isStanding ? styles.folded : "",
                    ].join(" ")}
                >
                    <h3 className={props.name.length >= 10 ? styles.long : ""}>
                        {props.name}
                    </h3>
                    <p className={styles.playerMoney}>
                        {props.chips}
                        {props.chipsWon ? " + " : ""}
                        {props.chipsWon ? <span>{props.chipsWon}</span> : null}
                    </p>
                </div>
            </div>
            {(!props.isDealtIn || props.gameState === "finishedHand") &&
                !props.isStanding &&
                totalChips === 0 &&
                props.isHost && <GiveChips name={props.name} />}
            <div className={[styles.indicators].join(" ")}>
                {props.bet !== 0 && (
                    <div
                        style={{
                            left: positions[props.seat].betX,
                            top: positions[props.seat].betY,
                        }}
                        className={styles.bet}
                    >
                        <p>{props.bet}</p>
                    </div>
                )}
                {props.isDealtIn && !props.isStanding && (
                    <div>
                        {props.isDealer && (
                            <div className={styles.chipInd}>
                                <p>D</p>
                            </div>
                        )}
                        {props.isBigBlind && (
                            <div className={styles.chipInd}>
                                <p>B</p>
                            </div>
                        )}
                        {props.isSmallBlind && (
                            <div className={styles.chipInd}>
                                <p>b</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
            <div
                className={[
                    styles.indicators,
                    props.isFolded || props.isStanding ? styles.folded : "",
                ].join(" ")}
            >
                {props.isStanding && (
                    <div className={styles.standingInd}>
                        <img src={standingIcon} />
                        <p>Standing</p>
                    </div>
                )}
                {(!props.isDealtIn || props.gameState === "finishedHand") &&
                    !props.isStanding &&
                    totalChips === 0 && (
                        <div className={styles.outInd}>
                            <p>Out of Chips</p>
                        </div>
                    )}
                {!props.isDealtIn && props.chips !== 0 && !props.isStanding && (
                    <div className={styles.waitingInd}>
                        <img src={waitingIcon} />
                        <p>Waiting</p>
                    </div>
                )}
                {props.isDealtIn && !props.isStanding && (
                    <div>
                        {props.isFolded && (
                            <div className={styles.foldInd}>
                                <p>Fold</p>
                            </div>
                        )}
                        {props.isAllIn && props.gameState === "inHand" && (
                            <div className={styles.allInInd}>
                                <p>All In</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}
