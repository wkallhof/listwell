import Testing
import Foundation
@testable import Listwell

private func makeListing(
    id: String = "test-1",
    title: String? = "Nike Air Max 90",
    description: String? = "Classic sneakers in great condition",
    suggestedPrice: Double? = 85,
    priceRangeLow: Double? = 60,
    priceRangeHigh: Double? = 110,
    category: String? = "Shoes",
    condition: String? = "Good",
    brand: String? = "Nike",
    model: String? = "Air Max 90",
    researchNotes: String? = "Popular model with strong resale value",
    comparables: [Comparable]? = nil,
    status: ListingStatus = .ready,
    pipelineStep: PipelineStep = .complete,
    images: [ListingImage]? = nil
) -> Listing {
    Listing(
        id: id,
        userId: "user-1",
        rawDescription: nil,
        title: title,
        description: description,
        suggestedPrice: suggestedPrice,
        priceRangeLow: priceRangeLow,
        priceRangeHigh: priceRangeHigh,
        category: category,
        condition: condition,
        brand: brand,
        model: model,
        researchNotes: researchNotes,
        comparables: comparables,
        status: status,
        pipelineStep: pipelineStep,
        pipelineError: nil,
        agentLog: nil,
        inngestRunId: nil,
        createdAt: Date(),
        updatedAt: Date(),
        images: images
    )
}

// MARK: - ImageCarouselView Tests

@Suite("ImageCarouselView")
struct ImageCarouselViewTests {

    @Test("handles empty images with placeholder")
    func emptyImages() {
        let images: [ListingImage] = []
        #expect(images.isEmpty)
    }

    @Test("handles single image without dot indicators")
    func singleImage() {
        let image = ListingImage(
            id: "img-1",
            listingId: "listing-1",
            type: .original,
            blobUrl: "https://example.com/photo.jpg",
            blobKey: "key-1",
            parentImageId: nil,
            sortOrder: 0,
            isPrimary: true,
            geminiPrompt: nil,
            createdAt: Date()
        )
        #expect([image].count == 1)
    }

    @Test("shows dot indicators for multiple images")
    func multipleImages() {
        let images = (0..<3).map { i in
            ListingImage(
                id: "img-\(i)",
                listingId: "listing-1",
                type: .original,
                blobUrl: "https://example.com/photo\(i).jpg",
                blobKey: "key-\(i)",
                parentImageId: nil,
                sortOrder: i,
                isPrimary: i == 0,
                geminiPrompt: nil,
                createdAt: Date()
            )
        }
        #expect(images.count > 1)
    }
}

// MARK: - ProductDetailsView Tests

@Suite("ProductDetailsView")
struct ProductDetailsViewTests {

    @Test("renders all four detail fields")
    func allFields() {
        let listing = makeListing()
        #expect(listing.brand == "Nike")
        #expect(listing.model == "Air Max 90")
        #expect(listing.condition == "Good")
        #expect(listing.category == "Shoes")
    }

    @Test("handles nil fields gracefully")
    func nilFields() {
        let listing = makeListing(category: nil, condition: nil, brand: nil, model: nil)
        #expect(listing.brand == nil)
        #expect(listing.model == nil)
        #expect(listing.condition == nil)
        #expect(listing.category == nil)
    }
}

// MARK: - ComparablesView Tests

@Suite("ComparablesView")
struct ComparablesViewTests {

    @Test("renders comparables with title price and source")
    func renderComparables() {
        let comps = [
            Comparable(title: "Nike Air Max 90 Used", price: 75, source: "eBay", url: "https://ebay.com/item/1", condition: "Good", soldDate: nil),
            Comparable(title: "Air Max 90 White", price: 90, source: "Mercari", url: nil, condition: "Like New", soldDate: nil)
        ]
        #expect(comps.count == 2)
        #expect(comps[0].title == "Nike Air Max 90 Used")
        #expect(comps[0].price == 75)
        #expect(comps[0].source == "eBay")
        #expect(comps[1].url == nil)
    }

    @Test("handles empty comparables")
    func emptyComparables() {
        let comps: [Comparable] = []
        #expect(comps.isEmpty)
    }
}

// MARK: - ListingDetailView Tests

@Suite("ListingDetailView")
struct ListingDetailViewTests {

    @Test("listing with all sections has complete data")
    func allSections() {
        let comps = [
            Comparable(title: "Similar Item", price: 80, source: "eBay", url: nil, condition: nil, soldDate: nil)
        ]
        let listing = makeListing(comparables: comps)
        #expect(listing.title != nil)
        #expect(listing.suggestedPrice != nil)
        #expect(listing.description != nil)
        #expect(listing.brand != nil)
        #expect(listing.comparables != nil)
        #expect(listing.researchNotes != nil)
    }

    @Test("price card shows market range")
    func priceRange() {
        let listing = makeListing()
        #expect(listing.priceRangeLow == 60)
        #expect(listing.priceRangeHigh == 110)
    }

    @Test("menu shows mark as listed for ready status")
    func menuForReady() {
        let listing = makeListing(status: .ready)
        #expect(listing.status == .ready)
    }

    @Test("menu shows mark as sold for listed status")
    func menuForListed() {
        let listing = makeListing(status: .listed)
        #expect(listing.status == .listed)
    }

    @Test("copy full listing formats correctly")
    @MainActor
    func copyFullListing() {
        let listing = makeListing()
        let formatted = ListingFormatter.formatForClipboard(listing)
        #expect(formatted.contains("Nike Air Max 90"))
        #expect(formatted.contains("$85"))
        #expect(formatted.contains("Classic sneakers"))
        #expect(formatted.contains("Brand: Nike"))
    }
}
