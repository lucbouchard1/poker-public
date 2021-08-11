/* eslint-disable @typescript-eslint/no-namespace */
/* eslint-disable no-inner-declarations */
export type ASet<T> = Array<T>

// tslint:disable-next-line:no-namespace
export namespace ASet {
    export function create<T>(): ASet<T> {
        return []
    }

    export function has<T>(set: ASet<T>, val: T): boolean {
        return set.findIndex(elem => elem === val) !== -1
    }

    export function add<T>(set: ASet<T>, val: T) {
        if (!has(set, val)) {
            set.push(val)
        }
    }
}
