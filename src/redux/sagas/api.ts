import * as firebase from "firebase"
import {
    CreateRoomArgs,
    JoinRoomArgs,
    SitDownArgs,
    RaiseArgs,
    GameCallArgs,
    SetChipsArgs,
    PlayerNameArg,
} from "@pokerweb-app/game/src/types"
import { FrontendError } from "../errors"

let serverUrl
if (location.hostname == "localhost") {
    serverUrl = "http://localhost:9000"
} else {
    serverUrl = "https://pokerweb-app.uc.r.appspot.com"
}

export class RequestError extends Error implements FrontendError {
    data: unknown

    constructor(name: string, data: unknown) {
        super("API request failed")
        this.name = name
        this.data = data
    }
}

function getUrl(endpoint: string) {
    return serverUrl + endpoint
}

const getUserToken = async () => {
    const user = firebase.auth().currentUser
    if (user) return user.getIdToken()
}

const authenticatedPost = async (endpoint: string, data: unknown) => {
    const token = await getUserToken()
    if (!token) return
    const resp = await fetch(getUrl(endpoint), {
        method: "POST",
        mode: "cors",
        cache: "no-cache",
        credentials: "same-origin",
        referrerPolicy: "no-referrer",
        headers: {
            AuthToken: token,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ data: data }),
    })

    if (resp.status === 200) {
        return resp.json()
    }

    const err = await resp.json()
    throw new RequestError(err.name, err.data)
}

export async function createRoomApi(data: CreateRoomArgs) {
    return authenticatedPost("/api/create-game", data)
}

export async function joinRoomApi(data: JoinRoomArgs) {
    return authenticatedPost("/api/join-game", data)
}

export async function showHandApi(data: GameCallArgs) {
    return authenticatedPost("/api/show-hand", data)
}

export async function sitDownApi(data: SitDownArgs) {
    return authenticatedPost("/api/seat-player", data)
}

export async function startHandApi(data: GameCallArgs) {
    return authenticatedPost("/api/start-hand", data)
}

export async function raiseApi(data: RaiseArgs) {
    return authenticatedPost("/api/raise", data)
}

export async function foldApi(data: GameCallArgs) {
    return authenticatedPost("/api/fold", data)
}

export async function callApi(data: GameCallArgs) {
    return authenticatedPost("/api/call", data)
}

export async function checkApi(data: GameCallArgs) {
    return authenticatedPost("/api/check", data)
}

export async function setChipsApi(data: SetChipsArgs) {
    return authenticatedPost("/api/set-chips", data)
}

export async function togglePlayerStandingAPI(data: GameCallArgs) {
    return authenticatedPost("/api/toggle-player-standing", data)
}

export async function kickOutPlayerAPI(data: PlayerNameArg) {
    return authenticatedPost("/api/kick-out-player", data)
}
