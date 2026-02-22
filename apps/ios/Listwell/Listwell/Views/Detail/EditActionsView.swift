import SwiftUI

struct EditActionsView: View {
    let onSave: () async -> Void
    let onCancel: () -> Void

    var body: some View {
        HStack(spacing: Spacing.sm) {
            Button("Save") {
                Task { await onSave() }
            }
            .font(.system(size: Typography.body, weight: .medium))
            .foregroundStyle(Color.accentColor)

            Button("Cancel", action: onCancel)
                .font(.system(size: Typography.body))
                .foregroundStyle(Color.mutedForeground)
        }
    }
}
