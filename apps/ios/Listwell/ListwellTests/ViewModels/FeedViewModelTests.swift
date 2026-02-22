import Testing
import Foundation
@testable import Listwell

@Suite("FeedViewModel")
struct FeedViewModelTests {

    // MARK: - Mock Service

    enum MockListingsService: ListingsServiceProtocol {
        nonisolated(unsafe) static var result: Result<[Listing], Error> = .success([])

        static func fetchListings(token: String, client: APIClient) async throws -> [Listing] {
            try result.get()
        }

        static func fetchListing(id: String, token: String, client: APIClient) async throws -> Listing {
            fatalError("Not used in FeedViewModel tests")
        }

        static func updateListing(id: String, updates: PatchListingRequest, token: String, client: APIClient) async throws -> Listing {
            fatalError("Not used in FeedViewModel tests")
        }

        static func deleteListing(id: String, token: String, client: APIClient) async throws {
            fatalError("Not used in FeedViewModel tests")
        }

        static func reset() {
            result = .success([])
        }
    }

    // MARK: - Helpers

    private static func sampleListing(
        id: String = "listing-1",
        title: String? = "Test Listing",
        status: ListingStatus = .ready,
        pipelineStep: PipelineStep = .complete
    ) -> Listing {
        Listing(
            id: id,
            userId: "user-1",
            rawDescription: nil,
            title: title,
            description: "A test listing",
            suggestedPrice: 25.00,
            priceRangeLow: 20.00,
            priceRangeHigh: 30.00,
            category: "Electronics",
            condition: "Good",
            brand: "TestBrand",
            model: "Model X",
            researchNotes: nil,
            comparables: nil,
            status: status,
            pipelineStep: pipelineStep,
            pipelineError: nil,
            agentLog: nil,
            inngestRunId: nil,
            createdAt: Date(),
            updatedAt: Date(),
            images: nil
        )
    }

    // MARK: - Tests

    @Test("loadListings populates listings array")
    @MainActor
    func loadListingsSuccess() async {
        MockListingsService.result = .success([
            Self.sampleListing(id: "listing-1", title: "Item A"),
            Self.sampleListing(id: "listing-2", title: "Item B"),
        ])

        let viewModel = FeedViewModel(listingsService: MockListingsService.self)
        await viewModel.loadListings(token: "test-token")

        #expect(viewModel.listings.count == 2)
        #expect(viewModel.listings[0].title == "Item A")
        #expect(viewModel.listings[1].title == "Item B")
        #expect(viewModel.isLoading == false)
        #expect(viewModel.errorMessage == nil)
    }

    @Test("loadListings with nil token does nothing")
    @MainActor
    func loadListingsNilToken() async {
        let viewModel = FeedViewModel(listingsService: MockListingsService.self)
        await viewModel.loadListings(token: nil)

        #expect(viewModel.listings.isEmpty)
        #expect(viewModel.isLoading == false)
    }

    @Test("loadListings sets error on failure")
    @MainActor
    func loadListingsError() async {
        MockListingsService.result = .failure(APIError.networkError(
            NSError(domain: "test", code: -1)
        ))

        let viewModel = FeedViewModel(listingsService: MockListingsService.self)
        await viewModel.loadListings(token: "test-token")

        #expect(viewModel.listings.isEmpty)
        #expect(viewModel.errorMessage != nil)
        #expect(viewModel.isLoading == false)
    }

    @Test("loadListings handles empty array")
    @MainActor
    func loadListingsEmpty() async {
        MockListingsService.result = .success([])

        let viewModel = FeedViewModel(listingsService: MockListingsService.self)
        await viewModel.loadListings(token: "test-token")

        #expect(viewModel.listings.isEmpty)
        #expect(viewModel.errorMessage == nil)
    }

    @Test("refresh calls loadListings")
    @MainActor
    func refreshReloads() async {
        MockListingsService.result = .success([
            Self.sampleListing(id: "listing-1"),
        ])

        let viewModel = FeedViewModel(listingsService: MockListingsService.self)
        await viewModel.refresh(token: "test-token")

        #expect(viewModel.listings.count == 1)
    }

    @Test("listings start empty")
    @MainActor
    func initialState() {
        let viewModel = FeedViewModel(listingsService: MockListingsService.self)
        #expect(viewModel.listings.isEmpty)
        #expect(viewModel.isLoading == false)
        #expect(viewModel.errorMessage == nil)
    }
}
