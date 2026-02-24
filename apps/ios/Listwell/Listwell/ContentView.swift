import SwiftUI

struct ContentView: View {
    @Environment(AuthState.self) private var authState
    @Environment(PushNotificationManager.self) private var pushManager

    var body: some View {
        Group {
            if authState.isLoading && !authState.isLoggedIn {
                splashView
            } else if authState.isLoggedIn {
                MainView()
            } else {
                LoginView()
            }
        }
        .task {
            await authState.checkExistingSession()
        }
        .onReceive(NotificationCenter.default.publisher(for: .didRegisterForRemoteNotifications)) { notification in
            if let tokenData = notification.userInfo?["deviceToken"] as? Data {
                pushManager.handleDeviceToken(tokenData)
                if let authToken = authState.token {
                    Task {
                        await pushManager.subscribeToAPI(token: authToken)
                    }
                }
            }
        }
    }

    private var splashView: some View {
        VStack(spacing: Spacing.lg) {
            Text("Listwell")
                .font(.display(size: Typography.pageTitle, weight: .bold))
                .foregroundStyle(Color.appForeground)
            ProgressView()
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .background(Color.appBackground)
    }
}

// MARK: - Main View (Authenticated)

struct MainView: View {
    var body: some View {
        FeedView()
    }
}

#Preview("Logged Out") {
    ContentView()
        .environment(AuthState())
        .environment(PushNotificationManager())
}
