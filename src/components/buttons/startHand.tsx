import React from "react"
import { Button } from "./button"

import styles from "./startHand.module.scss"

export interface Props {
    isPlayersTurn: boolean
    host: string
    activePlayerName: string
    isHost: boolean
    activePlayers: number
    startHandTimeRemaining: number
    startHandTimeoutDuration: number
    gameState: "notStarted" | "inHand" | "finishedHand"
    startHand: () => void
}

export const StartHandButton: React.FC<Props> = (p: Props) => {
    let statusMessage = ""
    let active = false

    if (p.activePlayers < 2) {
        statusMessage = "Waiting for players to join game..."
        active = false
    } else if (p.gameState == "notStarted") {
        statusMessage = p.isHost
            ? "Start Game"
            : "Waiting for host to start game..."
        active = p.isHost
    } else if (p.gameState == "inHand") {
        statusMessage = p.isPlayersTurn
            ? "Your turn"
            : p.activePlayerName + "'s turn"
    } else if (p.gameState == "finishedHand") {
        statusMessage = !p.isHost
            ? "Waiting for host to start next hand..."
            : (statusMessage = "Start Next Hand")
        active = p.isHost
    }

    const percentage =
        (p.startHandTimeRemaining / p.startHandTimeoutDuration) * 100

    return (
        <Button
            borderColor={"magenta"}
            active={active}
            className={styles.button}
            inactiveClassName={styles.inactiveButton}
            onClick={p.startHand}
        >
            <div className={styles.buttonContent}>
                <h1>{statusMessage}</h1>
                {p.startHandTimeRemaining !== -1 && (
                    <div className={styles.progress}>
                        <div
                            className={styles.left}
                            style={{ width: `${100 - percentage}%` }}
                        />
                        <div
                            className={styles.right}
                            style={{ width: `${percentage}%` }}
                        />
                    </div>
                )}
            </div>
        </Button>
    )
}
