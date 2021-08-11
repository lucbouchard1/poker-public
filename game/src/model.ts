import { ASet } from "./util"

export type Name = string
export type ID = string

export enum Suit {
    Diamond = "d",
    Heart = "h",
    Spade = "s",
    Club = "c",
}

export enum Rank {
    Ace = 14,
    Two = 2,
    Three = 3,
    Four = 4,
    Five = 5,
    Six = 6,
    Seven = 7,
    Eight = 8,
    Nine = 9,
    Ten = 10,
    Jack = 11,
    Queen = 12,
    King = 13,
}

export enum Round {
    PreFlop = 0,
    Flop = 1,
    Turn = 2,
    River = 3,
}

export enum GameState {
    NOT_STARTED = "notStarted",
    IN_HAND = "inHand",
    FINISHED_HAND = "finishedHand",
}

export interface Card {
    suit: Suit
    rank: Rank
}

export interface OptionsDoc {
    defaultChips: number
    smallBlind: number
    bigBlind: number
    straddleEnabled: boolean
}

export interface TimeoutDoc {
    /**
     * The uid of the player who the timeout will apply to
     */
    uid: string

    /**
     * The timeout expiration timestamp.
     */
    expiry: number
}

export interface PotDoc {
    /**
     * Players who have chips in the pot
     */
    players: ASet<Name>

    /**
     * Number of chips in the pot
     */
    chips: number

    /**
     * Maximum bet for this pot. Excess goes to
     * secondary pots
     */
    maxBet: number
}

export interface CurrentHandDoc {
    /**
     * Community cards for the current hand
     */
    community: Card[]

    /**
     * The current table bet that user must call
     */
    bet: number

    /**
     * Seat index of the player who's turn it is
     */
    activeSeat: number

    /**
     * Index of the seat where the round will end
     * if all users call or fold
     */
    roundEndSeat: number

    /**
     * Index of the dealer's seat
     */
    dealerSeat: number

    /**
     * Seat index of the player with the big blind chip
     */
    bigBlindSeat: number

    /**
     * Seat index of the player with the small blind chip
     */
    smallBlindSeat?: number

    /**
     * Current pots
     */
    pots: PotDoc[]
}

export interface PublicPlayerDoc {
    /**
     * Player name
     */
    name: Name

    /**
     * Private user ID
     * TODO: Remove this field from this document
     */
    id: ID

    /**
     * Player's chip count
     */
    chips: number

    /**
     * Player's current bet
     */
    bet: number

    isDealtIn: boolean
    isFolded: boolean
    isAllIn: boolean
    isStanding: boolean

    /**
     * Seat index of the player. Unset until the user
     * sits down
     */
    seat?: number

    /**
     * The number of chips won by a player.
     * Should only be set if the game is in state
     * "finishedHand"
     */
    chipsWon?: number

    /**
     * The player's displayed cards. Undefined until the user
     * decides to show them
     */
    shownHand?: Card[]
}

export interface PrivatePlayerDoc {
    /**
     * Private user ID
     */
    id: ID

    /**
     * Public player name
     */
    name: Name

    /**
     * Player's hand
     */
    hand?: Card[]

    /**
     * The epoch timestamp of the last time this game document was written to
     */
    updatedTime?: number

    /**
     * The epoch timestamp of the time of creation for this game document
     */
    createdTime?: number
}

export interface DeckDoc {
    /**
     * Card deck for a game
     */
    deck: Card[]

    /**
     * The epoch timestamp of the last time this game document was written to
     */
    updatedTime?: number

    /**
     * The epoch timestamp of the time of creation for this game document
     */
    createdTime?: number
}

/**
 * Complete description of the game
 */
export interface GameDoc {
    /**
     * Current state of the game.
     */
    state: GameState

    /**
     * Unique identifier for the game.
     */
    roomId: string

    /**
     * Name of the player who created the game
     */
    hostName: Name

    /**
     * Customizable game options
     */
    options: OptionsDoc

    /**
     * Data for each player in the game, indexed by
     * their name.
     */
    players: Record<Name, PublicPlayerDoc>

    /**
     * Each element corresponds to a seat and stores the name of
     * the player in that seat. If an element is contains an empty string,
     * the seat is empty.
     */
    seats: Name[]

    /**
     * Data for the current round. Re-creeated on every deal.
     */
    currentHand?: CurrentHandDoc

    /**
     * The epoch timestamp of the last time this game document was written to
     */
    updatedTime?: number

    /**
     * The epoch timestamp of the time of creation for this game document
     */
    createdTime?: number

    /**
     * The optional timeout information
     */
    timeout?: TimeoutDoc
}
