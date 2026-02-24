import SwiftUI

struct ListingStatusBadge: View {
    let status: ListingStatus
    let pipelineStep: PipelineStep

    init(status: ListingStatus, pipelineStep: PipelineStep = .pending) {
        self.status = status
        self.pipelineStep = pipelineStep
    }

    private var isError: Bool {
        pipelineStep == .error
    }

    private var displayStatus: String {
        if isError { return "Error" }
        return status.displayName
    }

    private var backgroundColor: Color {
        if isError { return Color.statusBackground(for: .draft) }
        return Color.statusBackground(for: status)
    }

    private var foregroundColor: Color {
        if isError { return Color("StatusErrorFg") }
        return Color.statusForeground(for: status)
    }

    var body: some View {
        HStack(spacing: Spacing.xs) {
            if status == .processing && !isError {
                ProgressView()
                    .controlSize(.mini)
                    .tint(foregroundColor)
            }
            if isError {
                Image(systemName: "exclamationmark.circle.fill")
                    .font(.system(size: Typography.caption))
            }
            if status == .ready && !isError {
                Image(systemName: "checkmark.circle.fill")
                    .font(.system(size: Typography.caption))
            }
            Text(displayStatus)
                .font(.bodyFont(size: Typography.caption, weight: .medium))
        }
        .foregroundStyle(foregroundColor)
        .padding(.horizontal, 10)
        .padding(.vertical, 4)
        .background(backgroundColor)
        .clipShape(RoundedRectangle(cornerRadius: CornerRadius.small))
    }
}
