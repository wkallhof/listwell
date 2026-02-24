import SwiftUI

struct PipelineStepsView: View {
    let currentStep: PipelineStep

    private static let steps: [(step: PipelineStep, label: String)] = [
        (.analyzing, "Analyzing photos"),
        (.researching, "Researching prices"),
        (.generating, "Writing listing"),
        (.complete, "Finishing up"),
    ]

    var body: some View {
        VStack(spacing: Spacing.lg) {
            ForEach(Self.steps, id: \.step) { item in
                stepRow(item.step, label: item.label)
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

    private func stepRow(_ step: PipelineStep, label: String) -> some View {
        let state = stepState(for: step)

        return HStack(spacing: Spacing.md) {
            stepIcon(state)
                .frame(width: 20, height: 20)

            Text(label)
                .font(.bodyFont(size: Typography.body, weight: state == .active ? .medium : .regular))
                .foregroundStyle(stepTextColor(state))

            Spacer()
        }
    }

    @ViewBuilder
    private func stepIcon(_ state: StepState) -> some View {
        switch state {
        case .completed:
            Image(systemName: "checkmark.circle.fill")
                .font(.system(size: 20))
                .foregroundStyle(Color.statusForeground(for: .ready))
        case .active:
            ProgressView()
                .controlSize(.small)
                .tint(Color.accentColor)
        case .pending:
            Image(systemName: "circle")
                .font(.system(size: 20))
                .foregroundStyle(Color.mutedForeground.opacity(0.3))
        }
    }

    private func stepTextColor(_ state: StepState) -> Color {
        switch state {
        case .completed: return Color.mutedForeground
        case .active: return Color.appForeground
        case .pending: return Color.mutedForeground.opacity(0.5)
        }
    }

    private func stepState(for step: PipelineStep) -> StepState {
        let order = Self.steps.map(\.step)
        guard let currentIndex = order.firstIndex(of: currentStep),
              let stepIndex = order.firstIndex(of: step) else {
            return .pending
        }

        if stepIndex < currentIndex { return .completed }
        if stepIndex == currentIndex { return .active }
        return .pending
    }
}

// MARK: - Step State

enum StepState {
    case completed
    case active
    case pending
}
