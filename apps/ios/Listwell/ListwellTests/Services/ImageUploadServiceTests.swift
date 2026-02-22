import Testing
import Foundation
import UIKit
@testable import Listwell

@Suite("ImageUploadService")
struct ImageUploadServiceTests {

    // MARK: - Presigned URL Request

    @Test("requestPresignedURLs returns presigned uploads")
    func presignSuccess() async throws {
        let client = makeTestClient()
        let json = """
        {
            "uploads": [
                {
                    "presignedUrl": "https://storage.test.com/upload/1",
                    "key": "listings/abc/photo_0.jpg",
                    "publicUrl": "https://cdn.test.com/listings/abc/photo_0.jpg"
                },
                {
                    "presignedUrl": "https://storage.test.com/upload/2",
                    "key": "listings/abc/photo_1.jpg",
                    "publicUrl": "https://cdn.test.com/listings/abc/photo_1.jpg"
                }
            ]
        }
        """

        MockURLProtocol.requestHandler = { request in
            #expect(request.httpMethod == "POST")
            #expect(request.url?.path.hasSuffix("/upload/presign") == true)
            #expect(request.value(forHTTPHeaderField: "Authorization") == "Bearer test-token")

            let response = HTTPURLResponse(
                url: request.url!, statusCode: 200, httpVersion: nil, headerFields: nil
            )!
            return (response, json.data(using: .utf8)!)
        }

        let files = [
            FileInfo(filename: "photo_0.jpg", contentType: "image/jpeg"),
            FileInfo(filename: "photo_1.jpg", contentType: "image/jpeg"),
        ]

        let uploads = try await ImageUploadService.requestPresignedURLs(
            files: files, token: "test-token", client: client
        )

        #expect(uploads.count == 2)
        #expect(uploads[0].key == "listings/abc/photo_0.jpg")
        #expect(uploads[1].publicUrl == "https://cdn.test.com/listings/abc/photo_1.jpg")
    }

    @Test("requestPresignedURLs throws on 401")
    func presignUnauthorized() async throws {
        let client = makeTestClient()

        MockURLProtocol.requestHandler = { request in
            let response = HTTPURLResponse(
                url: request.url!, statusCode: 401, httpVersion: nil, headerFields: nil
            )!
            return (response, Data())
        }

        await #expect(throws: APIError.self) {
            try await ImageUploadService.requestPresignedURLs(
                files: [FileInfo(filename: "img.jpg", contentType: "image/jpeg")],
                token: "bad-token",
                client: client
            )
        }
    }

    // MARK: - Direct Upload

    @Test("uploadImage sends PUT with data and content type")
    func uploadImageSuccess() async throws {
        let config = URLSessionConfiguration.ephemeral
        config.protocolClasses = [MockURLProtocol.self]
        let session = URLSession(configuration: config)

        MockURLProtocol.requestHandler = { request in
            #expect(request.httpMethod == "PUT")
            #expect(request.value(forHTTPHeaderField: "Content-Type") == "image/jpeg")

            let response = HTTPURLResponse(
                url: request.url!, statusCode: 200, httpVersion: nil, headerFields: nil
            )!
            return (response, Data())
        }

        let testData = Data(repeating: 0xFF, count: 100)
        try await ImageUploadService.uploadImage(
            data: testData,
            contentType: "image/jpeg",
            to: "https://storage.test.com/upload/1",
            session: session
        )
    }

    @Test("uploadImage throws on invalid URL")
    func uploadImageInvalidURL() async throws {
        await #expect(throws: APIError.self) {
            try await ImageUploadService.uploadImage(
                data: Data(),
                contentType: "image/jpeg",
                to: ""
            )
        }
    }

    @Test("uploadImage throws on server error")
    func uploadImageServerError() async throws {
        let config = URLSessionConfiguration.ephemeral
        config.protocolClasses = [MockURLProtocol.self]
        let session = URLSession(configuration: config)

        MockURLProtocol.requestHandler = { request in
            let response = HTTPURLResponse(
                url: request.url!, statusCode: 500, httpVersion: nil, headerFields: nil
            )!
            return (response, Data())
        }

        await #expect(throws: APIError.self) {
            try await ImageUploadService.uploadImage(
                data: Data(repeating: 0xFF, count: 10),
                contentType: "image/jpeg",
                to: "https://storage.test.com/upload/1",
                session: session
            )
        }
    }

    // MARK: - Image Compression

    @Test("compressImage returns JPEG data for a small image")
    func compressSmallImage() {
        let image = createTestImage(width: 100, height: 100)
        let data = ImageUploadService.compressImage(image, maxDimension: 2048, quality: 0.8)
        #expect(data != nil)
        #expect(data!.count > 0)
    }

    @Test("compressImage resizes large images to max dimension")
    func compressLargeImage() {
        let image = createTestImage(width: 4000, height: 3000)
        let data = ImageUploadService.compressImage(image, maxDimension: 2048, quality: 0.8)
        #expect(data != nil)

        // Verify the compressed data represents a smaller image
        guard let data, let resized = UIImage(data: data) else {
            #expect(Bool(false), "Failed to create resized image")
            return
        }
        #expect(resized.size.width <= 2048)
        #expect(resized.size.height <= 2048)
    }

    @Test("compressImage preserves aspect ratio")
    func compressPreservesAspectRatio() {
        let image = createTestImage(width: 4000, height: 2000)
        let data = ImageUploadService.compressImage(image, maxDimension: 2048, quality: 0.8)
        #expect(data != nil)

        guard let data, let resized = UIImage(data: data) else {
            #expect(Bool(false), "Failed to create resized image")
            return
        }
        let ratio = resized.size.width / resized.size.height
        #expect(abs(ratio - 2.0) < 0.01)
    }

    // MARK: - Full Upload Flow

    @Test("uploadImages compresses, presigns, uploads, and returns ImageRefs")
    func fullUploadFlow() async throws {
        let client = makeTestClient()
        let config = URLSessionConfiguration.ephemeral
        config.protocolClasses = [MockURLProtocol.self]
        let session = URLSession(configuration: config)

        var requestCount = 0

        MockURLProtocol.requestHandler = { request in
            requestCount += 1

            // First request is presign
            if request.url?.path.hasSuffix("/upload/presign") == true {
                let json = """
                {
                    "uploads": [
                        {
                            "presignedUrl": "https://storage.test.com/upload/0",
                            "key": "listings/sess/photo_0.jpg",
                            "publicUrl": "https://cdn.test.com/listings/sess/photo_0.jpg"
                        }
                    ]
                }
                """
                let response = HTTPURLResponse(
                    url: request.url!, statusCode: 200, httpVersion: nil, headerFields: nil
                )!
                return (response, json.data(using: .utf8)!)
            }

            // Subsequent requests are PUT uploads
            let response = HTTPURLResponse(
                url: request.url!, statusCode: 200, httpVersion: nil, headerFields: nil
            )!
            return (response, Data())
        }

        let testImage = createTestImage(width: 200, height: 200)
        let refs = try await ImageUploadService.uploadImages(
            [testImage], token: "test-token", client: client, session: session
        )

        #expect(refs.count == 1)
        #expect(refs[0].key == "listings/sess/photo_0.jpg")
        #expect(refs[0].url == "https://cdn.test.com/listings/sess/photo_0.jpg")
        #expect(refs[0].filename == "photo_0.jpg")
        #expect(requestCount >= 2) // presign + upload
    }

    // MARK: - Helpers

    private func createTestImage(width: Int, height: Int) -> UIImage {
        let format = UIGraphicsImageRendererFormat()
        format.scale = 1.0
        let renderer = UIGraphicsImageRenderer(
            size: CGSize(width: width, height: height), format: format
        )
        return renderer.image { context in
            UIColor.blue.setFill()
            context.fill(CGRect(x: 0, y: 0, width: width, height: height))
        }
    }
}
