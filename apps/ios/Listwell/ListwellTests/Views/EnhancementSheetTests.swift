import Testing
import Foundation
@testable import Listwell

@Suite("EnhancementViewModel")
struct EnhancementViewModelTests {

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

    @Test("view model initializes with listingId")
    @MainActor
    func viewModelInit() {
        let viewModel = EnhancementViewModel(listingId: "listing-1")

        #expect(!viewModel.isEnhancing)
        #expect(viewModel.enhancingImageId == nil)
        #expect(viewModel.newlyEnhancedImageId == nil)
    }

    // MARK: - Enhancement State

    @Test("isEnhancing defaults to false")
    @MainActor
    func isEnhancingDefaultFalse() {
        let viewModel = EnhancementViewModel(listingId: "listing-1")
        #expect(!viewModel.isEnhancing)
    }

    @Test("errorMessage defaults to nil")
    @MainActor
    func errorMessageDefaultNil() {
        let viewModel = EnhancementViewModel(listingId: "listing-1")
        #expect(viewModel.errorMessage == nil)
    }

    @Test("enhancingImageId defaults to nil")
    @MainActor
    func enhancingImageIdDefaultNil() {
        let viewModel = EnhancementViewModel(listingId: "listing-1")
        #expect(viewModel.enhancingImageId == nil)
    }

    @Test("newlyEnhancedImageId defaults to nil")
    @MainActor
    func newlyEnhancedImageIdDefaultNil() {
        let viewModel = EnhancementViewModel(listingId: "listing-1")
        #expect(viewModel.newlyEnhancedImageId == nil)
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
