import { createStore, combineReducers, applyMiddleware } from "redux"
import createSagaMiddleware from "redux-saga"
import { composeWithDevTools } from "redux-devtools-extension"
import rootSaga from "./sagas"
import { user, UserState } from "./reducers/user"
import { game, GameState } from "./reducers/game"
import { error, ErrorState } from "./reducers/error"
import { players, PlayersState } from "./reducers/players"
import { playSoundMiddleware } from "./middleware/soundMiddleware"
import { gameStateMiddleware } from "./middleware/game-state-updates"
import { checkKickedMiddleware } from "./middleware/check-kicked"
import { analyticsMiddleware } from "./middleware/analytics"

export interface ReduxState {
    user: UserState
    game: GameState
    players: PlayersState
    error: ErrorState
}

const sagaMiddleware = createSagaMiddleware()
const store = createStore(
    combineReducers({ user, game, players, error }),
    composeWithDevTools(
        applyMiddleware(
            sagaMiddleware,
            playSoundMiddleware,
            gameStateMiddleware,
            checkKickedMiddleware,
            analyticsMiddleware
        )
    )
)
sagaMiddleware.run(rootSaga)

export default store
