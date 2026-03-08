import Foundation

struct CreditBalance: Codable, Sendable {
    let balance: Int
    let freeCreditsGranted: Bool
}

struct CreditTransaction: Codable, Identifiable, Sendable {
    let id: String
    let type: CreditTransactionType
    let amount: Int
    let balanceAfter: Int
    let listingId: String?
    let note: String?
    let createdAt: Date

    enum CreditTransactionType: String, Codable, Sendable {
        case freeGrant = "FREE_GRANT"
        case purchase = "PURCHASE"
        case usage = "USAGE"
        case refund = "REFUND"
    }
}

struct PurchaseVerificationResponse: Codable, Sendable {
    let success: Bool
    let balance: Int
    let alreadyProcessed: Bool
}
