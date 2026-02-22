import Foundation

struct Comparable: Codable, Sendable {
    let title: String
    let price: Double
    let source: String
    let url: String?
    let condition: String?
    let soldDate: String?
}
