# Better `WebSocketStream`

💡 A more ergonomic `WebSocketStream` interface

## Installation

## Usage

```js
import BetterWebSocketStream from "@jcbhmr/better-web-socket-stream"

const wss = await BetterWebSocketStream.open("wss://echo.websocket.org");
await ReadableStream.from(["Hello!", "Alan Turing"])
    .pipeThrough(wss)
    .pipeTo(new WritableStream({
        write(chunk, controller) {
            console.log("Received chunk! %o", chunk);
        }
    }));
```
