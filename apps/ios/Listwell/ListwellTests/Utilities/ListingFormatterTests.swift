import Testing
import Foundation
@testable import Listwell

@Suite("ListingFormatter")
struct ListingFormatterTests {

    private let decoder: JSONDecoder = {
        let d = JSONDecoder()
        let isoFormatter = ISO8601DateFormatter()
        isoFormatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        d.dateDecodingStrategy = .custom { decoder in
            let container = try decoder.singleValueContainer()
            let dateString = try container.decode(String.self)
            if let date = isoFormatter.date(from: dateString) { return date }
            let basic = ISO8601DateFormatter()
            basic.formatOptions = [.withInternetDateTime]
            if let date = basic.date(from: dateString) { return date }
            throw DecodingError.dataCorruptedError(in: container, debugDescription: "Bad date")
        }
        return d
    }()

    private func makeListing(
        title: String? = nil,
        description: String? = nil,
        suggestedPrice: Double? = nil,
        condition: String? = nil,
        brand: String? = nil,
        model: String? = nil
    ) throws -> Listing {
        let json: [String: Any?] = [
            "id": "test",
            "userId": "user",
            "rawDescription": nil,
            "title": title,
            "description": description,
            "suggestedPrice": suggestedPrice,
            "priceRangeLow": nil,
            "priceRangeHigh": nil,
            "category": nil,
            "condition": condition,
            "brand": brand,
            "model": model,
            "researchNotes": nil,
            "comparables": nil,
            "status": "READY",
            "pipelineStep": "COMPLETE",
            "pipelineError": nil,
            "agentLog": nil,
            "inngestRunId": nil,
            "createdAt": "2024-01-20T10:30:00.000Z",
            "updatedAt": "2024-01-20T10:30:00.000Z",
            "images": nil
        ]
        let data = try JSONSerialization.data(withJSONObject: json.compactMapValues { $0 ?? NSNull() })
        return try decoder.decode(Listing.self, from: data)
    }

    @Test("formats full listing with title, price, description, and details")
    func fullListing() throws {
        let listing = try makeListing(
            title: "West Elm Harmony Sofa - Like New Condition",
            description: "Selling my West Elm Harmony sofa. It's in great condition.",
            suggestedPrice: 450,
            condition: "Like New",
            brand: "West Elm",
            model: "Harmony"
        )

        let result = ListingFormatter.formatForClipboard(listing)
        let expected = """
        West Elm Harmony Sofa - Like New Condition - $450

        Selling my West Elm Harmony sofa. It's in great condition.

        Condition: Like New | Brand: West Elm | Model: Harmony
        """

        #expect(result == expected)
    }

    @Test("formats listing with only title")
    func titleOnly() throws {
        let listing = try makeListing(title: "My Item")
        let result = ListingFormatter.formatForClipboard(listing)
        #expect(result == "My Item")
    }

    @Test("formats listing with only price")
    func priceOnly() throws {
        let listing = try makeListing(suggestedPrice: 100)
        let result = ListingFormatter.formatForClipboard(listing)
        #expect(result == "$100")
    }

    @Test("formats listing with title and description, no price")
    func titleAndDescription() throws {
        let listing = try makeListing(title: "Item", description: "A nice item")
        let result = ListingFormatter.formatForClipboard(listing)
        #expect(result == "Item\n\nA nice item")
    }

    @Test("formats listing with partial details")
    func partialDetails() throws {
        let listing = try makeListing(
            title: "Chair",
            suggestedPrice: 50,
            condition: "Good"
        )
        let result = ListingFormatter.formatForClipboard(listing)
        #expect(result == "Chair - $50\n\nCondition: Good")
    }

    @Test("empty listing produces empty string")
    func emptyListing() throws {
        let listing = try makeListing()
        let result = ListingFormatter.formatForClipboard(listing)
        #expect(result == "")
    }
}
