import SwiftUI

enum StillStyle {
    static let violet = Color(red: 0.43, green: 0.32, blue: 0.76)
    static let lilac = Color(red: 0.77, green: 0.72, blue: 0.95)
    static let mint = Color(red: 0.67, green: 0.86, blue: 0.75)
    static let corner: CGFloat = 22
}

struct PaperBackground: View {
    @Environment(\.colorScheme) private var scheme
    var body: some View {
        (scheme == .dark ? Color(red: 0.075, green: 0.073, blue: 0.09) : Color(red: 0.97, green: 0.965, blue: 0.95))
            .ignoresSafeArea()
    }
}

struct BrandMark: View {
    var size: CGFloat = 38
    var body: some View {
        ZStack(alignment: .topTrailing) {
            RoundedRectangle(cornerRadius: size * 0.26)
                .fill(StillStyle.lilac.gradient)
                .overlay {
                    Image(systemName: "pause.fill")
                        .font(.system(size: size * 0.35, weight: .bold))
                        .foregroundStyle(Color(red: 0.21, green: 0.14, blue: 0.41))
                }
            Image(systemName: "sparkle")
                .font(.system(size: size * 0.36, weight: .semibold))
                .foregroundStyle(StillStyle.violet)
                .offset(x: size * 0.13, y: -size * 0.12)
        }
        .frame(width: size, height: size)
        .accessibilityHidden(true)
    }
}

struct PrimaryActionStyle: ButtonStyle {
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .font(.system(.body, design: .rounded, weight: .semibold))
            .padding(.horizontal, 26).padding(.vertical, 14)
            .frame(minHeight: 48)
            .foregroundStyle(.white)
            .background(StillStyle.violet, in: Capsule())
            .overlay(Capsule().strokeBorder(.white.opacity(0.14)))
            .opacity(configuration.isPressed ? 0.8 : 1)
            .scaleEffect(configuration.isPressed && !reduceMotion ? 0.98 : 1)
    }
}

struct StatusLabel: View {
    let text: LocalizedStringKey
    let symbol: String
    var body: some View {
        Label(text, systemImage: symbol)
            .font(.system(.caption, design: .rounded, weight: .semibold))
            .padding(.horizontal, 13).padding(.vertical, 8)
            .background(StillStyle.lilac.opacity(0.17), in: Capsule())
    }
}
