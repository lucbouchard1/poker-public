import { PotDoc as Pot, PublicPlayerDoc, Name } from "./model"
import { ASet } from "./util"

/**
 * loop through the seats and keep track of the players that are all
 * in and the amounts that they are all in for.
 * For all the players that are all in, for the amounts that they are all in form
 * we add pots in ascending order.
 *
 * Condition: an all in or not?
 * If there is, we add a pot all the players that are all in
 * If not, we modify the last pot
 *
 * pots = []
 * for (all seats that are allIn)
 * size = seat bet
 * maxBet = seat bet
 * currentPot = [size, maxBet, [playerName]]
 * for (all seats)
 *     if (seat bet >= currentPot.maxBet)
 *     seat bet -= currentPot.maxBet
 *     pot.size += currentPot.maxBet
 *     append seat player to currentPot.seats
 * pots.append(currentPot)
 * sort pots by pot.maxBet ascending
 * for (all seats that are folded and bet quantity > 0)
 * for (pot in pots)
 *     pot.size += min(pot.maxBet, seat bet)
 *     seat bet -= min(pot.maxBet, seat bet)
 *     if (seatBet == 0)
 *     break
 * currentPot = [0, []]
 * for (all seats where the bet quantity > 0 && not folded && not allIn)
 * currentPot[0] += seat bet
 * currentPot[1].append(playerName)
 * append currentPot
 */
export const updatePots = function (dealtInPlayers: PublicPlayerDoc[]): Pot[] {
    const newPots: Pot[] = []

    // Deep copy players and sort by bet amount
    const players = dealtInPlayers
        .map(p => JSON.parse(JSON.stringify(p)) as PublicPlayerDoc)
        .sort((a, b) => {
            return a.bet - b.bet
        })

    const allInPlayers = players.filter(p => p.isAllIn)
    const activePlayers = players.filter(p => !p.isFolded && !p.isStanding)

    // Handle all in pots that are smaller
    for (const p of allInPlayers) {
        const currentAllInPot: Pot = {
            chips: 0,
            maxBet: p.bet,
            players: ASet.create(),
        }

        for (const aP of activePlayers) {
            if (aP.bet >= currentAllInPot.maxBet) {
                aP.bet -= currentAllInPot.maxBet
                currentAllInPot.chips += currentAllInPot.maxBet
                ASet.add(currentAllInPot.players, aP.name)
            }
        }

        newPots.push(currentAllInPot)
    }

    const normalPlayers = players.filter(
        p => !p.isFolded && !p.isAllIn && !p.isStanding
    )
    const currentPot: Pot = {
        players: ASet.create(),
        maxBet: 0,
        chips: 0,
    }

    if (normalPlayers.length > 0) {
        currentPot.maxBet = normalPlayers[0].bet
    }

    for (const p of normalPlayers) {
        if (p.bet !== currentPot.maxBet) {
            throw new Error(
                `Player does not have a matching bet. ${p.bet} != ${currentPot.maxBet}`
            )
        }

        currentPot.chips += currentPot.maxBet
        p.bet -= currentPot.maxBet
        ASet.add(currentPot.players, p.name)
    }

    newPots.push(currentPot)

    const foldedBettedPlayers = players.filter(p => {
        return (p.isFolded || p.isStanding) && p.bet > 0
    })

    // Update pots with folded bet quantities
    for (const p of foldedBettedPlayers) {
        for (const pot of newPots) {
            pot.chips += Math.min(pot.maxBet, p.bet)
            p.bet -= Math.min(pot.maxBet, p.bet)

            if (p.bet === 0) {
                break
            }
        }
    }

    return newPots
}

/**
 * For the given hand values and pots, allocate the amount in the pots to the players in the seats.
 *
 * @param handValues A mapping from the seat indices to the value of their hand
 * @param pots The collection of pots
 * @returns A mapping from the seat indices to the number of chips they will be allocated
 */
export const splitPots = function (
    handValues: Map<Name, number>,
    pots: Pot[]
): Map<Name, number> {
    // For all the seats, calculate the ranking of players, taking ties into account
    const invertedMapping: Map<number, Name[]> = new Map()
    const hValues: number[] = []

    if (handValues.size === 0) {
        throw new Error(`Hand is empty!`)
    }

    handValues.forEach((hValue, player) => {
        hValues.push(hValue)
        const tiedPlayers = invertedMapping.get(hValue)
        if (tiedPlayers) {
            tiedPlayers.push(player)
            invertedMapping.set(hValue, tiedPlayers)
        } else {
            invertedMapping.set(hValue, [player])
        }
    })

    // hValue from lowest to highest.
    // Hands with lower hValue are actually better hands (ie Royal Flush has a lower hValue than a Full House)
    const sortedHValues = hValues.sort((a, b) => a - b)

    // For each rank, starting from the first, while there are still pots
    //  Split all pots that contain the seat indices of the current rank and removed the emptied pots from the list.

    // Deep copy pots
    let potsCopy: Pot[] = JSON.parse(JSON.stringify(pots))
    const playerChipAssignment: Map<Name, number> = new Map()
    // Pre-fill assignment so each seat index is guaranteed a chip value
    for (const p of handValues.keys()) {
        playerChipAssignment.set(p, 0)
    }

    for (const hValue of sortedHValues) {
        if (potsCopy.length === 0) {
            // Distributed all the pots
            break
        }

        // As we are looping over the keys, this is know to be in the map
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        const tiedPlayers = invertedMapping.get(hValue)!

        potsCopy.forEach(pot => {
            const players = tiedPlayers.filter(p => ASet.has(pot.players, p))
            const numSeats = players.length
            if (numSeats > 0) {
                // For all seats that are in the pot, distribute the pot evenly between them
                // If the pot is not divisible by the number of players, give a chip to each player in arbitrary order

                // This will always finish after a couple iterations, usually pots are evenly divisible among the players
                while (pot.chips > 0) {
                    const toEach = Math.max(Math.floor(pot.chips / numSeats), 1)
                    for (const p of players) {
                        // A previous iteration of this loop could have taken enough chips so that a later seat cannot fulfill their amount
                        if (pot.chips >= toEach) {
                            playerChipAssignment.set(
                                p,
                                // All seats are assigned zero to start
                                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                                playerChipAssignment.get(p)! + toEach
                            )

                            pot.chips -= toEach
                        } else {
                            break
                        }
                    }
                }
            }
        })

        // Remove all empty pots before the next rank of seats
        potsCopy = potsCopy.filter(pot => pot.chips > 0)
    }

    if (potsCopy.length !== 0) {
        throw new Error(
            `Unable to distribute all of the pots! hand: ${JSON.stringify(
                handValues
            )} pots: ${JSON.stringify(potsCopy)}`
        )
    }

    return playerChipAssignment
}
