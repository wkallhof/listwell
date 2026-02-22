import Foundation

struct ListingImage: Codable, Identifiable, Sendable {
    let id: String
    let listingId: String
    let type: ImageType
    let blobUrl: String
    let blobKey: String
    let parentImageId: String?
    let sortOrder: Int
    let isPrimary: Bool
    let geminiPrompt: String?
    let createdAt: Date

    var imageURL: URL? {
        URL(string: blobUrl)
    }

    var isOriginal: Bool {
        type == .original
    }

    var isEnhanced: Bool {
        type == .enhanced
    }
}
