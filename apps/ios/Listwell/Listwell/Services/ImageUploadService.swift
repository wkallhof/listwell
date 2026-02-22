import Foundation
import UIKit

enum ImageUploadService {

    // MARK: - Presigned URL Request

    static func requestPresignedURLs(
        files: [FileInfo],
        token: String,
        client: APIClient = .shared
    ) async throws -> [PresignedUpload] {
        let body = PresignRequest(files: files)
        let response: PresignResponse = try await client.request(
            .post, path: "/upload/presign", body: body, token: token
        )
        return response.uploads
    }

    // MARK: - Direct Upload

    static func uploadImage(
        data: Data,
        contentType: String,
        to presignedUrl: String,
        session: URLSession = .shared
    ) async throws {
        guard let url = URL(string: presignedUrl) else {
            throw APIError.invalidURL
        }

        var request = URLRequest(url: url)
        request.httpMethod = "PUT"
        request.setValue(contentType, forHTTPHeaderField: "Content-Type")
        request.httpBody = data

        let (_, response) = try await session.data(for: request)

        guard let httpResponse = response as? HTTPURLResponse,
              (200...299).contains(httpResponse.statusCode) else {
            throw APIError.invalidResponse
        }
    }

    // MARK: - Full Upload Flow

    static func uploadImages(
        _ images: [UIImage],
        token: String,
        client: APIClient = .shared,
        session: URLSession = .shared
    ) async throws -> [ImageRef] {
        let compressed = images.compactMap { image -> (Data, String)? in
            guard let data = compressImage(
                image,
                maxDimension: APIConfig.maxImageDimension,
                quality: APIConfig.imageCompressionQuality
            ) else {
                return nil
            }
            return (data, "image/jpeg")
        }

        let fileInfos = compressed.enumerated().map { index, _ in
            FileInfo(filename: "photo_\(index).jpg", contentType: "image/jpeg")
        }

        let presignedUploads = try await requestPresignedURLs(
            files: fileInfos, token: token, client: client
        )

        try await withThrowingTaskGroup(of: Void.self) { group in
            for (index, upload) in presignedUploads.enumerated() {
                let (data, contentType) = compressed[index]
                group.addTask {
                    try await uploadImage(
                        data: data,
                        contentType: contentType,
                        to: upload.presignedUrl,
                        session: session
                    )
                }
            }
            try await group.waitForAll()
        }

        return presignedUploads.enumerated().map { index, upload in
            ImageRef(
                key: upload.key,
                url: upload.publicUrl,
                filename: fileInfos[index].filename
            )
        }
    }

    // MARK: - Image Compression

    static func compressImage(
        _ image: UIImage,
        maxDimension: CGFloat,
        quality: CGFloat
    ) -> Data? {
        let resized = resizeImage(image, maxDimension: maxDimension)
        return resized.jpegData(compressionQuality: quality)
    }

    private static func resizeImage(_ image: UIImage, maxDimension: CGFloat) -> UIImage {
        let size = image.size
        guard size.width > maxDimension || size.height > maxDimension else {
            return image
        }

        let ratio = min(maxDimension / size.width, maxDimension / size.height)
        let newSize = CGSize(width: size.width * ratio, height: size.height * ratio)

        let format = UIGraphicsImageRendererFormat()
        format.scale = 1.0
        let renderer = UIGraphicsImageRenderer(size: newSize, format: format)
        return renderer.image { _ in
            image.draw(in: CGRect(origin: .zero, size: newSize))
        }
    }
}
