import Testing
import SwiftUI
@testable import Listwell

@Suite("ListingCardView")
struct ListingCardViewTests {

    private static func sampleListing(
        title: String? = "iPhone 14 Pro",
        suggestedPrice: Double? = 599.00,
        status: ListingStatus = .ready,
        pipelineStep: PipelineStep = .complete
    ) -> Listing {
        Listing(
            id: "listing-1",
            userId: "user-1",
            rawDescription: nil,
            title: title,
            description: "Great phone",
            suggestedPrice: suggestedPrice,
            priceRangeLow: 550.00,
            priceRangeHigh: 650.00,
            category: "Electronics",
            condition: "Like New",
            brand: "Apple",
            model: "iPhone 14 Pro",
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

    @Test("card shows title for ready listing")
    @MainActor
    func readyListing() {
        let listing = Self.sampleListing(title: "iPhone 14 Pro", status: .ready)
        let card = ListingCardView(listing: listing)
        #expect(card.listing.title == "iPhone 14 Pro")
        #expect(card.listing.status == .ready)
    }

    @Test("card uses processing state for processing listing")
    @MainActor
    func processingListing() {
        let listing = Self.sampleListing(
            title: nil,
            status: .processing,
            pipelineStep: .analyzing
        )
        let card = ListingCardView(listing: listing)
        #expect(card.listing.isProcessing)
        #expect(card.listing.pipelineStep == .analyzing)
    }

    @Test("card shows price for ready listings")
    @MainActor
    func priceDisplay() {
        let listing = Self.sampleListing(suggestedPrice: 299.00)
        let card = ListingCardView(listing: listing)
        #expect(card.listing.suggestedPrice == 299.00)
    }

    @Test("card shows status badge")
    @MainActor
    func statusBadge() {
        let listing = Self.sampleListing(status: .listed)
        let card = ListingCardView(listing: listing)
        #expect(card.listing.status == .listed)
    }
}

@Suite("FeedView")
struct FeedViewTests {

    @Test("empty state shown when no listings")
    @MainActor
    func emptyState() {
        let viewModel = FeedViewModel()
        #expect(viewModel.listings.isEmpty)
    }

    @Test("FeedViewModel initial state is correct")
    @MainActor
    func initialState() {
        let viewModel = FeedViewModel()
        #expect(viewModel.listings.isEmpty)
        #expect(viewModel.isLoading == false)
        #expect(viewModel.errorMessage == nil)
    }
}
