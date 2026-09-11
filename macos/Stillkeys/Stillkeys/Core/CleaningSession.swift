import AppKit
import Observation
import SwiftUI

@MainActor @Observable
final class CleaningSession {
    private(set) var policy = SessionPolicy()
    private(set) var now = InputGate.now
    var selectedDuration = 60
    var errorMessage: String?
    var showingGuide = false
    var showingPrivacy = false
    private(set) var permissionGranted = false
    @ObservationIgnored private let gate = InputGate()
    @ObservationIgnored private let shield: any KeyboardShield
    @ObservationIgnored private var timer: Timer?
    @ObservationIgnored private var overlays: [NSWindow] = []
    @ObservationIgnored private var previousPresentation: NSApplication.PresentationOptions?
    @ObservationIgnored private var observers: [NSObjectProtocol] = []
    @ObservationIgnored private var workspaceObservers: [NSObjectProtocol] = []
    @ObservationIgnored private var sessionWasStarted = false
    @ObservationIgnored private var displaySignature: [String] = []
    #if DEBUG
    @ObservationIgnored var isPreview = false
    #endif

    static var isDirect: Bool {
        #if STILLKEYS_DIRECT
        true
        #else
        false
        #endif
    }

    init(shield: (any KeyboardShield)? = nil) {
        #if STILLKEYS_DIRECT
        self.shield = shield ?? SystemKeyboardShield()
        #else
        self.shield = shield ?? ForegroundKeyboardShield()
        #endif
        refreshPermission()
    }

    var isProtecting: Bool { policy.isProtecting }
    var remaining: Int { policy.remaining(now: now) }
    var timerText: String { String(format: "%d:%02d", remaining / 60, remaining % 60) }
    var escapeProgress: Double { policy.escapeProgress(now: now) }

    func refreshPermission() { permissionGranted = shield.isAvailable }
    func requestPermission() {
        #if STILLKEYS_DIRECT
        SystemKeyboardShield.requestAccess()
        #endif
    }

    func start() {
        guard !sessionWasStarted else { return }
        #if DEBUG
        guard !isPreview else { return }
        #endif
        refreshPermission()
        guard permissionGranted else { errorMessage = ShieldError.permission.localizedDescription; return }
        gate.reset()
        gate.start(duration: selectedDuration)
        do { try shield.start(gate: gate) }
        catch { gate.finish(.unavailable); shield.stop(); errorMessage = error.localizedDescription; return }
        sessionWasStarted = true
        policy = gate.snapshot()
        now = InputGate.now
        displaySignature = currentDisplaySignature()
        showOverlays()
        let timer = Timer(timeInterval: 0.05, repeats: true) { [weak self] _ in
            MainActor.assumeIsolated { self?.tick() }
        }
        timer.tolerance = 0.015
        self.timer = timer
        RunLoop.main.add(timer, forMode: .common)
        announce("Cleaning screen on. Hold Escape for two seconds or click Finish to stop.")
    }

    func finish(_ reason: SessionPolicy.EndReason = .button) {
        gate.finish(reason)
        policy = gate.snapshot()
        restoreDesktop()
    }

    func reset() { gate.reset(); policy = gate.snapshot() }

    private func tick() {
        now = InputGate.now
        policy = gate.snapshot(now: now)
        #if STILLKEYS_DIRECT
        if isProtecting && !shield.isOperational { finish(.unavailable); return }
        #endif
        if !isProtecting { restoreDesktop() }
    }

    func installLifecycleObservers() {
        guard observers.isEmpty else { return }
        let center = NotificationCenter.default
        for name in [NSApplication.didResignActiveNotification, NSApplication.didChangeScreenParametersNotification] {
            observers.append(center.addObserver(forName: name, object: nil, queue: .main) { [weak self] _ in
                MainActor.assumeIsolated {
                    if self?.isProtecting == true {
                        // Hiding our own Dock/menu bar changes visibleFrame and emits this
                        // notification too. Only a real display/scale change should end cleaning.
                        if name == NSApplication.didChangeScreenParametersNotification,
                           self?.displaySignature == self?.currentDisplaySignature() { return }
                        #if DEBUG
                        FileHandle.standardError.write(Data("Session interrupted by: \(name.rawValue)\n".utf8))
                        #endif
                        self?.finish(.interrupted)
                    }
                }
            })
        }
        observers.append(center.addObserver(forName: NSApplication.didBecomeActiveNotification, object: nil, queue: .main) { [weak self] _ in
            MainActor.assumeIsolated { self?.refreshPermission() }
        })
        let workspace = NSWorkspace.shared.notificationCenter
        for name in [NSWorkspace.willSleepNotification, NSWorkspace.screensDidSleepNotification,
                     NSWorkspace.sessionDidResignActiveNotification, NSWorkspace.activeSpaceDidChangeNotification] {
            workspaceObservers.append(workspace.addObserver(forName: name, object: nil, queue: .main) { [weak self] _ in
                MainActor.assumeIsolated {
                    if self?.isProtecting == true {
                        #if DEBUG
                        FileHandle.standardError.write(Data("Session interrupted by: \(name.rawValue)\n".utf8))
                        #endif
                        self?.finish(.interrupted)
                    }
                }
            })
        }
    }

    private func currentDisplaySignature() -> [String] {
        NSScreen.screens.map { "\($0.frame):\($0.backingScaleFactor)" }
    }

    func shutdown() {
        finish(.interrupted)
        observers.forEach(NotificationCenter.default.removeObserver)
        workspaceObservers.forEach(NSWorkspace.shared.notificationCenter.removeObserver)
        observers.removeAll()
        workspaceObservers.removeAll()
    }

    private func showOverlays() {
        previousPresentation = NSApp.presentationOptions
        NSApp.presentationOptions = [.hideDock, .hideMenuBar, .disableProcessSwitching, .disableHideApplication]
        let screens = NSScreen.screens
        for screen in screens {
            let window = CleaningWindow(contentRect: screen.frame, styleMask: .borderless, backing: .buffered, defer: false)
            window.setFrame(screen.frame, display: false)
            window.level = .screenSaver
            window.collectionBehavior = [.canJoinAllSpaces, .fullScreenAuxiliary]
            window.isReleasedWhenClosed = false
            window.hasShadow = false
            window.backgroundColor = .windowBackgroundColor
            window.contentView = NSHostingView(rootView: CleaningView(session: self))
            overlays.append(window)
            window.orderFrontRegardless()
        }
        overlays.first?.makeKey()
    }

    private func restoreDesktop() {
        // Remove interception before closing windows or changing activation.
        shield.stop()
        timer?.invalidate()
        timer = nil
        overlays.forEach { $0.orderOut(nil); $0.close() }
        overlays.removeAll()
        if let previousPresentation { NSApp.presentationOptions = previousPresentation }
        previousPresentation = nil
        if sessionWasStarted {
            sessionWasStarted = false
            announce("Cleaning screen off. Your keyboard is available.")
        }
    }

    private func announce(_ message: String) {
        guard let window = NSApp.mainWindow ?? overlays.first else { return }
        NSAccessibility.post(element: window, notification: .announcementRequested,
                             userInfo: [.announcement: message, .priority: NSAccessibilityPriorityLevel.high.rawValue])
    }

    #if DEBUG
    static func preview(phase: SessionPolicy.Phase) -> CleaningSession {
        let session = CleaningSession()
        session.isPreview = true
        session.permissionGranted = true
        session.gate.start(duration: 120, now: 100)
        session.now = phase == .preparing ? 101 : 141
        session.policy = session.gate.snapshot(now: session.now)
        if phase == .ready { session.gate.reset(); session.policy = session.gate.snapshot() }
        if phase == .finished { session.gate.finish(.button); session.policy = session.gate.snapshot(now: session.now) }
        return session
    }
    #endif
}

private final class CleaningWindow: NSWindow {
    override var canBecomeKey: Bool { true }
    override var canBecomeMain: Bool { false }
}
