import { Round, PublicPlayerDoc, GameDoc, TimeoutDoc } from "./model"
import { Game, InHandGame } from "./types"

export function getPlayerForUid(
    g: GameDoc,
    uid: string
): PublicPlayerDoc | undefined {
    for (const playerName of Object.keys(g.players)) {
        if (g.players[playerName].id === uid) {
            return g.players[playerName]
        }
    }

    return undefined
}

export function getPlayerforName(
    g: GameDoc,
    playerName: string
): PublicPlayerDoc | undefined {
    if (playerName in g.players) return g.players[playerName]
    return undefined
}

/**
 * Iterate through the seated players. Yields
 * the name of each seated player.
 *
 * @param game The game state
 */
export function* seatedPlayers(game: Game) {
    for (const p in game.players)
        if (game.players[p].seat !== undefined) yield p
}

/**
 * Iterate through the players who can still bet. Yields
 * the name of each player who is seated, hasn't folded,
 * and has chips left to bet.
 *
 * @param game The game state
 */
export function* activePlayers(game: Game) {
    for (const p in game.players)
        if (
            game.players[p].seat !== undefined &&
            !game.players[p].isFolded &&
            !game.players[p].isStanding &&
            game.players[p].isDealtIn &&
            !game.players[p].isAllIn
        )
            yield p
}

/**
 * Iterate through the players with chips in the pot. Yields
 * the name of each player who is seated a not folded. Includes
 * players who are all in.
 *
 * @param game The game state
 */
export function* potPlayers(game: Game) {
    for (const p in game.players)
        if (
            game.players[p].seat !== undefined &&
            !game.players[p].isFolded &&
            !game.players[p].isStanding &&
            game.players[p].isDealtIn
        )
            yield p
}

/**
 * Iterate through the active seats. Yields the seat index
 * of each seat with a player that has chips and hasn't folded.
 *
 * @param g The game state
 * @param start The seat index to start with.
 */
export function* activeSeats(g: Game, start?: number) {
    let i = start
    if (i === undefined) i = 0

    do {
        if (
            g.seats[i] !== "" &&
            !g.players[g.seats[i]].isFolded &&
            !g.players[g.seats[i]].isStanding &&
            g.players[g.seats[i]].isDealtIn &&
            !g.players[g.seats[i]].isAllIn
        )
            yield i
        i = (i + 1) % g.seats.length
    } while (i !== start)
}

/**
 * Get the round for the current hand
 *
 * @param g The game state
 */
export function gameRound(g: InHandGame): Round {
    switch (g.currentHand.community.length) {
        case 0:
            return Round.PreFlop
        case 3:
            return Round.Flop
        case 4:
            return Round.Turn
        case 5:
            return Round.River
        default:
            return Round.PreFlop
    }
}

/**
 * Get the number of players who are seated and haven't
 * folded.
 *
 * @param g The game state
 */
export function numActivePlayers(g: GameDoc): number {
    return Object.keys(g.players).filter(
        k =>
            g.players[k].seat !== undefined &&
            !g.players[k].isFolded &&
            !g.players[k].isStanding &&
            g.players[k].isDealtIn &&
            !g.players[k].isAllIn
    ).length
}

/**
 * Get the number of players who are seated and haven't
 * folded.
 *
 * @param g The game state
 */
export function numPotPlayers(g: GameDoc): number {
    return Object.keys(g.players).filter(
        k =>
            g.players[k].seat !== undefined &&
            !g.players[k].isFolded &&
            !g.players[k].isStanding &&
            g.players[k].isDealtIn
    ).length
}

/**
 * Get the number of seated players.
 *
 * @param g The game state
 */
export function numSeatedPlayers(g: Game): number {
    return Object.keys(g.players).filter(k => g.players[k].seat !== undefined)
        .length
}

/**
 * Get the next active seat index after `seat`.
 *
 * @param g The game state
 * @param seat The search starting point. First checked index
 *      is the one the follows this seat.
 */
export function nextActiveSeat(g: Game, seat: number): number | undefined {
    const result = activeSeats(g, (seat + 1) % g.seats.length).next()
        .value as number
    if (result === undefined) return undefined
    return result
}

/**
 * Get the next active seat index including `seat`.
 *
 * @param g The game state
 * @param seat The search starting point. First checked index
 *      is this seat.
 */
export function nextActiveSeatInclusive(
    g: Game,
    seat: number
): number | undefined {
    const result = activeSeats(g, seat).next().value as number
    if (result === undefined) return undefined
    return result
}

/**
 * Get the active player's data
 *
 * @param g The game state
 */
export function activePlayer(g: InHandGame): PublicPlayerDoc {
    return g.players[g.seats[g.currentHand.activeSeat]]
}

/**
 * How long until the turn expires in milliseconds
 */
export const TURN_TIMEOUT_DURATION = 30_000

export function createNewTimeout(g: InHandGame): TimeoutDoc {
    const currentPlayerName = g.seats[g.currentHand.activeSeat]
    const expiry = Date.now() + TURN_TIMEOUT_DURATION

    return {
        uid: g.players[currentPlayerName].id,
        expiry,
    }
}

/**
 * How long until a game expires in milliseconds
 */
export const GAME_EXPIRATION_DURATION = 43200000

/**
 * Return true if the given game has not been updated in some constant number of time.
 * If the field is missing, the game is expired.
 *
 * @param g The game state
 */
export function isGameExpired(g: Game): boolean {
    if (g.updatedTime !== undefined) {
        const expirationDate = g.updatedTime + GAME_EXPIRATION_DURATION

        return Date.now() >= expirationDate
    } else {
        return true
    }
}

/**
 * Return true if the given game and current player have timed out.
 *
 * @param g The game state
 */
export function isGameTimedOut(g: Game, now?: number): boolean {
    const actualNow = now || Date.now()
    if (g.timeout !== undefined) {
        return actualNow >= g.timeout.expiry
    } else {
        return false
    }
}

/**
 * Return true if the given user id is the current player in the given game
 *
 * @param g The game state
 * @param uid The user id
 */
export function isCurrentPlayerId(g: InHandGame, uid: string): boolean {
    const currentPlayerName = g.seats[g.currentHand.activeSeat]

    return g.players[currentPlayerName].id === uid
}

/**
 * Returns true if current seat is the round ending seat
 *
 * @param g The game state
 */
export function isSeatEnd(g: InHandGame, seat: number): boolean {
    return seat === g.currentHand.roundEndSeat
}

/**
 * Returns true if current seat is the round ending seat
 *
 * @param g The game state
 */
export function isCurrentSeatEnd(g: InHandGame): boolean {
    return g.currentHand.activeSeat === g.currentHand.roundEndSeat
}

/**
 * Returns the minimum raise value for a given game
 *
 * @param g The game state
 */
export function minimumRaise(g: InHandGame): number {
    if (g.currentHand.bet === 0) {
        return g.options.bigBlind
    } else {
        return g.currentHand.bet
    }
}
