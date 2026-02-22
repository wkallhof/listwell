import Testing
import Foundation
@testable import Listwell

@Suite("ListingsService")
struct ListingsServiceTests {

    // MARK: - Fetch All Listings

    @Test("fetchListings returns array of listings")
    func fetchListingsSuccess() async throws {
        let client = makeTestClient()
        let json = """
        [
            {
                "id": "listing-1",
                "userId": "user-1",
                "rawDescription": "Test item",
                "title": "Test Listing",
                "description": "A great item",
                "suggestedPrice": 25.00,
                "priceRangeLow": 20.00,
                "priceRangeHigh": 30.00,
                "category": "Electronics",
                "condition": "Good",
                "brand": "TestBrand",
                "model": "Model X",
                "researchNotes": "Market notes here",
                "comparables": [],
                "status": "READY",
                "pipelineStep": "COMPLETE",
                "pipelineError": null,
                "agentLog": null,
                "inngestRunId": null,
                "createdAt": "2026-02-01T00:00:00.000Z",
                "updatedAt": "2026-02-01T00:00:00.000Z",
                "images": []
            }
        ]
        """

        MockURLProtocol.requestHandler = { request in
            #expect(request.httpMethod == "GET")
            #expect(request.url?.path.hasSuffix("/listings") == true)
            #expect(request.value(forHTTPHeaderField: "Authorization") == "Bearer test-token")

            let response = HTTPURLResponse(
                url: request.url!, statusCode: 200, httpVersion: nil, headerFields: nil
            )!
            return (response, json.data(using: .utf8)!)
        }

        let listings = try await ListingsService.fetchListings(token: "test-token", client: client)
        #expect(listings.count == 1)
        #expect(listings[0].id == "listing-1")
        #expect(listings[0].title == "Test Listing")
        #expect(listings[0].status == .ready)
        #expect(listings[0].pipelineStep == .complete)
    }

    @Test("fetchListings returns empty array when no listings")
    func fetchListingsEmpty() async throws {
        let client = makeTestClient()

        MockURLProtocol.requestHandler = { request in
            let response = HTTPURLResponse(
                url: request.url!, statusCode: 200, httpVersion: nil, headerFields: nil
            )!
            return (response, "[]".data(using: .utf8)!)
        }

        let listings = try await ListingsService.fetchListings(token: "test-token", client: client)
        #expect(listings.isEmpty)
    }

    @Test("fetchListings throws on 401 unauthorized")
    func fetchListingsUnauthorized() async throws {
        let client = makeTestClient()

        MockURLProtocol.requestHandler = { request in
            let response = HTTPURLResponse(
                url: request.url!, statusCode: 401, httpVersion: nil, headerFields: nil
            )!
            return (response, Data())
        }

        await #expect(throws: APIError.self) {
            try await ListingsService.fetchListings(token: "bad-token", client: client)
        }
    }

    // MARK: - Fetch Single Listing

    @Test("fetchListing returns listing with images")
    func fetchListingSuccess() async throws {
        let client = makeTestClient()
        let json = """
        {
            "id": "listing-1",
            "userId": "user-1",
            "rawDescription": null,
            "title": "iPhone 14",
            "description": "Great phone",
            "suggestedPrice": 599.00,
            "priceRangeLow": 550.00,
            "priceRangeHigh": 650.00,
            "category": "Electronics",
            "condition": "Like New",
            "brand": "Apple",
            "model": "iPhone 14",
            "researchNotes": "Strong market demand",
            "comparables": [
                {
                    "title": "iPhone 14 128GB",
                    "price": 580.00,
                    "source": "eBay",
                    "url": "https://ebay.com/item/123",
                    "condition": "Used",
                    "soldDate": "2026-01-15"
                }
            ],
            "status": "READY",
            "pipelineStep": "COMPLETE",
            "pipelineError": null,
            "agentLog": null,
            "inngestRunId": "run-123",
            "createdAt": "2026-02-01T00:00:00.000Z",
            "updatedAt": "2026-02-01T00:00:00.000Z",
            "images": [
                {
                    "id": "img-1",
                    "listingId": "listing-1",
                    "type": "ORIGINAL",
                    "blobUrl": "https://blob.test.com/image1.jpg",
                    "blobKey": "image1.jpg",
                    "parentImageId": null,
                    "sortOrder": 0,
                    "isPrimary": true,
                    "geminiPrompt": null,
                    "createdAt": "2026-02-01T00:00:00.000Z"
                }
            ]
        }
        """

        MockURLProtocol.requestHandler = { request in
            #expect(request.httpMethod == "GET")
            #expect(request.url?.path.hasSuffix("/listings/listing-1") == true)
            #expect(request.value(forHTTPHeaderField: "Authorization") == "Bearer test-token")

            let response = HTTPURLResponse(
                url: request.url!, statusCode: 200, httpVersion: nil, headerFields: nil
            )!
            return (response, json.data(using: .utf8)!)
        }

        let listing = try await ListingsService.fetchListing(
            id: "listing-1", token: "test-token", client: client
        )
        #expect(listing.id == "listing-1")
        #expect(listing.title == "iPhone 14")
        #expect(listing.suggestedPrice == 599.00)
        #expect(listing.images?.count == 1)
        #expect(listing.images?[0].isPrimary == true)
        #expect(listing.comparables?.count == 1)
        #expect(listing.comparables?[0].source == "eBay")
    }

    @Test("fetchListing throws on 404 not found")
    func fetchListingNotFound() async throws {
        let client = makeTestClient()

        MockURLProtocol.requestHandler = { request in
            let response = HTTPURLResponse(
                url: request.url!, statusCode: 404, httpVersion: nil, headerFields: nil
            )!
            return (response, #"{"error":"Listing not found"}"#.data(using: .utf8)!)
        }

        await #expect(throws: APIError.self) {
            try await ListingsService.fetchListing(
                id: "nonexistent", token: "test-token", client: client
            )
        }
    }

    // MARK: - Create Listing

    @Test("createListing sends images and description, returns listing")
    func createListingSuccess() async throws {
        let client = makeTestClient()
        let json = """
        {
            "id": "new-listing-1",
            "userId": "user-1",
            "rawDescription": "Blue Nike shoes, size 10",
            "title": null,
            "description": null,
            "suggestedPrice": null,
            "priceRangeLow": null,
            "priceRangeHigh": null,
            "category": null,
            "condition": null,
            "brand": null,
            "model": null,
            "researchNotes": null,
            "comparables": null,
            "status": "DRAFT",
            "pipelineStep": "PENDING",
            "pipelineError": null,
            "agentLog": null,
            "inngestRunId": null,
            "createdAt": "2026-02-15T00:00:00.000Z",
            "updatedAt": "2026-02-15T00:00:00.000Z",
            "images": [
                {
                    "id": "img-new-1",
                    "listingId": "new-listing-1",
                    "type": "ORIGINAL",
                    "blobUrl": "https://blob.test.com/photo1.jpg",
                    "blobKey": "photo1.jpg",
                    "parentImageId": null,
                    "sortOrder": 0,
                    "isPrimary": true,
                    "geminiPrompt": null,
                    "createdAt": "2026-02-15T00:00:00.000Z"
                }
            ]
        }
        """

        MockURLProtocol.requestHandler = { request in
            #expect(request.httpMethod == "POST")
            #expect(request.url?.path.hasSuffix("/listings") == true)
            #expect(request.value(forHTTPHeaderField: "Authorization") == "Bearer test-token")

            let response = HTTPURLResponse(
                url: request.url!, statusCode: 201, httpVersion: nil, headerFields: nil
            )!
            return (response, json.data(using: .utf8)!)
        }

        let images = [ImageRef(key: "photo1.jpg", url: "https://blob.test.com/photo1.jpg", filename: "photo1.jpg")]
        let listing = try await ListingsService.createListing(
            description: "Blue Nike shoes, size 10",
            images: images,
            token: "test-token",
            client: client
        )

        #expect(listing.id == "new-listing-1")
        #expect(listing.rawDescription == "Blue Nike shoes, size 10")
        #expect(listing.status == .draft)
        #expect(listing.pipelineStep == .pending)
        #expect(listing.images?.count == 1)
    }

    @Test("createListing with nil description")
    func createListingNoDescription() async throws {
        let client = makeTestClient()
        let json = """
        {
            "id": "new-listing-2",
            "userId": "user-1",
            "rawDescription": null,
            "status": "DRAFT",
            "pipelineStep": "PENDING",
            "createdAt": "2026-02-15T00:00:00.000Z",
            "updatedAt": "2026-02-15T00:00:00.000Z",
            "images": []
        }
        """

        MockURLProtocol.requestHandler = { request in
            #expect(request.httpMethod == "POST")
            #expect(request.url?.path.hasSuffix("/listings") == true)

            let response = HTTPURLResponse(
                url: request.url!, statusCode: 201, httpVersion: nil, headerFields: nil
            )!
            return (response, json.data(using: .utf8)!)
        }

        let images = [ImageRef(key: "img.jpg", url: "https://blob.test.com/img.jpg", filename: "img.jpg")]
        let listing = try await ListingsService.createListing(
            description: nil,
            images: images,
            token: "test-token",
            client: client
        )

        #expect(listing.id == "new-listing-2")
        #expect(listing.rawDescription == nil)
    }

    // MARK: - Update Listing

    @Test("updateListing sends patch and returns updated listing")
    func updateListingSuccess() async throws {
        let client = makeTestClient()
        let json = """
        {
            "id": "listing-1",
            "userId": "user-1",
            "rawDescription": null,
            "title": "Updated Title",
            "description": "Updated description",
            "suggestedPrice": 50.00,
            "status": "LISTED",
            "pipelineStep": "COMPLETE",
            "pipelineError": null,
            "createdAt": "2026-02-01T00:00:00.000Z",
            "updatedAt": "2026-02-15T00:00:00.000Z"
        }
        """

        MockURLProtocol.requestHandler = { request in
            #expect(request.httpMethod == "PATCH")
            #expect(request.url?.path.hasSuffix("/listings/listing-1") == true)
            #expect(request.value(forHTTPHeaderField: "Authorization") == "Bearer test-token")

            let response = HTTPURLResponse(
                url: request.url!, statusCode: 200, httpVersion: nil, headerFields: nil
            )!
            return (response, json.data(using: .utf8)!)
        }

        var updates = PatchListingRequest()
        updates.status = "LISTED"

        let listing = try await ListingsService.updateListing(
            id: "listing-1", updates: updates, token: "test-token", client: client
        )

        #expect(listing.id == "listing-1")
        #expect(listing.status == .listed)
    }

    @Test("updateListing throws on 404")
    func updateListingNotFound() async throws {
        let client = makeTestClient()

        MockURLProtocol.requestHandler = { request in
            let response = HTTPURLResponse(
                url: request.url!, statusCode: 404, httpVersion: nil, headerFields: nil
            )!
            return (response, #"{"error":"Listing not found"}"#.data(using: .utf8)!)
        }

        var updates = PatchListingRequest()
        updates.title = "New Title"

        await #expect(throws: APIError.self) {
            try await ListingsService.updateListing(
                id: "nonexistent", updates: updates, token: "test-token", client: client
            )
        }
    }

    // MARK: - Delete Listing

    @Test("deleteListing sends DELETE request")
    func deleteListingSuccess() async throws {
        let client = makeTestClient()

        MockURLProtocol.requestHandler = { request in
            #expect(request.httpMethod == "DELETE")
            #expect(request.url?.path.hasSuffix("/listings/listing-1") == true)
            #expect(request.value(forHTTPHeaderField: "Authorization") == "Bearer test-token")

            let response = HTTPURLResponse(
                url: request.url!, statusCode: 200, httpVersion: nil, headerFields: nil
            )!
            return (response, #"{"success":true}"#.data(using: .utf8)!)
        }

        try await ListingsService.deleteListing(
            id: "listing-1", token: "test-token", client: client
        )
    }

    @Test("deleteListing throws on 404")
    func deleteListingNotFound() async throws {
        let client = makeTestClient()

        MockURLProtocol.requestHandler = { request in
            let response = HTTPURLResponse(
                url: request.url!, statusCode: 404, httpVersion: nil, headerFields: nil
            )!
            return (response, #"{"error":"Listing not found"}"#.data(using: .utf8)!)
        }

        await #expect(throws: APIError.self) {
            try await ListingsService.deleteListing(
                id: "nonexistent", token: "test-token", client: client
            )
        }
    }

    @Test("deleteListing throws on 401 unauthorized")
    func deleteListingUnauthorized() async throws {
        let client = makeTestClient()

        MockURLProtocol.requestHandler = { request in
            let response = HTTPURLResponse(
                url: request.url!, statusCode: 401, httpVersion: nil, headerFields: nil
            )!
            return (response, Data())
        }

        await #expect(throws: APIError.self) {
            try await ListingsService.deleteListing(
                id: "listing-1", token: "expired-token", client: client
            )
        }
    }

    // MARK: - Enhance Image

    @Test("enhanceImage sends POST with imageId in body")
    func enhanceImageSuccess() async throws {
        let client = makeTestClient()

        MockURLProtocol.requestHandler = { request in
            #expect(request.httpMethod == "POST")
            #expect(request.url?.path.hasSuffix("/listings/listing-1/enhance") == true)
            #expect(request.value(forHTTPHeaderField: "Authorization") == "Bearer test-token")

            // Verify body contains imageId
            if let body = request.httpBody,
               let json = try? JSONSerialization.jsonObject(with: body) as? [String: Any] {
                #expect(json["imageId"] as? String == "img-1")
            }

            let response = HTTPURLResponse(
                url: request.url!, statusCode: 200, httpVersion: nil, headerFields: nil
            )!
            return (response, #"{"status":"processing"}"#.data(using: .utf8)!)
        }

        try await ListingsService.enhanceImage(
            listingId: "listing-1", imageId: "img-1", token: "test-token", client: client
        )
    }

    @Test("enhanceImage throws on 404")
    func enhanceImageNotFound() async throws {
        let client = makeTestClient()

        MockURLProtocol.requestHandler = { request in
            let response = HTTPURLResponse(
                url: request.url!, statusCode: 404, httpVersion: nil, headerFields: nil
            )!
            return (response, #"{"error":"Listing not found"}"#.data(using: .utf8)!)
        }

        await #expect(throws: APIError.self) {
            try await ListingsService.enhanceImage(
                listingId: "nonexistent", imageId: "img-1", token: "test-token", client: client
            )
        }
    }

    @Test("enhanceImage throws on 401 unauthorized")
    func enhanceImageUnauthorized() async throws {
        let client = makeTestClient()

        MockURLProtocol.requestHandler = { request in
            let response = HTTPURLResponse(
                url: request.url!, statusCode: 401, httpVersion: nil, headerFields: nil
            )!
            return (response, Data())
        }

        await #expect(throws: APIError.self) {
            try await ListingsService.enhanceImage(
                listingId: "listing-1", imageId: "img-1", token: "bad-token", client: client
            )
        }
    }

    // MARK: - Delete Image

    @Test("deleteImage sends DELETE with imageId in query string")
    func deleteImageSuccess() async throws {
        let client = makeTestClient()

        MockURLProtocol.requestHandler = { request in
            #expect(request.httpMethod == "DELETE")
            #expect(request.url?.absoluteString.contains("/listings/listing-1/images?imageId=img-2") == true)
            #expect(request.value(forHTTPHeaderField: "Authorization") == "Bearer test-token")

            let response = HTTPURLResponse(
                url: request.url!, statusCode: 200, httpVersion: nil, headerFields: nil
            )!
            return (response, #"{"success":true}"#.data(using: .utf8)!)
        }

        try await ListingsService.deleteImage(
            listingId: "listing-1", imageId: "img-2", token: "test-token", client: client
        )
    }

    @Test("deleteImage throws on 404")
    func deleteImageNotFound() async throws {
        let client = makeTestClient()

        MockURLProtocol.requestHandler = { request in
            let response = HTTPURLResponse(
                url: request.url!, statusCode: 404, httpVersion: nil, headerFields: nil
            )!
            return (response, #"{"error":"Image not found"}"#.data(using: .utf8)!)
        }

        await #expect(throws: APIError.self) {
            try await ListingsService.deleteImage(
                listingId: "listing-1", imageId: "nonexistent", token: "test-token", client: client
            )
        }
    }
}
