import Foundation

@Observable
@MainActor
final class FeedViewModel {
    var listings: [Listing] = []
    var isLoading = false
    var errorMessage: String?

    private let listingsService: ListingsServiceProtocol.Type

    init(listingsService: ListingsServiceProtocol.Type = ListingsService.self) {
        self.listingsService = listingsService
    }

    func loadListings(token: String?) async {
        guard let token else { return }
        isLoading = true
        errorMessage = nil
        defer { isLoading = false }

        do {
            listings = try await listingsService.fetchListings(token: token, client: .shared)
        } catch let error as APIError {
            errorMessage = error.errorDescription
        } catch {
            errorMessage = "Failed to load listings."
        }
    }

    func refresh(token: String?) async {
        await loadListings(token: token)
    }
}

protocol ListingsServiceProtocol {
    static func fetchListings(token: String, client: APIClient) async throws -> [Listing]
}

extension ListingsService: ListingsServiceProtocol {}
