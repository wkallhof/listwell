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

    @Test("updateField requires token")
    @MainActor
    func updateFieldWithoutToken() async {
        let viewModel = ListingDetailViewModel()
        await viewModel.updateField(title: "New Title", token: nil)
        #expect(viewModel.listing == nil)
    }

    @Test("updateField requires listingId to be loaded first")
    @MainActor
    func updateFieldWithoutListingId() async {
        let viewModel = ListingDetailViewModel()
        await viewModel.updateField(title: "New Title", token: "test-token")
        #expect(viewModel.listing == nil)
    }

    @Test("updateStatus requires listingId to be loaded first")
    @MainActor
    func updateStatusWithoutListingId() async {
        let viewModel = ListingDetailViewModel()
        await viewModel.updateStatus("LISTED", token: "test-token")
        #expect(viewModel.listing == nil)
    }

    @Test("deleteListing returns false without listingId")
    @MainActor
    func deleteListingWithoutListingId() async {
        let viewModel = ListingDetailViewModel()
        let result = await viewModel.deleteListing(token: "test-token")
        #expect(!result)
    }

    @Test("retryGeneration requires listingId")
    @MainActor
    func retryWithoutListingId() async {
        let viewModel = ListingDetailViewModel()
        await viewModel.retryGeneration(token: "test-token")
        #expect(viewModel.listing == nil)
    }

    @Test("cancelPolling is safe to call when not polling")
    @MainActor
    func cancelPollingWhenIdle() {
        let viewModel = ListingDetailViewModel()
        viewModel.cancelPolling()
        #expect(!viewModel.isPolling)
    }

    @Test("stopPolling is idempotent")
    @MainActor
    func stopPollingIdempotent() {
        let viewModel = ListingDetailViewModel()
        viewModel.stopPolling()
        viewModel.stopPolling()
        #expect(!viewModel.isPolling)
    }
}
