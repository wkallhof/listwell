import Foundation

protocol ListingsServiceProtocol {
    static func fetchListings(token: String, client: APIClient) async throws -> [Listing]
    static func fetchListing(id: String, token: String, client: APIClient) async throws -> Listing
    static func updateListing(id: String, updates: PatchListingRequest, token: String, client: APIClient) async throws -> Listing
    static func deleteListing(id: String, token: String, client: APIClient) async throws
}

enum ListingsService: ListingsServiceProtocol {

    static func fetchListings(
        token: String,
        client: APIClient = .shared
    ) async throws -> [Listing] {
        try await client.request(.get, path: "/listings", token: token)
    }

    static func fetchListing(
        id: String,
        token: String,
        client: APIClient = .shared
    ) async throws -> Listing {
        try await client.request(.get, path: "/listings/\(id)", token: token)
    }

    static func createListing(
        description: String?,
        images: [ImageRef],
        token: String,
        client: APIClient = .shared
    ) async throws -> Listing {
        let body = CreateListingRequest(description: description, images: images)
        return try await client.request(.post, path: "/listings", body: body, token: token)
    }

    static func updateListing(
        id: String,
        updates: PatchListingRequest,
        token: String,
        client: APIClient = .shared
    ) async throws -> Listing {
        try await client.request(.patch, path: "/listings/\(id)", body: updates, token: token)
    }

    static func deleteListing(
        id: String,
        token: String,
        client: APIClient = .shared
    ) async throws {
        try await client.requestVoid(.delete, path: "/listings/\(id)", token: token)
    }

    // MARK: - Image Enhancement

    static func enhanceImage(
        listingId: String,
        imageId: String,
        token: String,
        client: APIClient = .shared
    ) async throws {
        let body = EnhanceRequest(imageId: imageId)
        try await client.requestVoid(.post, path: "/listings/\(listingId)/enhance", body: body, token: token)
    }

    static func deleteImage(
        listingId: String,
        imageId: String,
        token: String,
        client: APIClient = .shared
    ) async throws {
        try await client.requestVoid(.delete, path: "/listings/\(listingId)/images?imageId=\(imageId)", token: token)
    }
}
