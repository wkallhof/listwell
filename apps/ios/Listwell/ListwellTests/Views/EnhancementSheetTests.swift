import Testing
import Foundation
@testable import Listwell

@Suite("EnhancementSheet")
struct EnhancementSheetTests {

    // MARK: - Test Helpers

    private func makeOriginalImage(id: String = "img-1") -> ListingImage {
        ListingImage(
            id: id,
            listingId: "listing-1",
            type: .original,
            blobUrl: "https://blob.test.com/original.jpg",
            blobKey: "original.jpg",
            parentImageId: nil,
            sortOrder: 0,
            isPrimary: true,
            geminiPrompt: nil,
            createdAt: Date()
        )
    }

    private func makeEnhancedImage(
        id: String = "img-2",
        parentId: String = "img-1"
    ) -> ListingImage {
        ListingImage(
            id: id,
            listingId: "listing-1",
            type: .enhanced,
            blobUrl: "https://blob.test.com/enhanced.jpg",
            blobKey: "enhanced.jpg",
            parentImageId: parentId,
            sortOrder: 1,
            isPrimary: false,
            geminiPrompt: "Clean up background",
            createdAt: Date()
        )
    }

    // MARK: - View Model State

    @Test("sheet creates view model with correct original image")
    @MainActor
    func viewModelOriginalImage() {
        let original = makeOriginalImage()
        let viewModel = EnhancementViewModel(
            originalImage: original,
            listingId: "listing-1",
            allImages: [original]
        )

        #expect(viewModel.originalImage.id == "img-1")
        #expect(viewModel.originalImage.isOriginal)
    }

    @Test("sheet view model filters enhanced variants by parentImageId")
    @MainActor
    func viewModelFiltersVariants() {
        let original = makeOriginalImage()
        let enhanced1 = makeEnhancedImage(id: "img-2", parentId: "img-1")
        let enhanced2 = makeEnhancedImage(id: "img-3", parentId: "img-1")
        let unrelated = makeEnhancedImage(id: "img-4", parentId: "other-img")

        let viewModel = EnhancementViewModel(
            originalImage: original,
            listingId: "listing-1",
            allImages: [original, enhanced1, enhanced2, unrelated]
        )

        #expect(viewModel.enhancedVariants.count == 2)
        #expect(viewModel.enhancedVariants.allSatisfy { $0.parentImageId == "img-1" })
    }

    @Test("sheet view model shows empty variants for image with no enhancements")
    @MainActor
    func viewModelEmptyVariants() {
        let original = makeOriginalImage()

        let viewModel = EnhancementViewModel(
            originalImage: original,
            listingId: "listing-1",
            allImages: [original]
        )

        #expect(viewModel.enhancedVariants.isEmpty)
        #expect(!viewModel.isEnhancing)
    }

    // MARK: - Enhancement State

    @Test("isEnhancing defaults to false")
    @MainActor
    func isEnhancingDefaultFalse() {
        let original = makeOriginalImage()
        let viewModel = EnhancementViewModel(
            originalImage: original,
            listingId: "listing-1",
            allImages: [original]
        )

        #expect(!viewModel.isEnhancing)
    }

    @Test("errorMessage defaults to nil")
    @MainActor
    func errorMessageDefaultNil() {
        let original = makeOriginalImage()
        let viewModel = EnhancementViewModel(
            originalImage: original,
            listingId: "listing-1",
            allImages: [original]
        )

        #expect(viewModel.errorMessage == nil)
    }

    // MARK: - Image Types

    @Test("original image has isOriginal true")
    func originalImageType() {
        let image = makeOriginalImage()
        #expect(image.isOriginal)
        #expect(!image.isEnhanced)
    }

    @Test("enhanced image has isEnhanced true")
    func enhancedImageType() {
        let image = makeEnhancedImage()
        #expect(image.isEnhanced)
        #expect(!image.isOriginal)
    }

    @Test("enhanced image has parentImageId set")
    func enhancedParentId() {
        let image = makeEnhancedImage(parentId: "img-1")
        #expect(image.parentImageId == "img-1")
    }
}
