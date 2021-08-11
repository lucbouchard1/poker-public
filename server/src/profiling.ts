import { performance, PerformanceObserver } from "perf_hooks"
import { getLogger } from "./logging"

const LOG = getLogger("application-profile")

export const OBS = new PerformanceObserver(list => {
    for (const entry of list.getEntries()) {
        // tslint:disable-next-line:no-floating-promises
        LOG.info({
            entry: entry.name,
            duration: entry.duration,
        })
    }
})

export function enableProfiling() {
    OBS.observe({ entryTypes: ["measure"], buffered: true })
}

export function disableProfiling() {
    OBS.disconnect()
}

export function profileSync<TArgs extends unknown[], TResult>(
    desc: string,
    fn: (...args: TArgs) => TResult
): (...args: TArgs) => TResult {
    return (...args: TArgs): TResult => {
        const [startMarkDesc, endMarkDesc] = createMarkDesc(desc)

        performance.mark(startMarkDesc)
        const result = fn(...args)
        performance.mark(endMarkDesc)

        performance.measure(desc, startMarkDesc, endMarkDesc)
        return result
    }
}

export function profileAsync<TArgs extends unknown[], TResult>(
    desc: string,
    fn: (...args: TArgs) => Promise<TResult>
): (...args: TArgs) => Promise<TResult> {
    return async (...arg: TArgs): Promise<TResult> => {
        const [startMarkDesc, endMarkDesc] = createMarkDesc(desc)
        performance.mark(startMarkDesc)
        const result = await fn(...arg)
        performance.mark(endMarkDesc)

        performance.measure(desc, startMarkDesc, endMarkDesc)
        return result
    }
}

export async function profilePromise<TResult>(
    desc: string,
    prom: Promise<TResult>
): Promise<TResult> {
    const [startMarkDesc, endMarkDesc] = createMarkDesc(desc)

    performance.mark(startMarkDesc)
    const result = await prom
    performance.mark(endMarkDesc)

    performance.measure(desc, startMarkDesc, endMarkDesc)
    return result
}

function createMarkDesc(desc: string): [string, string] {
    const startMarkDesc = `${desc}-start`
    const endMarkDesc = `${desc}-end`

    return [startMarkDesc, endMarkDesc]
}
