import { eventChannel } from "redux-saga"
import { all, select, take, spawn } from "redux-saga/effects"
import { firebase, database } from "../../firebase"
import {
    CREATE_ROOM,
    CHECK_ROOM_EXISTS,
    JOIN_ROOM,
    PICK_SEAT,
    GAME_STATE_UPDATE,
    START_HAND,
    PRIVATE_DATA_UPDATE,
    RAISE,
    FOLD,
    CALL,
    CHECK,
    SET_CHIPS,
    TOGGLE_PLAYER_STANDING,
    SHOW_HAND,
    KICK_OUT_PLAYER,
} from "../actions"
import { userAuthenticationError, invalidRoomError } from "../errors"
import { ReduxState } from "../store"
import * as api from "./api"

const GAME_DOC_COLLECTION = "prod-games"
const PRIVATE_DATA_DOC_COLLECTION = "private-data"

const authenticateUser = () => {
    const auth = firebase.auth()

    if (auth.currentUser) return { response: { user: auth.currentUser } }

    return auth
        .signInAnonymously()
        .then(response => ({ response }))
        .catch(error => ({ error }))
}

function createGameStateListener(roomId: string) {
    return eventChannel(emit => {
        return database
            .collection(GAME_DOC_COLLECTION)
            .doc(roomId)
            .onSnapshot(doc => {
                const data = doc.data()
                if (data != undefined) emit(data)
            })
    })
}

function* gameStateChangedSaga(roomId: string) {
    const updateChannel = createGameStateListener(roomId)
    while (true) {
        const data = yield take(updateChannel)
        if (data != undefined) yield GAME_STATE_UPDATE.ops.put(data)
    }
}

function createPrivateDataListener(roomId: string) {
    const uid = firebase.auth().currentUser.uid

    return eventChannel(emit => {
        return database
            .collection(GAME_DOC_COLLECTION)
            .doc(roomId)
            .collection(PRIVATE_DATA_DOC_COLLECTION)
            .doc(uid)
            .onSnapshot(doc => {
                const data = doc.data()
                if (data != undefined) emit(data)
            })
    })
}

function* privateDataChangedSaga(roomId: string) {
    const updateChannel = createPrivateDataListener(roomId)
    while (true) {
        const data = yield take(updateChannel)
        if (data != undefined) yield PRIVATE_DATA_UPDATE.ops.put(data)
    }
}

/**
 * Saga for creating new rooms
 */
function* createRoom(action: CREATE_ROOM.Action) {
    const auth = yield authenticateUser()
    if (auth.error) {
        yield CREATE_ROOM.ops.putFailure(userAuthenticationError(null))
        return
    }

    const { response, error } = yield api
        .createRoomApi({
            hostName: action.hostName,
            options: {
                defaultChips: action.options.defaultChips,
                bigBlind: action.options.bigBlind,
                smallBlind: action.options.smallBlind,
                straddleEnabled: action.options.straddleEnabled,
            },
        })
        .then(response => ({ response }))
        .catch(error => ({ error }))

    if (response) {
        yield CREATE_ROOM.ops.putSuccess({ roomId: response.roomId })
        yield spawn(() => gameStateChangedSaga(response.roomId))
        yield spawn(() => privateDataChangedSaga(response.roomId))
    } else yield CREATE_ROOM.ops.putFailure(error)
}

function* watchCreateRoom() {
    yield CREATE_ROOM.ops.takeLatest(createRoom)
}

/**
 * Saga for checking if room exists. Also checks if
 * user is already in the room.
 */
function* checkRoomExists(action: CHECK_ROOM_EXISTS.Action) {
    const user = yield authenticateUser()
    if (user.error) {
        yield CREATE_ROOM.ops.putFailure(userAuthenticationError(null))
        return
    }

    // Check if room exists
    const doc = yield database
        .collection(GAME_DOC_COLLECTION)
        .doc(action.roomId)
        .get()

    if (!doc.exists) {
        yield CHECK_ROOM_EXISTS.ops.putFailure(invalidRoomError(action.roomId))
        return
    }

    // The room exists!
    yield spawn(() => gameStateChangedSaga(action.roomId))

    // Check if the user has private data for this room
    const pDoc = yield database
        .collection(GAME_DOC_COLLECTION)
        .doc(action.roomId)
        .collection(PRIVATE_DATA_DOC_COLLECTION)
        .doc(user.response.user.uid)
        .get()

    if (!pDoc.exists) {
        yield CHECK_ROOM_EXISTS.ops.putSuccess()
        return
    }

    // The user is already in this room!
    yield spawn(() => privateDataChangedSaga(action.roomId))
}

function* watchCheckRoomExists() {
    yield CHECK_ROOM_EXISTS.ops.takeLatest(checkRoomExists)
}

/**
 * Saga for showing hand
 */
function* showHand() {
    const data = yield select((state: ReduxState) => ({
        roomId: state.game.roomId,
    }))

    const { response, error } = yield api
        .showHandApi({
            roomId: data.roomId,
        })
        .then(response => ({ response }))
        .catch(error => ({ error }))

    if (response) yield SHOW_HAND.ops.putSuccess()
    else yield SHOW_HAND.ops.putFailure(error)
}

function* watchShowHand() {
    yield SHOW_HAND.ops.takeLatest(showHand)
}

/**
 * Saga for joining rooms
 */
function* joinRoom(action: JOIN_ROOM.Action) {
    const auth = yield authenticateUser()
    if (auth.error) {
        yield JOIN_ROOM.ops.putFailure(userAuthenticationError(null))
        return
    }

    const { response, error } = yield api
        .joinRoomApi({
            name: action.playerName,
            roomId: action.roomId,
        })
        .then(response => ({ response }))
        .catch(error => ({ error }))

    if (response) {
        yield JOIN_ROOM.ops.putSuccess({ roomId: response.roomId })
        yield spawn(() => gameStateChangedSaga(response.roomId))
        yield spawn(() => privateDataChangedSaga(response.roomId))
    } else yield JOIN_ROOM.ops.putFailure(error)
}

function* watchJoinRoom() {
    yield JOIN_ROOM.ops.takeLatest(joinRoom)
}

/**
 * Saga for picking seat
 */
function* sitDown(action: PICK_SEAT.Action) {
    const data = yield select((state: ReduxState) => ({
        roomId: state.game.roomId,
        name: state.user.name,
    }))

    const { response, error } = yield api
        .sitDownApi({
            roomId: data.roomId,
            seat: action.seat,
        })
        .then(response => ({ response }))
        .catch(error => ({ error }))

    if (response) yield PICK_SEAT.ops.putSuccess()
    else yield PICK_SEAT.ops.putFailure(error)
}

function* watchSitDown() {
    yield PICK_SEAT.ops.takeLatest(sitDown)
}

/**
 * Saga for toggling player standing
 */
function* togglePlayerStanding() {
    const data = yield select((state: ReduxState) => ({
        roomId: state.game.roomId,
    }))

    const { response, error } = yield api
        .togglePlayerStandingAPI({
            roomId: data.roomId,
        })
        .then(response => ({ response }))
        .catch(error => ({ error }))

    if (response) yield TOGGLE_PLAYER_STANDING.ops.putSuccess()
    else yield TOGGLE_PLAYER_STANDING.ops.putFailure(error)
}

function* watchTogglePlayerStanding() {
    yield TOGGLE_PLAYER_STANDING.ops.takeLatest(togglePlayerStanding)
}

/**
 * Saga for kicking out player
 */
function* kickOutPlayer(action: KICK_OUT_PLAYER.Action) {
    const data = yield select((state: ReduxState) => ({
        roomId: state.game.roomId,
    }))

    const { response, error } = yield api
        .kickOutPlayerAPI({
            roomId: data.roomId,
            playerName: action.playerName,
        })
        .then(response => ({ response }))
        .catch(error => ({ error }))

    if (response) yield KICK_OUT_PLAYER.ops.putSuccess()
    else yield KICK_OUT_PLAYER.ops.putFailure(error)
}

function* kickOutPlayerStanding() {
    yield KICK_OUT_PLAYER.ops.takeLatest(kickOutPlayer)
}

/**
 * Saga for setting player's chips.
 */
function* setChips(action: SET_CHIPS.Action) {
    const data = yield select((state: ReduxState) => ({
        roomId: state.game.roomId,
        name: state.user.name,
    }))

    const { response, error } = yield api
        .setChipsApi({
            roomId: data.roomId,
            playerName: action.playerName,
            amount: action.chips,
        })
        .then(response => ({ response }))
        .catch(error => ({ error }))

    if (response) yield SET_CHIPS.ops.putSuccess()
    else yield SET_CHIPS.ops.putFailure(error)
}

function* watchSetChips() {
    yield SET_CHIPS.ops.takeLatest(setChips)
}

/**
 * Saga for starting hand
 */
function* startHand() {
    const data = yield select((state: ReduxState) => ({
        roomId: state.game.roomId,
    }))

    const { response, error } = yield api
        .startHandApi({
            roomId: data.roomId,
        })
        .then(response => ({ response }))
        .catch(error => ({ error }))

    if (response) yield START_HAND.ops.putSuccess()
    else yield START_HAND.ops.putFailure(error)
}

function* watchStartHand() {
    yield START_HAND.ops.takeLatest(startHand)
}

/**
 * Saga for betting/raising
 */
function* raise(params: RAISE.Action) {
    const data = yield select((state: ReduxState) => ({
        roomId: state.game.roomId,
    }))

    const { response, error } = yield api
        .raiseApi({
            roomId: data.roomId,
            amount: params.amount,
        })
        .then(response => ({ response }))
        .catch(error => ({ error }))

    if (response) yield RAISE.ops.putSuccess()
    else yield RAISE.ops.putFailure(error)
}

function* watchRaise() {
    yield RAISE.ops.takeLatest(raise)
}

/**
 * Saga for folding
 */
function* fold() {
    const data = yield select((state: ReduxState) => ({
        roomId: state.game.roomId,
    }))

    const { response, error } = yield api
        .foldApi({
            roomId: data.roomId,
        })
        .then(response => ({ response }))
        .catch(error => ({ error }))

    if (response) yield FOLD.ops.putSuccess()
    else yield FOLD.ops.putFailure(error)
}

function* watchFold() {
    yield FOLD.ops.takeLatest(fold)
}

/**
 * Saga for calling
 */
function* call() {
    const data = yield select((state: ReduxState) => ({
        roomId: state.game.roomId,
    }))

    const { response, error } = yield api
        .callApi({
            roomId: data.roomId,
        })
        .then(response => ({ response }))
        .catch(error => ({ error }))

    if (response) yield CALL.ops.putSuccess()
    else yield CALL.ops.putFailure(error)
}

function* watchCall() {
    yield CALL.ops.takeLatest(call)
}

/**
 * Saga for checking
 */
function* check() {
    const data = yield select((state: ReduxState) => ({
        roomId: state.game.roomId,
    }))

    const { response, error } = yield api
        .checkApi({
            roomId: data.roomId,
        })
        .then(response => ({ response }))
        .catch(error => ({ error }))

    if (response) yield CHECK.ops.putSuccess()
    else yield CHECK.ops.putFailure(error)
}

function* watchCheck() {
    yield CHECK.ops.takeLatest(check)
}

/**
 * Export sagas
 */
export default function* rootSaga() {
    yield all([
        watchCreateRoom(),
        watchCheckRoomExists(),
        watchJoinRoom(),
        watchSitDown(),
        watchStartHand(),
        watchRaise(),
        watchFold(),
        watchCall(),
        watchCheck(),
        watchSetChips(),
        watchTogglePlayerStanding(),
        watchShowHand(),
        kickOutPlayerStanding(),
    ])
}
