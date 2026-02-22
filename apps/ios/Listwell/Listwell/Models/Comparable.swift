import Foundation

struct MarketComparable: Codable, Sendable, Identifiable {
    let title: String
    let price: Double
    let source: String
    let url: String?
    let condition: String?
    let soldDate: String?

    var id: String { "\(title)-\(source)-\(price)" }
}
