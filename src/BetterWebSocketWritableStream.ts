import BetterWebSocketError from "./BetterWebSocketError.ts"

export let createBetterWebSocketWritableStream: (ws: WebSocket) => BetterWebSocketWritableStream
export default class BetterWebSocketWritableStream extends WritableStream<string | BufferSource> {
    static {
        createBetterWebSocketWritableStream = (ws: WebSocket) => new BetterWebSocketWritableStream(ws)
    }
    #ws: WebSocket
    #listeners: AbortController
    private constructor(ws: WebSocket) {
        const listeners = new AbortController()
        super({
            start: (controller) => {
                if (ws.readyState !== WebSocket.OPEN) {
                    listeners.abort()
                    throw new DOMException(`${ws} is not open`, "InvalidStateError")
                }
                ws.addEventListener("error", (event) => {
                    const error = new Error("error event")
                    listeners.abort(error)
                    controller.error(error)
                }, { passive: true, signal: listeners.signal, once: true })
                ws.addEventListener("close", (event) => {
                    const error = new BetterWebSocketError("close event", { wasClean: event.wasClean, closeCode: event.code, reason: event.reason })
                    listeners.abort(error)
                    controller.error(error)
                }, { passive: true, signal: listeners.signal, once: true })
            },
            write: (chunk, controller) => {
                ws.send(chunk)
            },
            abort: (reason) => {
                listeners.abort()
                if (reason?.name === "BetterWebSocketError") {
                    const { closeCode: code = 1000, reason: reason2 } = reason;
                    ws.close(code, reason2)
                } else {
                    ws.close()
                }
            },
            close: () => {
                listeners.abort()
                ws.close()
            },
        })
        this.#ws = ws
        this.#listeners = listeners
    }
}