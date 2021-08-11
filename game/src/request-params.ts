export const PLAYER_NAME_LENGTH_BOUND = 15

export const BAD_REQUEST_ERROR = "BadRequestError"
export const INVALID_TOKEN_ERROR = "InvalidTokenError"
export const INVALID_NAME_ERROR = "InvalidNameError"
export const DUPLICATE_NAME_ERROR = "DuplicateNameError"
export const UNKNOWN_PLAYER_ERROR = "UnknownPlayerError"

const ALPHANUMERIC_REG = /^[0-9a-z ,'.]+$/i

export enum PlayerNameResults {
    VALID = 0,
    TOO_LONG = 1,
    EMPTY = 2,
    NOT_SIMPLE = 3,
}

export function verifyPlayerName(
    rawName: string
): { name: string; res: PlayerNameResults } {
    const name = rawName.trim()

    if (name.length === 0) {
        return { name, res: PlayerNameResults.EMPTY }
    }

    if (name.length > PLAYER_NAME_LENGTH_BOUND) {
        return { name, res: PlayerNameResults.TOO_LONG }
    }

    if (!ALPHANUMERIC_REG.test(name)) {
        return { name, res: PlayerNameResults.NOT_SIMPLE }
    }

    return { name, res: PlayerNameResults.VALID }
}

const CHIP_VALUE_UPPER_LIMIT = Number.MAX_SAFE_INTEGER

export enum ChipValueResults {
    VALID = 0,
    NON_NUMERIC = 1,
    NEGATIVE = 2,
    DECIMAL = 3,
    TOO_BIG = 4,
    ZERO = 5,
}

export function verifyChipValue(
    str: string
): { val: number; res: ChipValueResults } {
    // We're expecting an int, so it may make more sense to use `parseInt`,
    // however, we can't detect a float input in that case (and provide an intelligent response).
    const val = parseFloat(str)

    if (isNaN(val) || !isFinite(val)) {
        return { val, res: ChipValueResults.NON_NUMERIC }
    }

    if (val < 0) {
        return { val, res: ChipValueResults.NEGATIVE }
    }

    if (val === 0) {
        return { val, res: ChipValueResults.ZERO }
    }

    if (val > CHIP_VALUE_UPPER_LIMIT) {
        return { val, res: ChipValueResults.TOO_BIG }
    }

    if (Math.round(val) !== val) {
        return { val, res: ChipValueResults.DECIMAL }
    }

    return { val, res: ChipValueResults.VALID }
}
