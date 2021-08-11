export const ROOM_PATH_PREFIX = "/game/"

export function getRoomPath(roomId: string) {
    return ROOM_PATH_PREFIX + roomId
}

export function isRoomPath(path: string): boolean {
    return path.length > 6 && path.slice(0, 6) == ROOM_PATH_PREFIX
}

export function getRoomId(path: string): string | undefined {
    if (isRoomPath(path)) return path.slice(6)
    return undefined
}
