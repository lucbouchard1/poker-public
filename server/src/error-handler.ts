import express from "express"
import { ErrorReporting } from "@google-cloud/error-reporting"
import { isHandledError } from "./errors"
import { getLogger } from "./logging"

const LOG = getLogger()

let errorReporter: ErrorReporting | undefined = undefined
if (process.env.NODE_ENV === "production") {
    errorReporter = new ErrorReporting()
}

export async function errorHandler(
    err: Error,
    req: express.Request,
    res: express.Response
) {
    if (isHandledError(err)) {
        res.status(err.code)
        res.json({ data: err.message, name: err.name })
    } else {
        // Unhandled error! Report to google cloud
        res.status(500)
        res.json({ data: err.message, name: err.name })
        await LOG.log(err)
        if (errorReporter) errorReporter.report(err)
    }
}
