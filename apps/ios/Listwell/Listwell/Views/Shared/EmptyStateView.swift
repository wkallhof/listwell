import SwiftUI

struct EmptyStateView: View {
    let iconName: String
    let title: String
    let description: String

    var body: some View {
        VStack(spacing: Spacing.sm) {
            Image(systemName: iconName)
                .font(.system(size: 48))
                .foregroundStyle(Color.mutedForeground.opacity(0.4))
                .padding(.bottom, Spacing.sm)

            Text(title)
                .font(.system(size: Typography.sectionHeading, weight: .medium))
                .foregroundStyle(Color.mutedForeground)

            Text(description)
                .font(.system(size: Typography.body))
                .foregroundStyle(Color.mutedForeground)
        }
        .multilineTextAlignment(.center)
        .frame(maxWidth: .infinity)
        .padding(.vertical, Spacing.xxxl * 2)
    }
}
