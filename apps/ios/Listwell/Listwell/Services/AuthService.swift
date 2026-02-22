import Foundation

enum AuthService {

    static func signIn(
        email: String,
        password: String,
        client: APIClient = .shared
    ) async throws -> AuthResponse {
        let body = AuthRequest(email: email, password: password)
        let response: AuthResponse = try await client.request(
            .post, path: "/auth/sign-in/email", body: body
        )
        guard extractToken(from: response) != nil else {
            throw APIError.invalidResponse
        }
        return response
    }

    static func signUp(
        email: String,
        password: String,
        name: String,
        client: APIClient = .shared
    ) async throws -> AuthResponse {
        let body = AuthRequest(email: email, password: password, name: name)
        let response: AuthResponse = try await client.request(
            .post, path: "/auth/sign-up/email", body: body
        )
        guard extractToken(from: response) != nil else {
            throw APIError.invalidResponse
        }
        return response
    }

    static func signOut(
        token: String,
        client: APIClient = .shared
    ) async throws {
        try await client.requestVoid(.post, path: "/auth/sign-out", token: token)
    }

    static func getSession(
        token: String,
        client: APIClient = .shared
    ) async throws -> User {
        let response: AuthResponse = try await client.request(
            .get,
            path: "/auth/get-session",
            token: token
        )
        guard let user = response.user else {
            throw APIError.unauthorized
        }
        return user
    }

    /// Extracts the bearer token from an auth response.
    /// BetterAuth may return the token at the top level or nested inside session.
    static func extractToken(from response: AuthResponse) -> String? {
        response.token ?? response.session?.token
    }
}
