import SwiftUI

struct ContentView: View {
    @Environment(AuthState.self) private var authState

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
    }

    private var splashView: some View {
        VStack(spacing: Spacing.lg) {
            Text("Listwell")
                .font(.system(size: Typography.pageTitle, weight: .bold))
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
}
