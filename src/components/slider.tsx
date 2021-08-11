import React from "react"

import styles from "./slider.module.scss"

interface Props {
    value: number
    min: number
    max: number
    onChange: (number) => void
}

const map = (sMin: number, sMax: number, dMin: number, dMax: number) => x =>
    dMin + ((x - sMin) * (dMax - dMin)) / (sMax - sMin)

const getPercentage = (current, min, max) => map(min, max, 0, 100)(current)

export class Slider extends React.Component<Props, {}> {
    railRef: React.RefObject<HTMLDivElement>

    constructor(props: Props) {
        super(props)
        this.railRef = React.createRef()

        this.handleMouseMove = this.handleMouseMove.bind(this)
        this.handleMouseUp = this.handleMouseUp.bind(this)
        this.handleMouseDown = this.handleMouseDown.bind(this)
        this.handleTouchEnd = this.handleTouchEnd.bind(this)
        this.handleTouchStart = this.handleTouchStart.bind(this)
    }

    handleMouseMove(event) {
        let clientX

        if (event.type === "touchmove") {
            clientX = event.touches[0].clientX
        } else {
            clientX = event.clientX
        }

        const rail = this.railRef.current
        const bound = rail.getBoundingClientRect()
        const end = bound.width
        const start = 0

        let newX = clientX - bound.left
        newX = Math.min(Math.max(newX, start), end)

        const newValue = map(start, end, this.props.min, this.props.max)(newX)
        this.props.onChange(newValue)
    }

    handleMouseUp() {
        document.removeEventListener("mousemove", this.handleMouseMove)
    }

    handleTouchEnd() {
        document.removeEventListener("touchmove", this.handleMouseMove)
    }

    handleMouseDown() {
        document.addEventListener("mousemove", this.handleMouseMove)
    }

    handleTouchStart() {
        document.addEventListener("touchmove", this.handleMouseMove)
    }

    componentDidMount() {
        document.addEventListener("mouseup", this.handleMouseUp)
        document.addEventListener("touchend", this.handleTouchEnd)
    }

    componentWillUnmount() {
        document.removeEventListener("mouseup", this.handleMouseUp)
        document.removeEventListener("touchend", this.handleTouchEnd)
    }

    render() {
        const shift = getPercentage(
            this.props.value,
            this.props.min,
            this.props.max
        )
        return (
            <div className={styles.container}>
                <div className={styles.rail} ref={this.railRef} />
                <div
                    className={styles.thumbContainer}
                    style={{ left: `${shift}%` }}
                >
                    <div
                        className={styles.thumb}
                        onMouseDown={this.handleMouseDown}
                        onTouchStart={this.handleTouchStart}
                    />
                </div>
            </div>
        )
    }
}
