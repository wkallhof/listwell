import SwiftUI

struct ListingDetailPriceCard: View {
    let price: Double
    let priceRangeLow: Double?
    let priceRangeHigh: Double?
    @Binding var isEditing: Bool
    @Binding var editText: String
    let onSave: () async -> Void

    var body: some View {
        VStack(spacing: Spacing.sm) {
            if isEditing {
                VStack(alignment: .leading, spacing: Spacing.sm) {
                    HStack(spacing: Spacing.xs) {
                        Text("$")
                            .font(.system(size: Typography.priceLarge, weight: .bold))
                            .foregroundStyle(Color.appForeground)
                        TextField("Price", text: $editText)
                            .font(.system(size: Typography.priceLarge, weight: .bold))
                            .keyboardType(.decimalPad)
                            .textFieldStyle(.plain)
                            .editFieldStyle()
                    }
                    EditActionsView {
                        await onSave()
                        isEditing = false
                    } onCancel: {
                        isEditing = false
                    }
                }
            } else {
                HStack(alignment: .firstTextBaseline) {
                    Button {
                        editText = "\(Int(price))"
                        isEditing = true
                    } label: {
                        Text("$\(Int(price))")
                            .font(.system(size: Typography.priceLarge, weight: .bold))
                            .foregroundStyle(Color.appForeground)
                    }
                    .buttonStyle(.plain)
                    .accessibilityLabel("Edit price")
                    Spacer()
                    Text("suggested price")
                        .font(.system(size: Typography.caption))
                        .foregroundStyle(Color.mutedForeground)
                }
            }

            if let low = priceRangeLow, let high = priceRangeHigh {
                Text("Market range: $\(Int(low)) – $\(Int(high))")
                    .font(.system(size: Typography.body))
                    .foregroundStyle(Color.mutedForeground)
                    .frame(maxWidth: .infinity, alignment: .leading)
            }
        }
        .padding(Spacing.lg)
        .background(Color.cardBackground)
        .clipShape(RoundedRectangle(cornerRadius: CornerRadius.default))
        .overlay(
            RoundedRectangle(cornerRadius: CornerRadius.default)
                .stroke(Color.borderColor, lineWidth: 1)
        )
    }
}
