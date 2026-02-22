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

// MARK: - Placeholder MainView (will be replaced in Phase 2)

struct MainView: View {
    @Environment(AuthState.self) private var authState

    var body: some View {
        VStack(spacing: Spacing.lg) {
            Text("Your Listings")
                .font(.system(size: Typography.pageTitle, weight: .bold))

            Text("Welcome, \(authState.currentUser?.name ?? "User")")
                .foregroundStyle(Color.mutedForeground)

            Button("Log out") {
                Task {
                    await authState.logout()
                }
            }
            .foregroundStyle(Color.destructive)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .background(Color.appBackground)
    }
}

#Preview("Logged Out") {
    ContentView()
        .environment(AuthState())
}
