# ChatSphere - Android build

Your React client is now wrapped as a native Android app (via Capacitor)
with the exact same UI and functionality. The server is untouched and
keeps running where it already does - the app talks to it over the
network, same as your web version.

**I could not compile the final .apk/.aab file myself** - this sandbox
has no network access to Google's Android SDK or Gradle's distribution
servers (verified directly, blocked with `host_not_allowed`). Everything
up to that final compile step is done and ready to go. Two ways to get
the actual installable file, pick one:


## Option A - GitHub Actions (no installs, ~5 minutes)

1. Push this whole folder to a new GitHub repo.
2. Add 4 repo secrets so the build gets signed - see
   `keystore/keystore-info.txt` for exact values and steps
   (Settings → Secrets and variables → Actions).
3. Go to the "Actions" tab → run "Build Android APK / AAB" (or just
   push to `main`, it runs automatically).
4. Download the `release-build` artifact when it finishes. Inside:
   - **`app-release.aab`** → upload this to Google Play Console
   - **`app-release.apk`** → install this directly on a phone to test

   (A `debug-build` artifact with a test APK is produced on every run
   even before you add the secrets, so you can try the app immediately.)


## Option B - Android Studio, on your own machine

1. Install [Android Studio](https://developer.android.com/studio) (it
   downloads the Android SDK automatically on first launch).
2. Open the `client/android` folder as a project.
3. Let Gradle sync (first sync takes a few minutes).
4. Build → Generate Signed App Bundle / APK → pick **Android App
   Bundle** → it will already find the keystore at
   `client/android/app/chatsphere-release.keystore` (password in
   `keystore/keystore-info.txt`).
5. The signed `.aab` lands in `client/android/app/release/`.

If you'd rather just try it on your phone first: Run ▶ with a device
connected/emulator running installs a debug build directly, no signing
needed.


## Uploading to Google Play

- Play Console requires the **`.aab`** (Android App Bundle) format for
  new apps, not a raw `.apk` - that's what `bundleRelease` /
  "Generate Signed App Bundle" above produces.
- Package name: `com.chatsphere.app` — **this is permanent once
  published**, cannot change later. If you want something different,
  edit it now in `client/capacitor.config.ts`, `client/android/app/build.gradle`
  (`applicationId` and `namespace`), and the folder path
  `client/android/app/src/main/java/com/chatsphere/app/`, before your
  first upload.
- 512×512 hi-res store icon is ready at `store_assets/play_store_icon_512x512.png`.
- You'll still need to fill in the Play Console listing itself
  (screenshots, description, privacy policy URL, content rating, data
  safety form) - none of that was part of "convert the app," so it's
  not included here.
- Per your request, **no Google Play Billing was set up.** The
  donation feature works exactly as it already did in your code
  (`server/utils/googlePlay.js` is present but was never wired into a
  live route in your original server - I didn't add anything there).


## What I actually changed, and why

Only one type of change, applied consistently, nothing else touched:

**Fixed 16 hardcoded `http://localhost:3000` URLs across 13 files**
(image/file/voice uploads, avatars, the donor leaderboard) to point at
your real deployed server instead. On a phone, "localhost" means the
phone itself, not your server - so without this fix, images and
uploads would have silently failed to load in the installed app (this
was very likely already broken on your live GitHub Pages deployment
too, for the same reason - worth checking). Everything now routes
through one place, `client/src/config.js`:

```js
export const API_ORIGIN = "https://my-chat-app-api-630a.onrender.com";
```

That's the same URL your socket connection already used. If this isn't
your current production server, update that one line and rebuild - no
other file needs to change.

Every other file is exactly what you uploaded. The native Android
scaffolding (permissions, icons, signing, `MainActivity.java`) is all
new/additive - it configures the wrapper app around your code, it
doesn't touch your React source or UI.


## Two things worth knowing (not fixed, by design - you said don't change function)

- **Desktop-style notifications** (`new Notification(...)` in
  `Chat.jsx`) don't work inside an Android WebView - browsers support
  it, WebViews generally don't. It's feature-detected
  (`"Notification" in window`), so it just silently does nothing
  rather than crashing. Real Android push notifications would need a
  native plugin added (e.g. `@capacitor/local-notifications`) - happy
  to add that as a follow-up if you want it, didn't want to add an
  untested new dependency to this build without asking first.
- **A few `window.location.href = "/chat"` style redirects** (in
  `UserList.jsx`, `GroupInfo.jsx`) skip the `#` your app's HashRouter
  needs, so they'd land on a blank/error page instead of navigating.
  This looks like a pre-existing bug that likely already 404s on your
  live GitHub Pages site the same way - I left it as-is since you
  asked me not to change function, but flagging it since it'll be more
  noticeable in the app (a stuck blank screen vs. a browser 404 page).
  Easy one-line-per-spot fix if you want it.


## Project layout

```
client/           Your React app + the Android project (client/android/)
server/           Your server, untouched (keeps running wherever it runs now)
keystore/         Signing key for Play Store releases - back this up somewhere safe
store_assets/     512x512 icon for the Play Console listing
.github/workflows/build-android.yml   Cloud build (Option A above)
```
