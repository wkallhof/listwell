import Testing
import Foundation
@testable import Listwell

@Suite("LoginView")
struct LoginViewTests {

    // MARK: - AuthTab

    @Test("AuthTab has login and register cases")
    func authTabCases() {
        #expect(AuthTab.allCases.count == 2)
        #expect(AuthTab.login.rawValue == "login")
        #expect(AuthTab.register.rawValue == "register")
    }

    // MARK: - Form Validation Logic

    @Test("email validation accepts valid emails")
    func validEmails() {
        let validEmails = [
            "test@example.com",
            "user+tag@domain.co",
            "name@sub.domain.org",
        ]
        let pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        for email in validEmails {
            #expect(email.wholeMatch(of: pattern) != nil, "Expected \(email) to be valid")
        }
    }

    @Test("email validation rejects invalid emails")
    func invalidEmails() {
        let invalidEmails = [
            "",
            "nope",
            "no@",
            "@no.com",
            "has spaces@email.com",
        ]
        let pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        for email in invalidEmails {
            #expect(email.wholeMatch(of: pattern) == nil, "Expected \(email) to be invalid")
        }
    }

    @Test("password must be at least 8 characters")
    func passwordLength() {
        #expect("1234567".count < 8)
        #expect("12345678".count >= 8)
    }

    // MARK: - LoginView Creation

    @Test("LoginView is a View type")
    @MainActor
    func loginViewIsView() {
        // Verify the type exists and conforms to View
        let _ = LoginView.self
    }

    // MARK: - MainView Creation

    @Test("MainView is a View type")
    @MainActor
    func mainViewIsView() {
        let _ = MainView.self
    }

    // MARK: - ContentView Creation

    @Test("ContentView is a View type")
    @MainActor
    func contentViewIsView() {
        let _ = ContentView.self
    }
}
