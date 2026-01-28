import BetterWebSocketError from "./BetterWebSocketError.ts"
import BetterWebSocketReadableStream, { createBetterWebSocketReadableStream } from "./BetterWebSocketReadableStream.ts"
import BetterWebSocketWritableStream, { createBetterWebSocketWritableStream } from "./BetterWebSocketWritableStream.ts"

export interface BetterWebSocketStreamOptions {
    protocols?: string[] | undefined
    signal?: AbortSignal | undefined
}

export interface BetterWebSocketStreamClosed {
    wasClean: boolean
    closeCode: number
    reason: string
}

export default class BetterWebSocketStream {
    static async open(url: string | URL, options: BetterWebSocketStreamOptions = {}): Promise<BetterWebSocketStream> {
        const { signal = new AbortController().signal } = options
        signal.throwIfAborted()
        const ws = new WebSocket(url, options.protocols)
        await new Promise((resolve, reject) => {
            const listeners = new AbortController()
            signal.addEventListener("abort", event => {
                listeners.abort((event.target as AbortSignal).reason)
                ws.close(1000, `${(event.target as AbortSignal).reason}`)
                reject((event.target as AbortSignal).reason)
            }, { passive: true, signal: listeners.signal, once: true })
            ws.addEventListener("error", event => {
                const error = new Error("error event")
                listeners.abort(error)
                reject(error)
            }, { passive: true, signal: listeners.signal, once: true })
            ws.addEventListener("open", event => {
                listeners.abort()
                resolve(event)
            }, { passive: true, signal: listeners.signal, once: true })
        })
        return new BetterWebSocketStream(ws)
    }
    #ws: WebSocket
    #readable: BetterWebSocketReadableStream
    #writable: BetterWebSocketWritableStream
    #closed: Promise<BetterWebSocketStreamClosed>
    private constructor(ws: WebSocket) {
        this.#ws = ws
        this.#readable = createBetterWebSocketReadableStream(ws)
        this.#writable = createBetterWebSocketWritableStream(ws)
        this.#closed = createBetterWebSocketStreamClosed(ws)
    }
    get url(): string {
        return this.#ws.url
    }
    get extensions(): string {
        return this.#ws.extensions
    }
    get protocol(): string {
        return this.#ws.protocol
    }
    get readable(): ReadableStream<string | Uint8Array> {
        return this.#readable
    }
    get writable(): WritableStream<string | BufferSource> {
        return this.#writable
    }
    get closed(): Promise<BetterWebSocketStreamClosed> {
        return this.#closed
    }
    close(closeCode: number = 1000, reason: string = ""): void {
        this.#ws.close(closeCode, reason)
    }
}

function createBetterWebSocketStreamClosed(ws: WebSocket): Promise<BetterWebSocketStreamClosed> {
    return new Promise((resolve, reject) => {
        const listeners = new AbortController()
        if (ws.readyState === WebSocket.CLOSED) {
            listeners.abort()
            throw new DOMException(`${ws} already closed`, "InvalidStateError")
        }
        ws.addEventListener("error", (event) => {
            const error = new Error("error event")
            listeners.abort(error)
            reject(error)
        }, { passive: true, signal: listeners.signal, once: true })
        ws.addEventListener("close", event => {
            listeners.abort()
            resolve({ wasClean: event.wasClean, closeCode: event.code, reason: event.reason })
        }, { passive: true, signal: listeners.signal, once: true })
    })
}