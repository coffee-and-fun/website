import SwiftUI

struct GuideView: View {
    @Environment(\.dismiss) private var dismiss
    var body: some View {
        VStack(alignment: .leading, spacing: 24) {
            HStack { BrandMark(); Spacer(); Button("Done") { dismiss() }.keyboardShortcut(.cancelAction) }
            Text("A little care goes a long way.")
                .font(.system(size: 28, weight: .semibold, design: .rounded)).accessibilityAddTraits(.isHeader)
            guideRow("1", "Choose a little time", "Pick 30 seconds, 1, 2, or 5 minutes. The cleaning screen starts immediately, with three seconds to get ready.")
            guideRow("2", "Know what stays available", CleaningSession.isDirect
                     ? "Stillkeys pauses keyboard events macOS lets it intercept. Power, Touch ID, some hardware controls, and protected system interfaces remain available. Your mouse and trackpad work normally."
                     : "Stillkeys catches typing in its foreground screen and disables Command-Tab during the session. It does not turn off your keyboard. Power, Touch ID, media keys, and some system shortcuts remain available.")
            guideRow("3", "Finish whenever you’re ready", "Click Finish cleaning, hold Escape for two seconds, or let the timer end. Switching away, sleeping, or changing displays ends the session. Command-Option-Escape remains available for Force Quit.")
            Divider()
            VStack(alignment: .leading, spacing: 8) {
                Label("Follow your keyboard’s cleaning instructions", systemImage: "info.circle").font(.headline)
                Text("Apple recommends shutting down and disconnecting power before cleaning. Stillkeys does not replace those steps or make liquid cleaning safe.")
                    .font(.callout).foregroundStyle(.secondary)
                Link("Read Apple’s cleaning guide ↗", destination: URL(string: "https://support.apple.com/103258")!)
                    .font(.callout)
            }
        }
        .padding(32).frame(width: 550).fixedSize(horizontal: false, vertical: true)
    }

    private func guideRow(_ number: String, _ title: LocalizedStringKey, _ text: LocalizedStringKey) -> some View {
        HStack(alignment: .top, spacing: 15) {
            Text(number).font(.system(.body, design: .rounded, weight: .semibold))
                .frame(width: 29, height: 29).background(StillStyle.lilac.opacity(0.2), in: Circle()).accessibilityHidden(true)
            VStack(alignment: .leading, spacing: 5) {
                Text(title).font(.headline)
                Text(text).font(.callout).foregroundStyle(.secondary).fixedSize(horizontal: false, vertical: true)
            }
        }
    }
}

struct PrivacyView: View {
    @Environment(\.dismiss) private var dismiss
    var body: some View {
        VStack(alignment: .leading, spacing: 23) {
            HStack { Image(systemName: "hand.raised").font(.system(size: 32)).foregroundStyle(StillStyle.violet); Spacer(); Button("Done") { dismiss() }.keyboardShortcut(.cancelAction) }
            Text("Your keys. Your business.")
                .font(.system(size: 29, weight: .semibold, design: .rounded)).accessibilityAddTraits(.isHeader)
            Text("Stillkeys works entirely on your Mac.").font(.title3)
            Label("No keystroke recording", systemImage: "keyboard")
            Label("No accounts, ads, or analytics", systemImage: "person.crop.circle.badge.checkmark")
            Label("No network requests from the app", systemImage: "wifi.slash")
            Divider()
            Text("During a session, Stillkeys discards keyboard events and checks only whether Escape is held so you can finish. It does not read typed text, save key history, or send input anywhere. Your duration choice lasts only until you quit.")
                .font(.callout).foregroundStyle(.secondary).fixedSize(horizontal: false, vertical: true)
            if CleaningSession.isDirect {
                Text("The Direct edition needs Accessibility permission to block keyboard events across apps. You can revoke access in System Settings at any time.")
                    .font(.callout).foregroundStyle(.secondary)
            }
            Text("Links open in your browser or mail app, which have their own privacy practices.")
                .font(.caption).foregroundStyle(.secondary)
            Button("Contact Coffee & Fun ↗") {
                NSWorkspace.shared.open(URL(string: "mailto:hello@coffeeandfun.com?subject=Stillkeys")!)
            }.buttonStyle(.plain).foregroundStyle(StillStyle.violet).accessibilityAddTraits(.isLink)
        }
        .padding(32).frame(width: 500).fixedSize(horizontal: false, vertical: true)
    }
}
