import React, { useState, useEffect } from "react"
import { Slider } from "../../slider"
import { RAISE } from "../../../redux/actions"
import { ChipInput } from "../../utils/chip-input"
import { BetButton } from "../../buttons/bet"

import styles from "./bet.module.scss"

const MIN_SLIDER_JUMP_BY_10 = 100

interface Props {
    isActive: boolean
    isRaise: boolean
    sliderChanged: (v: number) => void
    betValue: number
    raise: (d: RAISE.Action) => void
    minBet: number
    maxBet: number
    blind: number
    pot: number
}

const potPresets = [
    { name: "33%", mult: 1 / 3 },
    { name: "50%", mult: 1 / 2 },
    { name: "67%", mult: 2 / 3 },
    { name: "Pot", mult: 1 },
]

const blindPresets = [
    { name: "Blind", mult: 1 },
    { name: "x2", mult: 2 },
    { name: "x3", mult: 3 },
    { name: "x4", mult: 4 },
]

export const BetControls: React.FC<Props> = (props: Props) => {
    const betVal = Math.round(props.betValue)
    const presets = props.pot ? potPresets : blindPresets
    const presetBase = props.pot ? props.pot : props.blind
    const [open, setOpen] = useState(false)
    const [betStr, setBetStr] = useState(betVal.toString())

    useEffect(() => {
        const val = Math.round(props.betValue)
        if (val.toString() !== betStr) setBetStr(val.toString())
    }, [props.betValue])

    useEffect(() => {
        if (!props.isActive && open) setOpen(false)
    }, [props.isActive])

    return (
        <div>
            <div
                className={[styles.container, open ? styles.expanded : ""].join(
                    " "
                )}
            >
                <div className={styles.controls}>
                    <div className={styles.amountContainer}>
                        <div className={styles.topRow}>
                            <ChipInput
                                id={"betChips"}
                                chips={betStr}
                                className={styles.input}
                                onChange={val => {
                                    setBetStr(val)
                                    const amount = parseInt(val)
                                    if (
                                        !isNaN(amount) &&
                                        amount !== betVal &&
                                        amount <= props.maxBet &&
                                        amount >= props.minBet
                                    )
                                        props.sliderChanged(amount)
                                }}
                            />
                            <div className={styles.betPresets}>
                                {presets.map(p => {
                                    const val = presetBase * p.mult
                                    return (
                                        <p
                                            key={p.name}
                                            onClick={
                                                val <= props.maxBet &&
                                                val >= props.minBet
                                                    ? () =>
                                                          props.sliderChanged(
                                                              val
                                                          )
                                                    : undefined
                                            }
                                            className={
                                                val <= props.maxBet &&
                                                val >= props.minBet
                                                    ? ""
                                                    : styles.presetInactive
                                            }
                                        >
                                            {p.name}
                                        </p>
                                    )
                                })}
                            </div>
                        </div>
                        <div className={styles.sliderContainer}>
                            <div className={styles.slider}>
                                <Slider
                                    min={props.minBet}
                                    max={props.maxBet}
                                    value={props.betValue}
                                    onChange={amount => {
                                        if (
                                            props.maxBet - props.minBet >
                                                MIN_SLIDER_JUMP_BY_10 &&
                                            amount !== props.maxBet &&
                                            amount !== props.minBet
                                        ) {
                                            props.sliderChanged(
                                                Math.trunc(amount / 10) * 10
                                            )
                                        } else {
                                            props.sliderChanged(
                                                Math.trunc(amount)
                                            )
                                        }
                                    }}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <BetButton
                isActive={props.isActive}
                isRaise={props.isRaise}
                isOpen={open}
                raise={
                    open
                        ? d => {
                              props.raise(d)
                              setOpen(false)
                          }
                        : () => {
                              props.sliderChanged(props.minBet)
                              setOpen(true)
                          }
                }
                betVal={betVal}
                maxBet={props.maxBet}
            />
        </div>
    )
}
