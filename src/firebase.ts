import * as firebaseApp from "firebase"

export const firebase = firebaseApp

firebase.initializeApp({
})

export const database = firebase.firestore()

let analyticsRef: firebase.analytics.Analytics = {
    logEvent: (v: unknown) => null,
} as firebase.analytics.Analytics

if (location.hostname === "localhost") {
    database.settings({
        host: "localhost:8080",
        ssl: false,
    })
} else {
    analyticsRef = firebase.analytics()
}

export const analytics = analyticsRef
