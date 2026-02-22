import Testing
import UIKit
@testable import Listwell

@Suite("NewListingViewModel")
struct NewListingViewModelTests {

    private func createTestImage() -> UIImage {
        let format = UIGraphicsImageRendererFormat()
        format.scale = 1.0
        let renderer = UIGraphicsImageRenderer(
            size: CGSize(width: 100, height: 100), format: format
        )
        return renderer.image { context in
            UIColor.red.setFill()
            context.fill(CGRect(x: 0, y: 0, width: 100, height: 100))
        }
    }

    @Test("starts with empty images")
    @MainActor
    func initialState() {
        let viewModel = NewListingViewModel()
        #expect(viewModel.selectedImages.isEmpty)
        #expect(viewModel.description == "")
        #expect(viewModel.isSubmitting == false)
        #expect(viewModel.errorMessage == nil)
        #expect(viewModel.submittedListingId == nil)
    }

    @Test("addImage appends image to selectedImages")
    @MainActor
    func addImage() {
        let viewModel = NewListingViewModel()
        let image = createTestImage()
        viewModel.addImage(image)
        #expect(viewModel.selectedImages.count == 1)
    }

    @Test("addImage respects max 5 limit")
    @MainActor
    func addImageLimit() {
        let viewModel = NewListingViewModel()
        for _ in 0..<6 {
            viewModel.addImage(createTestImage())
        }
        #expect(viewModel.selectedImages.count == 5)
    }

    @Test("removeImage removes at index")
    @MainActor
    func removeImage() {
        let viewModel = NewListingViewModel()
        viewModel.addImage(createTestImage())
        viewModel.addImage(createTestImage())
        #expect(viewModel.selectedImages.count == 2)
        viewModel.removeImage(at: 0)
        #expect(viewModel.selectedImages.count == 1)
    }

    @Test("removeImage with out of bounds index does nothing")
    @MainActor
    func removeImageOutOfBounds() {
        let viewModel = NewListingViewModel()
        viewModel.addImage(createTestImage())
        viewModel.removeImage(at: 5)
        #expect(viewModel.selectedImages.count == 1)
    }

    @Test("canAddMore is true when under limit")
    @MainActor
    func canAddMoreTrue() {
        let viewModel = NewListingViewModel()
        viewModel.addImage(createTestImage())
        #expect(viewModel.canAddMore)
    }

    @Test("canAddMore is false at limit")
    @MainActor
    func canAddMoreFalse() {
        let viewModel = NewListingViewModel()
        for _ in 0..<5 {
            viewModel.addImage(createTestImage())
        }
        #expect(!viewModel.canAddMore)
    }

    @Test("canProceed is false with no images")
    @MainActor
    func canProceedFalse() {
        let viewModel = NewListingViewModel()
        #expect(!viewModel.canProceed)
    }

    @Test("canProceed is true with at least one image")
    @MainActor
    func canProceedTrue() {
        let viewModel = NewListingViewModel()
        viewModel.addImage(createTestImage())
        #expect(viewModel.canProceed)
    }

    @Test("reset clears all state")
    @MainActor
    func reset() {
        let viewModel = NewListingViewModel()
        viewModel.addImage(createTestImage())
        viewModel.description = "Test description"
        viewModel.submittedListingId = "listing-1"
        viewModel.reset()

        #expect(viewModel.selectedImages.isEmpty)
        #expect(viewModel.description == "")
        #expect(viewModel.submittedListingId == nil)
        #expect(viewModel.errorMessage == nil)
    }

    @Test("submitListing with nil token does nothing")
    @MainActor
    func submitNilToken() async {
        let viewModel = NewListingViewModel()
        viewModel.addImage(createTestImage())
        await viewModel.submitListing(token: nil)
        #expect(viewModel.submittedListingId == nil)
        #expect(!viewModel.isSubmitting)
    }

    @Test("submitListing with no images does nothing")
    @MainActor
    func submitNoImages() async {
        let viewModel = NewListingViewModel()
        await viewModel.submitListing(token: "test-token")
        #expect(viewModel.submittedListingId == nil)
    }
}

@Suite("PhotoGridView")
struct PhotoGridViewTests {

    @Test("grid initializes with correct properties")
    @MainActor
    func initProperties() {
        var removedIndex: Int?
        var addTapped = false

        let grid = PhotoGridView(
            images: [],
            canAddMore: true,
            onRemove: { removedIndex = $0 },
            onAddTapped: { addTapped = true }
        )

        #expect(grid.images.isEmpty)
        #expect(grid.canAddMore)
        grid.onRemove(2)
        #expect(removedIndex == 2)
        grid.onAddTapped()
        #expect(addTapped)
    }
}
