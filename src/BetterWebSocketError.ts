export interface BetterWebSocketErrorInit {
    wasClean?: boolean | undefined
    closeCode?: number | undefined
    reason?: string | undefined
}

export default class BetterWebSocketError extends DOMException {
    #wasClean: boolean
    #code: number | null
    #reason: string
    constructor(message: string = "", init: BetterWebSocketErrorInit = {}) {
        const { closeCode: code = null, reason = "", wasClean = false } = init
        super(message, "WebSocketError")
        this.#wasClean = wasClean
        this.#code = code
        this.#reason = reason
    }
    get wasClean(): boolean {
        return this.#wasClean
    }
    get closeCode(): number | null {
        return this.#code
    }
    get reason(): string {
        return this.#reason
    }
}