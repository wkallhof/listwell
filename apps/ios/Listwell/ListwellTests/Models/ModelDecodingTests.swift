import Testing
import Foundation
@testable import Listwell

// MARK: - Shared decoder

private let decoder: JSONDecoder = {
    let d = JSONDecoder()
    let isoFormatter = ISO8601DateFormatter()
    isoFormatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
    d.dateDecodingStrategy = .custom { decoder in
        let container = try decoder.singleValueContainer()
        let dateString = try container.decode(String.self)
        if let date = isoFormatter.date(from: dateString) {
            return date
        }
        let basicISO = ISO8601DateFormatter()
        basicISO.formatOptions = [.withInternetDateTime]
        if let date = basicISO.date(from: dateString) {
            return date
        }
        throw DecodingError.dataCorruptedError(
            in: container,
            debugDescription: "Cannot decode date: \(dateString)"
        )
    }
    return d
}()

// MARK: - ListingStatus Tests

@Suite("ListingStatus")
struct ListingStatusTests {
    @Test("decodes from uppercase JSON string")
    func decodeStatus() throws {
        let json = #""PROCESSING""#.data(using: .utf8)!
        let status = try JSONDecoder().decode(ListingStatus.self, from: json)
        #expect(status == .processing)
    }

    @Test("decodes all status values")
    func decodeAllStatuses() throws {
        for status in ListingStatus.allCases {
            let json = "\"\(status.rawValue)\"".data(using: .utf8)!
            let decoded = try JSONDecoder().decode(ListingStatus.self, from: json)
            #expect(decoded == status)
        }
    }

    @Test("has correct display names")
    func displayNames() {
        #expect(ListingStatus.draft.displayName == "Draft")
        #expect(ListingStatus.processing.displayName == "Processing")
        #expect(ListingStatus.ready.displayName == "Ready")
    }
}

// MARK: - PipelineStep Tests

@Suite("PipelineStep")
struct PipelineStepTests {
    @Test("decodes from uppercase JSON string")
    func decodeStep() throws {
        let json = #""ANALYZING""#.data(using: .utf8)!
        let step = try JSONDecoder().decode(PipelineStep.self, from: json)
        #expect(step == .analyzing)
    }

    @Test("decodes all step values")
    func decodeAllSteps() throws {
        for step in PipelineStep.allCases {
            let json = "\"\(step.rawValue)\"".data(using: .utf8)!
            let decoded = try JSONDecoder().decode(PipelineStep.self, from: json)
            #expect(decoded == step)
        }
    }

    @Test("has correct icon names")
    func iconNames() {
        #expect(PipelineStep.pending.iconName == "clock")
        #expect(PipelineStep.analyzing.iconName == "eye")
        #expect(PipelineStep.researching.iconName == "magnifyingglass")
        #expect(PipelineStep.generating.iconName == "pencil.line")
        #expect(PipelineStep.complete.iconName == "checkmark.circle.fill")
        #expect(PipelineStep.error.iconName == "exclamationmark.triangle.fill")
    }
}

// MARK: - ImageType Tests

@Suite("ImageType")
struct ImageTypeTests {
    @Test("decodes from uppercase JSON string")
    func decodeType() throws {
        let json = #""ORIGINAL""#.data(using: .utf8)!
        let type = try JSONDecoder().decode(ImageType.self, from: json)
        #expect(type == .original)

        let enhancedJSON = #""ENHANCED""#.data(using: .utf8)!
        let enhanced = try JSONDecoder().decode(ImageType.self, from: enhancedJSON)
        #expect(enhanced == .enhanced)
    }
}

// MARK: - Listing Tests

@Suite("Listing")
struct ListingTests {
    @Test("decodes from full API response JSON")
    func decodeFullListing() throws {
        let json = """
        {
            "id": "clx123abc",
            "userId": "user_456",
            "rawDescription": "Old couch in good shape",
            "title": "West Elm Harmony Sofa - Like New Condition",
            "description": "Selling my West Elm Harmony sofa. It's in great condition.",
            "suggestedPrice": 450.0,
            "priceRangeLow": 350.0,
            "priceRangeHigh": 600.0,
            "category": "Furniture",
            "condition": "Like New",
            "brand": "West Elm",
            "model": "Harmony",
            "researchNotes": "Good market for this item.",
            "comparables": [
                {
                    "title": "West Elm Harmony Sofa",
                    "price": 500,
                    "source": "eBay Sold",
                    "url": "https://ebay.com/item/123",
                    "condition": "Good",
                    "soldDate": "2024-01-15"
                }
            ],
            "status": "READY",
            "pipelineStep": "COMPLETE",
            "pipelineError": null,
            "agentLog": [
                {"ts": 1700000000000, "type": "status", "content": "Starting analysis"},
                {"ts": 1700000005000, "type": "complete", "content": "Done"}
            ],
            "inngestRunId": "run_xyz",
            "createdAt": "2024-01-20T10:30:00.000Z",
            "updatedAt": "2024-01-20T10:31:00.000Z",
            "images": [
                {
                    "id": "img_001",
                    "listingId": "clx123abc",
                    "type": "ORIGINAL",
                    "blobUrl": "https://storage.example.com/photo1.jpg",
                    "blobKey": "uploads/photo1.jpg",
                    "parentImageId": null,
                    "sortOrder": 0,
                    "isPrimary": true,
                    "geminiPrompt": null,
                    "createdAt": "2024-01-20T10:30:00.000Z"
                }
            ]
        }
        """.data(using: .utf8)!

        let listing = try decoder.decode(Listing.self, from: json)
        #expect(listing.id == "clx123abc")
        #expect(listing.title == "West Elm Harmony Sofa - Like New Condition")
        #expect(listing.suggestedPrice == 450.0)
        #expect(listing.status == .ready)
        #expect(listing.pipelineStep == .complete)
        #expect(listing.isReady == true)
        #expect(listing.isProcessing == false)
        #expect(listing.comparables?.count == 1)
        #expect(listing.agentLog?.count == 2)
        #expect(listing.images?.count == 1)
        #expect(listing.images?.first?.isPrimary == true)
        #expect(listing.primaryImageURL?.absoluteString == "https://storage.example.com/photo1.jpg")
    }

    @Test("decodes listing with null optionals")
    func decodeMinimalListing() throws {
        let json = """
        {
            "id": "clx999",
            "userId": "user_1",
            "rawDescription": null,
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
            "status": "PROCESSING",
            "pipelineStep": "ANALYZING",
            "pipelineError": null,
            "agentLog": null,
            "inngestRunId": null,
            "createdAt": "2024-01-20T10:30:00.000Z",
            "updatedAt": "2024-01-20T10:30:00.000Z",
            "images": []
        }
        """.data(using: .utf8)!

        let listing = try decoder.decode(Listing.self, from: json)
        #expect(listing.id == "clx999")
        #expect(listing.title == nil)
        #expect(listing.status == .processing)
        #expect(listing.pipelineStep == .analyzing)
        #expect(listing.isProcessing == true)
        #expect(listing.isReady == false)
        #expect(listing.primaryImageURL == nil)
    }

    @Test("effectiveStatus returns draft when pipeline has error")
    func effectiveStatusError() throws {
        let json = """
        {
            "id": "clxerr",
            "userId": "user_1",
            "rawDescription": null,
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
            "status": "PROCESSING",
            "pipelineStep": "ERROR",
            "pipelineError": "Agent crashed",
            "agentLog": null,
            "inngestRunId": null,
            "createdAt": "2024-01-20T10:30:00.000Z",
            "updatedAt": "2024-01-20T10:30:00.000Z",
            "images": null
        }
        """.data(using: .utf8)!

        let listing = try decoder.decode(Listing.self, from: json)
        #expect(listing.effectiveStatus == .draft)
        #expect(listing.pipelineError == "Agent crashed")
    }
}

// MARK: - ListingImage Tests

@Suite("ListingImage")
struct ListingImageTests {
    @Test("decodes from JSON")
    func decodeFull() throws {
        let json = """
        {
            "id": "img_001",
            "listingId": "clx123",
            "type": "ORIGINAL",
            "blobUrl": "https://storage.example.com/photo1.jpg",
            "blobKey": "uploads/photo1.jpg",
            "parentImageId": null,
            "sortOrder": 0,
            "isPrimary": true,
            "geminiPrompt": null,
            "createdAt": "2024-01-20T10:30:00.000Z"
        }
        """.data(using: .utf8)!

        let image = try decoder.decode(ListingImage.self, from: json)
        #expect(image.id == "img_001")
        #expect(image.isOriginal == true)
        #expect(image.isEnhanced == false)
        #expect(image.imageURL?.absoluteString == "https://storage.example.com/photo1.jpg")
    }

    @Test("decodes enhanced image with parent")
    func decodeEnhanced() throws {
        let json = """
        {
            "id": "img_002",
            "listingId": "clx123",
            "type": "ENHANCED",
            "blobUrl": "https://storage.example.com/enhanced1.jpg",
            "blobKey": "uploads/enhanced1.jpg",
            "parentImageId": "img_001",
            "sortOrder": 1,
            "isPrimary": false,
            "geminiPrompt": "Clean up background",
            "createdAt": "2024-01-20T10:35:00.000Z"
        }
        """.data(using: .utf8)!

        let image = try decoder.decode(ListingImage.self, from: json)
        #expect(image.isEnhanced == true)
        #expect(image.parentImageId == "img_001")
        #expect(image.geminiPrompt == "Clean up background")
    }
}

// MARK: - Comparable Tests

@Suite("Comparable")
struct ComparableTests {
    @Test("decodes from JSON")
    func decodeFull() throws {
        let json = """
        {
            "title": "West Elm Harmony Sofa",
            "price": 500,
            "source": "eBay Sold",
            "url": "https://ebay.com/item/123",
            "condition": "Good",
            "soldDate": "2024-01-15"
        }
        """.data(using: .utf8)!

        let comparable = try JSONDecoder().decode(Comparable.self, from: json)
        #expect(comparable.title == "West Elm Harmony Sofa")
        #expect(comparable.price == 500)
        #expect(comparable.source == "eBay Sold")
        #expect(comparable.url == "https://ebay.com/item/123")
    }

    @Test("decodes with null optionals")
    func decodeMinimal() throws {
        let json = """
        {
            "title": "Some Item",
            "price": 100,
            "source": "FB Marketplace",
            "url": null,
            "condition": null,
            "soldDate": null
        }
        """.data(using: .utf8)!

        let comparable = try JSONDecoder().decode(Comparable.self, from: json)
        #expect(comparable.url == nil)
        #expect(comparable.condition == nil)
        #expect(comparable.soldDate == nil)
    }
}

// MARK: - AgentLogEntry Tests

@Suite("AgentLogEntry")
struct AgentLogEntryTests {
    @Test("decodes from JSON")
    func decode() throws {
        let json = """
        {"ts": 1700000000000, "type": "status", "content": "Starting analysis"}
        """.data(using: .utf8)!

        let entry = try JSONDecoder().decode(AgentLogEntry.self, from: json)
        #expect(entry.ts == 1700000000000)
        #expect(entry.type == "status")
        #expect(entry.content == "Starting analysis")
        #expect(entry.iconName == "info.circle")
    }

    @Test("has correct icon names for each type")
    func iconNames() throws {
        let types: [(String, String)] = [
            ("status", "info.circle"),
            ("search", "magnifyingglass"),
            ("fetch", "arrow.down"),
            ("text", "text.bubble"),
            ("write", "pencil"),
            ("complete", "checkmark"),
            ("error", "exclamationmark.triangle"),
            ("unknown", "circle"),
        ]

        for (type, expectedIcon) in types {
            let json = """
            {"ts": 1700000000000, "type": "\(type)", "content": "test"}
            """.data(using: .utf8)!
            let entry = try JSONDecoder().decode(AgentLogEntry.self, from: json)
            #expect(entry.iconName == expectedIcon)
        }
    }

    @Test("date computed property")
    func dateProperty() throws {
        let json = """
        {"ts": 1700000000000, "type": "status", "content": "test"}
        """.data(using: .utf8)!
        let entry = try JSONDecoder().decode(AgentLogEntry.self, from: json)
        // ts is in milliseconds
        #expect(entry.date.timeIntervalSince1970 == 1700000000)
    }
}

// MARK: - User Tests

@Suite("User")
struct UserTests {
    @Test("decodes from BetterAuth response")
    func decode() throws {
        let json = """
        {
            "id": "user_123",
            "name": "John Doe",
            "email": "john@example.com",
            "createdAt": "2024-01-01T00:00:00.000Z",
            "updatedAt": "2024-01-15T12:00:00.000Z"
        }
        """.data(using: .utf8)!

        let user = try decoder.decode(User.self, from: json)
        #expect(user.id == "user_123")
        #expect(user.name == "John Doe")
        #expect(user.email == "john@example.com")
    }
}

// MARK: - API Model Tests

@Suite("APIModels")
struct APIModelTests {
    @Test("CreateListingRequest encodes correctly")
    func encodeCreateListing() throws {
        let request = CreateListingRequest(
            description: "Old couch",
            images: [ImageRef(key: "uploads/photo.jpg", url: "https://example.com/photo.jpg", filename: "photo.jpg")]
        )
        let data = try JSONEncoder().encode(request)
        let json = try JSONSerialization.jsonObject(with: data) as! [String: Any]

        #expect(json["description"] as? String == "Old couch")
        #expect((json["images"] as? [[String: Any]])?.count == 1)
    }

    @Test("PatchListingRequest encodes with only set fields")
    func encodePatchListing() throws {
        let request = PatchListingRequest(title: "New Title")
        let data = try JSONEncoder().encode(request)
        let json = try JSONSerialization.jsonObject(with: data) as! [String: Any]

        #expect(json["title"] as? String == "New Title")
    }

    @Test("PresignResponse decodes correctly")
    func decodePresignResponse() throws {
        let json = """
        {
            "uploads": [
                {
                    "presignedUrl": "https://storage.example.com/upload?sig=abc",
                    "key": "uploads/photo1.jpg",
                    "publicUrl": "https://cdn.example.com/photo1.jpg"
                }
            ]
        }
        """.data(using: .utf8)!

        let response = try JSONDecoder().decode(PresignResponse.self, from: json)
        #expect(response.uploads.count == 1)
        #expect(response.uploads[0].key == "uploads/photo1.jpg")
    }

    @Test("AuthResponse decodes with session")
    func decodeAuthResponse() throws {
        let json = """
        {
            "session": {
                "id": "sess_123",
                "token": "bearer-token-abc",
                "userId": "user_456",
                "expiresAt": "2025-01-20T10:30:00.000Z"
            },
            "token": "bearer-token-abc",
            "user": {
                "id": "user_456",
                "name": "Jane",
                "email": "jane@example.com",
                "createdAt": "2024-01-01T00:00:00.000Z",
                "updatedAt": "2024-01-15T12:00:00.000Z"
            }
        }
        """.data(using: .utf8)!

        let response = try decoder.decode(AuthResponse.self, from: json)
        #expect(response.token == "bearer-token-abc")
        #expect(response.user?.name == "Jane")
        #expect(response.session?.userId == "user_456")
    }

    @Test("AuthRequest encodes with optional name")
    func encodeAuthRequest() throws {
        let loginRequest = AuthRequest(email: "test@test.com", password: "pass123")
        let loginData = try JSONEncoder().encode(loginRequest)
        let loginJSON = try JSONSerialization.jsonObject(with: loginData) as! [String: Any]
        #expect(loginJSON["email"] as? String == "test@test.com")

        let signupRequest = AuthRequest(email: "test@test.com", password: "pass123", name: "Test User")
        let signupData = try JSONEncoder().encode(signupRequest)
        let signupJSON = try JSONSerialization.jsonObject(with: signupData) as! [String: Any]
        #expect(signupJSON["name"] as? String == "Test User")
    }

    @Test("EnhanceRequest encodes correctly")
    func encodeEnhanceRequest() throws {
        let request = EnhanceRequest(imageId: "img_001")
        let data = try JSONEncoder().encode(request)
        let json = try JSONSerialization.jsonObject(with: data) as! [String: Any]
        #expect(json["imageId"] as? String == "img_001")
    }

    @Test("SuccessResponse decodes both variants")
    func decodeSuccessResponse() throws {
        let json1 = #"{"success": true}"#.data(using: .utf8)!
        let r1 = try JSONDecoder().decode(SuccessResponse.self, from: json1)
        #expect(r1.success == true)

        let json2 = #"{"status": "ok"}"#.data(using: .utf8)!
        let r2 = try JSONDecoder().decode(SuccessResponse.self, from: json2)
        #expect(r2.status == "ok")
    }

    @Test("ImageRef encodes all fields")
    func encodeImageRef() throws {
        let ref = ImageRef(key: "uploads/img.jpg", url: "https://cdn.example.com/img.jpg", filename: "img.jpg")
        let data = try JSONEncoder().encode(ref)
        let json = try JSONSerialization.jsonObject(with: data) as! [String: Any]
        #expect(json["key"] as? String == "uploads/img.jpg")
        #expect(json["url"] as? String == "https://cdn.example.com/img.jpg")
        #expect(json["filename"] as? String == "img.jpg")
    }

    @Test("FileInfo encodes correctly")
    func encodeFileInfo() throws {
        let info = FileInfo(filename: "photo.jpg", contentType: "image/jpeg")
        let data = try JSONEncoder().encode(info)
        let json = try JSONSerialization.jsonObject(with: data) as! [String: Any]
        #expect(json["filename"] as? String == "photo.jpg")
        #expect(json["contentType"] as? String == "image/jpeg")
    }

    @Test("PresignRequest encodes files array")
    func encodePresignRequest() throws {
        let request = PresignRequest(files: [
            FileInfo(filename: "a.jpg", contentType: "image/jpeg"),
            FileInfo(filename: "b.png", contentType: "image/png"),
        ])
        let data = try JSONEncoder().encode(request)
        let json = try JSONSerialization.jsonObject(with: data) as! [String: Any]
        let files = json["files"] as? [[String: Any]]
        #expect(files?.count == 2)
    }

    @Test("PatchListingRequest encodes retry field")
    func encodePatchWithRetry() throws {
        let request = PatchListingRequest(
            status: "PROCESSING",
            pipelineStep: "PENDING",
            retry: true
        )
        let data = try JSONEncoder().encode(request)
        let json = try JSONSerialization.jsonObject(with: data) as! [String: Any]
        #expect(json["retry"] as? Bool == true)
        #expect(json["status"] as? String == "PROCESSING")
        #expect(json["pipelineStep"] as? String == "PENDING")
    }
}

// MARK: - Listing Computed Properties

@Suite("Listing Computed Properties")
struct ListingComputedPropertyTests {
    @Test("primaryImageURL returns first primary image URL")
    func primaryImageURL() {
        let images = [
            ListingImage(id: "1", listingId: "l1", type: .original, blobUrl: "https://example.com/1.jpg",
                         blobKey: "1.jpg", parentImageId: nil, sortOrder: 0, isPrimary: false,
                         geminiPrompt: nil, createdAt: Date()),
            ListingImage(id: "2", listingId: "l1", type: .original, blobUrl: "https://example.com/2.jpg",
                         blobKey: "2.jpg", parentImageId: nil, sortOrder: 1, isPrimary: true,
                         geminiPrompt: nil, createdAt: Date()),
        ]
        let listing = Listing(id: "l1", userId: "u1", rawDescription: nil, title: nil, description: nil,
                              suggestedPrice: nil, priceRangeLow: nil, priceRangeHigh: nil, category: nil,
                              condition: nil, brand: nil, model: nil, researchNotes: nil, comparables: nil,
                              status: .ready, pipelineStep: .complete, pipelineError: nil, agentLog: nil,
                              inngestRunId: nil, createdAt: Date(), updatedAt: Date(), images: images)
        #expect(listing.primaryImageURL?.absoluteString == "https://example.com/2.jpg")
    }

    @Test("primaryImageURL falls back to first image when no primary")
    func primaryImageURLFallback() {
        let images = [
            ListingImage(id: "1", listingId: "l1", type: .original, blobUrl: "https://example.com/first.jpg",
                         blobKey: "1.jpg", parentImageId: nil, sortOrder: 0, isPrimary: false,
                         geminiPrompt: nil, createdAt: Date()),
        ]
        let listing = Listing(id: "l1", userId: "u1", rawDescription: nil, title: nil, description: nil,
                              suggestedPrice: nil, priceRangeLow: nil, priceRangeHigh: nil, category: nil,
                              condition: nil, brand: nil, model: nil, researchNotes: nil, comparables: nil,
                              status: .ready, pipelineStep: .complete, pipelineError: nil, agentLog: nil,
                              inngestRunId: nil, createdAt: Date(), updatedAt: Date(), images: images)
        #expect(listing.primaryImageURL?.absoluteString == "https://example.com/first.jpg")
    }

    @Test("primaryImageURL returns nil for nil images")
    func primaryImageURLNil() {
        let listing = Listing(id: "l1", userId: "u1", rawDescription: nil, title: nil, description: nil,
                              suggestedPrice: nil, priceRangeLow: nil, priceRangeHigh: nil, category: nil,
                              condition: nil, brand: nil, model: nil, researchNotes: nil, comparables: nil,
                              status: .ready, pipelineStep: .complete, pipelineError: nil, agentLog: nil,
                              inngestRunId: nil, createdAt: Date(), updatedAt: Date(), images: nil)
        #expect(listing.primaryImageURL == nil)
    }

    @Test("isProcessing is false when pipeline step is complete")
    func isProcessingComplete() {
        let listing = Listing(id: "l1", userId: "u1", rawDescription: nil, title: nil, description: nil,
                              suggestedPrice: nil, priceRangeLow: nil, priceRangeHigh: nil, category: nil,
                              condition: nil, brand: nil, model: nil, researchNotes: nil, comparables: nil,
                              status: .processing, pipelineStep: .complete, pipelineError: nil, agentLog: nil,
                              inngestRunId: nil, createdAt: Date(), updatedAt: Date(), images: nil)
        #expect(!listing.isProcessing)
    }

    @Test("isReady requires both ready status and complete pipeline step")
    func isReadyRequirements() {
        let ready = Listing(id: "l1", userId: "u1", rawDescription: nil, title: nil, description: nil,
                            suggestedPrice: nil, priceRangeLow: nil, priceRangeHigh: nil, category: nil,
                            condition: nil, brand: nil, model: nil, researchNotes: nil, comparables: nil,
                            status: .ready, pipelineStep: .complete, pipelineError: nil, agentLog: nil,
                            inngestRunId: nil, createdAt: Date(), updatedAt: Date(), images: nil)
        #expect(ready.isReady)

        let notComplete = Listing(id: "l2", userId: "u1", rawDescription: nil, title: nil, description: nil,
                                  suggestedPrice: nil, priceRangeLow: nil, priceRangeHigh: nil, category: nil,
                                  condition: nil, brand: nil, model: nil, researchNotes: nil, comparables: nil,
                                  status: .ready, pipelineStep: .analyzing, pipelineError: nil, agentLog: nil,
                                  inngestRunId: nil, createdAt: Date(), updatedAt: Date(), images: nil)
        #expect(!notComplete.isReady)
    }
}
