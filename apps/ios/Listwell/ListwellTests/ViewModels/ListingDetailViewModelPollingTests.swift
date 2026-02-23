import Testing
import Foundation
import UIKit
@testable import Listwell

// MARK: - Mock Service

private enum MockDetailService: ListingsServiceProtocol {
    nonisolated(unsafe) static var fetchListingsResult: Result<[Listing], Error> = .success([])
    nonisolated(unsafe) static var fetchListingResult: Result<Listing, Error>?
    nonisolated(unsafe) static var updateListingResult: Result<Listing, Error>?
    nonisolated(unsafe) static var deleteListingResult: Result<Void, Error> = .success(())
    nonisolated(unsafe) static var fetchCallCount = 0
    nonisolated(unsafe) static var lastUpdateBody: PatchListingRequest?

    static func fetchListings(token: String, client: APIClient) async throws -> [Listing] {
        try fetchListingsResult.get()
    }

    static func fetchListing(id: String, token: String, client: APIClient) async throws -> Listing {
        fetchCallCount += 1
        guard let result = fetchListingResult else {
            throw APIError.httpError(statusCode: 404, body: "Not found")
        }
        return try result.get()
    }

    static func updateListing(id: String, updates: PatchListingRequest, token: String, client: APIClient) async throws -> Listing {
        lastUpdateBody = updates
        guard let result = updateListingResult else {
            throw APIError.httpError(statusCode: 400, body: "Bad request")
        }
        return try result.get()
    }

    static func deleteListing(id: String, token: String, client: APIClient) async throws {
        try deleteListingResult.get()
    }

    static func reset() {
        fetchListingsResult = .success([])
        fetchListingResult = nil
        updateListingResult = nil
        deleteListingResult = .success(())
        fetchCallCount = 0
        lastUpdateBody = nil
    }
}

// MARK: - Helpers

private func makeProcessingListing(
    pipelineStep: PipelineStep = .analyzing,
    pipelineError: String? = nil
) -> Listing {
    Listing(
        id: "test-1",
        userId: "user-1",
        rawDescription: "Test item",
        title: nil,
        description: nil,
        suggestedPrice: nil,
        priceRangeLow: nil,
        priceRangeHigh: nil,
        category: nil,
        condition: nil,
        brand: nil,
        model: nil,
        researchNotes: nil,
        comparables: nil,
        status: .processing,
        pipelineStep: pipelineStep,
        pipelineError: pipelineError,
        agentLog: nil,
        inngestRunId: "run-1",
        createdAt: Date(),
        updatedAt: Date(),
        images: []
    )
}

private func makeReadyListing() -> Listing {
    Listing(
        id: "test-1",
        userId: "user-1",
        rawDescription: "Test item",
        title: "Nike Air Max 90",
        description: "Classic sneakers",
        suggestedPrice: 85,
        priceRangeLow: 60,
        priceRangeHigh: 110,
        category: "Shoes",
        condition: "Good",
        brand: "Nike",
        model: "Air Max 90",
        researchNotes: "Popular model",
        comparables: [],
        status: .ready,
        pipelineStep: .complete,
        pipelineError: nil,
        agentLog: nil,
        inngestRunId: "run-1",
        createdAt: Date(),
        updatedAt: Date(),
        images: []
    )
}

private func makeErrorListing() -> Listing {
    Listing(
        id: "test-1",
        userId: "user-1",
        rawDescription: "Test item",
        title: nil,
        description: nil,
        suggestedPrice: nil,
        priceRangeLow: nil,
        priceRangeHigh: nil,
        category: nil,
        condition: nil,
        brand: nil,
        model: nil,
        researchNotes: nil,
        comparables: nil,
        status: .processing,
        pipelineStep: .error,
        pipelineError: "AI agent crashed",
        agentLog: nil,
        inngestRunId: "run-1",
        createdAt: Date(),
        updatedAt: Date(),
        images: []
    )
}

// MARK: - Tests

@Suite("ListingDetailViewModel Polling")
struct ListingDetailViewModelPollingTests {

    init() {
        MockDetailService.reset()
    }

    @Test("starts with no polling")
    @MainActor
    func initialState() {
        let viewModel = ListingDetailViewModel(listingsService: MockDetailService.self)
        #expect(!viewModel.isPolling)
    }

    @Test("loadListing starts polling for processing listing")
    @MainActor
    func loadProcessingStartsPolling() async {
        MockDetailService.fetchListingResult = .success(makeProcessingListing())

        let viewModel = ListingDetailViewModel(listingsService: MockDetailService.self)
        await viewModel.loadListing(id: "test-1", token: "test-token")

        #expect(viewModel.listing != nil)
        #expect(viewModel.listing?.isProcessing == true)
        #expect(viewModel.isPolling)

        viewModel.stopPolling()
        #expect(!viewModel.isPolling)
    }

    @Test("loadListing does not poll for ready listing")
    @MainActor
    func loadReadyNoPolling() async {
        MockDetailService.fetchListingResult = .success(makeReadyListing())

        let viewModel = ListingDetailViewModel(listingsService: MockDetailService.self)
        await viewModel.loadListing(id: "test-1", token: "test-token")

        #expect(viewModel.listing != nil)
        #expect(viewModel.listing?.isReady == true)
        #expect(!viewModel.isPolling)
    }

    @Test("stopPolling cancels active polling")
    @MainActor
    func stopPollingCancels() async {
        MockDetailService.fetchListingResult = .success(makeProcessingListing(pipelineStep: .researching))

        let viewModel = ListingDetailViewModel(listingsService: MockDetailService.self)
        await viewModel.loadListing(id: "test-1", token: "test-token")
        #expect(viewModel.isPolling)

        viewModel.stopPolling()
        #expect(!viewModel.isPolling)
    }

    @Test("retryGeneration requires token and listingId")
    @MainActor
    func retryWithoutToken() async {
        let viewModel = ListingDetailViewModel(listingsService: MockDetailService.self)
        await viewModel.retryGeneration(token: nil)
        #expect(viewModel.listing == nil)
    }

    @Test("retryGeneration sends correct PATCH body")
    @MainActor
    func retryGenerationRequest() async {
        MockDetailService.fetchListingResult = .success(makeErrorListing())

        let viewModel = ListingDetailViewModel(listingsService: MockDetailService.self)
        await viewModel.loadListing(id: "test-1", token: "test-token")
        #expect(viewModel.listing?.pipelineStep == .error)

        // Set up retry response
        let retryListing = makeProcessingListing(pipelineStep: .pending)
        MockDetailService.updateListingResult = .success(retryListing)
        MockDetailService.fetchListingResult = .success(retryListing)

        await viewModel.retryGeneration(token: "test-token")
        #expect(viewModel.listing?.pipelineStep == .pending)
        #expect(MockDetailService.lastUpdateBody?.retry == true)
        #expect(MockDetailService.lastUpdateBody?.status == "PROCESSING")
        #expect(MockDetailService.lastUpdateBody?.pipelineStep == "PENDING")

        viewModel.stopPolling()
    }

    @Test("retryGeneration sets error on failure")
    @MainActor
    func retryGenerationFailure() async {
        MockDetailService.fetchListingResult = .success(makeErrorListing())

        let viewModel = ListingDetailViewModel(listingsService: MockDetailService.self)
        await viewModel.loadListing(id: "test-1", token: "test-token")

        MockDetailService.updateListingResult = nil // will throw

        await viewModel.retryGeneration(token: "test-token")
        #expect(viewModel.errorMessage != nil)
    }

    @Test("cancelPolling is an alias for stopPolling")
    @MainActor
    func cancelPollingStops() {
        let viewModel = ListingDetailViewModel(listingsService: MockDetailService.self)
        viewModel.cancelPolling()
        #expect(!viewModel.isPolling)
    }

    @Test("listing isProcessing is true for processing status with non-terminal step")
    func isProcessingCheck() {
        let processing = makeProcessingListing(pipelineStep: .analyzing)
        #expect(processing.isProcessing)

        let ready = makeReadyListing()
        #expect(!ready.isProcessing)

        let errorListing = makeErrorListing()
        #expect(!errorListing.isProcessing)
    }

    @Test("error listing has pipeline error message")
    func errorListingMessage() {
        let listing = makeErrorListing()
        #expect(listing.pipelineStep == .error)
        #expect(listing.pipelineError == "AI agent crashed")
    }

    @Test("loadListing sets error for API failure")
    @MainActor
    func loadListingAPIError() async {
        MockDetailService.fetchListingResult = nil // will throw 404

        let viewModel = ListingDetailViewModel(listingsService: MockDetailService.self)
        await viewModel.loadListing(id: "nonexistent", token: "test-token")

        #expect(viewModel.listing == nil)
        #expect(viewModel.errorMessage != nil)
    }

    @Test("deleteListing returns true on success")
    @MainActor
    func deleteListingSuccess() async {
        MockDetailService.fetchListingResult = .success(makeReadyListing())
        MockDetailService.deleteListingResult = .success(())

        let viewModel = ListingDetailViewModel(listingsService: MockDetailService.self)
        await viewModel.loadListing(id: "test-1", token: "test-token")

        let result = await viewModel.deleteListing(token: "test-token")
        #expect(result)
    }

    @Test("updateStatus updates listing")
    @MainActor
    func updateStatusSuccess() async {
        let readyListing = makeReadyListing()
        MockDetailService.fetchListingResult = .success(readyListing)

        let viewModel = ListingDetailViewModel(listingsService: MockDetailService.self)
        await viewModel.loadListing(id: "test-1", token: "test-token")

        let listed = Listing(
            id: "test-1", userId: "user-1", rawDescription: "Test item",
            title: "Nike Air Max 90", description: "Classic sneakers",
            suggestedPrice: 85, priceRangeLow: 60, priceRangeHigh: 110,
            category: "Shoes", condition: "Good", brand: "Nike", model: "Air Max 90",
            researchNotes: "Popular model", comparables: [],
            status: .listed, pipelineStep: .complete, pipelineError: nil,
            agentLog: nil, inngestRunId: "run-1",
            createdAt: Date(), updatedAt: Date(), images: []
        )
        MockDetailService.updateListingResult = .success(listed)

        await viewModel.updateStatus("LISTED", token: "test-token")
        #expect(viewModel.listing?.status == .listed)
    }

    @Test("updateField updates title")
    @MainActor
    func updateFieldTitle() async {
        MockDetailService.fetchListingResult = .success(makeReadyListing())

        let viewModel = ListingDetailViewModel(listingsService: MockDetailService.self)
        await viewModel.loadListing(id: "test-1", token: "test-token")

        let updated = Listing(
            id: "test-1", userId: "user-1", rawDescription: "Test item",
            title: "Updated Title", description: "Classic sneakers",
            suggestedPrice: 85, priceRangeLow: 60, priceRangeHigh: 110,
            category: "Shoes", condition: "Good", brand: "Nike", model: "Air Max 90",
            researchNotes: "Popular model", comparables: [],
            status: .ready, pipelineStep: .complete, pipelineError: nil,
            agentLog: nil, inngestRunId: "run-1",
            createdAt: Date(), updatedAt: Date(), images: []
        )
        MockDetailService.updateListingResult = .success(updated)

        await viewModel.updateField(title: "Updated Title", token: "test-token")
        #expect(viewModel.listing?.title == "Updated Title")
        #expect(MockDetailService.lastUpdateBody?.title == "Updated Title")
    }

    @Test("updateField updates description")
    @MainActor
    func updateFieldDescription() async {
        MockDetailService.fetchListingResult = .success(makeReadyListing())

        let viewModel = ListingDetailViewModel(listingsService: MockDetailService.self)
        await viewModel.loadListing(id: "test-1", token: "test-token")

        let updated = Listing(
            id: "test-1", userId: "user-1", rawDescription: "Test item",
            title: "Nike Air Max 90", description: "New description",
            suggestedPrice: 85, priceRangeLow: 60, priceRangeHigh: 110,
            category: "Shoes", condition: "Good", brand: "Nike", model: "Air Max 90",
            researchNotes: "Popular model", comparables: [],
            status: .ready, pipelineStep: .complete, pipelineError: nil,
            agentLog: nil, inngestRunId: "run-1",
            createdAt: Date(), updatedAt: Date(), images: []
        )
        MockDetailService.updateListingResult = .success(updated)

        await viewModel.updateField(description: "New description", token: "test-token")
        #expect(viewModel.listing?.description == "New description")
        #expect(MockDetailService.lastUpdateBody?.description == "New description")
    }

    @Test("updateField updates suggestedPrice")
    @MainActor
    func updateFieldPrice() async {
        MockDetailService.fetchListingResult = .success(makeReadyListing())

        let viewModel = ListingDetailViewModel(listingsService: MockDetailService.self)
        await viewModel.loadListing(id: "test-1", token: "test-token")

        let updated = Listing(
            id: "test-1", userId: "user-1", rawDescription: "Test item",
            title: "Nike Air Max 90", description: "Classic sneakers",
            suggestedPrice: 120, priceRangeLow: 60, priceRangeHigh: 110,
            category: "Shoes", condition: "Good", brand: "Nike", model: "Air Max 90",
            researchNotes: "Popular model", comparables: [],
            status: .ready, pipelineStep: .complete, pipelineError: nil,
            agentLog: nil, inngestRunId: "run-1",
            createdAt: Date(), updatedAt: Date(), images: []
        )
        MockDetailService.updateListingResult = .success(updated)

        await viewModel.updateField(suggestedPrice: 120, token: "test-token")
        #expect(viewModel.listing?.suggestedPrice == 120)
        #expect(MockDetailService.lastUpdateBody?.suggestedPrice == 120)
    }

    @Test("updateField sets error on API failure")
    @MainActor
    func updateFieldError() async {
        MockDetailService.fetchListingResult = .success(makeReadyListing())

        let viewModel = ListingDetailViewModel(listingsService: MockDetailService.self)
        await viewModel.loadListing(id: "test-1", token: "test-token")

        MockDetailService.updateListingResult = nil // will throw

        await viewModel.updateField(title: "Fail", token: "test-token")
        #expect(viewModel.errorMessage != nil)
    }

    @Test("updateStatus sets error on failure")
    @MainActor
    func updateStatusError() async {
        MockDetailService.fetchListingResult = .success(makeReadyListing())

        let viewModel = ListingDetailViewModel(listingsService: MockDetailService.self)
        await viewModel.loadListing(id: "test-1", token: "test-token")

        MockDetailService.updateListingResult = nil // will throw

        await viewModel.updateStatus("LISTED", token: "test-token")
        #expect(viewModel.errorMessage != nil)
    }

    @Test("deleteListing returns false on failure")
    @MainActor
    func deleteListingFailure() async {
        MockDetailService.fetchListingResult = .success(makeReadyListing())
        MockDetailService.deleteListingResult = .failure(APIError.httpError(statusCode: 500, body: "Error"))

        let viewModel = ListingDetailViewModel(listingsService: MockDetailService.self)
        await viewModel.loadListing(id: "test-1", token: "test-token")

        let result = await viewModel.deleteListing(token: "test-token")
        #expect(!result)
        #expect(viewModel.errorMessage != nil)
    }

    @Test("copyFullListing copies formatted text to pasteboard")
    @MainActor
    func copyFullListingSuccess() {
        let viewModel = ListingDetailViewModel(listingsService: MockDetailService.self)
        viewModel.listing = makeReadyListing()
        viewModel.copyFullListing()
        // The pasteboard should contain formatted text
        let text = UIPasteboard.general.string ?? ""
        #expect(text.contains("Nike Air Max 90"))
        #expect(text.contains("$85"))
    }
}
