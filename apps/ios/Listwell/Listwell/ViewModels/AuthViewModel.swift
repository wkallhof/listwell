import Foundation

@Observable
@MainActor
final class AuthState {
    var isLoggedIn = false
    var currentUser: User?
    var token: String?
    var isLoading = true
    var errorMessage: String?

    private let authService: AuthServiceProtocol.Type
    private let keychainKey: String

    init(
        authService: AuthServiceProtocol.Type = AuthService.self,
        keychainKey: String = KeychainKeys.authToken
    ) {
        self.authService = authService
        self.keychainKey = keychainKey
    }

    func checkExistingSession() async {
        isLoading = true
        defer { isLoading = false }

        guard let savedToken = KeychainManager.retrieve(forKey: keychainKey) else {
            return
        }

        do {
            let user = try await authService.getSession(token: savedToken, client: .shared)
            token = savedToken
            currentUser = user
            isLoggedIn = true
        } catch {
            // Token is invalid/expired — clean up
            try? KeychainManager.delete(forKey: keychainKey)
        }
    }

    func login(email: String, password: String) async {
        errorMessage = nil
        isLoading = true
        defer { isLoading = false }

        do {
            let response = try await authService.signIn(
                email: email, password: password, client: .shared
            )
            let bearerToken = AuthService.extractToken(from: response)
            guard let bearerToken else {
                errorMessage = "Login failed. Please try again."
                return
            }
            try KeychainManager.save(token: bearerToken, forKey: keychainKey)
            token = bearerToken
            currentUser = response.user
            isLoggedIn = true
        } catch let error as APIError {
            errorMessage = error.errorDescription
        } catch {
            errorMessage = "An unexpected error occurred."
        }
    }

    func register(email: String, password: String, name: String) async {
        errorMessage = nil
        isLoading = true
        defer { isLoading = false }

        do {
            let response = try await authService.signUp(
                email: email, password: password, name: name, client: .shared
            )
            let bearerToken = AuthService.extractToken(from: response)
            guard let bearerToken else {
                errorMessage = "Registration failed. Please try again."
                return
            }
            try KeychainManager.save(token: bearerToken, forKey: keychainKey)
            token = bearerToken
            currentUser = response.user
            isLoggedIn = true
        } catch let error as APIError {
            errorMessage = error.errorDescription
        } catch {
            errorMessage = "An unexpected error occurred."
        }
    }

    func logout() async {
        if let token {
            try? await authService.signOut(token: token, client: .shared)
        }
        try? KeychainManager.delete(forKey: keychainKey)
        token = nil
        currentUser = nil
        isLoggedIn = false
        errorMessage = nil
    }
}
