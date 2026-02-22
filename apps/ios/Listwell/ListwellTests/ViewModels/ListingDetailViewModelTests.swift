import Testing
import Foundation
@testable import Listwell

@Suite("ListingDetailViewModel")
struct ListingDetailViewModelTests {

    @Test("starts with nil listing and no loading")
    @MainActor
    func initialState() {
        let viewModel = ListingDetailViewModel()
        #expect(viewModel.listing == nil)
        #expect(!viewModel.isLoading)
        #expect(viewModel.errorMessage == nil)
        #expect(!viewModel.isPolling)
    }

    @Test("loadListing requires a token")
    @MainActor
    func loadListingWithoutToken() async {
        let viewModel = ListingDetailViewModel()
        await viewModel.loadListing(id: "test-id", token: nil)
        #expect(viewModel.listing == nil)
        #expect(!viewModel.isLoading)
    }

    @Test("updateStatus requires token and listingId")
    @MainActor
    func updateStatusWithoutToken() async {
        let viewModel = ListingDetailViewModel()
        await viewModel.updateStatus("LISTED", token: nil)
        #expect(viewModel.listing == nil)
    }

    @Test("deleteListing returns false without token")
    @MainActor
    func deleteListingWithoutToken() async {
        let viewModel = ListingDetailViewModel()
        let result = await viewModel.deleteListing(token: nil)
        #expect(!result)
    }

    @Test("retryGeneration requires token")
    @MainActor
    func retryWithoutToken() async {
        let viewModel = ListingDetailViewModel()
        await viewModel.retryGeneration(token: nil)
        #expect(viewModel.listing == nil)
    }

    @Test("copyFullListing does nothing without listing")
    @MainActor
    func copyWithoutListing() {
        let viewModel = ListingDetailViewModel()
        viewModel.copyFullListing()
        #expect(viewModel.listing == nil)
    }
}
