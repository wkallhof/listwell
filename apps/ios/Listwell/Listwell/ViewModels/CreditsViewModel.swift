import Foundation

@Observable
@MainActor
final class CreditsViewModel {
    var balance: Int = 0
    var freeCreditsGranted = false
    var isLoading = false
    var isPurchasing = false
    var errorMessage: String?
    var purchaseSuccess = false

    private let storeManager: StoreManager

    init(storeManager: StoreManager = StoreManager()) {
        self.storeManager = storeManager
    }

    var productDisplayPrice: String? {
        storeManager.products.first?.displayPrice
    }

    var hasProduct: Bool {
        !storeManager.products.isEmpty
    }

    func loadProducts() async {
        await storeManager.loadProducts()
    }

    func fetchBalance(token: String?) async {
        guard let token else { return }
        isLoading = true
        defer { isLoading = false }

        do {
            let credits = try await CreditsService.fetchBalance(token: token)
            balance = credits.balance
            freeCreditsGranted = credits.freeCreditsGranted
        } catch {
            print("[Credits] Failed to fetch balance: \(error)")
        }
    }

    func purchaseCredits(token: String?) async {
        guard let token else { return }
        isPurchasing = true
        errorMessage = nil
        purchaseSuccess = false
        defer { isPurchasing = false }

        let success = await storeManager.purchase(token: token)
        if success {
            purchaseSuccess = true
            await fetchBalance(token: token)
        } else if let error = storeManager.purchaseError {
            errorMessage = error
        }
    }
}
