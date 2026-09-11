import SwiftUI

struct CleaningView: View {
    @Bindable var session: CleaningSession

    var body: some View {
        GeometryReader { geometry in
            ZStack {
                PaperBackground()
                VStack(spacing: geometry.size.height < 850 ? 12 : 22) {
                    HStack(spacing: 9) {
                        BrandMark(size: 26)
                        Text("Stillkeys").font(.system(.body, design: .rounded, weight: .semibold))
                    }
                    Spacer(minLength: 0)
                    StatusLabel(text: session.policy.phase == .preparing ? "Cleaning screen on" : "A quiet moment for your keys", symbol: "pause.circle.fill")
                    Text(session.policy.phase == .preparing ? "Take a breath." : "A little room to clean.")
                        .font(.system(size: 38, weight: .semibold, design: .rounded)).tracking(-1.2)
                        .multilineTextAlignment(.center).accessibilityAddTraits(.isHeader)
                    VStack(spacing: 0) {
                        Text(session.policy.phase == .preparing ? "\(session.remaining)" : session.timerText)
                            .font(.system(size: geometry.size.height < 850 ? 82 : 112, weight: .light, design: .rounded))
                            .monospacedDigit().tracking(-4)
                            .accessibilityLabel(session.policy.phase == .preparing ? "Starting in \(session.remaining) seconds" : "\(session.remaining) seconds remaining")
                            .accessibilityIdentifier("cleaningTimer")
                        Text(session.policy.phase == .preparing ? "Your session is about to begin" : "until your keyboard is available again")
                            .font(.system(size: 13)).foregroundStyle(.secondary)
                    }
                    KeyboardIllustration(active: true).frame(maxWidth: 410).padding(.vertical, geometry.size.height < 850 ? 0 : 12)
                    VStack(spacing: 13) {
                        Button { session.finish() } label: {
                            Label("Finish cleaning", systemImage: "checkmark")
                        }
                        .buttonStyle(PrimaryActionStyle()).accessibilityIdentifier("finishCleaning")
                        HStack(spacing: 6) {
                            Text("Or hold")
                            Text("esc").font(.system(size: 11, weight: .medium, design: .monospaced))
                                .padding(.horizontal, 7).padding(.vertical, 4)
                                .background(.primary.opacity(0.06), in: RoundedRectangle(cornerRadius: 5))
                            Text("for 2 seconds")
                        }.font(.system(size: 12)).foregroundStyle(.secondary)
                        ProgressView(value: session.escapeProgress)
                            .tint(StillStyle.violet).frame(width: 170).opacity(session.escapeProgress > 0 ? 1 : 0)
                            .accessibilityLabel("Hold Escape to finish").accessibilityValue("\(Int(session.escapeProgress * 100)) percent")
                    }
                    Spacer(minLength: 0)
                    Text("Mouse and trackpad stay available. Avoid Power and Touch ID.")
                        .font(.system(size: 11)).foregroundStyle(.secondary).multilineTextAlignment(.center)
                }
                .padding(.horizontal, 32).padding(.vertical, 32)
                .frame(maxWidth: .infinity, maxHeight: .infinity)
            }
        }
    }
}
