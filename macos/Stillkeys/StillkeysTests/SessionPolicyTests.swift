import XCTest
@testable import Stillkeys

final class SessionPolicyTests: XCTestCase {
    func testCapturesImmediatelyAndTransitionsAfterPreparation() {
        var policy = SessionPolicy()
        policy.start(duration: 60, now: 10)
        XCTAssertTrue(policy.isProtecting)
        XCTAssertEqual(policy.phase, .preparing)
        XCTAssertEqual(policy.remaining(now: 10), 3)
        policy.update(now: 13)
        XCTAssertEqual(policy.phase, .cleaning)
        XCTAssertEqual(policy.remaining(now: 13), 60)
    }

    func testEveryDurationEndsAtItsDeadline() {
        for duration in SessionPolicy.allowedDurations {
            var policy = SessionPolicy()
            policy.start(duration: duration, now: 5)
            policy.update(now: 8 + Double(duration) - 0.01)
            XCTAssertTrue(policy.isProtecting)
            XCTAssertEqual(policy.remaining(now: 8 + Double(duration) - 0.01), 1)
            policy.update(now: 8 + Double(duration))
            XCTAssertFalse(policy.isProtecting)
            XCTAssertEqual(policy.endReason, .timer)
            XCTAssertEqual(policy.remaining(now: 10_000), 0)
        }
    }

    func testAnEscapeTapDoesNotUnlock() {
        var policy = SessionPolicy()
        policy.start(duration: 60, now: 0)
        policy.escape(down: true, now: 5)
        policy.escape(down: false, now: 5.2)
        policy.update(now: 8)
        XCTAssertTrue(policy.isProtecting)
        XCTAssertEqual(policy.escapeProgress(now: 8), 0)
    }

    func testEscapeHoldUnlocksWithoutKeyRepeat() {
        var policy = SessionPolicy()
        policy.start(duration: 60, now: 0)
        policy.escape(down: true, now: 4)
        policy.update(now: 5.99)
        XCTAssertTrue(policy.isProtecting)
        policy.update(now: 6)
        XCTAssertEqual(policy.endReason, .escape)
        XCTAssertFalse(policy.isProtecting)
    }

    func testEscapeRepeatsDoNotRestartHold() {
        var policy = SessionPolicy()
        policy.start(duration: 60, now: 0)
        policy.escape(down: true, now: 5)
        policy.escape(down: true, isRepeat: true, now: 6.9)
        policy.update(now: 7)
        XCTAssertEqual(policy.endReason, .escape)
    }

    func testRepeatedStartCannotExtendBlocking() {
        var policy = SessionPolicy()
        policy.start(duration: 30, now: 10)
        policy.start(duration: 300, now: 20)
        policy.update(now: 43)
        XCTAssertFalse(policy.isProtecting)
        XCTAssertEqual(policy.duration, 30)
    }

    func testInvalidDurationsFallBackToBoundedDefault() {
        for invalid in [-1, 0, Int.max] {
            var policy = SessionPolicy()
            policy.start(duration: invalid, now: 0)
            XCTAssertEqual(policy.duration, 60)
        }
    }

    func testAllExitReasonsImmediatelyReleaseAndPreserveReason() {
        for reason in [SessionPolicy.EndReason.button, .escape, .interrupted, .unavailable] {
            var policy = SessionPolicy()
            policy.start(duration: 60, now: 0)
            policy.finish(reason)
            policy.finish(.timer)
            XCTAssertFalse(policy.isProtecting)
            XCTAssertEqual(policy.endReason, reason)
        }
    }

    func testCallbackExpiresProtectionWithoutUITimer() {
        let gate = InputGate()
        gate.start(duration: 30, now: 100)
        XCTAssertTrue(gate.shouldSuppress(now: 132.99))
        XCTAssertFalse(gate.shouldSuppress(now: 133))
        XCTAssertFalse(gate.shouldSuppress(now: 999))
    }

    func testResetClearsPriorEscapeAndEndState() {
        var policy = SessionPolicy()
        policy.start(duration: 60, now: 0)
        policy.escape(down: true, now: 1)
        policy.finish(.button)
        policy.reset()
        XCTAssertEqual(policy.phase, .ready)
        XCTAssertNil(policy.startedAt)
        XCTAssertNil(policy.escapeStartedAt)
        XCTAssertNil(policy.endReason)
    }

    func testConcurrentGateReadsAndStopCannotLeaveProtectionActive() {
        let gate = InputGate()
        gate.start(duration: 60, now: 0)
        DispatchQueue.concurrentPerform(iterations: 1_000) { _ in
            _ = gate.shouldSuppress(now: 10)
            _ = gate.snapshot(now: 10)
        }
        gate.finish(.interrupted)
        XCTAssertFalse(gate.shouldSuppress(now: 10))
    }
}
