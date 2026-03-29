import SwiftUI

struct ContentView: View {
    @Environment(AuthState.self) private var authState
    #if !PUSH_DISABLED
    @Environment(PushNotificationManager.self) private var pushManager
    #endif
    @Environment(SettingsStore.self) private var settingsStore

    @State private var showSplash = true

    var body: some View {
        ZStack {
            Group {
                if authState.isLoggedIn {
                    MainView()
                } else if !authState.isLoading {
                    LoginView()
                }
            }

            if showSplash {
                SplashView()
                    .transition(.opacity.combined(with: .scale(scale: 1.05)))
                    .zIndex(1)
            }
        }
        .task {
            let start = ContinuousClock.now

            await authState.checkExistingSession()
            await settingsStore.load(token: authState.token)

            // Ensure splash shows for at least 800ms so it doesn't flash away
            let elapsed = ContinuousClock.now - start
            let minimum = Duration.milliseconds(800)
            if elapsed < minimum {
                try? await Task.sleep(for: minimum - elapsed)
            }

            withAnimation(.easeOut(duration: 0.4)) {
                showSplash = false
            }
        }
        #if !PUSH_DISABLED
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
        #endif
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
        #if !PUSH_DISABLED
        .environment(PushNotificationManager())
        #endif
        .environment(SettingsStore())
}
