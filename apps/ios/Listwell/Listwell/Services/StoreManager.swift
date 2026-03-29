import Foundation
import StoreKit

@Observable
@MainActor
final class StoreManager {
    private(set) var products: [Product] = []
    private(set) var isLoading = false
    private(set) var purchaseError: String?

    @ObservationIgnored
    private var transactionListener: Task<Void, Never>?

    static let creditProductId = "com.listwell.credits5"

    init() {
        let task = listenForTransactions()
        transactionListener = task
    }

    deinit {
        transactionListener?.cancel()
    }

    // MARK: - Load Products

    func loadProducts() async {
        guard products.isEmpty else { return }
        isLoading = true
        defer { isLoading = false }

        do {
            let storeProducts = try await Product.products(for: [Self.creditProductId])
            products = storeProducts
        } catch {
            print("[Store] Failed to load products: \(error)")
        }
    }

    // MARK: - Purchase

    func purchase(token: String) async -> Bool {
        guard let product = products.first else {
            purchaseError = "Product not available"
            return false
        }

        purchaseError = nil

        do {
            let result = try await product.purchase()

            switch result {
            case .success(let verification):
                let transaction = try checkVerified(verification)
                let success = await verifyWithBackend(
                    verification: verification,
                    token: token
                )
                if success {
                    await transaction.finish()
                    return true
                } else {
                    purchaseError = "Server verification failed"
                    return false
                }

            case .userCancelled:
                return false

            case .pending:
                purchaseError = "Purchase is pending approval"
                return false

            @unknown default:
                purchaseError = "Unknown purchase result"
                return false
            }
        } catch {
            purchaseError = error.localizedDescription
            return false
        }
    }

    // MARK: - Transaction Listener

    private func listenForTransactions() -> Task<Void, Never> {
        Task.detached { [weak self] in
            for await result in Transaction.updates {
                guard let self else { return }
                do {
                    let transaction = try self.checkVerified(result)
                    if let savedToken = KeychainManager.retrieve(forKey: KeychainKeys.authToken) {
                        let success = await self.verifyWithBackend(
                            verification: result,
                            token: savedToken
                        )
                        if success {
                            await transaction.finish()
                        }
                    }
                } catch {
                    print("[Store] Transaction verification failed: \(error)")
                }
            }
        }
    }

    // MARK: - Helpers

    private nonisolated func checkVerified(_ result: VerificationResult<Transaction>) throws -> Transaction {
        switch result {
        case .verified(let transaction):
            return transaction
        case .unverified(_, let error):
            throw error
        }
    }

    private func verifyWithBackend(
        verification: VerificationResult<Transaction>,
        token: String
    ) async -> Bool {
        let jwsString = verification.jwsRepresentation

        do {
            let response = try await CreditsService.verifyPurchase(
                signedTransaction: jwsString,
                token: token
            )
            return response.success
        } catch {
            print("[Store] Backend verification failed: \(error)")
            return false
        }
    }
}
