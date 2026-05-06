
## Goal
Install Makazi as a real native app on your phone so you can test it.

## Current status
Capacitor is already configured in this project:
- `capacitor.config.ts` exists with `appId: app.lovable.17432d3a7189414aa058083823c358d5`, `appName: makazi`, hot-reload `server.url` pointing to your Lovable preview
- `@capacitor/core`, `@capacitor/cli`, `@capacitor/ios`, `@capacitor/android` are installed (v8.3.1)

So nothing more is needed inside Lovable. What's missing is the **local build step** — Lovable's sandbox cannot build iOS/Android binaries; only your computer can. Below is exactly what to do.

## What you need on your computer

Pick the platform you want to install on:

| Phone | You need | OS required |
|---|---|---|
| iPhone | Xcode (free, App Store) + an Apple ID | macOS |
| Android | Android Studio (free) | Windows / macOS / Linux |
| Android (easiest) | Just a USB cable + "USB debugging" enabled on the phone | any OS |

Plus: Node.js 20+ and Git installed.

## Step-by-step

### 1. Get the code onto your computer
1. In Lovable, top right → **GitHub → Connect to GitHub** → create the repo.
2. On your computer:
   ```bash
   git clone https://github.com/<your-username>/<repo-name>.git
   cd <repo-name>
   npm install
   ```

### 2. Add the native platform (one-time)
```bash
# For Android:
npx cap add android

# For iPhone (Mac only):
npx cap add ios
```

### 3. Build the web bundle and sync it into the native project
```bash
npm run build
npx cap sync
```
Run `npx cap sync` again any time you `git pull` new changes from Lovable.

### 4. Run on your phone

**Android (recommended for first try — much simpler):**
1. On the phone: Settings → About phone → tap "Build number" 7 times to unlock Developer options → enable **USB debugging**.
2. Plug the phone into your computer with USB.
3. ```bash
   npx cap run android
   ```
4. Approve the "Allow USB debugging?" prompt on the phone. The app installs and launches.

Alternative (no Android Studio at all): after `npx cap sync`, the APK is at `android/app/build/outputs/apk/debug/app-debug.apk`. Email/AirDrop it to yourself, open it on the phone, allow "Install from unknown sources", install.

**iPhone:**
1. Open the project in Xcode: `npx cap open ios`
2. In Xcode, select your iPhone from the device dropdown (top bar). Plug it in via USB and trust the computer.
3. Under **Signing & Capabilities**, sign in with your Apple ID and pick your personal team.
4. Click the ▶ Play button. The app installs on your phone.
5. On the phone: Settings → General → VPN & Device Management → trust your developer certificate.

## What you'll see
Because `capacitor.config.ts` has a `server.url` pointing to your Lovable preview, the installed app **loads live from Lovable** — every change you make in Lovable shows up instantly in the app on your phone (just refresh). No rebuild required for normal UI/code changes.

If you instead want a fully offline app that ships its own bundled HTML/JS (for App Store / Play Store distribution), that's a follow-up step — let me know after you've got it running.

## Technical notes
- Capacitor 8 requires Node 20+.
- For Android: Android Studio is only needed if `npx cap run android` complains about missing SDK; the GUI is otherwise optional.
- The hot-reload `server.url` is fine for personal testing; it must be removed before App Store / Play Store submission so the binary is self-contained.
- Helpful reference: https://lovable.dev/blog/2025-03-25-the-complete-guide-to-building-mobile-apps-with-lovable
