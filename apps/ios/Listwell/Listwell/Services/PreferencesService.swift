import Foundation

enum PreferencesService {

    static func fetchPreferences(
        token: String,
        client: APIClient = .shared
    ) async throws -> UserPreferences {
        try await client.request(.get, path: "/preferences", token: token)
    }

    static func updatePreferences(
        _ updates: UpdatePreferencesRequest,
        token: String,
        client: APIClient = .shared
    ) async throws -> UserPreferences {
        try await client.request(.patch, path: "/preferences", body: updates, token: token)
    }
}
