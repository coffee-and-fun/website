import AppKit

@MainActor
protocol KeyboardShield: AnyObject {
    var isAvailable: Bool { get }
    var isOperational: Bool { get }
    func start(gate: InputGate) throws
    func stop()
}

enum ShieldError: LocalizedError {
    case permission, eventTap, secureInput
    var errorDescription: String? {
        switch self {
        case .permission: "Allow Stillkeys in System Settings → Privacy & Security → Accessibility, then try again."
        case .eventTap: "macOS could not start keyboard blocking. Your keyboard is still available. Check Accessibility access and try again."
        case .secureInput: "Another app is using Secure Input. Close its password field or secure keyboard mode, then try again. Your keyboard is still available."
        }
    }
}

/// The App Store edition consumes only events delivered to our own foreground app.
/// Public presentation options additionally disable Command-Tab. Hardware keys remain available.
@MainActor
final class ForegroundKeyboardShield: KeyboardShield {
    private var monitor: Any?
    var isAvailable: Bool { true }
    var isOperational: Bool { monitor != nil }

    func start(gate: InputGate) throws {
        stop()
        monitor = NSEvent.addLocalMonitorForEvents(matching: [.keyDown, .keyUp, .flagsChanged, .systemDefined]) { event in
            let escape = (event.type == .keyDown || event.type == .keyUp) && event.keyCode == 53
            // Always retain the operating system's emergency Force Quit route.
            if escape && event.modifierFlags.contains([.command, .option]) { return event }
            let suppress = gate.shouldSuppress(
                escapeDown: escape ? event.type == .keyDown : nil,
                isRepeat: event.type == .keyDown && event.isARepeat
            )
            return suppress ? nil : event
        }
    }

    func stop() {
        if let monitor { NSEvent.removeMonitor(monitor) }
        monitor = nil
    }
}

#if STILLKEYS_DIRECT
@preconcurrency import ApplicationServices
import Carbon.HIToolbox

/// This implementation is compiled only into the explicitly non-sandboxed Direct scheme.
@MainActor
final class SystemKeyboardShield: KeyboardShield {
    private var tap: CFMachPort?
    private var source: CFRunLoopSource?
    private var gate: InputGate?
    var isAvailable: Bool { AXIsProcessTrusted() }
    var isOperational: Bool {
        guard let tap else { return false }
        return isAvailable && !IsSecureEventInputEnabled() && CGEvent.tapIsEnabled(tap: tap)
    }

    static func requestAccess() {
        let key = kAXTrustedCheckOptionPrompt.takeUnretainedValue() as String
        _ = AXIsProcessTrustedWithOptions([key: true] as CFDictionary)
    }

    func start(gate: InputGate) throws {
        stop()
        guard isAvailable else { throw ShieldError.permission }
        guard !IsSecureEventInputEnabled() else { throw ShieldError.secureInput }
        let mask = [CGEventType.keyDown.rawValue, CGEventType.keyUp.rawValue,
                    CGEventType.flagsChanged.rawValue, UInt32(NSEvent.EventType.systemDefined.rawValue)]
            .reduce(CGEventMask(0)) { $0 | (CGEventMask(1) << $1) }
        self.gate = gate
        let callback: CGEventTapCallBack = { _, type, event, context in
            guard let context else { return Unmanaged.passUnretained(event) }
            let gate = Unmanaged<InputGate>.fromOpaque(context).takeUnretainedValue()
            if type == .tapDisabledByTimeout || type == .tapDisabledByUserInput {
                // Fail open; never silently re-enable a tap the OS has disabled.
                gate.finish(.unavailable)
                return Unmanaged.passUnretained(event)
            }
            let escape = (type == .keyDown || type == .keyUp) && event.getIntegerValueField(.keyboardEventKeycode) == 53
            if escape && event.flags.contains([.maskCommand, .maskAlternate]) {
                gate.finish(.interrupted)
                return Unmanaged.passUnretained(event)
            }
            let suppress = gate.shouldSuppress(
                escapeDown: escape ? type == .keyDown : nil,
                isRepeat: type == .keyDown && event.getIntegerValueField(.keyboardEventAutorepeat) != 0
            )
            return suppress ? nil : Unmanaged.passUnretained(event)
        }
        guard let tap = CGEvent.tapCreate(tap: .cgSessionEventTap, place: .headInsertEventTap,
                                        options: .defaultTap, eventsOfInterest: mask, callback: callback,
                                        userInfo: Unmanaged.passUnretained(gate).toOpaque()) else {
            self.gate = nil
            throw ShieldError.eventTap
        }
        guard let source = CFMachPortCreateRunLoopSource(kCFAllocatorDefault, tap, 0) else {
            CFMachPortInvalidate(tap)
            self.gate = nil
            throw ShieldError.eventTap
        }
        self.tap = tap
        self.source = source
        CFRunLoopAddSource(CFRunLoopGetMain(), source, .commonModes)
        CGEvent.tapEnable(tap: tap, enable: true)
        guard CGEvent.tapIsEnabled(tap: tap) else { stop(); throw ShieldError.eventTap }
    }

    func stop() {
        if let tap { CGEvent.tapEnable(tap: tap, enable: false); CFMachPortInvalidate(tap) }
        if let source { CFRunLoopRemoveSource(CFRunLoopGetMain(), source, .commonModes) }
        source = nil
        tap = nil
        gate = nil
    }
}
#endif
