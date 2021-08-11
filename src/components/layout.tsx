import React from "react"
import { Header } from "./header"
import { GameInfo } from "./game-info"
import { RoomLink } from "./room-link"
import JoinRoom from "./game/join"

import styles from "./layout.module.scss"

const seatPositions = [
    { x: 400, y: 250, s: 1 },
    { x: 90, y: 210, s: 0.9 },
    { x: -80, y: 100, s: 0.8 },
    { x: -45, y: -30, s: 0.7 },
    { x: 150, y: -90, s: 0.65 },
    { x: 395, y: -110, s: 0.65 },
    { x: 650, y: -90, s: 0.65 },
    { x: 845, y: -30, s: 0.7 },
    { x: 880, y: 100, s: 0.8 },
    { x: 720, y: 205, s: 0.9 },
]

export interface Props {
    gameData?: {
        roomId: string
    }

    seatElements: {
        [seat: number]: JSX.Element
    }
    centerElement?: JSX.Element
    footerElement?: JSX.Element
    children?: JSX.Element
    isHost?: boolean
    hasJoinedRoom: boolean
}

export interface State {
    infoVisible: boolean
    roomLinkClosed: boolean
    scaleFactor: number
    xMargin: number
    yMargin: number
}

export class Layout extends React.Component<Props, State> {
    widthBase = 1660.0
    heightBase = 850.0

    constructor(props: Props) {
        super(props)

        this.state = {
            infoVisible: false,
            roomLinkClosed: false,
            scaleFactor: 1,
            xMargin: 0,
            yMargin: 0,
        }

        this.resizeHandler = this.resizeHandler.bind(this)
        this.infoClicked = this.infoClicked.bind(this)
        this.roomLinkClosed = this.roomLinkClosed.bind(this)
    }

    componentDidMount() {
        window.addEventListener("resize", this.resizeHandler)
        this.resizeHandler()
    }

    componentWillUnmount() {
        window.removeEventListener("resize", this.resizeHandler)
    }

    resizeHandler() {
        const hScale = window.innerHeight / this.heightBase
        const wScale = window.innerWidth / this.widthBase
        const scale = Math.min(hScale, wScale)
        const h = this.heightBase * scale
        const w = this.widthBase * scale
        this.setState({
            scaleFactor: scale,
            xMargin: (window.innerWidth - w) / 2,
            yMargin: (window.innerHeight - h) / 2,
        })
    }

    infoClicked() {
        this.setState({
            infoVisible: !this.state.infoVisible,
        })
    }

    roomLinkClosed() {
        this.setState({
            roomLinkClosed: true,
        })
    }

    render() {
        return (
            <div className={styles.mainContainer}>
                {this.state.infoVisible && (
                    <GameInfo
                        roomId={this.props.gameData.roomId}
                        close={this.infoClicked}
                    />
                )}
                {!this.state.roomLinkClosed && this.props.isHost && (
                    <RoomLink
                        roomId={this.props.gameData.roomId}
                        close={this.roomLinkClosed}
                    />
                )}
                {!this.props.hasJoinedRoom && <JoinRoom />}
                <div className={styles.main}>
                    <Header
                        infoClicked={
                            this.props.gameData ? this.infoClicked : undefined
                        }
                        fixed={true}
                        spacerHeight={this.state.yMargin}
                    />
                    <div
                        className={styles.container}
                        style={{
                            marginLeft: this.state.xMargin,
                            transform: `scale(${this.state.scaleFactor})`,
                        }}
                    >
                        <div className={styles.game}>
                            <div
                                className={[styles.element, styles.center].join(
                                    " "
                                )}
                            >
                                {this.props.centerElement}
                            </div>
                            {Object.keys(this.props.seatElements)
                                .reverse()
                                .map(s => {
                                    return (
                                        <div
                                            key={s}
                                            className={styles.element}
                                            style={{
                                                left: seatPositions[s].x,
                                                top: seatPositions[s].y,
                                                transform: `scale(${seatPositions[s].s})`,
                                            }}
                                        >
                                            {this.props.seatElements[s]}
                                        </div>
                                    )
                                })}
                            {this.props.children}
                        </div>
                        <div
                            className={[styles.element, styles.footer].join(
                                " "
                            )}
                        >
                            {this.props.footerElement}
                        </div>
                    </div>
                </div>
            </div>
        )
    }
}
