import Foundation

@Observable
@MainActor
final class EnhancementViewModel {
    var originalImage: ListingImage
    var enhancedVariants: [ListingImage]
    var isEnhancing = false
    var errorMessage: String?

    private let listingId: String
    private nonisolated(unsafe) var pollingTask: Task<Void, Never>?

    init(originalImage: ListingImage, listingId: String, allImages: [ListingImage]) {
        self.originalImage = originalImage
        self.listingId = listingId
        self.enhancedVariants = Self.variants(of: originalImage, in: allImages)
    }

    private static func variants(of image: ListingImage, in images: [ListingImage]) -> [ListingImage] {
        images.filter { $0.type == .enhanced && $0.parentImageId == image.id }
    }

    deinit {
        pollingTask?.cancel()
    }

    func requestEnhancement(token: String?) async {
        guard let token else { return }
        isEnhancing = true
        errorMessage = nil

        do {
            try await ListingsService.enhanceImage(
                listingId: listingId,
                imageId: originalImage.id,
                token: token
            )
            await pollForNewVariant(token: token)
        } catch let error as APIError {
            isEnhancing = false
            errorMessage = error.errorDescription
        } catch {
            isEnhancing = false
            errorMessage = "Enhancement failed."
        }
    }

    func deleteVariant(_ variant: ListingImage, token: String?) async {
        guard let token else { return }

        do {
            try await ListingsService.deleteImage(
                listingId: listingId,
                imageId: variant.id,
                token: token
            )
            enhancedVariants.removeAll { $0.id == variant.id }
        } catch let error as APIError {
            errorMessage = error.errorDescription
        } catch {
            errorMessage = "Failed to delete variant."
        }
    }

    private func pollForNewVariant(token: String) async {
        let previousCount = enhancedVariants.count
        pollingTask?.cancel()

        pollingTask = Task { [weak self] in
            guard let self else { return }

            for _ in 0..<30 { // max ~90 seconds of polling
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
                    let newVariants = Self.variants(of: originalImage, in: listing.images ?? [])

                    if newVariants.count > previousCount {
                        enhancedVariants = newVariants
                        isEnhancing = false
                        return
                    }
                } catch {
                    // Continue polling on transient errors
                }
            }

            // Polling timed out
            isEnhancing = false
            errorMessage = "Enhancement is taking longer than expected. Pull to refresh."
        }

        await pollingTask?.value
    }

    func stopPolling() {
        pollingTask?.cancel()
        pollingTask = nil
    }
}
