import Testing
import Foundation
@testable import Listwell

// MARK: - Mock Auth Service

enum MockAuthService: AuthServiceProtocol {
    nonisolated(unsafe) static var signInResult: Result<AuthResponse, Error> = .success(
        AuthResponse(session: nil, token: "mock-token", user: nil)
    )
    nonisolated(unsafe) static var signUpResult: Result<AuthResponse, Error> = .success(
        AuthResponse(session: nil, token: "mock-token", user: nil)
    )
    nonisolated(unsafe) static var signOutCalled = false
    nonisolated(unsafe) static var getSessionResult: Result<User, Error> = .failure(APIError.unauthorized)
    nonisolated(unsafe) static var lastSignInEmail: String?
    nonisolated(unsafe) static var lastSignUpName: String?

    static func reset() {
        signInResult = .success(AuthResponse(session: nil, token: "mock-token", user: nil))
        signUpResult = .success(AuthResponse(session: nil, token: "mock-token", user: nil))
        signOutCalled = false
        getSessionResult = .failure(APIError.unauthorized)
        lastSignInEmail = nil
        lastSignUpName = nil
    }

    static func signIn(email: String, password: String, client: APIClient) async throws -> AuthResponse {
        lastSignInEmail = email
        return try signInResult.get()
    }

    static func signUp(email: String, password: String, name: String, client: APIClient) async throws -> AuthResponse {
        lastSignUpName = name
        return try signUpResult.get()
    }

    static func signOut(token: String, client: APIClient) async throws {
        signOutCalled = true
    }

    static func getSession(token: String, client: APIClient) async throws -> User {
        return try getSessionResult.get()
    }
}

// MARK: - Test Helpers

private let testKeychainKey = "com.listwell.test.auth.token"

@MainActor
private func makeAuthState() -> AuthState {
    AuthState(authService: MockAuthService.self, keychainKey: testKeychainKey)
}

private func cleanupKeychain() {
    try? KeychainManager.delete(forKey: testKeychainKey)
}

private func sampleUser() -> User {
    User(
        id: "user-1",
        name: "Test User",
        email: "test@example.com",
        createdAt: Date(),
        updatedAt: Date()
    )
}

private func sampleAuthResponse(token: String = "test-token", user: User? = nil) -> AuthResponse {
    AuthResponse(
        session: SessionData(
            id: "s1", token: token, userId: "user-1", expiresAt: Date().addingTimeInterval(86400)
        ),
        token: token,
        user: user ?? sampleUser()
    )
}

// MARK: - Tests

@Suite("AuthState")
struct AuthViewModelTests {

    init() {
        MockAuthService.reset()
        cleanupKeychain()
    }

    @Test("initializes with default state")
    @MainActor
    func defaultState() {
        let authState = makeAuthState()
        #expect(authState.isLoggedIn == false)
        #expect(authState.currentUser == nil)
        #expect(authState.token == nil)
        #expect(authState.errorMessage == nil)
    }

    // MARK: - Login

    @Test("login sets user and token on success")
    @MainActor
    func loginSuccess() async {
        let authState = makeAuthState()
        MockAuthService.signInResult = .success(sampleAuthResponse())

        await authState.login(email: "test@example.com", password: "password123")

        #expect(authState.isLoggedIn == true)
        #expect(authState.token == "test-token")
        #expect(authState.currentUser?.email == "test@example.com")
        #expect(authState.errorMessage == nil)
        #expect(MockAuthService.lastSignInEmail == "test@example.com")

        // Verify token saved to keychain
        let saved = KeychainManager.retrieve(forKey: testKeychainKey)
        #expect(saved == "test-token")

        cleanupKeychain()
    }

    @Test("login sets error message on failure")
    @MainActor
    func loginFailure() async {
        let authState = makeAuthState()
        MockAuthService.signInResult = .failure(APIError.unauthorized)

        await authState.login(email: "test@example.com", password: "wrong")

        #expect(authState.isLoggedIn == false)
        #expect(authState.errorMessage != nil)
        #expect(authState.token == nil)
    }

    @Test("login handles missing token in response")
    @MainActor
    func loginMissingToken() async {
        let authState = makeAuthState()
        MockAuthService.signInResult = .success(
            AuthResponse(session: nil, token: nil, user: sampleUser())
        )

        await authState.login(email: "test@example.com", password: "pass")

        #expect(authState.isLoggedIn == false)
        #expect(authState.errorMessage == "Login failed. Please try again.")
    }

    // MARK: - Register

    @Test("register sets user and token on success")
    @MainActor
    func registerSuccess() async {
        let authState = makeAuthState()
        MockAuthService.signUpResult = .success(sampleAuthResponse(user: sampleUser()))

        await authState.register(email: "new@example.com", password: "password123", name: "New User")

        #expect(authState.isLoggedIn == true)
        #expect(authState.token == "test-token")
        #expect(MockAuthService.lastSignUpName == "New User")

        cleanupKeychain()
    }

    @Test("register sets error on failure")
    @MainActor
    func registerFailure() async {
        let authState = makeAuthState()
        MockAuthService.signUpResult = .failure(
            APIError.httpError(statusCode: 400, body: "Email already exists")
        )

        await authState.register(email: "existing@example.com", password: "pass", name: "Test")

        #expect(authState.isLoggedIn == false)
        #expect(authState.errorMessage != nil)
    }

    // MARK: - Logout

    @Test("logout clears state and keychain")
    @MainActor
    func logoutClearsState() async {
        let authState = makeAuthState()
        MockAuthService.signInResult = .success(sampleAuthResponse())

        // Login first
        await authState.login(email: "test@example.com", password: "pass")
        #expect(authState.isLoggedIn == true)

        // Now logout
        await authState.logout()

        #expect(authState.isLoggedIn == false)
        #expect(authState.token == nil)
        #expect(authState.currentUser == nil)
        #expect(authState.errorMessage == nil)
        #expect(MockAuthService.signOutCalled == true)

        // Verify keychain cleared
        let saved = KeychainManager.retrieve(forKey: testKeychainKey)
        #expect(saved == nil)
    }

    // MARK: - Session Restore

    @Test("checkExistingSession restores from valid keychain token")
    @MainActor
    func sessionRestoreSuccess() async throws {
        try KeychainManager.save(token: "saved-token", forKey: testKeychainKey)
        MockAuthService.getSessionResult = .success(sampleUser())

        let authState = makeAuthState()
        await authState.checkExistingSession()

        #expect(authState.isLoggedIn == true)
        #expect(authState.token == "saved-token")
        #expect(authState.currentUser?.email == "test@example.com")
        #expect(authState.isLoading == false)

        cleanupKeychain()
    }

    @Test("checkExistingSession clears invalid token")
    @MainActor
    func sessionRestoreInvalidToken() async throws {
        try KeychainManager.save(token: "expired-token", forKey: testKeychainKey)
        MockAuthService.getSessionResult = .failure(APIError.unauthorized)

        let authState = makeAuthState()
        await authState.checkExistingSession()

        #expect(authState.isLoggedIn == false)
        #expect(authState.token == nil)
        #expect(authState.isLoading == false)

        // Verify token removed from keychain
        let saved = KeychainManager.retrieve(forKey: testKeychainKey)
        #expect(saved == nil)
    }

    @Test("checkExistingSession does nothing when no saved token")
    @MainActor
    func sessionRestoreNoToken() async {
        let authState = makeAuthState()
        await authState.checkExistingSession()

        #expect(authState.isLoggedIn == false)
        #expect(authState.isLoading == false)
    }
}
