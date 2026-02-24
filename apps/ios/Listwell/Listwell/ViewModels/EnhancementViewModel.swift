import Foundation

@Observable
@MainActor
final class EnhancementViewModel {
    var enhancingImageId: String?
    var newlyEnhancedImageId: String?
    var isEnhancing = false
    var errorMessage: String?

    var onEnhancementComplete: (([ListingImage]) -> Void)?

    private let listingId: String
    private nonisolated(unsafe) var pollingTask: Task<Void, Never>?

    init(listingId: String) {
        self.listingId = listingId
    }

    deinit {
        pollingTask?.cancel()
    }

    func requestEnhancement(for imageId: String, token: String?) async {
        guard let token else { return }
        isEnhancing = true
        enhancingImageId = imageId
        errorMessage = nil

        do {
            try await ListingsService.enhanceImage(
                listingId: listingId,
                imageId: imageId,
                token: token
            )
            await pollForNewImage(imageId: imageId, token: token)
        } catch let error as APIError {
            isEnhancing = false
            enhancingImageId = nil
            errorMessage = error.errorDescription
        } catch {
            isEnhancing = false
            enhancingImageId = nil
            errorMessage = "Enhancement failed."
        }
    }

    func deleteImage(_ imageId: String, token: String?) async {
        guard let token else { return }

        do {
            try await ListingsService.deleteImage(
                listingId: listingId,
                imageId: imageId,
                token: token
            )
        } catch let error as APIError {
            errorMessage = error.errorDescription
        } catch {
            errorMessage = "Failed to delete image."
        }
    }

    private func pollForNewImage(imageId: String, token: String) async {
        pollingTask?.cancel()

        pollingTask = Task { [weak self] in
            guard let self else { return }

            for _ in 0..<30 {
                guard !Task.isCancelled else { return }

                do {
                    try await Task.sleep(for: .seconds(APIConfig.enhancementPollingInterval))
                } catch {
                    return
                }

                guard !Task.isCancelled else { return }

                do {
                    let listing = try await ListingsService.fetchListing(
                        id: listingId, token: token
                    )
                    let images = listing.images ?? []
                    let newEnhanced = images.first {
                        $0.type == .enhanced && $0.parentImageId == imageId
                    }

                    if let newEnhanced {
                        enhancingImageId = nil
                        isEnhancing = false
                        newlyEnhancedImageId = newEnhanced.id
                        onEnhancementComplete?(images)
                        return
                    }
                } catch {
                    // Continue polling on transient errors
                }
            }

            // Polling timed out
            isEnhancing = false
            enhancingImageId = nil
            errorMessage = "Enhancement is taking longer than expected. Pull to refresh."
        }

        await pollingTask?.value
    }

    func stopPolling() {
        pollingTask?.cancel()
        pollingTask = nil
    }
}
