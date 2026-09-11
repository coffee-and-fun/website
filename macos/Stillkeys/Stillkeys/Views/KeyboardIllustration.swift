import SwiftUI

/// Decorative, layout-independent artwork. It never represents or records pressed keys.
struct KeyboardIllustration: View {
    var active = false
    @Environment(\.colorScheme) private var scheme
    private let counts = [14, 14, 13, 12]

    var body: some View {
        VStack(spacing: 5) {
            ForEach(Array(counts.enumerated()), id: \.offset) { row, count in
                HStack(spacing: 6) {
                    ForEach(0..<count, id: \.self) { column in
                        key(row: row, column: column)
                    }
                }
            }
            HStack(spacing: 6) {
                key(row: 4, column: 0)
                key(row: 4, column: 1)
                key(row: 4, column: 2)
                RoundedRectangle(cornerRadius: 6)
                    .fill(active ? StillStyle.lilac.opacity(0.65) : keyColor)
                    .overlay {
                        Image(systemName: active ? "pause.fill" : "sparkle")
                            .font(.system(size: 12, weight: .semibold))
                            .foregroundStyle(StillStyle.violet)
                    }
                    .frame(maxWidth: .infinity).frame(height: 24)
                    .overlay(RoundedRectangle(cornerRadius: 6).strokeBorder(.primary.opacity(0.06)))
                key(row: 4, column: 3)
                key(row: 4, column: 4)
                key(row: 4, column: 5)
            }
        }
        .padding(12)
        .background {
            RoundedRectangle(cornerRadius: 19)
                .fill(scheme == .dark ? Color(white: 0.17) : Color(red: 0.88, green: 0.875, blue: 0.86))
                .shadow(color: .black.opacity(scheme == .dark ? 0.3 : 0.10), radius: 18, y: 12)
        }
        .overlay(RoundedRectangle(cornerRadius: 19).strokeBorder(.primary.opacity(0.08)))
        .frame(maxWidth: 470)
        .accessibilityHidden(true)
    }

    private var keyColor: Color { scheme == .dark ? Color(white: 0.24) : Color(red: 0.985, green: 0.982, blue: 0.975) }

    private func key(row: Int, column: Int) -> some View {
        RoundedRectangle(cornerRadius: 5)
            .fill(active && (column + row * 2) % 5 == 0 ? StillStyle.lilac.opacity(0.65) : keyColor)
            .frame(maxWidth: .infinity)
            .frame(height: row == 0 ? 17 : 22)
            .overlay(alignment: .bottomLeading) {
                if row > 0 {
                    Circle().fill(.primary.opacity(0.16)).frame(width: 3, height: 3).padding(6)
                }
            }
            .overlay(RoundedRectangle(cornerRadius: 5).strokeBorder(.primary.opacity(0.06)))
    }
}
