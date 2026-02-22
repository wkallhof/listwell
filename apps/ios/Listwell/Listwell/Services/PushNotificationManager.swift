import Foundation
import UserNotifications
import UIKit

@Observable
@MainActor
final class PushNotificationManager {
    var isRegistered = false
    var deviceToken: String?
    var errorMessage: String?

    func requestPermission() async -> Bool {
        do {
            let granted = try await UNUserNotificationCenter.current().requestAuthorization(
                options: [.alert, .badge, .sound]
            )
            if granted {
                registerForRemoteNotifications()
            }
            return granted
        } catch {
            errorMessage = "Failed to request notification permission."
            return false
        }
    }

    func registerForRemoteNotifications() {
        UIApplication.shared.registerForRemoteNotifications()
    }

    func handleDeviceToken(_ tokenData: Data) {
        let token = tokenData.map { String(format: "%02x", $0) }.joined()
        deviceToken = token
        isRegistered = true
    }

    func handleRegistrationError(_ error: Error) {
        errorMessage = "Push registration failed: \(error.localizedDescription)"
        isRegistered = false
    }

    func subscribeToAPI(token authToken: String, client: APIClient = .shared) async {
        guard let deviceToken else { return }

        let body = APNsSubscribeRequest(type: "apns", deviceToken: deviceToken)
        do {
            try await client.requestVoid(.post, path: "/push/subscribe", body: body, token: authToken)
        } catch {
            errorMessage = "Failed to register for push notifications."
        }
    }

    func unsubscribeFromAPI(token authToken: String, client: APIClient = .shared) async {
        guard let deviceToken else { return }

        let body = APNsUnsubscribeRequest(deviceToken: deviceToken)
        do {
            try await client.requestVoid(.delete, path: "/push/subscribe", body: body, token: authToken)
        } catch {
            // Silent failure on unsubscribe
        }
    }
}

// MARK: - API Request Models

struct APNsSubscribeRequest: Encodable {
    let type: String
    let deviceToken: String
}

struct APNsUnsubscribeRequest: Encodable {
    let deviceToken: String
}
