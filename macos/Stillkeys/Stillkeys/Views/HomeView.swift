import SwiftUI

struct HomeView: View {
    @Bindable var session: CleaningSession

    var body: some View {
        ZStack {
            PaperBackground()
            #if DEBUG
            if session.isPreview {
                // ImageRenderer cannot draw AppKit's scroll container. Render the exact
                // same content at the app's default viewport size for the store export.
                homeContent.frame(width: 740, height: 760)
            } else { adaptiveContent }
            #else
            adaptiveContent
            #endif
        }
        .frame(minWidth: 660, idealWidth: 740, minHeight: 640, idealHeight: 760)
        .sheet(isPresented: $session.showingGuide) { GuideView() }
        .sheet(isPresented: $session.showingPrivacy) { PrivacyView() }
        .alert("Couldn’t start cleaning", isPresented: Binding(get: { session.errorMessage != nil }, set: { if !$0 { session.errorMessage = nil } })) {
            Button("OK") { session.errorMessage = nil }
        } message: { Text(session.errorMessage ?? "") }
    }

    private var adaptiveContent: some View {
        GeometryReader { geometry in
            ScrollView {
                homeContent.frame(minHeight: geometry.size.height)
            }.scrollIndicators(.hidden)
        }
    }

    private var homeContent: some View {
        VStack(spacing: 0) {
            header
            Spacer(minLength: 10)
            if session.policy.phase == .finished { completion } else { introduction }
            Spacer(minLength: 10)
            footer
        }
        .padding(.horizontal, 40).padding(.top, 16).padding(.bottom, 20)
        .frame(maxWidth: .infinity)
    }

    private var header: some View {
        HStack(spacing: 11) {
            BrandMark(size: 31)
            Text("Stillkeys").font(.system(.title3, design: .rounded, weight: .bold))
            Spacer()
            Button { session.showingGuide = true } label: {
                Label("Cleaning guide", systemImage: "questionmark.circle").labelStyle(.iconOnly)
                    .font(.system(size: 18)).frame(width: 34, height: 34)
            }
            .buttonStyle(.plain).help("Cleaning guide")
            .accessibilityIdentifier("cleaningGuide")
        }
    }

    private var introduction: some View {
        VStack(spacing: 18) {
            VStack(spacing: 14) {
                Text("A LITTLE CARE FOR YOUR MAC")
                    .font(.system(size: 10, weight: .semibold)).tracking(2.5).foregroundStyle(.secondary)
                Text("A little pause.\nA cleaner keyboard.")
                    .font(.system(size: 40, weight: .semibold, design: .rounded))
                    .tracking(-1.6).lineSpacing(-1).multilineTextAlignment(.center)
                    .fixedSize(horizontal: false, vertical: true)
                    .accessibilityAddTraits(.isHeader)
                Text(CleaningSession.isDirect
                     ? "Pause keyboard input. Give your keys a little care."
                     : "Give stray keystrokes somewhere quiet to land.")
                    .font(.system(size: 15)).foregroundStyle(.secondary)
            }
            KeyboardIllustration().padding(.vertical, 8)
            VStack(spacing: 12) {
                Text("TIME TO TIDY").font(.system(size: 10, weight: .semibold)).tracking(2).foregroundStyle(.secondary)
                HStack(spacing: 4) {
                    ForEach(SessionPolicy.allowedDurations, id: \.self) { duration in
                        Button { session.selectedDuration = duration } label: {
                            Text(duration == 30 ? "30 sec" : "\(duration / 60) min")
                                .font(.system(size: 13, weight: session.selectedDuration == duration ? .semibold : .regular))
                                .frame(width: 69, height: 30)
                                .background(session.selectedDuration == duration ? StillStyle.lilac.opacity(0.3) : .clear, in: Capsule())
                        }
                        .buttonStyle(.plain)
                        .accessibilityAddTraits(session.selectedDuration == duration ? [.isSelected] : [])
                        .accessibilityLabel(duration == 30 ? "30 seconds" : duration == 60 ? "1 minute" : "\(duration / 60) minutes")
                    }
                }
                .padding(4).background(.primary.opacity(0.045), in: Capsule())
                .accessibilityElement(children: .contain).accessibilityLabel("Cleaning duration")
                .accessibilityIdentifier("durationPicker")
            }
            VStack(spacing: 12) {
                if CleaningSession.isDirect && !session.permissionGranted {
                    Button { session.requestPermission() } label: {
                        Label("Allow keyboard blocking", systemImage: "hand.raised")
                    }.buttonStyle(PrimaryActionStyle())
                    Button("Check access again") { session.refreshPermission() }.buttonStyle(.link)
                } else {
                    Button { session.start() } label: {
                        Label(CleaningSession.isDirect ? "Pause keyboard" : "Start cleaning screen", systemImage: "sparkles")
                    }
                    .buttonStyle(PrimaryActionStyle())
                    .accessibilityIdentifier("startCleaning")
                    .keyboardShortcut(.return, modifiers: [])
                }
                Text("Stops automatically. Finish anytime with your mouse.")
                    .font(.system(size: 12)).foregroundStyle(.secondary)
            }
        }
    }

    private var completion: some View {
        VStack(spacing: 25) {
            Image(systemName: session.policy.endReason == .interrupted || session.policy.endReason == .unavailable ? "pause.circle" : "checkmark.circle")
                .font(.system(size: 48, weight: .light)).foregroundStyle(StillStyle.violet)
            Text(completionTitle)
                .font(.system(size: 40, weight: .semibold, design: .rounded)).tracking(-1.2)
                .multilineTextAlignment(.center).accessibilityAddTraits(.isHeader)
            Text(completionMessage).font(.body).foregroundStyle(.secondary).multilineTextAlignment(.center).frame(maxWidth: 430)
            KeyboardIllustration().padding(.vertical, 15)
            Button("Back to Stillkeys") { session.reset() }
                .buttonStyle(PrimaryActionStyle()).accessibilityIdentifier("backToStart")
        }
    }

    private var completionTitle: LocalizedStringKey {
        switch session.policy.endReason {
        case .interrupted, .unavailable: "Your keyboard is available."
        case .timer: "Time’s up. All yours."
        default: "A fresh start."
        }
    }

    private var completionMessage: LocalizedStringKey {
        switch session.policy.endReason {
        case .interrupted: "The session ended because your Mac changed focus, display, or sleep state."
        case .unavailable: "macOS interrupted keyboard blocking, so Stillkeys ended the session. Check access before trying again."
        case .timer: "The cleaning timer has ended. Your keyboard is ready when you are."
        default: "Cleaning screen off. Back to whatever’s next."
        }
    }

    private var footer: some View {
        VStack(spacing: 16) {
            Divider()
            Text(CleaningSession.isDirect
                 ? "Power, Touch ID, and some system controls stay active."
                 : "Captures typing while this screen is active. Hardware keys and some system shortcuts stay active.")
                .font(.system(size: 11)).foregroundStyle(.secondary).multilineTextAlignment(.center)
                .frame(maxWidth: 470).fixedSize(horizontal: false, vertical: true)
            HStack {
                Button { session.showingPrivacy = true } label: {
                    Label("Private by design", systemImage: "hand.raised")
                }.buttonStyle(.plain).accessibilityIdentifier("privacyButton")
                Spacer()
                Text("Made by Coffee & Fun")
            }.font(.system(size: 11)).foregroundStyle(.secondary)
        }
    }
}
