# Complete the Guideline 2.1 information request

The reply draft is `APP-REVIEW-REPLY.txt`. Replace its bracketed recording paragraph before sending. Put the same six-part information in App Store Connect's App Review Information Notes field. This is an information request; the message itself does not identify a specific code defect.

## Recording still required

No verified demonstration video was produced during the September 11 recording attempt. Screen Studio's recording UI was unreliable through automation. An incomplete recorder project was preserved rather than deleted; do not submit it as demonstration evidence.

Record the submitted Mac App Store build on a physical Mac running the latest macOS available for that Mac. The local Mac was running macOS 26.6.2, Apple's latest published macOS release checked on September 11, 2026. Check again if recording later. This is a Mac app: an iPhone recording or simulator recording would not demonstrate its normal operation.

Use Shift-Command-5 to open macOS Screenshot, choose Record Entire Screen, and set Microphone to None. Close private windows and prevent private notifications appearing before recording. Start recording with Stillkeys closed, then launch it. Do not record a mockup, screenshot slideshow, or the Direct edition.

Suggested continuous demonstration, approximately 90 seconds:

1. Launch Stillkeys and show its home window.
2. Choose 30 seconds and click **Start cleaning screen**. Show the three-second preparation and active countdown.
3. Press ordinary letter keys and Return. Show that the cleaning screen stays active. Briefly explain in narration, if used, that these input events are being discarded; do not imply hardware controls are disabled.
4. Click **Finish cleaning** with the mouse or trackpad and show the completion screen.
5. Click **Back to Stillkeys**, start another 30-second session, and allow it to expire. Show the automatic completion screen.
6. Open **Cleaning guide** and **Private by design**. Show the limitations and local-only operation.
7. Stop recording using the menu-bar stop control after the cleaning screen has ended. Watch the recording before submitting.

Also test a physical two-second Escape hold before submission. It may be demonstrated in an additional short session. Do not type passwords or private text into the demonstration.

Use a reviewer-accessible link with no login requirement, or attach the recording if App Store Connect accepts its format and size. Confirm the link works while signed out. State the physical Mac model, macOS version, and app version/build. Do not write "attached" unless the attachment has actually been added.

## Build and physical-Mac verification

The local signed archive is `Stillkeys 9-10-26, 11.14 PM.xcarchive` in Xcode's September 10 archives folder. Its bundle identifier is `com.coffeeandfun.stillkeys`, version **1.0.0**, build **1**. The app was copied unchanged from that archive to `build/Review Recording/Stillkeys.app`; its signature verified successfully. Confirm this is the build selected in App Store Connect before using it for the recording. Matching version/build metadata alone does not establish which binary was uploaded.

On September 11, this copied archived app was launched on the physical Apple-silicon Mac (model identifier Mac16,8), running macOS 26.6.2. The following checks passed through native UI automation:

- Launch and 30-second session start.
- Ordinary typing, Return, and Command-Q left the cleaning session active.
- Mouse activation of Finish cleaning restored the completion screen immediately.
- A brief Escape tap left the session active.
- Automatic completion after the 30-second timer restored the normal home window.

These checks do not establish every supported hardware/OS combination. See `Docs/VALIDATION.md` for the existing test results and remaining physical-device checks. The Direct edition's testing requirements do not apply to this sandboxed App Store submission.

## App Store Connect

1. Finish physical-device QA and the recording.
2. Replace the recording placeholder in `APP-REVIEW-REPLY.txt` and `REVIEW-NOTES.md` with the actual evidence details.
3. Add the six-part information to **App Review Information → Notes**, then save.
4. Open the unresolved review message, choose **Reply to App Review**, paste the reply, and add the recording attachment or link.

Do not claim that the app disables every key. Its current sandboxed implementation captures typing in its foreground screen and restricts some process switching. A build change should be based on a discovered problem; this request alone does not require uploading a new binary.

References: [Apple's reply instructions](https://developer.apple.com/help/app-store-connect/manage-submissions-to-app-review/reply-to-app-review-messages/), [macOS screen recording](https://support.apple.com/en-au/guide/mac-help/mh26782/mac), [Apple security releases](https://support.apple.com/en-us/100100).
