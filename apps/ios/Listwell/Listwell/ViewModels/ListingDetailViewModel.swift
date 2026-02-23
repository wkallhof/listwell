import Foundation
import SwiftUI
import UIKit

@Observable
@MainActor
final class ListingDetailViewModel {
    var listing: Listing?
    var isLoading = false
    var errorMessage: String?
    private(set) var isPolling = false

    private var listingId: String?
    private var pollingTask: Task<Void, Never>?
    private let listingsService: ListingsServiceProtocol.Type

    init(listingsService: ListingsServiceProtocol.Type = ListingsService.self) {
        self.listingsService = listingsService
    }

    func loadListing(id: String, token: String?) async {
        guard let token else { return }
        listingId = id
        isLoading = true
        errorMessage = nil
        defer { isLoading = false }

        do {
            let fetched = try await listingsService.fetchListing(id: id, token: token, client: .shared)
            if listing != nil && fetched.status != listing?.status {
                withAnimation(.easeOut(duration: 0.2)) { listing = fetched }
            } else {
                listing = fetched
            }
            startPollingIfNeeded(token: token)
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
            listing = try await listingsService.updateListing(
                id: id, updates: updates, token: token, client: .shared
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
            try await listingsService.deleteListing(id: id, token: token, client: .shared)
            return true
        } catch let error as APIError {
            errorMessage = error.errorDescription
            return false
        } catch {
            errorMessage = "Failed to delete listing."
            return false
        }
    }

    func retryGeneration(token: String?) async {
        guard let token, let id = listingId else { return }

        let updates = PatchListingRequest(
            status: "PROCESSING",
            pipelineStep: "PENDING",
            pipelineError: nil,
            retry: true
        )

        do {
            listing = try await listingsService.updateListing(
                id: id, updates: updates, token: token, client: .shared
            )
            startPollingIfNeeded(token: token)
        } catch let error as APIError {
            errorMessage = error.errorDescription
        } catch {
            errorMessage = "Failed to retry generation."
        }
    }

    func updateField(title: String? = nil, description: String? = nil, suggestedPrice: Double? = nil, token: String?) async {
        guard let token, let id = listingId else { return }
        var updates = PatchListingRequest()
        updates.title = title
        updates.description = description
        updates.suggestedPrice = suggestedPrice

        do {
            listing = try await listingsService.updateListing(
                id: id, updates: updates, token: token, client: .shared
            )
        } catch let error as APIError {
            errorMessage = error.errorDescription
        } catch {
            errorMessage = "Failed to update listing."
        }
    }

    func copyFullListing() {
        guard let listing else { return }
        let text = ListingFormatter.formatForClipboard(listing)
        UIPasteboard.general.string = text
    }

    // MARK: - Polling

    func startPollingIfNeeded(token: String) {
        guard let id = listingId,
              listing?.isProcessing == true else {
            stopPolling()
            return
        }

        guard !isPolling else { return }
        isPolling = true
        let service = listingsService

        pollingTask = Task { [weak self] in
            while !Task.isCancelled {
                try? await Task.sleep(for: .seconds(APIConfig.pollingInterval))
                guard !Task.isCancelled else { break }

                guard let self else { break }

                do {
                    let updated = try await service.fetchListing(id: id, token: token, client: .shared)
                    let statusChanged = updated.status != self.listing?.status
                        || updated.pipelineStep != self.listing?.pipelineStep

                    if statusChanged {
                        withAnimation(.easeOut(duration: 0.2)) { self.listing = updated }
                    } else {
                        self.listing = updated
                    }

                    if !updated.isProcessing {
                        self.stopPolling()
                        break
                    }
                } catch {
                    // Continue polling on transient errors
                }
            }
        }
    }

    func stopPolling() {
        pollingTask?.cancel()
        pollingTask = nil
        isPolling = false
    }

    func cancelPolling() {
        stopPolling()
    }
}
