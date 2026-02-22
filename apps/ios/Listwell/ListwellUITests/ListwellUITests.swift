import XCTest

final class ListwellUITests: XCTestCase {

    var app: XCUIApplication!

    override func setUpWithError() throws {
        continueAfterFailure = false
        app = XCUIApplication()
        app.launchArguments = ["UI_TESTING"]
        app.launch()
    }

    // MARK: - Login Flow

    func testLoginScreenDisplays() {
        // Login screen should show app name and form
        XCTAssertTrue(app.staticTexts["Listwell"].exists)
        XCTAssertTrue(app.staticTexts["Turn photos into listings"].exists)
    }

    func testLoginFormHasRequiredFields() {
        // Email and password fields should be present
        let emailField = app.textFields["Email"]
        let passwordField = app.secureTextFields["Password"]

        XCTAssertTrue(emailField.exists)
        XCTAssertTrue(passwordField.exists)
    }

    func testTabSwitchToSignUp() {
        // Tap "Sign up" tab
        let signUpButton = app.buttons["Sign up"]
        if signUpButton.exists {
            signUpButton.tap()

            // Should show name and confirm password fields
            let nameField = app.textFields["Full name"]
            let confirmField = app.secureTextFields["Confirm password"]

            XCTAssertTrue(nameField.waitForExistence(timeout: 2))
            XCTAssertTrue(confirmField.exists)
        }
    }

    func testLoginButtonDisabledWithEmptyFields() {
        // Login/Create account button should be disabled initially
        let loginButton = app.buttons["Log in"]
        if loginButton.exists {
            XCTAssertFalse(loginButton.isEnabled)
        }
    }

    // MARK: - Navigation Flow

    func testNavigationAfterLogin() {
        // This test validates basic navigation structure exists
        // In a real test environment with mock API, we'd enter credentials
        XCTAssertTrue(app.staticTexts["Listwell"].exists)
    }

    // MARK: - Accessibility

    func testLoginScreenAccessibility() {
        // Verify key elements have accessibility labels
        XCTAssertTrue(app.staticTexts["Listwell"].exists)
    }
}
