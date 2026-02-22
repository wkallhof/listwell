import Foundation
import UIKit

@Observable
@MainActor
final class ListingDetailViewModel {
    var listing: Listing?
    var isLoading = false
    var errorMessage: String?

    private var listingId: String?

    func loadListing(id: String, token: String?) async {
        guard let token else { return }
        listingId = id
        isLoading = true
        errorMessage = nil
        defer { isLoading = false }

        do {
            listing = try await ListingsService.fetchListing(id: id, token: token)
        } catch let error as APIError {
            errorMessage = error.errorDescription
        } catch {
            errorMessage = "Failed to load listing."
        }
    }

    func updateStatus(_ status: String, token: String?) async {
        guard let token, let id = listingId else { return }
        var updates = PatchListingRequest()
        updates.status = status

        do {
            listing = try await ListingsService.updateListing(
                id: id, updates: updates, token: token
            )
        } catch let error as APIError {
            errorMessage = error.errorDescription
        } catch {
            errorMessage = "Failed to update listing."
        }
    }

    func deleteListing(token: String?) async -> Bool {
        guard let token, let id = listingId else { return false }

        do {
            try await ListingsService.deleteListing(id: id, token: token)
            return true
        } catch let error as APIError {
            errorMessage = error.errorDescription
            return false
        } catch {
            errorMessage = "Failed to delete listing."
            return false
        }
    }

    func copyFullListing() {
        guard let listing else { return }
        let text = ListingFormatter.formatForClipboard(listing)
        UIPasteboard.general.string = text
    }
}
