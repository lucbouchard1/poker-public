import { FrontendError, FAILURE_ACTION } from "../errors"

export interface ErrorState {
    failedAction: string
    error?: FrontendError
}

const initialState: ErrorState = {
    failedAction: null,
}

interface ErrorAction extends FrontendError {
    type: string
    failedAction: string
}

export const error = (
    state = initialState,
    action: ErrorAction
): ErrorState => {
    if (action.type !== FAILURE_ACTION) return state

    return {
        failedAction: action.failedAction,
        error: {
            name: action.name,
            data: action.data,
        },
    }
}
