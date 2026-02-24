import SwiftUI

@Observable
@MainActor
final class SettingsStore {
    var themePreference: ThemePreference = .system

    var colorScheme: ColorScheme? {
        switch themePreference {
        case .system: return nil
        case .light: return .light
        case .dark: return .dark
        }
    }

    func load(token: String?) async {
        guard let token else { return }
        do {
            let prefs = try await PreferencesService.fetchPreferences(token: token)
            themePreference = ThemePreference(rawValue: prefs.themePreference) ?? .system
        } catch {
            // Fall back to system default
        }
    }
}
