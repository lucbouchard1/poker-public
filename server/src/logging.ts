import * as proc from "process"
import { Logging, Log, Entry } from "@google-cloud/logging"

const LOGGING: Logging = new Logging()

type LogLevel =
    | "DEFAULT"
    | "DEBUG"
    | "INFO"
    | "NOTICE"
    | "WARNING"
    | "ERROR"
    | "CRITICAL"
    | "ALERT"
    | "EMERGENCY"

type LogData = string | {} | undefined

const DEFAULT_LOG_NAME = "server-default"

export function getLogger(logName?: string): Logger {
    return new Logger(logName || DEFAULT_LOG_NAME)
}

class Logger {
    constructor(logName: string) {
        this._logName = logName
        this._log = LOGGING.log(this._logName)
    }

    get logName() {
        return this._logName
    }

    debug(data: LogData): Promise<unknown> {
        const entry = this._getEntry("DEBUG", data)

        return this._log.write(entry)
    }

    info(data: LogData): Promise<unknown> {
        const entry = this._getEntry("INFO", data)

        return this._log.write(entry)
    }

    log(data: LogData): Promise<unknown> {
        const entry = this._getEntry("DEFAULT", data)

        return this._log.write(entry)
    }

    warn(data: LogData): Promise<unknown> {
        const entry = this._getEntry("WARNING", data)

        return this._log.write(entry)
    }

    error(data: LogData): Promise<unknown> {
        const entry = this._getEntry("ERROR", data)

        return this._log.write(entry)
    }

    private _getEntry(severity: LogLevel, data: LogData): Entry {
        return this._log.entry(
            {
                resource: {
                    type: "gae_app",
                    labels: {
                        // eslint-disable-next-line @typescript-eslint/camelcase
                        version_id: proc.env.GAE_VERSION || "unknown",
                        // eslint-disable-next-line @typescript-eslint/camelcase
                        project_id: proc.env.GOOGLE_CLOUD_PROJECT || "unknown",
                    },
                },
                severity,
            },
            data
        )
    }

    private _logName: string
    private _log: Log
}
