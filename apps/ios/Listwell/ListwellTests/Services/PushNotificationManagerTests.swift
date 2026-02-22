import Testing
import Foundation
@testable import Listwell

@Suite("PushNotificationManager")
struct PushNotificationManagerTests {

    @Test("initializes with default values")
    @MainActor
    func defaultInit() {
        let manager = PushNotificationManager()

        #expect(manager.isRegistered == false)
        #expect(manager.deviceToken == nil)
        #expect(manager.errorMessage == nil)
    }

    @Test("handleDeviceToken converts data to hex string")
    @MainActor
    func deviceTokenConversion() {
        let manager = PushNotificationManager()
        let tokenBytes: [UInt8] = [0xAB, 0xCD, 0xEF, 0x01, 0x23, 0x45, 0x67, 0x89]
        let tokenData = Data(tokenBytes)

        manager.handleDeviceToken(tokenData)

        #expect(manager.deviceToken == "abcdef0123456789")
        #expect(manager.isRegistered == true)
    }

    @Test("handleDeviceToken with empty data")
    @MainActor
    func emptyDeviceToken() {
        let manager = PushNotificationManager()
        let tokenData = Data()

        manager.handleDeviceToken(tokenData)

        #expect(manager.deviceToken == "")
        #expect(manager.isRegistered == true)
    }

    @Test("handleRegistrationError sets error message")
    @MainActor
    func registrationError() {
        let manager = PushNotificationManager()
        let error = NSError(domain: "APNs", code: 3000, userInfo: [NSLocalizedDescriptionKey: "Not entitled"])

        manager.handleRegistrationError(error)

        #expect(manager.isRegistered == false)
        #expect(manager.errorMessage?.contains("Push registration failed") == true)
    }

    @Test("subscribeToAPI sends device token to server")
    @MainActor
    func subscribeToAPI() async throws {
        let client = makeTestClient()
        let manager = PushNotificationManager()

        // Set device token first
        let tokenData = Data([0x01, 0x02, 0x03])
        manager.handleDeviceToken(tokenData)

        MockURLProtocol.requestHandler = { request in
            #expect(request.httpMethod == "POST")
            #expect(request.url?.path.hasSuffix("/push/subscribe") == true)
            #expect(request.value(forHTTPHeaderField: "Authorization") == "Bearer test-token")

            // Verify body contains APNs fields
            if let body = request.httpBody {
                let json = try? JSONSerialization.jsonObject(with: body) as? [String: Any]
                #expect(json?["type"] as? String == "apns")
                #expect(json?["deviceToken"] as? String == "010203")
            }

            let response = HTTPURLResponse(
                url: request.url!, statusCode: 200, httpVersion: nil, headerFields: nil
            )!
            return (response, #"{"success":true}"#.data(using: .utf8)!)
        }

        await manager.subscribeToAPI(token: "test-token", client: client)
        #expect(manager.errorMessage == nil)
    }

    @Test("subscribeToAPI skips when no device token")
    @MainActor
    func subscribeWithoutToken() async {
        let client = makeTestClient()
        let manager = PushNotificationManager()

        MockURLProtocol.requestHandler = { _ in
            Issue.record("Should not make API call without device token")
            let response = HTTPURLResponse(
                url: URL(string: "https://api.test.com")!, statusCode: 200, httpVersion: nil, headerFields: nil
            )!
            return (response, Data())
        }

        await manager.subscribeToAPI(token: "test-token", client: client)
    }

    @Test("unsubscribeFromAPI sends delete request")
    @MainActor
    func unsubscribeFromAPI() async {
        let client = makeTestClient()
        let manager = PushNotificationManager()

        let tokenData = Data([0xAA, 0xBB])
        manager.handleDeviceToken(tokenData)

        MockURLProtocol.requestHandler = { request in
            #expect(request.httpMethod == "DELETE")
            #expect(request.url?.path.hasSuffix("/push/subscribe") == true)

            let response = HTTPURLResponse(
                url: request.url!, statusCode: 200, httpVersion: nil, headerFields: nil
            )!
            return (response, #"{"success":true}"#.data(using: .utf8)!)
        }

        await manager.unsubscribeFromAPI(token: "test-token", client: client)
    }
}
