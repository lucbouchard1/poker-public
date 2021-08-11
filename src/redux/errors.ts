export const FAILURE_ACTION = "ACTION_FAILED"

export interface FrontendError {
    name: string
    data: any
}

export const userAuthenticationError = (data): FrontendError => ({
    name: "UserAuthenticationError",
    data,
})

export const invalidRoomError = (roomId: string): FrontendError => ({
    name: "InvalidRoomError",
    data: roomId,
})
