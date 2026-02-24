import Foundation

struct UserPreferences: Codable, Sendable {
    let themePreference: String
    let notificationsEnabled: Bool

    static let defaults = UserPreferences(
        themePreference: "system",
        notificationsEnabled: true
    )
}

struct UpdatePreferencesRequest: Codable, Sendable {
    var themePreference: String?
    var notificationsEnabled: Bool?
}
