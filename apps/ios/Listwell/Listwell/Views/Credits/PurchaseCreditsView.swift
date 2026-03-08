import SwiftUI

struct PurchaseCreditsView: View {
    @Environment(AuthState.self) private var authState
    @Environment(\.dismiss) private var dismiss
    @State private var viewModel = CreditsViewModel()

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: Spacing.xxl) {
                    balanceCard
                    purchaseCard
                    if let error = viewModel.errorMessage {
                        errorBanner(error)
                    }
                }
                .padding(.horizontal, Sizing.pagePadding)
                .padding(.vertical, Spacing.lg)
            }
            .background(Color.appBackground)
            .navigationTitle("Credits")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Done") { dismiss() }
                }
            }
            .task {
                await viewModel.loadProducts()
                await viewModel.fetchBalance(token: authState.token)
            }
            .onChange(of: viewModel.purchaseSuccess) {
                if viewModel.purchaseSuccess {
                    dismiss()
                }
            }
        }
    }

    // MARK: - Balance Card

    private var balanceCard: some View {
        VStack(spacing: Spacing.md) {
            Image(systemName: "creditcard.fill")
                .font(.system(size: 32))
                .foregroundStyle(Color.accentColor)

            if viewModel.isLoading {
                ProgressView()
            } else {
                Text("\(viewModel.balance)")
                    .font(.display(size: Typography.xxxl, weight: .bold))
                    .foregroundStyle(Color.appForeground)

                Text(viewModel.balance == 1 ? "credit remaining" : "credits remaining")
                    .font(.bodyFont(size: Typography.base))
                    .foregroundStyle(Color.mutedForeground)
            }
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, Spacing.xxl)
        .background(
            RoundedRectangle(cornerRadius: CornerRadius.lg)
                .fill(Color.cardBackground)
                .stroke(Color.borderColor, lineWidth: 1)
        )
    }

    // MARK: - Purchase Card

    private var purchaseCard: some View {
        VStack(spacing: Spacing.lg) {
            VStack(spacing: Spacing.sm) {
                Text("Need more credits?")
                    .font(.bodyFont(size: Typography.lg, weight: .semibold))
                    .foregroundStyle(Color.appForeground)

                Text("Each credit creates one AI-powered listing")
                    .font(.bodyFont(size: Typography.sm))
                    .foregroundStyle(Color.mutedForeground)
            }

            VStack(spacing: Spacing.sm) {
                HStack {
                    Image(systemName: "sparkles")
                        .foregroundStyle(Color.gold)
                    Text("5 Listing Credits")
                        .font(.bodyFont(size: Typography.md, weight: .semibold))
                        .foregroundStyle(Color.appForeground)
                    Spacer()
                    Text(viewModel.productDisplayPrice ?? "$4.99")
                        .font(.bodyFont(size: Typography.md, weight: .bold))
                        .foregroundStyle(Color.appForeground)
                }
            }

            Button {
                Task { await viewModel.purchaseCredits(token: authState.token) }
            } label: {
                Group {
                    if viewModel.isPurchasing {
                        ProgressView()
                            .tint(.white)
                    } else {
                        Text("Purchase")
                            .font(.bodyFont(size: Typography.md, weight: .semibold))
                    }
                }
                .frame(maxWidth: .infinity)
                .frame(height: Sizing.minTapTarget)
                .background(Color.accentColor)
                .foregroundStyle(.white)
                .clipShape(RoundedRectangle(cornerRadius: CornerRadius.default))
            }
            .disabled(viewModel.isPurchasing || !viewModel.hasProduct)
        }
        .padding(Spacing.lg)
        .background(
            RoundedRectangle(cornerRadius: CornerRadius.lg)
                .fill(Color.cardBackground)
                .stroke(Color.borderColor, lineWidth: 1)
        )
    }

    // MARK: - Error Banner

    private func errorBanner(_ message: String) -> some View {
        HStack(spacing: Spacing.sm) {
            Image(systemName: "exclamationmark.triangle.fill")
                .foregroundStyle(Color.destructive)
            Text(message)
                .font(.bodyFont(size: Typography.sm))
                .foregroundStyle(Color.appForeground)
        }
        .padding(Spacing.md)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(
            RoundedRectangle(cornerRadius: CornerRadius.default)
                .fill(Color.destructive.opacity(0.1))
                .stroke(Color.destructive.opacity(0.3), lineWidth: 1)
        )
    }
}
