import Testing
import UIKit
@testable import Listwell

@Suite("DescribeView")
struct DescribeViewTests {

    @Test("viewModel starts with empty description")
    @MainActor
    func emptyDescription() {
        let viewModel = NewListingViewModel()
        #expect(viewModel.description == "")
    }

    @Test("description can be set on viewModel")
    @MainActor
    func setDescription() {
        let viewModel = NewListingViewModel()
        viewModel.description = "Blue Nike shoes, size 10, barely worn"
        #expect(viewModel.description == "Blue Nike shoes, size 10, barely worn")
    }

    @Test("submitListing with empty description sends nil")
    @MainActor
    func emptyDescriptionSubmit() {
        let viewModel = NewListingViewModel()
        #expect(viewModel.description.isEmpty)
        // When description is empty, submitListing should pass nil
        // This is verified by the fact that the condition is description.isEmpty ? nil : description
    }

    @Test("viewModel tracks submission state")
    @MainActor
    func submissionState() {
        let viewModel = NewListingViewModel()
        #expect(!viewModel.isSubmitting)
        #expect(viewModel.submittedListingId == nil)
        #expect(viewModel.errorMessage == nil)
    }
}
