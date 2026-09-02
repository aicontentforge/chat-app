/*
 * Centralises reading/writing the logged-in user from
 * localStorage.
 *
 * Why this exists:
 * App.jsx used to read `localStorage.getItem("user")` once,
 * into a plain variable, when it first mounted. React Router
 * navigation does NOT remount App.jsx, so that variable never
 * updated again for the lifetime of the tab. That meant: as
 * soon as you registered/logged in and got redirected through
 * a guarded route (e.g. ProfileSetup finishing and sending you
 * to "/"), App.jsx was still checking the STALE value it read
 * before you logged in - so it looked logged out and bounced
 * you back to /login even though localStorage was correct.
 *
 * setStoredUser()/clearStoredUser() below fire a same-tab
 * "auth-changed" event (a plain `storage` event only fires in
 * *other* tabs, never the one that made the change) so App.jsx
 * can re-check localStorage and re-render immediately.
 */

const AUTH_EVENT = "chatsphere:auth-changed";

export function getStoredUser() {

    try {

        const raw = localStorage.getItem("user");

        return raw ? JSON.parse(raw) : null;

    } catch {

        return null;

    }

}

export function setStoredUser(user) {

    localStorage.setItem("user", JSON.stringify(user));

    window.dispatchEvent(new Event(AUTH_EVENT));

}

export function clearStoredUser() {

    localStorage.removeItem("user");

    window.dispatchEvent(new Event(AUTH_EVENT));

}

/*
 * Subscribe to auth changes, whether they happened in this tab
 * (AUTH_EVENT) or another tab (native `storage` event).
 * Returns an unsubscribe function.
 */
export function onAuthChange(callback) {

    window.addEventListener(AUTH_EVENT, callback);
    window.addEventListener("storage", callback);

    return () => {

        window.removeEventListener(AUTH_EVENT, callback);
        window.removeEventListener("storage", callback);

    };

}
