import AppKit
import SwiftUI

@main
struct StillkeysApp: App {
    @NSApplicationDelegateAdaptor(AppDelegate.self) private var delegate
    @State private var session = CleaningSession()

    var body: some Scene {
        Window("Stillkeys", id: "home") {
            HomeView(session: session)
                .onAppear {
                    delegate.session = session
                    session.installLifecycleObservers()
                }
        }
        .defaultSize(width: 740, height: 760)
        .windowResizability(.contentSize)
        .commands {
            CommandGroup(replacing: .newItem) {}
            CommandGroup(replacing: .help) {
                Button("Stillkeys Guide") { session.showingGuide = true }.disabled(session.isProtecting)
                Button("Privacy in Stillkeys") { session.showingPrivacy = true }.disabled(session.isProtecting)
                Divider()
                Link("Contact Support", destination: URL(string: "mailto:hello@coffeeandfun.com?subject=Stillkeys")!)
            }
        }
    }
}

@MainActor
final class AppDelegate: NSObject, NSApplicationDelegate {
    var session: CleaningSession?

    func applicationDidFinishLaunching(_ notification: Notification) {
        #if DEBUG
        if ProcessInfo.processInfo.arguments.contains("--export-screenshots") {
            DispatchQueue.main.asyncAfter(deadline: .now() + 1) {
                do { try ScreenshotExporter.export() }
                catch { FileHandle.standardError.write(Data("Screenshot export failed: \(error)\n".utf8)) }
                NSApp.terminate(nil)
            }
        }
        #endif
    }

    func applicationShouldTerminate(_ sender: NSApplication) -> NSApplication.TerminateReply {
        session?.shutdown()
        return .terminateNow
    }

    func applicationShouldTerminateAfterLastWindowClosed(_ sender: NSApplication) -> Bool { true }
}
