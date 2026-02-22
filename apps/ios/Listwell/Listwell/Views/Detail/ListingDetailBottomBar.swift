import SwiftUI

struct ListingDetailBottomBar: View {
    let onCopy: () -> Void
    @Binding var isCopied: Bool

    var body: some View {
        VStack(spacing: 0) {
            Divider()
            Button {
                onCopy()
                Task {
                    isCopied = true
                    try? await Task.sleep(for: .seconds(2))
                    isCopied = false
                }
            } label: {
                HStack(spacing: Spacing.sm) {
                    Image(systemName: isCopied ? "checkmark" : "doc.on.doc")
                        .font(.system(size: 16))
                    Text(isCopied ? "Copied!" : "Copy Full Listing")
                        .font(.system(size: Typography.body, weight: .semibold))
                }
                .frame(maxWidth: .infinity)
                .frame(height: Sizing.minTapTarget)
                .background(Color.accentColor)
                .foregroundStyle(.white)
                .clipShape(RoundedRectangle(cornerRadius: CornerRadius.default))
            }
            .sensoryFeedback(.success, trigger: isCopied)
            .padding(.horizontal, Sizing.pagePadding)
            .padding(.vertical, Spacing.md)
        }
        .background(Color.appBackground.opacity(0.8))
    }
}
