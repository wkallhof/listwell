import Testing
import Foundation
@testable import Listwell

@Suite("AuthService")
struct AuthServiceTests {

    // MARK: - Sign In

    @Test("signIn returns auth response with token")
    func signInSuccess() async throws {
        let client = makeTestClient()
        let json = """
        {
            "token": "bearer-token-123",
            "user": {
                "id": "user-1",
                "name": "Test User",
                "email": "test@example.com",
                "createdAt": "2026-01-01T00:00:00.000Z",
                "updatedAt": "2026-01-01T00:00:00.000Z"
            },
            "session": {
                "id": "session-1",
                "token": "bearer-token-123",
                "userId": "user-1",
                "expiresAt": "2026-12-31T00:00:00.000Z"
            }
        }
        """

        MockURLProtocol.requestHandler = { request in
            #expect(request.httpMethod == "POST")
            #expect(request.url?.path.hasSuffix("/auth/sign-in/email") == true)

            let response = HTTPURLResponse(
                url: request.url!,
                statusCode: 200,
                httpVersion: nil,
                headerFields: nil
            )!
            return (response, json.data(using: .utf8)!)
        }

        let result = try await AuthService.signIn(
            email: "test@example.com",
            password: "password123",
            client: client
        )

        #expect(result.token == "bearer-token-123")
        #expect(result.user?.email == "test@example.com")
        #expect(result.user?.name == "Test User")
    }

    @Test("signIn with token in session only")
    func signInSessionToken() async throws {
        let client = makeTestClient()
        let json = """
        {
            "user": {
                "id": "user-1",
                "name": "Test",
                "email": "test@example.com",
                "createdAt": "2026-01-01T00:00:00.000Z",
                "updatedAt": "2026-01-01T00:00:00.000Z"
            },
            "session": {
                "id": "session-1",
                "token": "session-token-456",
                "userId": "user-1",
                "expiresAt": "2026-12-31T00:00:00.000Z"
            }
        }
        """

        MockURLProtocol.requestHandler = { request in
            let response = HTTPURLResponse(
                url: request.url!, statusCode: 200, httpVersion: nil, headerFields: nil
            )!
            return (response, json.data(using: .utf8)!)
        }

        let result = try await AuthService.signIn(
            email: "test@example.com",
            password: "pass",
            client: client
        )

        #expect(AuthService.extractToken(from: result) == "session-token-456")
    }

    @Test("signIn throws on missing token")
    func signInMissingToken() async throws {
        let client = makeTestClient()
        let json = """
        {
            "user": {
                "id": "user-1",
                "name": "Test",
                "email": "test@example.com",
                "createdAt": "2026-01-01T00:00:00.000Z",
                "updatedAt": "2026-01-01T00:00:00.000Z"
            }
        }
        """

        MockURLProtocol.requestHandler = { request in
            let response = HTTPURLResponse(
                url: request.url!, statusCode: 200, httpVersion: nil, headerFields: nil
            )!
            return (response, json.data(using: .utf8)!)
        }

        await #expect(throws: APIError.self) {
            try await AuthService.signIn(
                email: "test@example.com",
                password: "pass",
                client: client
            )
        }
    }

    @Test("signIn throws on 401 unauthorized")
    func signInUnauthorized() async throws {
        let client = makeTestClient()

        MockURLProtocol.requestHandler = { request in
            let response = HTTPURLResponse(
                url: request.url!, statusCode: 401, httpVersion: nil, headerFields: nil
            )!
            return (response, #"{"message":"Invalid credentials"}"#.data(using: .utf8)!)
        }

        await #expect(throws: APIError.self) {
            try await AuthService.signIn(
                email: "test@example.com",
                password: "wrong",
                client: client
            )
        }
    }

    // MARK: - Sign Up

    @Test("signUp returns auth response with token")
    func signUpSuccess() async throws {
        let client = makeTestClient()
        let json = """
        {
            "token": "new-user-token",
            "user": {
                "id": "user-2",
                "name": "New User",
                "email": "new@example.com",
                "createdAt": "2026-01-01T00:00:00.000Z",
                "updatedAt": "2026-01-01T00:00:00.000Z"
            },
            "session": {
                "id": "session-2",
                "token": "new-user-token",
                "userId": "user-2",
                "expiresAt": "2026-12-31T00:00:00.000Z"
            }
        }
        """

        MockURLProtocol.requestHandler = { request in
            #expect(request.httpMethod == "POST")
            #expect(request.url?.path.hasSuffix("/auth/sign-up/email") == true)

            let response = HTTPURLResponse(
                url: request.url!, statusCode: 200, httpVersion: nil, headerFields: nil
            )!
            return (response, json.data(using: .utf8)!)
        }

        let result = try await AuthService.signUp(
            email: "new@example.com",
            password: "password123",
            name: "New User",
            client: client
        )

        #expect(result.token == "new-user-token")
        #expect(result.user?.name == "New User")
    }

    @Test("signUp throws on 400 bad request")
    func signUpBadRequest() async throws {
        let client = makeTestClient()

        MockURLProtocol.requestHandler = { request in
            let response = HTTPURLResponse(
                url: request.url!, statusCode: 400, httpVersion: nil, headerFields: nil
            )!
            return (response, #"{"message":"Email already exists"}"#.data(using: .utf8)!)
        }

        await #expect(throws: APIError.self) {
            try await AuthService.signUp(
                email: "existing@example.com",
                password: "password123",
                name: "Test",
                client: client
            )
        }
    }

    // MARK: - Sign Out

    @Test("signOut succeeds")
    func signOutSuccess() async throws {
        let client = makeTestClient()

        MockURLProtocol.requestHandler = { request in
            #expect(request.httpMethod == "POST")
            #expect(request.url?.path.hasSuffix("/auth/sign-out") == true)
            #expect(request.value(forHTTPHeaderField: "Authorization") == "Bearer test-token")

            let response = HTTPURLResponse(
                url: request.url!, statusCode: 200, httpVersion: nil, headerFields: nil
            )!
            return (response, #"{"success":true}"#.data(using: .utf8)!)
        }

        try await AuthService.signOut(token: "test-token", client: client)
    }

    // MARK: - Get Session

    @Test("getSession returns user for valid token")
    func getSessionSuccess() async throws {
        let client = makeTestClient()
        let json = """
        {
            "user": {
                "id": "user-1",
                "name": "Test User",
                "email": "test@example.com",
                "createdAt": "2026-01-01T00:00:00.000Z",
                "updatedAt": "2026-01-01T00:00:00.000Z"
            },
            "session": {
                "id": "session-1",
                "token": "valid-token",
                "userId": "user-1",
                "expiresAt": "2026-12-31T00:00:00.000Z"
            }
        }
        """

        MockURLProtocol.requestHandler = { request in
            #expect(request.httpMethod == "GET")
            #expect(request.url?.path.hasSuffix("/auth/get-session") == true)
            #expect(request.value(forHTTPHeaderField: "Authorization") == "Bearer valid-token")

            let response = HTTPURLResponse(
                url: request.url!, statusCode: 200, httpVersion: nil, headerFields: nil
            )!
            return (response, json.data(using: .utf8)!)
        }

        let user = try await AuthService.getSession(token: "valid-token", client: client)
        #expect(user.id == "user-1")
        #expect(user.email == "test@example.com")
    }

    @Test("getSession throws unauthorized when user is nil")
    func getSessionNoUser() async throws {
        let client = makeTestClient()
        let json = #"{"session": null}"#

        MockURLProtocol.requestHandler = { request in
            let response = HTTPURLResponse(
                url: request.url!, statusCode: 200, httpVersion: nil, headerFields: nil
            )!
            return (response, json.data(using: .utf8)!)
        }

        await #expect(throws: APIError.self) {
            try await AuthService.getSession(token: "expired-token", client: client)
        }
    }

    @Test("getSession throws on 401")
    func getSessionUnauthorized() async throws {
        let client = makeTestClient()

        MockURLProtocol.requestHandler = { request in
            let response = HTTPURLResponse(
                url: request.url!, statusCode: 401, httpVersion: nil, headerFields: nil
            )!
            return (response, Data())
        }

        await #expect(throws: APIError.self) {
            try await AuthService.getSession(token: "bad-token", client: client)
        }
    }

    // MARK: - Extract Token

    @Test("extractToken prefers top-level token")
    func extractTokenTopLevel() {
        let response = AuthResponse(
            session: SessionData(
                id: "s1", token: "session-tok", userId: "u1",
                expiresAt: Date()
            ),
            token: "top-level-tok",
            user: nil
        )
        #expect(AuthService.extractToken(from: response) == "top-level-tok")
    }

    @Test("extractToken falls back to session token")
    func extractTokenFallback() {
        let response = AuthResponse(
            session: SessionData(
                id: "s1", token: "session-tok", userId: "u1",
                expiresAt: Date()
            ),
            token: nil,
            user: nil
        )
        #expect(AuthService.extractToken(from: response) == "session-tok")
    }

    @Test("extractToken returns nil when no token available")
    func extractTokenNil() {
        let response = AuthResponse(session: nil, token: nil, user: nil)
        #expect(AuthService.extractToken(from: response) == nil)
    }
}
