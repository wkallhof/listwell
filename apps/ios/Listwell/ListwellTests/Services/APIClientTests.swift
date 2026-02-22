import Testing
import Foundation
@testable import Listwell

// MARK: - Mock URLProtocol

final class MockURLProtocol: URLProtocol, @unchecked Sendable {
    nonisolated(unsafe) static var requestHandler: ((URLRequest) throws -> (HTTPURLResponse, Data))?

    override class func canInit(with request: URLRequest) -> Bool { true }
    override class func canonicalRequest(for request: URLRequest) -> URLRequest { request }

    override func startLoading() {
        guard let handler = MockURLProtocol.requestHandler else {
            fatalError("MockURLProtocol.requestHandler not set")
        }
        do {
            let (response, data) = try handler(request)
            client?.urlProtocol(self, didReceive: response, cacheStoragePolicy: .notAllowed)
            client?.urlProtocol(self, didLoad: data)
            client?.urlProtocolDidFinishLoading(self)
        } catch {
            client?.urlProtocol(self, didFailWithError: error)
        }
    }

    override func stopLoading() {}
}

// MARK: - Helper

func makeTestClient() -> APIClient {
    let config = URLSessionConfiguration.ephemeral
    config.protocolClasses = [MockURLProtocol.self]
    let session = URLSession(configuration: config)
    return APIClient(baseURL: "https://api.test.com/api", session: session)
}

// MARK: - Tests

@Suite("APIClient")
struct APIClientTests {

    @Test("builds correct GET request")
    func buildGetRequest() async throws {
        let client = makeTestClient()
        let request = try await client.buildRequest(.get, path: "/health")

        #expect(request.httpMethod == "GET")
        #expect(request.url?.absoluteString == "https://api.test.com/api/health")
        #expect(request.value(forHTTPHeaderField: "Content-Type") == "application/json")
    }

    @Test("includes bearer token in Authorization header")
    func bearerTokenInjection() async throws {
        let client = makeTestClient()
        let request = try await client.buildRequest(.get, path: "/listings", token: "test-token-123")

        #expect(request.value(forHTTPHeaderField: "Authorization") == "Bearer test-token-123")
    }

    @Test("omits Authorization header when no token")
    func noToken() async throws {
        let client = makeTestClient()
        let request = try await client.buildRequest(.get, path: "/listings")

        #expect(request.value(forHTTPHeaderField: "Authorization") == nil)
    }

    @Test("builds POST request with JSON body")
    func postWithBody() async throws {
        let client = makeTestClient()
        let body = AuthRequest(email: "test@example.com", password: "password123")
        let request = try await client.buildRequest(.post, path: "/auth/sign-in/email", body: body)

        #expect(request.httpMethod == "POST")
        #expect(request.httpBody != nil)

        let decoded = try JSONDecoder().decode(AuthRequest.self, from: request.httpBody!)
        #expect(decoded.email == "test@example.com")
        #expect(decoded.password == "password123")
    }

    @Test("decodes successful JSON response")
    func successfulRequest() async throws {
        let client = makeTestClient()
        let responseJSON = #"{"status":"ok"}"#

        MockURLProtocol.requestHandler = { _ in
            let response = HTTPURLResponse(
                url: URL(string: "https://api.test.com/api/health")!,
                statusCode: 200,
                httpVersion: nil,
                headerFields: nil
            )!
            return (response, responseJSON.data(using: .utf8)!)
        }

        let result: SuccessResponse = try await client.request(.get, path: "/health")
        #expect(result.status == "ok")
    }

    @Test("throws unauthorized on 401")
    func unauthorizedError() async throws {
        let client = makeTestClient()

        MockURLProtocol.requestHandler = { _ in
            let response = HTTPURLResponse(
                url: URL(string: "https://api.test.com/api/listings")!,
                statusCode: 401,
                httpVersion: nil,
                headerFields: nil
            )!
            return (response, Data())
        }

        await #expect(throws: APIError.self) {
            let _: SuccessResponse = try await client.request(.get, path: "/listings", token: "bad")
        }
    }

    @Test("throws httpError on non-2xx response")
    func httpError() async throws {
        let client = makeTestClient()

        MockURLProtocol.requestHandler = { _ in
            let response = HTTPURLResponse(
                url: URL(string: "https://api.test.com/api/listings")!,
                statusCode: 500,
                httpVersion: nil,
                headerFields: nil
            )!
            return (response, "Internal Server Error".data(using: .utf8)!)
        }

        await #expect(throws: APIError.self) {
            let _: SuccessResponse = try await client.request(.get, path: "/listings", token: "tok")
        }
    }

    @Test("requestVoid handles 200 without decoding")
    func voidRequest() async throws {
        let client = makeTestClient()

        MockURLProtocol.requestHandler = { _ in
            let response = HTTPURLResponse(
                url: URL(string: "https://api.test.com/api/listings/123")!,
                statusCode: 200,
                httpVersion: nil,
                headerFields: nil
            )!
            return (response, #"{"success":true}"#.data(using: .utf8)!)
        }

        try await client.requestVoid(.delete, path: "/listings/123", token: "tok")
    }

    @Test("builds PATCH request")
    func patchRequest() async throws {
        let client = makeTestClient()
        let body = PatchListingRequest(title: "Updated Title")
        let request = try await client.buildRequest(.patch, path: "/listings/123", body: body, token: "tok")

        #expect(request.httpMethod == "PATCH")
        #expect(request.url?.absoluteString == "https://api.test.com/api/listings/123")
    }

    @Test("builds DELETE request")
    func deleteRequest() async throws {
        let client = makeTestClient()
        let request = try await client.buildRequest(.delete, path: "/listings/123", token: "tok")

        #expect(request.httpMethod == "DELETE")
    }
}
