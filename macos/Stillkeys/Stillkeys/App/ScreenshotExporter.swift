#if DEBUG
import AppKit
import SwiftUI

/// Exports real application views with deterministic session state. This cannot enable interception.
/// Only included in Debug builds, never shipped to customers.
@MainActor
enum ScreenshotExporter {
    static func export() throws {
        let output = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask)[0]
            .appendingPathComponent("Stillkeys-Screenshots", isDirectory: true)
        try FileManager.default.createDirectory(at: output, withIntermediateDirectories: true)
        let scenes: [(String, AnyView, NSAppearance.Name)] = [
            ("01-a-little-pause", AnyView(StoreScene(kind: .home)), .aqua),
            ("02-time-to-tidy", AnyView(StoreScene(kind: .cleaning)), .aqua),
            ("03-private-by-design", AnyView(StoreScene(kind: .privacy)), .aqua),
            ("04-a-quieter-evening", AnyView(StoreScene(kind: .dark)), .darkAqua)
        ]
        for (name, view, appearance) in scenes {
            let renderer = ImageRenderer(content: view.environment(\.colorScheme, appearance == .darkAqua ? .dark : .light))
            renderer.proposedSize = ProposedViewSize(width: 1440, height: 900)
            renderer.scale = 2
            renderer.isOpaque = true
            guard let cgImage = renderer.cgImage else { throw CocoaError(.fileWriteUnknown) }
            let bitmap = NSBitmapImageRep(cgImage: cgImage)
            guard let data = bitmap.representation(using: .png, properties: [:]) else { throw CocoaError(.fileWriteUnknown) }
            try data.write(to: output.appendingPathComponent(name + ".png"))
        }
        print("Screenshots exported to \(output.path)")
    }
}

private enum StoreSceneKind { case home, cleaning, privacy, dark }

private struct StoreScene: View {
    let kind: StoreSceneKind
    private var dark: Bool { kind == .dark }

    var body: some View {
        HStack(spacing: 52) {
            VStack(alignment: .leading, spacing: 26) {
                HStack(spacing: 13) {
                    BrandMark(size: 43)
                    Text("Stillkeys").font(.system(size: 28, weight: .bold, design: .rounded))
                }
                Spacer()
                Text(eyebrow).font(.system(size: 12, weight: .semibold)).tracking(3).foregroundStyle(.secondary)
                Text(headline).font(.system(size: 61, weight: .semibold, design: .rounded)).tracking(-2.5).lineSpacing(-2)
                    .fixedSize(horizontal: false, vertical: true)
                Text(detail).font(.system(size: 21)).foregroundStyle(.secondary).lineSpacing(5)
                    .fixedSize(horizontal: false, vertical: true)
                Spacer()
                Label(footnote, systemImage: dark ? "moon" : "macwindow")
                    .font(.system(size: 14, weight: .medium)).foregroundStyle(.secondary)
            }.frame(width: 440).padding(.vertical, 10)
            Group {
                switch kind {
                case .home: appWindow { HomeView(session: .preview(phase: .ready)) }
                case .dark: appWindow { HomeView(session: .preview(phase: .ready)) }
                case .cleaning: appWindow { CleaningView(session: .preview(phase: .cleaning)).frame(width: 740, height: 760) }
                case .privacy:
                    ZStack {
                        PaperBackground()
                        VStack(spacing: 45) {
                            PrivacyView()
                            KeyboardIllustration().frame(width: 390)
                        }
                    }
                    .frame(width: 740, height: 792)
                    .clipShape(RoundedRectangle(cornerRadius: 20))
                    .overlay(RoundedRectangle(cornerRadius: 20).strokeBorder(.primary.opacity(0.1)))
                    .compositingGroup()
                    .shadow(color: .black.opacity(0.12), radius: 30, y: 18)
                }
            }
        }
        .padding(64).frame(width: 1440, height: 900)
        .background(dark ? Color(red: 0.12, green: 0.10, blue: 0.17) : Color(red: 0.91, green: 0.89, blue: 0.95))
    }

    private func appWindow<Content: View>(@ViewBuilder content: () -> Content) -> some View {
        VStack(spacing: 0) {
            HStack(spacing: 8) {
                ForEach([Color(red: 1, green: 0.38, blue: 0.35), Color(red: 1, green: 0.75, blue: 0.24), Color(red: 0.2, green: 0.78, blue: 0.35)], id: \.self) { color in
                    Circle().fill(color).frame(width: 12, height: 12)
                }
                Spacer()
                Text("Stillkeys").font(.system(size: 13, weight: .semibold)).foregroundStyle(.secondary)
                Spacer()
                Color.clear.frame(width: 52, height: 12)
            }.padding(.horizontal, 16).frame(height: 32).background(.bar)
            content()
        }
        .frame(width: 740, height: 792)
        .clipShape(RoundedRectangle(cornerRadius: 20))
        .overlay(RoundedRectangle(cornerRadius: 20).strokeBorder(.primary.opacity(0.1)))
        .compositingGroup()
        .shadow(color: .black.opacity(dark ? 0.3 : 0.14), radius: 30, y: 18)
    }

    private var eyebrow: String {
        switch kind {
        case .home: "A LITTLE CARE FOR YOUR MAC"
        case .cleaning: "MAKE A LITTLE SPACE"
        case .privacy: "BEAUTIFULLY UNCOMPLICATED"
        case .dark: "AT HOME ON YOUR MAC"
        }
    }
    private var headline: String {
        switch kind {
        case .home: "A little pause.\nA cleaner\nkeyboard."
        case .cleaning: "Your time\nto tidy."
        case .privacy: "Your keys.\nYour business."
        case .dark: "A quieter\nkind of\nutility."
        }
    }
    private var detail: String {
        switch kind {
        case .home: "A calm cleaning screen for the keystrokes you didn’t mean to make."
        case .cleaning: "Choose a timer. Finish with a click, or hold Escape for two seconds."
        case .privacy: "No accounts. No analytics.\nNo keystroke recording.\nJust a little peace of mind."
        case .dark: "Light or dark. Thoughtful details.\nMade to feel right at home."
        }
    }
    private var footnote: String {
        dark ? "Follows your Mac’s appearance" : "Made for Mac · Coffee & Fun"
    }
}
#endif
