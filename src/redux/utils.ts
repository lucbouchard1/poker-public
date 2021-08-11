import { put, takeLatest, takeEvery } from "redux-saga/effects"
import { FrontendError, FAILURE_ACTION } from "./errors"

interface Action {
    type: string
}

export class CreateAction<Data> {
    public action: string

    constructor(name: string) {
        this.action = name
        this.type = { type: name }
    }

    create(data?: Data) {
        return Object.assign({}, this.type, data)
    }

    put(data?: Data) {
        return put(Object.assign({}, this.type, data))
    }

    takeLatest(handler: (action: Data | Action) => Generator<any>) {
        return takeLatest(this.action, handler)
    }

    takeEvery(handler: (action: Data | Action) => Generator<any>) {
        return takeEvery(this.action, handler)
    }

    private type: { type: string }
}

export class CreateFallibleAction<Data, Success> {
    public action: string
    public success: string

    constructor(name: string) {
        this.action = name
        this.success = name + "_SUCCESS"
        this.type = { type: this.action }
        this.successType = { type: this.success }
    }

    create(data?: Data) {
        return Object.assign({}, this.type, data)
    }

    createSuccess(data?: Success) {
        return Object.assign({}, this.successType, data)
    }

    createFailure(data: FrontendError) {
        return Object.assign({}, this.failType, data)
    }

    put(data?: Data) {
        return put(Object.assign({}, this.type, data))
    }

    putSuccess(data?: Success) {
        return put(Object.assign({}, this.successType, data))
    }

    putFailure(data: FrontendError) {
        return put(
            Object.assign(
                { type: FAILURE_ACTION, failedAction: this.action },
                data
            )
        )
    }

    takeLatest(handler: (action: Data | Action) => Generator<any>) {
        return takeLatest(this.action, handler)
    }

    takeEvery(handler: (action: Data | Action) => Generator<any>) {
        return takeEvery(this.action, handler)
    }

    private type: { type: string }
    private successType: { type: string }
    private failType: { type: string }
}
