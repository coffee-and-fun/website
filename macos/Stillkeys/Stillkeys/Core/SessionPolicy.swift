import Foundation

/// A clock-driven state machine. No event text, key history, or wall-clock dates are retained.
struct SessionPolicy: Sendable {
    enum Phase: Equatable, Sendable { case ready, preparing, cleaning, finished }
    enum EndReason: String, Sendable { case timer, button, escape, interrupted, unavailable }
    static let preparationDuration: TimeInterval = 3
    static let escapeHoldDuration: TimeInterval = 2
    static let allowedDurations = [30, 60, 120, 300]

    private(set) var phase: Phase = .ready
    private(set) var duration = 60
    private(set) var startedAt: TimeInterval?
    private(set) var escapeStartedAt: TimeInterval?
    private(set) var endReason: EndReason?
    var isProtecting: Bool { phase == .preparing || phase == .cleaning }

    mutating func start(duration: Int, now: TimeInterval) {
        guard !isProtecting else { return }
        self.duration = Self.allowedDurations.contains(duration) ? duration : 60
        startedAt = now
        escapeStartedAt = nil
        endReason = nil
        phase = .preparing
    }

    mutating func update(now: TimeInterval) {
        guard isProtecting, let startedAt else { return }
        if let escapeStartedAt, now - escapeStartedAt >= Self.escapeHoldDuration {
            finish(.escape)
        } else if now - startedAt >= Self.preparationDuration + Double(duration) {
            finish(.timer)
        } else if now - startedAt >= Self.preparationDuration {
            phase = .cleaning
        }
    }

    mutating func escape(down: Bool, isRepeat: Bool = false, now: TimeInterval) {
        guard isProtecting else { return }
        if down {
            if !isRepeat && escapeStartedAt == nil { escapeStartedAt = now }
        } else {
            escapeStartedAt = nil
        }
    }

    mutating func finish(_ reason: EndReason) {
        guard isProtecting else { return }
        phase = .finished
        endReason = reason
        escapeStartedAt = nil
    }

    mutating func reset() { self = SessionPolicy() }

    func remaining(now: TimeInterval) -> Int {
        guard let startedAt else { return duration }
        if phase == .finished { return 0 }
        let total = phase == .preparing ? Self.preparationDuration : Self.preparationDuration + Double(duration)
        return max(0, Int(ceil(total - max(0, now - startedAt))))
    }

    func escapeProgress(now: TimeInterval) -> Double {
        guard let escapeStartedAt else { return 0 }
        return min(1, max(0, (now - escapeStartedAt) / Self.escapeHoldDuration))
    }
}

/// Used in the event callback as well as the UI timer, so a stalled UI cannot extend the deadline.
/// The lock protects only a tiny value type; no UI or blocking work runs while it is held.
final class InputGate: @unchecked Sendable {
    private let lock = NSLock()
    private var policy = SessionPolicy()
    static var now: TimeInterval { ProcessInfo.processInfo.systemUptime }

    func start(duration: Int, now: TimeInterval = InputGate.now) {
        lock.withLock { policy.start(duration: duration, now: now) }
    }
    func snapshot(now: TimeInterval = InputGate.now) -> SessionPolicy {
        lock.withLock { policy.update(now: now); return policy }
    }
    func shouldSuppress(escapeDown: Bool? = nil, isRepeat: Bool = false, now: TimeInterval = InputGate.now) -> Bool {
        lock.withLock {
            policy.update(now: now)
            guard policy.isProtecting else { return false }
            if let escapeDown { policy.escape(down: escapeDown, isRepeat: isRepeat, now: now) }
            return true
        }
    }
    func finish(_ reason: SessionPolicy.EndReason) { lock.withLock { policy.finish(reason) } }
    func reset() { lock.withLock { policy.reset() } }
}
