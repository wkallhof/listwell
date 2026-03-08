import Foundation

enum CreditsService {

    static func fetchBalance(
        token: String,
        client: APIClient = .shared
    ) async throws -> CreditBalance {
        try await client.request(.get, path: "/credits", token: token)
    }

    static func fetchTransactions(
        token: String,
        client: APIClient = .shared
    ) async throws -> [CreditTransaction] {
        try await client.request(.get, path: "/credits/transactions", token: token)
    }

    static func verifyPurchase(
        signedTransaction: String,
        token: String,
        client: APIClient = .shared
    ) async throws -> PurchaseVerificationResponse {
        let body = VerifyPurchaseRequest(signedTransaction: signedTransaction)
        return try await client.request(.post, path: "/purchases/apple/verify", body: body, token: token)
    }
}

private struct VerifyPurchaseRequest: Encodable {
    let signedTransaction: String
}
