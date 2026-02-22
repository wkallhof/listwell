import SwiftUI

struct ComparablesView: View {
    let comparables: [Comparable]

    var body: some View {
        if !comparables.isEmpty {
            VStack(alignment: .leading, spacing: Spacing.md) {
                Text("Market Comparables")
                    .font(.system(size: Typography.sectionHeading, weight: .semibold))
                    .foregroundStyle(Color.appForeground)

                VStack(spacing: Spacing.sm) {
                    ForEach(Array(comparables.enumerated()), id: \.offset) { _, comparable in
                        comparableCard(comparable)
                    }
                }
            }
        }
    }

    private func comparableCard(_ comparable: Comparable) -> some View {
        HStack(spacing: Spacing.md) {
            VStack(alignment: .leading, spacing: Spacing.xs) {
                Text(comparable.title)
                    .font(.system(size: Typography.body, weight: .medium))
                    .foregroundStyle(Color.appForeground)
                    .lineLimit(1)
                Text(comparable.source)
                    .font(.system(size: Typography.caption))
                    .foregroundStyle(Color.mutedForeground)
            }
            .frame(maxWidth: .infinity, alignment: .leading)

            Text("$\(Int(comparable.price))")
                .font(.system(size: Typography.body, weight: .semibold))
                .foregroundStyle(Color.appForeground)

            if let urlString = comparable.url, let url = URL(string: urlString) {
                Link(destination: url) {
                    Image(systemName: "arrow.up.right.square")
                        .font(.system(size: 14))
                        .foregroundStyle(Color.mutedForeground)
                        .frame(width: Sizing.minTapTarget, height: Sizing.minTapTarget)
                        .contentShape(Rectangle())
                }
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
