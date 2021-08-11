import * as admin from "firebase-admin"

// eslint-disable-next-line @typescript-eslint/no-var-requires
const serviceAccount = require("../key/admin-auth-key.json")

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
})

const firestoreHandle = admin.firestore()

if (process.env.MODE !== "prod") {
    firestoreHandle.settings({
        host: "localhost:8080",
        ssl: false,
    })
}

export default firestoreHandle
