import BetterWebSocketStream from "../src/index.ts"
import test from "node:test"

function readableStreamFrom(array: string[]): ReadableStream<string> {
    return new ReadableStream({
        start(controller) {
            for (const x of array) {
                controller.enqueue(x)
            }
        }
    })
}

test("echo.websocket.org", async () => {
    const wss = await BetterWebSocketStream.open("wss://echo.websocket.org");
    await readableStreamFrom(["Hello!", "Alan Turing"])
        .pipeThrough(wss)
        .pipeTo(new WritableStream({
            write(chunk, controller) {
                console.log("Received chunk! %o", chunk);
            }
        }));
})
