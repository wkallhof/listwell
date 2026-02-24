import SwiftUI

struct ComparablesView: View {
    let comparables: [MarketComparable]

    var body: some View {
        if !comparables.isEmpty {
            VStack(alignment: .leading, spacing: Spacing.md) {
                Text("Market Comparables")
                    .font(.display(size: Typography.sectionHeading, weight: .semibold))
                    .foregroundStyle(Color.appForeground)

                VStack(spacing: Spacing.sm) {
                    ForEach(comparables) { comparable in
                        comparableCard(comparable)
                    }
                }
            }
        }
    }

    private func comparableCard(_ comparable: MarketComparable) -> some View {
        HStack(spacing: Spacing.md) {
            VStack(alignment: .leading, spacing: Spacing.xs) {
                Text(comparable.title)
                    .font(.bodyFont(size: Typography.body, weight: .medium))
                    .foregroundStyle(Color.appForeground)
                    .lineLimit(1)
                Text(comparable.source)
                    .font(.bodyFont(size: Typography.caption))
                    .foregroundStyle(Color.mutedForeground)
            }
            .frame(maxWidth: .infinity, alignment: .leading)

            Text("$\(Int(comparable.price))")
                .font(.mono(size: Typography.body, weight: .semibold))
                .foregroundStyle(Color.appForeground)

            if let urlString = comparable.url, let url = URL(string: urlString) {
                Link(destination: url) {
                    Image(systemName: "arrow.up.right.square")
                        .font(.system(size: 14))
                        .foregroundStyle(Color.mutedForeground)
                        .frame(width: Sizing.minTapTarget, height: Sizing.minTapTarget)
                        .contentShape(Rectangle())
                }
                .accessibilityLabel("View on \(comparable.source)")
            }
        }
        .padding(.horizontal, Spacing.lg)
        .padding(.vertical, Spacing.md)
        .background(Color.cardBackground)
        .clipShape(RoundedRectangle(cornerRadius: CornerRadius.default))
        .overlay(
            RoundedRectangle(cornerRadius: CornerRadius.default)
                .stroke(Color.borderColor, lineWidth: 1)
        )
    }
}
