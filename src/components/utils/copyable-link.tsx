import React, { useState } from "react"

import clone from "./img/clone-regular.svg"

import styles from "./copyable-link.module.scss"

export interface Props {
    link: string
}

export const CopyableLink: React.FC<Props> = (props: Props) => {
    const [copied, setCopied] = useState(false)
    return (
        <div className={styles.container}>
            <p>{props.link}</p>
            {!copied ? (
                <img
                    alt={"Copy to Clipboard"}
                    src={clone}
                    onClick={() => {
                        const dummy = document.createElement("textarea")
                        document.body.appendChild(dummy)
                        dummy.value = props.link
                        dummy.select()
                        dummy.setSelectionRange(0, 99999)
                        document.execCommand("copy")
                        document.body.removeChild(dummy)
                        setCopied(true)
                    }}
                />
            ) : (
                <p className={styles.copied}>Copied!</p>
            )}
        </div>
    )
}
