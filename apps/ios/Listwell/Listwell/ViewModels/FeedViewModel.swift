import Foundation
import SwiftUI

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

    func updateStatus(_ status: String, listingId: String, token: String?) async {
        guard let token else { return }
        var updates = PatchListingRequest()
        updates.status = status

        do {
            let updated = try await listingsService.updateListing(
                id: listingId, updates: updates, token: token, client: .shared
            )
            if let index = listings.firstIndex(where: { $0.id == listingId }) {
                // PATCH response doesn't include images — preserve them from the existing listing
                let merged = Listing(
                    id: updated.id,
                    userId: updated.userId,
                    rawDescription: updated.rawDescription,
                    title: updated.title,
                    description: updated.description,
                    suggestedPrice: updated.suggestedPrice,
                    priceRangeLow: updated.priceRangeLow,
                    priceRangeHigh: updated.priceRangeHigh,
                    category: updated.category,
                    condition: updated.condition,
                    brand: updated.brand,
                    model: updated.model,
                    researchNotes: updated.researchNotes,
                    comparables: updated.comparables,
                    status: updated.status,
                    pipelineStep: updated.pipelineStep,
                    pipelineError: updated.pipelineError,
                    agentLog: updated.agentLog,
                    inngestRunId: updated.inngestRunId,
                    createdAt: updated.createdAt,
                    updatedAt: updated.updatedAt,
                    images: updated.images ?? listings[index].images
                )
                withAnimation(.easeOut(duration: 0.2)) {
                    listings[index] = merged
                }
            }
        } catch {
            errorMessage = "Failed to update listing."
        }
    }

    func deleteListing(id: String, token: String?) async {
        guard let token else { return }

        do {
            try await listingsService.deleteListing(id: id, token: token, client: .shared)
            withAnimation(.easeOut(duration: 0.2)) {
                listings.removeAll { $0.id == id }
            }
        } catch {
            errorMessage = "Failed to delete listing."
        }
    }
}
