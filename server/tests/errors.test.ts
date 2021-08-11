import { describe, it } from "mocha"
import { disableProfiling } from "../src/profiling"
import { TransactionError } from "../src/errors"

disableProfiling()

describe("TransactionError", () => {
    it("should be catchable with instanceof", () => {
        try {
            throw new TransactionError()
        } catch (e) {
            if (e instanceof TransactionError) {
                // do nothing
            } else {
                throw e
            }
        }
    })
})
