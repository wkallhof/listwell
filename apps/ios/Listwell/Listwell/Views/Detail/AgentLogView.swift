import SwiftUI

struct AgentLogView: View {
    let entries: [AgentLogEntry]

    var body: some View {
        ScrollViewReader { proxy in
            ScrollView {
                LazyVStack(alignment: .leading, spacing: Spacing.sm) {
                    ForEach(entries) { entry in
                        logEntryRow(entry)
                    }
                }
                .padding(Spacing.lg)
            }
            .frame(maxHeight: 200)
            .background(Color.cardBackground)
            .clipShape(RoundedRectangle(cornerRadius: CornerRadius.default))
            .overlay(
                RoundedRectangle(cornerRadius: CornerRadius.default)
                    .stroke(Color.borderColor, lineWidth: 1)
            )
            .onChange(of: entries.count) {
                if let lastEntry = entries.last {
                    withAnimation {
                        proxy.scrollTo(lastEntry.id, anchor: .bottom)
                    }
                }
            }
        }
    }

    private func logEntryRow(_ entry: AgentLogEntry) -> some View {
        HStack(alignment: .top, spacing: Spacing.sm) {
            Image(systemName: entry.iconName)
                .font(.system(size: 12))
                .foregroundStyle(Color.mutedForeground)
                .frame(width: 16, height: 16)

            Text(entry.content)
                .font(.bodyFont(size: Typography.caption))
                .foregroundStyle(Color.mutedForeground)
                .lineLimit(2)

            Spacer()

            Text(TimeAgo.string(from: entry.date))
                .font(.bodyFont(size: 10))
                .foregroundStyle(Color.mutedForeground.opacity(0.6))
        }
    }
}
