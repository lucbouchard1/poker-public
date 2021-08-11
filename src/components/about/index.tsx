import React, { useEffect } from "react"
import { Header } from "../header"

import styles from "./index.module.scss"

export const About: React.FC<{}> = () => {
    useEffect(() => {
        document.body.style.overflow = "auto"

        return () => {
            document.body.style.overflow = "hidden"
        }
    }, [])

    return (
        <div className={styles.body}>
            <Header className={styles.header} />
            <div className={styles.main}>
                <h1>Making Online Poker Easy</h1>
                <div className={styles.content}>
                    <div className={styles.section}>
                        <img src={"/demo.png"} className={styles.demo} />
                        <p className={styles.intro}>
                            <span className={styles.siteName}>
                                PokerTable.app
                            </span>{" "}
                            is the easiest way to play poker with friends!
                            Forget creating an account or downloading buggy
                            software, just send your friends a link and start
                            playing.
                        </p>
                        <p className={styles.email}>
                            Found a bug? Want a feature?{" "}
                            <a href={"mailto:pokertableapp@gmail.com"}>
                                Send us an email.
                            </a>
                        </p>
                    </div>
                    <div className={styles.section}>
                        <h2>FAQ</h2>
                        <h3>Does this game use real money?</h3>
                        <p>
                            No. Users can create games with zero consequences.
                        </p>
                        <div className={styles.faqSpacer} />
                        <h3>How long will my game exist?</h3>
                        <p>
                            Games are deleted after about 12 hours of
                            inactivity.
                        </p>
                        <div className={styles.faqSpacer} />
                        <h3>
                            If I close my browser, can I get back to my game?
                        </h3>
                        <p>
                            PokerTable.app uses browser cookies to identify your
                            user. If you refresh the webpage or close and reopen
                            your browser, you will be able to get back in your
                            game assuming your cookies persisted. If you delete
                            your cookies or switch to a new browser or device,
                            you will not be able to return to your game as the
                            same user.
                        </p>
                    </div>
                    <div className={styles.section}>
                        <h2>Credits</h2>
                        <p>
                            Most icons are from{" "}
                            <a href={"https://fontawesome.com/"}>
                                Font Awesome
                            </a>
                            . The icon license is{" "}
                            <a href={"https://fontawesome.com/license/free"}>
                                here
                            </a>
                            .
                        </p>
                        <p>
                            Additional icons are by{" "}
                            <a href="http://www.freepik.com/" title="Freepik">
                                Freepik
                            </a>{" "}
                            from{" "}
                            <a
                                href="https://www.flaticon.com/"
                                title="Flaticon"
                            >
                                {" "}
                                www.flaticon.com
                            </a>
                        </p>
                    </div>
                    <div className={styles.footer} />
                </div>
            </div>
        </div>
    )
}
