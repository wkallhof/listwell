import Foundation

enum ThemePreference: String, CaseIterable, Sendable {
    case system
    case light
    case dark
}

@Observable
@MainActor
final class SettingsViewModel {
    var themePreference: ThemePreference = .system
    var notificationsEnabled = true
    var isLoading = false
    var errorMessage: String?

    func load(token: String?) async {
        guard let token else { return }
        isLoading = true
        defer { isLoading = false }

        do {
            let prefs = try await PreferencesService.fetchPreferences(token: token)
            themePreference = ThemePreference(rawValue: prefs.themePreference) ?? .system
            notificationsEnabled = prefs.notificationsEnabled
        } catch {
            errorMessage = "Failed to load preferences."
        }
    }

    func updateTheme(_ theme: ThemePreference, token: String?) async {
        themePreference = theme
        guard let token else { return }

        do {
            _ = try await PreferencesService.updatePreferences(
                UpdatePreferencesRequest(themePreference: theme.rawValue),
                token: token
            )
        } catch {
            errorMessage = "Failed to save theme preference."
        }
    }

    func updateNotifications(_ enabled: Bool, token: String?) async {
        notificationsEnabled = enabled
        guard let token else { return }

        do {
            _ = try await PreferencesService.updatePreferences(
                UpdatePreferencesRequest(notificationsEnabled: enabled),
                token: token
            )
        } catch {
            errorMessage = "Failed to save notification preference."
        }
    }
}
