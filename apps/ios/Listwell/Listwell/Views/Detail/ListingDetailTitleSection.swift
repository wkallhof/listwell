import SwiftUI

struct ListingDetailTitleSection: View {
    let title: String
    @Binding var isEditing: Bool
    @Binding var editText: String
    let onSave: () async -> Void

    var body: some View {
        if isEditing {
            VStack(alignment: .leading, spacing: Spacing.sm) {
                TextField("Title", text: $editText)
                    .font(.system(size: Typography.pageTitle, weight: .bold))
                    .textFieldStyle(.plain)
                    .editFieldStyle()
                EditActionsView {
                    await onSave()
                    withAnimation(.easeOut(duration: 0.2)) { isEditing = false }
                } onCancel: {
                    withAnimation(.easeOut(duration: 0.2)) { isEditing = false }
                }
            }
        } else {
            HStack(alignment: .top, spacing: Spacing.sm) {
                Button {
                    editText = title
                    withAnimation(.easeOut(duration: 0.2)) { isEditing = true }
                } label: {
                    Text(title)
                        .font(.system(size: Typography.pageTitle, weight: .bold))
                        .foregroundStyle(Color.appForeground)
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .multilineTextAlignment(.leading)
                }
                .buttonStyle(.plain)
                .accessibilityLabel("Edit title")
                CopyButton(text: title, label: "title")
            }
        }
    }
}
