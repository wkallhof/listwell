import SwiftUI

struct ProductDetailsView: View {
    let brand: String?
    let model: String?
    let condition: String?
    let category: String?

    private var details: [(label: String, value: String)] {
        var result: [(String, String)] = []
        if let brand { result.append(("Brand", brand)) }
        if let model { result.append(("Model", model)) }
        if let condition { result.append(("Condition", condition)) }
        if let category { result.append(("Category", category)) }
        return result
    }

    var body: some View {
        if !details.isEmpty {
            LazyVGrid(
                columns: [
                    GridItem(.flexible(), spacing: Spacing.lg),
                    GridItem(.flexible(), spacing: Spacing.lg)
                ],
                spacing: Spacing.md
            ) {
                ForEach(details, id: \.label) { detail in
                    VStack(alignment: .leading, spacing: Spacing.xs) {
                        Text(detail.label.uppercased())
                            .font(.bodyFont(size: Typography.caption))
                            .foregroundStyle(Color.mutedForeground)
                            .tracking(0.5)
                        Text(detail.value)
                            .font(.bodyFont(size: Typography.body, weight: .medium))
                            .foregroundStyle(Color.appForeground)
                    }
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
}
