import {
    PlayerNameResults,
    PLAYER_NAME_LENGTH_BOUND,
    BAD_REQUEST_ERROR,
    INVALID_TOKEN_ERROR,
    INVALID_NAME_ERROR,
    DUPLICATE_NAME_ERROR,
    UNKNOWN_PLAYER_ERROR,
} from "@pokerweb-app/game/src/request-params"

interface HandledError {
    code: number
    name: string
    message: unknown
}

export function isHandledError(data: unknown): data is HandledError {
    return (
        (data as HandledError).message !== undefined &&
        (data as HandledError).code !== undefined &&
        typeof (data as HandledError).code === "number" &&
        (data as HandledError).name !== undefined &&
        typeof (data as HandledError).name === "string"
    )
}

export class BadRequestError extends Error implements HandledError {
    name = BAD_REQUEST_ERROR
    code = 400
}

export class InvalidTokenError extends BadRequestError {
    name = INVALID_TOKEN_ERROR

    constructor() {
        super("Authentication token not included in request")
    }
}

export class UnknownPlayerError extends BadRequestError {
    name = UNKNOWN_PLAYER_ERROR

    constructor() {
        super("Player is not present in game")
    }
}

export class InvalidNameError extends BadRequestError {
    constructor(type: PlayerNameResults) {
        let message
        switch (type) {
            case PlayerNameResults.EMPTY:
                message = "Name cannot be empty"
                break

            case PlayerNameResults.TOO_LONG:
                message = `Name cannot be longer than ${PLAYER_NAME_LENGTH_BOUND} characters`
                break

            case PlayerNameResults.NOT_SIMPLE:
                message =
                    "Name consists of characters other than numbers, letters, spaces, or punctuation (,.-)"
                break

            default:
                message = "Player name invalid"
        }

        super(message)
        this.name = INVALID_NAME_ERROR
    }
}

export class DuplicateNameError extends Error implements HandledError {
    name = DUPLICATE_NAME_ERROR
    code = 400

    constructor(name: string) {
        super(`'${name}' is already taken. Try another name.`)
    }
}

export class TransactionError extends Error {
    constructor() {
        super("The containing transaction is not longer valid") // 'Error' breaks prototype chain here
        Object.setPrototypeOf(this, new.target.prototype) // restore prototype chain
    }
}
