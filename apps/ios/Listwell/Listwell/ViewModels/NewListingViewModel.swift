import Foundation
import UIKit

@Observable
@MainActor
final class NewListingViewModel {
    var selectedImages: [UIImage] = []
    var description: String = ""
    var isSubmitting = false
    var errorMessage: String?
    var submittedListingId: String?
    var uploadProgress: Double = 0

    var canAddMore: Bool {
        selectedImages.count < APIConfig.maxPhotos
    }

    var canProceed: Bool {
        !selectedImages.isEmpty
    }

    func addImage(_ image: UIImage) {
        guard canAddMore else { return }
        selectedImages.append(image)
    }

    func removeImage(at index: Int) {
        guard selectedImages.indices.contains(index) else { return }
        selectedImages.remove(at: index)
    }

    func submitListing(token: String?) async {
        guard let token, !selectedImages.isEmpty else { return }
        isSubmitting = true
        errorMessage = nil
        uploadProgress = 0
        defer { isSubmitting = false }

        do {
            let imageRefs = try await ImageUploadService.uploadImages(
                selectedImages, token: token
            )
            uploadProgress = 0.8

            let listing = try await ListingsService.createListing(
                description: description.isEmpty ? nil : description,
                images: imageRefs,
                token: token
            )
            uploadProgress = 1.0
            submittedListingId = listing.id
        } catch let error as APIError {
            errorMessage = error.errorDescription
        } catch {
            errorMessage = "Failed to create listing."
        }
    }

    func reset() {
        selectedImages = []
        description = ""
        isSubmitting = false
        errorMessage = nil
        submittedListingId = nil
        uploadProgress = 0
    }
}
