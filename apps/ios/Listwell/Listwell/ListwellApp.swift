import SwiftUI
import Kingfisher

@main
struct ListwellApp: App {
    @UIApplicationDelegateAdaptor(AppDelegate.self) var appDelegate
    @State private var authState = AuthState()
    @State private var pushManager = PushNotificationManager()
    @State private var settingsStore = SettingsStore()

    init() {
        configureKingfisher()
    }

    var body: some Scene {
        WindowGroup {
            ContentView()
                .environment(authState)
                .environment(pushManager)
                .environment(settingsStore)
                .preferredColorScheme(settingsStore.colorScheme)
        }
    }

    private func configureKingfisher() {
        let cache = ImageCache.default
        cache.memoryStorage.config.totalCostLimit = 100 * 1024 * 1024 // 100 MB
        cache.diskStorage.config.sizeLimit = 500 * 1024 * 1024 // 500 MB
        cache.memoryStorage.config.countLimit = 150

        let downloader = ImageDownloader.default
        downloader.downloadTimeout = 30
    }
}

// MARK: - AppDelegate

final class AppDelegate: NSObject, UIApplicationDelegate, UNUserNotificationCenterDelegate {

    func application(
        _ application: UIApplication,
        didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil
    ) -> Bool {
        UNUserNotificationCenter.current().delegate = self
        return true
    }

    func application(
        _ application: UIApplication,
        didRegisterForRemoteNotificationsWithDeviceToken deviceToken: Data
    ) {
        NotificationCenter.default.post(
            name: .didRegisterForRemoteNotifications,
            object: nil,
            userInfo: ["deviceToken": deviceToken]
        )
    }

    func application(
        _ application: UIApplication,
        didFailToRegisterForRemoteNotificationsWithError error: Error
    ) {
        print("[Push] Registration failed: \(error.localizedDescription)")
    }

    // Show banner when app is in foreground
    func userNotificationCenter(
        _ center: UNUserNotificationCenter,
        willPresent notification: UNNotification
    ) async -> UNNotificationPresentationOptions {
        [.banner, .badge, .sound]
    }

    // Handle notification tap
    func userNotificationCenter(
        _ center: UNUserNotificationCenter,
        didReceive response: UNNotificationResponse
    ) async {
        let userInfo = response.notification.request.content.userInfo
        if let listingId = userInfo["listingId"] as? String {
            await MainActor.run {
                NotificationCenter.default.post(
                    name: .navigateToListing,
                    object: nil,
                    userInfo: ["listingId": listingId]
                )
            }
        }
    }
}

// MARK: - Notification Names

extension Notification.Name {
    static let navigateToListing = Notification.Name("navigateToListing")
    static let didRegisterForRemoteNotifications = Notification.Name("didRegisterForRemoteNotifications")
}
