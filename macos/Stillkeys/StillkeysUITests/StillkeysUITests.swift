import XCTest

@MainActor
final class StillkeysUITests: XCTestCase {
    func testCleaningCanAlwaysBeEndedWithMouse() throws {
        let app = XCUIApplication()
        app.launch()
        defer { app.terminate() }
        let start = app.buttons["startCleaning"]
        XCTAssertTrue(start.waitForExistence(timeout: 5))
        start.click()
        let finish = app.buttons["finishCleaning"].firstMatch
        XCTAssertTrue(finish.waitForExistence(timeout: 5))
        // These should be discarded by the app rather than close the screen or activate a button.
        app.typeText("tidy keyboard 123\n")
        XCTAssertTrue(finish.exists)
        finish.click()
        XCTAssertTrue(app.buttons["backToStart"].waitForExistence(timeout: 5))
        app.buttons["backToStart"].click()
        XCTAssertTrue(start.waitForExistence(timeout: 3))
    }

    func testGuideAndPrivacyAreAccessibleBeforeCleaning() {
        let app = XCUIApplication()
        app.launch()
        defer { app.terminate() }
        app.buttons["cleaningGuide"].click()
        XCTAssertTrue(app.staticTexts["A little care goes a long way."].waitForExistence(timeout: 3))
        app.buttons["Done"].click()
        app.buttons["privacyButton"].click()
        XCTAssertTrue(app.staticTexts["Your keys. Your business."].waitForExistence(timeout: 3))
        app.buttons["Done"].click()
    }
}
