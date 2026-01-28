import BetterWebSocketError from "./BetterWebSocketError.ts"

export let createBetterWebSocketReadableStream: (ws: WebSocket) => BetterWebSocketReadableStream
export default class BetterWebSocketReadableStream extends ReadableStream<string | Uint8Array> {
    static {
        createBetterWebSocketReadableStream = (ws: WebSocket) => new BetterWebSocketReadableStream(ws)
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
                ws.binaryType = "arraybuffer"
                ws.addEventListener("message", (event) => {
                    if (typeof event.data === "string") {
                        controller.enqueue(event.data)
                    } else if (event.data instanceof ArrayBuffer) {
                        controller.enqueue(new Uint8Array(event.data))
                    } else {
                        listeners.abort()
                        controller.error(new TypeError(`${event.data} is not a ${"string | ArrayBuffer"}`))
                    }
                }, { passive: true, signal: listeners.signal })
                ws.addEventListener("close", (event) => {
                    const error = new BetterWebSocketError("close event", { wasClean: event.wasClean, closeCode: event.code, reason: event.reason })
                    listeners.abort(error)
                    controller.error(error)
                }, { passive: true, signal: listeners.signal, once: true })
            },
            cancel: (reason) => {
                listeners.abort()
                if (reason?.name === "WebSocketError") {
                    const { closeCode: code = 1000, reason: reason2 = "" } = reason;
                    ws.close(code, reason2)
                } else {
                    ws.close()
                }
            }
        })
        this.#ws = ws
        this.#listeners = listeners
    }
}