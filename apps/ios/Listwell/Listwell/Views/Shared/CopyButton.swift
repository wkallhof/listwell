import SwiftUI
import UIKit

struct CopyButton: View {
    let text: String
    var label: String?

    @State private var isCopied = false

    var body: some View {
        Button {
            UIPasteboard.general.string = text
            isCopied = true
            DispatchQueue.main.asyncAfter(deadline: .now() + 2) {
                isCopied = false
            }
        } label: {
            Image(systemName: isCopied ? "checkmark" : "doc.on.doc")
                .font(.system(size: 14))
                .foregroundStyle(Color.mutedForeground)
                .frame(width: Sizing.minTapTarget, height: Sizing.minTapTarget)
                .contentShape(Rectangle())
        }
        .buttonStyle(.plain)
        .sensoryFeedback(.success, trigger: isCopied)
        .accessibilityLabel(label.map { "Copy \($0)" } ?? "Copy")
    }
}
