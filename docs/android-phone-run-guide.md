# LOCATOMED Android Phone Guide (Capacitor)

This guide explains how to run LOCATOMED on a real Android phone and generate an APK for local testing (without public deployment).

## 1) Prerequisites

Install these on your laptop:

- Node.js and npm
- Android Studio (latest stable)
- JDK 17 (important)

Why JDK 17: Android Gradle plugin in this project requires Java 11+, and Java 17 is the safest choice.

## 2) One-time Project Setup

From project root:

```powershell
npm install
```

If Android platform is missing:

```powershell
npx cap add android
```

## 3) Recommended Mode for LOCATOMED: Local Server Mode

LOCATOMED uses dynamic auth/API behavior, so local server mode is currently the most reliable for phone testing.

### 3.1 Set phone-accessible URL in Capacitor config

Edit `capacitor.config.ts` and uncomment the server block:

```ts
server: {
  url: 'http://192.168.x.x:3000',
  cleartext: true,
},
```

Replace `192.168.x.x` with your laptop LAN IP.

Find your LAN IP (Windows):

```powershell
ipconfig
```

Use IPv4 address from your active Wi-Fi adapter.

### 3.2 Sync Android project for local mode

```powershell
npm run cap:sync:android:local
```

### 3.3 Start Next.js dev server for phone access

```powershell
npm run dev:host
```

### 3.4 Open Android Studio

```powershell
npm run cap:open:android
```

If open command fails, see Troubleshooting section.

## 4) Run on Real Android Device

1. On your phone, enable Developer options.
2. Enable USB debugging.
3. Connect phone by USB.
4. Accept RSA debug prompt on phone.
5. In Android Studio, choose your device and click Run.

## 5) Build APK for Testing

In Android Studio:

1. Build menu
2. Build APK(s)
3. Wait for success notification
4. Click Locate

Typical debug APK location:

- `android/app/build/outputs/apk/debug/app-debug.apk`

Install to phone with ADB:

```powershell
adb install -r android/app/build/outputs/apk/debug/app-debug.apk
```

## 6) Alternative: Build APK from Terminal

If Java and Android SDK are configured correctly:

```powershell
cd android
.\gradlew.bat assembleDebug
```

APK output:

- `android/app/build/outputs/apk/debug/app-debug.apk`

## 7) Optional Static Export Mode (Only if Needed)

Use static mode only if your app pages/routes are static-export compatible.

```powershell
npm run cap:build:android:static
npm run cap:open:android
```

Then build APK from Android Studio as above.

## 8) Daily Development Workflow

For normal LOCATOMED development:

1. Keep this running:

```powershell
npm run dev:host
```

2. After plugin/config/webDir-related changes, run:

```powershell
npm run cap:sync:android:local
```

3. Run app from Android Studio on connected phone.

## 9) Troubleshooting

### A) Android Studio does not open with Capacitor

Error like: Unable to launch Android Studio.

Fix:

1. Make sure Android Studio is installed.
2. Set environment variable `CAPACITOR_ANDROID_STUDIO_PATH` to `studio64.exe` path.

Example path:

- `C:\Program Files\Android\Android Studio\bin\studio64.exe`

Then reopen terminal and run:

```powershell
npm run cap:open:android
```

### B) Gradle says Java 8 / requires Java 11+

Install JDK 17 and set `JAVA_HOME` to JDK 17 path, then reopen terminal.

Verify:

```powershell
java -version
```

It should show Java 17 (or at least 11+).

### C) Phone cannot load local server URL

Check all of these:

- Phone and laptop are on same Wi-Fi
- Correct LAN IP in `capacitor.config.ts`
- Port 3000 is open in firewall
- `npm run dev:host` is running
- Test URL in phone browser first (`http://YOUR_IP:3000`)

### D) Blank screen

- Recheck server URL and cleartext config
- Sync again: `npm run cap:sync:android:local`
- Clean/rebuild in Android Studio
- Watch Android Studio Logcat for WebView/network errors

## 10) Fast Command Summary

### Local mode (recommended)

```powershell
npm run cap:sync:android:local
npm run dev:host
npm run cap:open:android
```

### Build APK via terminal

```powershell
cd android
.\gradlew.bat assembleDebug
```

### APK file

- `android/app/build/outputs/apk/debug/app-debug.apk`
