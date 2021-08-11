import React from "react"
import { getRoomPath } from "../path"
import { CopyableLink } from "./utils/copyable-link"

import close from "./img/times-solid.svg"

import styles from "./room-link.module.scss"

export interface Props {
    roomId: string
    close: () => void
}

export const RoomLink: React.FC<Props> = (props: Props) => {
    const path = location.origin + getRoomPath(props.roomId)

    return (
        <div className={styles.container}>
            <div className={styles.main}>
                <div className={styles.content}>
                    <div className={styles.header}>
                        <h3>Send this link to your friends:</h3>
                        <img
                            className={styles.close}
                            alt={"Close"}
                            src={close}
                            onClick={props.close}
                        />
                    </div>
                    <CopyableLink link={path} />
                </div>
            </div>
        </div>
    )
}
