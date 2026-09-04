import { io } from "socket.io-client";
import { API_ORIGIN } from "../config";

const socket = io(API_ORIGIN, {
    autoConnect: false
});

/*
 * Resolve true only once the socket is actually connected.
 *
 * Why this exists: socket.emit() on a disconnected socket doesn't
 * throw or reject - it just silently fails to reach the server (and
 * this app calls socket.disconnect() every time the Chat screen
 * unmounts, which drops anything still queued). That mismatch - the
 * UI thinks a message went out, the server never saw it - is what
 * makes messages seem to "disappear" the next time a conversation is
 * reopened and reloaded from the server. Callers should await this
 * before emitting anything that matters, and skip the emit (warning
 * the user instead) if it resolves false.
 */
export function ensureConnected(timeoutMs = 4000) {
    return new Promise((resolve) => {
        if (socket.connected) {
            resolve(true);
            return;
        }

        let settled = false;

        const finish = (result) => {
            if (settled) return;
            settled = true;
            clearTimeout(timer);
            socket.off("connect", onConnect);
            resolve(result);
        };

        const onConnect = () => finish(true);
        const timer = setTimeout(() => finish(false), timeoutMs);

        socket.on("connect", onConnect);

        // Safe even if it's already mid-reconnect.
        socket.connect();
    });
}

export default socket;