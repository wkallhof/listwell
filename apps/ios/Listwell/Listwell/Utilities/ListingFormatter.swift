import Foundation

enum ListingFormatter {
    static func formatForClipboard(_ listing: Listing) -> String {
        var parts: [String] = []

        // Title line — include price inline for marketplace paste
        if let title = listing.title, let price = listing.suggestedPrice {
            parts.append("\(title) - $\(Int(price))")
        } else if let title = listing.title {
            parts.append(title)
        } else if let price = listing.suggestedPrice {
            parts.append("$\(Int(price))")
        }

        // Description block
        if let description = listing.description {
            if !parts.isEmpty { parts.append("") }
            parts.append(description)
        }

        // Product details line (compact format for marketplace copy)
        var details: [String] = []
        if let condition = listing.condition {
            details.append("Condition: \(condition)")
        }
        if let brand = listing.brand {
            details.append("Brand: \(brand)")
        }
        if let model = listing.model {
            details.append("Model: \(model)")
        }

        if !details.isEmpty {
            if !parts.isEmpty { parts.append("") }
            parts.append(details.joined(separator: " | "))
        }

        return parts.joined(separator: "\n")
    }
}
