# Stillkeys

A small native Mac utility for a quiet keyboard-cleaning break. Built with Swift 6, SwiftUI, and AppKit. No third-party packages, network clients, accounts, analytics, or saved keystrokes.

## Open in Xcode

Open **Stillkeys.xcodeproj**, select a scheme, and run on **My Mac**. Xcode 26.6 was used for development. The deployment target is macOS 14.0; older supported systems still need device testing before release.

| Scheme | Purpose | Permission | Distribution |
| --- | --- | --- | --- |
| Stillkeys | Foreground cleaning screen; consumes its own typing events and uses public presentation options to disable Command-Tab | None | Sandboxed Mac App Store candidate |
| Stillkeys Direct | Session-level keyboard event suppression using a public Core Graphics event tap | Accessibility | Direct Developer ID distribution; not the Mac App Store |

**Neither edition electrically disables the keyboard or blocks Power, Touch ID, or every system-controlled action.** The App Store edition has materially weaker protection: global shortcuts and hardware keys may still reach macOS. Store copy states this clearly. The Direct scheme is not a workaround to upload to the App Store.

The current default retains the requested App Store route. Both editions are provided because the distribution decision changes the core feature. No App Store account record, price, sale, upload, or public release has been created.

## Local build and checks

```sh
export DEVELOPER_DIR=/Applications/Xcode.app/Contents/Developer
xcodebuild -project Stillkeys.xcodeproj -scheme Stillkeys \
  -derivedDataPath DerivedData CODE_SIGN_IDENTITY=- CODE_SIGN_STYLE=Manual build
xcodebuild -project Stillkeys.xcodeproj -scheme Stillkeys \
  -derivedDataPath DerivedData -destination 'platform=macOS' \
  CODE_SIGN_IDENTITY=- CODE_SIGN_STYLE=Manual -only-testing:StillkeysTests test
xcodebuild -project Stillkeys.xcodeproj -scheme 'Stillkeys Direct' \
  -derivedDataPath DerivedData-Direct CODE_SIGN_IDENTITY=- CODE_SIGN_STYLE=Manual build
```

Local ad-hoc signing is for development. Select your actual Apple Developer team in Signing & Capabilities for distribution. The project does not embed an assumed team ID or credentials. The Direct edition uses a separate bundle identifier to keep its permission identity distinct.

## How it behaves

1. Choose 30 seconds, 1, 2, or 5 minutes.
2. Click Start. Interception begins immediately; a three-second preparation countdown follows.
3. The cleaning screen covers attached displays. Mouse and trackpad remain available.
4. Click Finish, continuously hold Escape for two seconds, or let the timer expire.
5. Focus loss, sleep, session switching, or a real display configuration change ends the session. In Direct, a disabled tap, revoked permission, or Secure Input also ends it.

Command-Option-Escape is preserved for macOS Force Quit. No startup item, persistent helper, root access, driver, private API, or background monitor is installed. Closing or quitting restores input. macOS removes an event tap when its process exits. A tap timeout is treated as failure and is never silently re-enabled.

## Project map

- `Stillkeys/Core`: monotonic-clock session state and a lock-protected input gate.
- `Stillkeys/Services`: independent foreground and Direct blocking implementations.
- `Stillkeys/Views`: shared production SwiftUI views, original keyboard artwork, guide, and privacy panel.
- `StillkeysTests`: safety and concurrency tests.
- `StillkeysUITests`: additional Xcode UI test cases; see the validation report for executed coverage.
- `Store`: listing copy, metadata, four 2880 × 1800 screenshots, privacy copy, and review notes.
- `Docs`: feasibility evidence, design decisions, validation, and release steps.
- `Scripts`: reproducible Xcode project and icon generation, screenshot export, and store-asset validation.

Screenshots use the production SwiftUI views with deterministic example session state. Export mode is compiled only into Debug builds and cannot start keyboard interception. Artwork shows the sandboxed edition. Source code and visual assets are original to this project apart from Apple-provided system fonts and SF Symbols.

## Release status

Read `Docs/VALIDATION.md` and `Docs/RELEASE.md` before distributing. App Review approval, legal availability of the working name, signing, notarization, hardware validation, and award/editorial selection have not been obtained. Apple recommends shutting down and disconnecting devices before cleaning; the app’s guide links to those instructions.
