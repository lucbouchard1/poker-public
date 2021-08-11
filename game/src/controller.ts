import {
    GameState,
    Round,
    OptionsDoc,
    PrivatePlayerDoc,
    DeckDoc,
    Name,
    ID,
    Card,
    CurrentHandDoc,
    GameDoc,
} from "./model"
import {
    Game,
    NotStartedGame,
    InHandGame,
    FinishedHandGame,
    CheckableInHandGame,
    CallableInHandGame,
    LazyPromise,
    lazyEval,
    lazy,
    isCheckableInHandGame,
} from "./types"
import {
    seatedPlayers,
    numSeatedPlayers,
    nextActiveSeat,
    nextActiveSeatInclusive,
    activePlayer,
    numActivePlayers,
    numPotPlayers,
    gameRound,
    potPlayers,
    isCurrentSeatEnd,
    isSeatEnd,
    createNewTimeout,
} from "./game"
import { FULL_DECK, rankHand, shuffleArrayInPlace } from "./cards"
import { updatePots, splitPots } from "./pots"

export const DEFAULT_SEATS: Name[] = Array(10).fill("")

export async function createGame(
    hostName: string,
    hostUserId: string,
    options: OptionsDoc
): Promise<{ game: NotStartedGame; player: PrivatePlayerDoc }> {
    const result: NotStartedGame = {
        state: GameState.NOT_STARTED,
        roomId: Math.random().toString(36).substring(2, 15),
        hostName,
        players: {},
        seats: DEFAULT_SEATS,
        options,
        createdTime: Date.now(),
    }

    const { game, player } = await addPlayer(() => result, hostName, hostUserId)

    return { game: game as NotStartedGame, player }
}

export async function addPlayer(
    game: LazyPromise<Game>,
    name: Name,
    uid: ID
): Promise<{ game: Game; player: PrivatePlayerDoc }> {
    const g = await lazyEval(game)

    if (name in g.players) {
        throw new Error(`Player '${name}' already exists in the room`)
    }

    g.players[name] = {
        name,
        id: uid,
        chips: g.options.defaultChips,
        bet: 0,
        isAllIn: false,
        isFolded: false,
        isDealtIn: false,
        isStanding: false,
    }
    return { game: g, player: { name, id: uid } }
}

export async function seatPlayer(
    game: LazyPromise<Game>,
    name: Name,
    seat: number
): Promise<Game> {
    const g = await lazyEval(game)

    g.seats[seat] = name
    g.players[name].seat = seat
    return g
}

export async function startHand(
    game: LazyPromise<NotStartedGame | FinishedHandGame>
): Promise<{ game: InHandGame; deck: DeckDoc; pData: PrivatePlayerDoc[] }> {
    const g = await lazyEval(game)

    if (g.state === "finishedHand") {
        for (const name of seatedPlayers(g)) {
            const player = g.players[name]
            player.chips += player.chipsWon !== undefined ? player.chipsWon : 0
            player.isFolded = false
            player.isAllIn = false
            player.isDealtIn = false
            delete player.shownHand
            delete player.chipsWon
        }
    }

    // Create and shuffle deck
    const deck = [...FULL_DECK]
    shuffleArrayInPlace(deck)

    // Assign hands to each player
    const playerHands: PrivatePlayerDoc[] = []
    for (const name of seatedPlayers(g)) {
        if (g.players[name].chips <= 0 || g.players[name].isStanding) continue

        g.players[name].isDealtIn = true
        const cards = [deck.pop(), deck.pop()]
        const id = g.players[name].id
        playerHands.push({
            id: id,
            name,
            hand: cards as Card[],
            createdTime: Date.now(),
        })
    }

    const deckDoc: DeckDoc = {
        deck,
        createdTime: Date.now(),
    }

    const seated = numSeatedPlayers(g)

    const dealerSeat = nextActiveSeat(
        g,
        g.state === GameState.NOT_STARTED ? 0 : g.currentHand.dealerSeat
    ) as number
    const smallBlindSeat =
        seated > 2 ? (nextActiveSeat(g, dealerSeat) as number) : undefined
    const bigBlindSeat = nextActiveSeat(
        g,
        smallBlindSeat === undefined ? dealerSeat : smallBlindSeat
    ) as number
    const roundEndSeat = nextActiveSeat(g, bigBlindSeat) as number

    // Setup game document
    let result = Object.assign({}, g as GameDoc, {
        state: GameState.IN_HAND,
        currentHand: {
            community: [],
            roundEndSeat: roundEndSeat,
            activeSeat:
                smallBlindSeat === undefined ? bigBlindSeat : smallBlindSeat,
            dealerSeat,
            bigBlindSeat,
            bet: 0,
            pots: [],
        } as CurrentHandDoc,
    }) as InHandGame

    // Bet blinds
    if (smallBlindSeat !== undefined) {
        result.currentHand.smallBlindSeat = smallBlindSeat
        result = await _bet(result, result.options.smallBlind)
        result = _advanceSeatTurn(result)
    }
    result = await _bet(result, result.options.bigBlind)
    result = _advanceSeatTurn(result)

    return { game: result, deck: deckDoc, pData: playerHands }
}

/**
 * Toggle the "stand up" status of a player. Very similar to
 * fold but can happen when it's not a player's turn.
 *
 * @param game The game state
 * @param name The name of the player to stand
 */
export async function togglePlayerStanding(
    game: LazyPromise<Game>,
    name: Name,
    deck?: LazyPromise<DeckDoc>,
    pData?: LazyPromise<PrivatePlayerDoc[]>
): Promise<{ game: Game; deck?: DeckDoc }> {
    const g = await lazyEval(game)
    const seat = g.players[name].seat

    g.players[name].isStanding = !g.players[name].isStanding

    if (
        seat === undefined ||
        g.state !== "inHand" ||
        !g.players[name].isStanding
    ) {
        return { game: g }
    }

    let result = g as InHandGame

    if (numActivePlayers(result) === 1) {
        const r = await _endRound(result, deck, pData)
        r.game.players[name].isDealtIn = false
        return r
    }

    const curr = result.currentHand.activeSeat

    if (seat === curr) {
        result = _advanceSeatTurn(result)
        const next = result.currentHand.activeSeat

        if (isSeatEnd(result, curr)) {
            result.currentHand.roundEndSeat = next
        } else if (isCurrentSeatEnd(result)) {
            const r = await _endRound(result, deck, pData)
            r.game.players[name].isDealtIn = false
            return r
        }
    } else if (isSeatEnd(result, seat)) {
        result.currentHand.roundEndSeat = nextActiveSeat(result, seat) as number
    }

    result.players[name].isDealtIn = false
    return { game: result }
}

/**
 * Kick a player out of the game.
 *
 * @param g The game state
 */
export async function kickOutPlayer(
    game: LazyPromise<Game>,
    name: Name,
    deck?: LazyPromise<DeckDoc>,
    pData?: LazyPromise<PrivatePlayerDoc[]>
): Promise<{
    game: Game
    deck?: DeckDoc
}> {
    const g = await lazyEval(game)
    const player = g.players[name]
    let result

    if (!player.isStanding) {
        result = await togglePlayerStanding(lazy(g), name, deck, pData)
    } else {
        result = { game: g, pData }
    }

    if (player.seat) {
        result.game.seats[player.seat] = ""
    }
    delete result.game.players[name]

    return { game: result.game, deck: result.deck }
}

/**
 * Increase the active player's bet to the current table bet
 * plus the passed amount. If the player goes all-in and there
 * is only one other active player, the round is over.
 *
 * Tricky edge cases:
 *
 * 1) If the player goes all in, the "round end seat" cannot be set to
 * them otherwise the round will never end.
 *
 * @param g The game state
 * @param amount Increase to the current table bet
 */
export async function raise(
    game: LazyPromise<InHandGame>,
    amount: number
): Promise<{ game: InHandGame }> {
    const g = await lazyEval(game)

    const player = activePlayer(g)

    const result = await _bet(g, amount + g.currentHand.bet - player.bet)
    g.currentHand.roundEndSeat = nextActiveSeatInclusive(
        g,
        g.currentHand.activeSeat
    ) as number

    return { game: _advanceSeatTurn(result) }
}

/**
 * Fold a player.
 *
 * Tricky edge cases:
 *
 * 1) If the player folds and they are the 'seatRoundEndsOn', then
 * the 'seatRoundEndsOn' needs to advance to the next active player.
 *
 * @param g The game state
 */
export async function fold(
    game: LazyPromise<InHandGame>,
    deck?: LazyPromise<DeckDoc>,
    pData?: LazyPromise<PrivatePlayerDoc[]>
): Promise<{ game: InHandGame | FinishedHandGame; deck?: DeckDoc }> {
    const g = await lazyEval(game)
    const player = activePlayer(g)
    player.isFolded = true

    if (numActivePlayers(g) <= 1) return _endRound(g, deck, pData)

    const curr = g.currentHand.activeSeat
    const result = _advanceSeatTurn(g)
    const next = result.currentHand.activeSeat

    if (isSeatEnd(result, curr)) {
        result.currentHand.roundEndSeat = next
    } else if (isCurrentSeatEnd(result)) {
        return _endRound(result, deck, pData)
    }

    return { game: result }
}

/**
 * Increase the active player's bet to the current table bet.
 *
 * Tricky edge cases:
 *
 * 1) Calling makes the player go all-in, but they are in the
 * 'roundEndSeat'. Need to advance the 'roundEndSeat' to the next
 * active player.
 *
 * @param g The game state
 */
export async function call(
    game: LazyPromise<CallableInHandGame>,
    deck?: LazyPromise<DeckDoc>,
    pData?: LazyPromise<PrivatePlayerDoc[]>
): Promise<{ game: InHandGame | FinishedHandGame; deck?: DeckDoc }> {
    const g = await lazyEval(game)
    const player = activePlayer(g)
    const result = await _bet(g, g.currentHand.bet - player.bet)

    _advanceSeatTurn(result)

    if (isCurrentSeatEnd(result)) {
        return _endRound(result, deck, pData)
    }

    if (player.isAllIn && result.currentHand.roundEndSeat === player.seat) {
        const next = nextActiveSeat(g, g.currentHand.activeSeat)
        // If there are no more active seats, this hand is over.
        if (next === undefined) return _endRound(result, deck, pData)
        g.currentHand.roundEndSeat = next
    }

    return { game: result }
}

export async function check(
    game: LazyPromise<CheckableInHandGame>,
    deck?: LazyPromise<DeckDoc>,
    pData?: LazyPromise<PrivatePlayerDoc[]>
): Promise<{ game: InHandGame | FinishedHandGame; deck?: DeckDoc }> {
    const g = await lazyEval(game)
    const result = _advanceSeatTurn(g)

    if (isCurrentSeatEnd(result)) return _endRound(result, deck, pData)
    return { game: result }
}

export async function showHand(
    game: LazyPromise<FinishedHandGame>,
    pData: LazyPromise<PrivatePlayerDoc>
): Promise<FinishedHandGame> {
    const g = await lazyEval(game)
    const p = await lazyEval(pData)

    if (p.hand === undefined) {
        throw new Error("Cannot show undefined hand")
    }

    g.players[p.name].shownHand = p.hand
    return g
}

export async function setChips(
    game: LazyPromise<GameDoc>,
    playerName: string,
    chipAmount: number
): Promise<GameDoc> {
    const g = await lazyEval(game)

    g.players[playerName].chips = chipAmount
    delete g.players[playerName].chipsWon
    return g
}

export async function setHost(
    game: LazyPromise<GameDoc>,
    newHostName: string
): Promise<GameDoc> {
    const g = await lazyEval(game)

    g.hostName = newHostName

    return g
}

export async function updateOptions(
    game: LazyPromise<GameDoc>,
    opts: Partial<OptionsDoc>
): Promise<GameDoc> {
    const g = await lazyEval(game)

    if (opts.defaultChips) {
        g.options.defaultChips = opts.defaultChips
    }

    if (opts.bigBlind) {
        g.options.bigBlind = opts.bigBlind
    }

    if (opts.smallBlind) {
        g.options.smallBlind = opts.smallBlind
    }

    if (opts.straddleEnabled) {
        g.options.straddleEnabled = opts.straddleEnabled
    }

    return g
}

export async function processTimeout(
    game: LazyPromise<InHandGame>,
    deck?: LazyPromise<DeckDoc>,
    pData?: LazyPromise<PrivatePlayerDoc[]>
): Promise<{ game: FinishedHandGame | InHandGame; deck?: DeckDoc }> {
    const gameDoc = await lazyEval(game)
    if (isCheckableInHandGame(gameDoc)) {
        return await check(lazy(gameDoc), deck, pData)
    } else {
        return await fold(game, deck, pData)
    }
}

/**
 * Increase the active player's bet. function does not
 * advance the current seat turn.
 *
 * @param g The game state.
 * @param amount The amount to increase the active user's bet by.
 */
async function _bet(g: InHandGame, increase: number): Promise<InHandGame> {
    const player = activePlayer(g)
    const lastBet = g.currentHand.bet

    const verifiedAmount = Math.min(player.chips, increase)
    if (verifiedAmount === player.chips) player.isAllIn = true

    player.chips -= verifiedAmount
    player.bet += verifiedAmount

    g.currentHand.bet = Math.max(player.bet, lastBet)

    return g
}

async function _endRound(
    g: InHandGame,
    deck?: LazyPromise<DeckDoc>,
    pData?: LazyPromise<PrivatePlayerDoc[]>
): Promise<{ game: InHandGame | FinishedHandGame; deck?: DeckDoc }> {
    const round = gameRound(g)

    const newPots = updatePots(
        Array.from(seatedPlayers(g))
            .filter(p => g.players[p].isDealtIn)
            .map(p => g.players[p])
    )
    g.currentHand.pots = g.currentHand.pots.concat(newPots)
    for (const p of seatedPlayers(g)) g.players[p].bet = 0

    // Check if all but one player has folded or its the last round
    if (round === Round.River || numActivePlayers(g) <= 1) {
        if (!pData || !deck) {
            return {
                game: Object.assign({}, g as Game, {
                    state: "finishedHand",
                }) as FinishedHandGame,
            }
        }

        let dck = undefined
        if (round !== Round.River && numPotPlayers(g) !== 1) {
            dck = (await lazyEval(deck)).deck
            while (g.currentHand.community.length < 5)
                g.currentHand.community.push(dck.pop() as Card)
        }

        return {
            game: await _endHand(g, pData),
            deck: dck ? { deck: dck } : undefined,
        }
    }

    let d
    if (deck) d = (await lazyEval(deck)).deck
    else d = { pop: () => null }

    if (round === Round.PreFlop) {
        // Deal Flop cards
        g.currentHand.community = [d.pop(), d.pop(), d.pop()] as Card[]
    } else if (round === Round.Flop) {
        // Deal Turn card
        g.currentHand.community.push(d.pop() as Card)
    } else if (round === Round.Turn) {
        // Deal River card
        g.currentHand.community.push(d.pop() as Card)
    }

    g.currentHand.bet = 0
    g.currentHand.activeSeat = nextActiveSeat(
        g,
        g.currentHand.dealerSeat
    ) as number
    g.currentHand.roundEndSeat = g.currentHand.activeSeat

    if (deck) return { game: g, deck: { deck: d as Card[] } }
    return { game: g }
}

async function _endHand(
    g: InHandGame,
    pData: LazyPromise<PrivatePlayerDoc[]>
): Promise<FinishedHandGame> {
    const playerHands: Map<string, PrivatePlayerDoc> = new Map()
    const playerDocs = await lazyEval(pData)
    const numInShowdown = numPotPlayers(g)
    playerDocs.forEach(pDoc => {
        playerHands.set(pDoc.name, pDoc)
    })

    let playerHandValues
    if (numInShowdown === 1) {
        // All other players folded. Win by default, no need to hand rank.
        const playerName = potPlayers(g).next().value
        playerHandValues = new Map().set(playerName, 0)
    } else {
        // All the cards have been dealt, time to determine the winning hand.
        playerHandValues = new Map()
        for (const playerName of potPlayers(g)) {
            const player = g.players[playerName]
            const playerHand = playerHands.get(player.name)?.hand
            if (!playerHand) continue
            let fullHand: Card[] = JSON.parse(
                JSON.stringify(g.currentHand.community)
            )
            fullHand = fullHand.concat(playerHand)

            const hValue = rankHand(fullHand)[1]
            playerHandValues.set(playerName, hValue)
        }
    }

    const potDistribution = splitPots(playerHandValues, g.currentHand.pots)

    potDistribution.forEach((chips, name) => {
        g.players[name].chipsWon = chips
    })

    const result = Object.assign({}, g as Game, {
        state: "finishedHand",
    }) as FinishedHandGame

    if (numInShowdown !== 1) {
        // For all currently active players (who must have challenged for the pot)
        // show their hands. Unless there is only a single player, in which case the
        // they must have won via everyone else folding
        let currentMin = Number.MAX_VALUE
        for (const playerName of potPlayers(result)) {
            const handValue = playerHandValues.get(playerName)
            if (handValue && handValue < currentMin) {
                currentMin = handValue
                const player = playerHands.get(playerName)
                if (!player) continue
                await showHand(lazy(result), lazy(player))
            }
        }
    }

    // Remove timeout information
    delete result.timeout

    return result
}

/**
 * Advance the activeSeat to the next active player. If there
 * are no more active seats, activeSeat remains unchanged.
 *
 * @param g The game state
 */
function _advanceSeatTurn(g: InHandGame): InHandGame {
    const next = nextActiveSeat(g, g.currentHand.activeSeat)
    if (next !== undefined) {
        g.currentHand.activeSeat = next
    }

    g.timeout = createNewTimeout(g)
    return g
}
