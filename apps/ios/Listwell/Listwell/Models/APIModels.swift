import Foundation

// MARK: - Listing Requests

struct CreateListingRequest: Encodable {
    let description: String?
    let images: [ImageRef]
}

struct ImageRef: Codable, Sendable {
    let key: String
    let url: String
    let filename: String
}

struct PatchListingRequest: Encodable {
    var title: String?
    var description: String?
    var suggestedPrice: Double?
    var status: String?
    var pipelineStep: String?
    var pipelineError: String?
    var retry: Bool?
}

// MARK: - Upload

struct FileInfo: Encodable {
    let filename: String
    let contentType: String
}

struct PresignRequest: Encodable {
    let files: [FileInfo]
}

struct PresignResponse: Decodable {
    let uploads: [PresignedUpload]
}

struct PresignedUpload: Decodable {
    let presignedUrl: String
    let key: String
    let publicUrl: String
}

// MARK: - Enhancement

struct EnhanceRequest: Encodable {
    let imageId: String
}

// MARK: - Auth

struct AuthRequest: Codable {
    let email: String
    let password: String
    var name: String?
}

struct AuthResponse: Decodable {
    let session: SessionData?
    let token: String?
    let user: User?
}

struct SessionData: Decodable {
    let id: String
    let token: String
    let userId: String
    let expiresAt: Date
}

// MARK: - Generic

struct SuccessResponse: Decodable {
    let success: Bool?
    let status: String?
}
