import SwiftUI

struct ListingDetailDescriptionSection: View {
    let description: String
    @Binding var isEditing: Bool
    @Binding var editText: String
    let onSave: () async -> Void

    var body: some View {
        VStack(alignment: .leading, spacing: Spacing.sm) {
            HStack {
                Text("Description")
                    .font(.system(size: Typography.sectionHeading, weight: .semibold))
                    .foregroundStyle(Color.appForeground)
                Spacer()
                CopyButton(text: description, label: "description")
            }

            if isEditing {
                VStack(alignment: .leading, spacing: Spacing.sm) {
                    TextEditor(text: $editText)
                        .font(.system(size: Typography.body))
                        .frame(minHeight: 120)
                        .scrollContentBackground(.hidden)
                        .editFieldStyle()
                    EditActionsView {
                        await onSave()
                        withAnimation(.easeOut(duration: 0.2)) { isEditing = false }
                    } onCancel: {
                        withAnimation(.easeOut(duration: 0.2)) { isEditing = false }
                    }
                }
            } else {
                Button {
                    editText = description
                    withAnimation(.easeOut(duration: 0.2)) { isEditing = true }
                } label: {
                    Text(description)
                        .font(.system(size: Typography.body))
                        .foregroundStyle(Color.appForeground)
                        .lineSpacing(4)
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .multilineTextAlignment(.leading)
                }
                .buttonStyle(.plain)
                .accessibilityLabel("Edit description")
            }
        }
    }
}
