import SwiftUI

struct SettingsView: View {
    @Environment(AuthState.self) private var authState
    @Environment(SettingsStore.self) private var settingsStore
    @State private var viewModel = SettingsViewModel()

    var body: some View {
        ScrollView {
            VStack(spacing: Spacing.xxl) {
                appearanceSection
                notificationsSection
                accountSection
            }
            .padding(.horizontal, Sizing.pagePadding)
            .padding(.vertical, Spacing.lg)
        }
        .background(Color.appBackground)
        .navigationTitle("Preferences")
        .navigationBarTitleDisplayMode(.inline)
        .task {
            await viewModel.load(token: authState.token)
        }
    }

    // MARK: - Appearance

    private var appearanceSection: some View {
        VStack(alignment: .leading, spacing: Spacing.md) {
            Text("Appearance")
                .font(.bodyFont(size: Typography.sm, weight: .medium))
                .foregroundStyle(Color.mutedForeground)

            HStack(spacing: Spacing.sm) {
                ForEach(ThemePreference.allCases, id: \.rawValue) { option in
                    themeButton(option)
                }
            }
        }
    }

    private func themeButton(_ option: ThemePreference) -> some View {
        let isSelected = viewModel.themePreference == option

        return Button {
            settingsStore.themePreference = option
            Task { await viewModel.updateTheme(option, token: authState.token) }
        } label: {
            VStack(spacing: Spacing.xs) {
                Image(systemName: themeIcon(option))
                    .font(.system(size: 18))
                Text(themeLabel(option))
                    .font(.bodyFont(size: Typography.xs, weight: .medium))
            }
            .frame(maxWidth: .infinity)
            .padding(.vertical, Spacing.md)
            .foregroundStyle(isSelected ? Color.accentColor : Color.mutedForeground)
            .background(
                RoundedRectangle(cornerRadius: CornerRadius.default)
                    .stroke(isSelected ? Color.accentColor : Color.borderColor, lineWidth: 1)
                    .fill(isSelected ? Color.accentColor.opacity(0.05) : Color.clear)
            )
        }
        .buttonStyle(.plain)
    }

    private func themeIcon(_ option: ThemePreference) -> String {
        switch option {
        case .light: return "sun.max"
        case .dark: return "moon"
        case .system: return "desktopcomputer"
        }
    }

    private func themeLabel(_ option: ThemePreference) -> String {
        switch option {
        case .light: return "Light"
        case .dark: return "Dark"
        case .system: return "System"
        }
    }

    // MARK: - Notifications

    private var notificationsSection: some View {
        VStack(alignment: .leading, spacing: Spacing.md) {
            Text("Notifications")
                .font(.bodyFont(size: Typography.sm, weight: .medium))
                .foregroundStyle(Color.mutedForeground)

            HStack {
                VStack(alignment: .leading, spacing: Spacing.xs) {
                    Text("Push notifications")
                        .font(.bodyFont(size: Typography.base, weight: .medium))
                        .foregroundStyle(Color.appForeground)
                    Text("Get notified when listings are ready")
                        .font(.bodyFont(size: Typography.xs))
                        .foregroundStyle(Color.mutedForeground)
                }
                Spacer()
                Toggle("", isOn: Binding(
                    get: { viewModel.notificationsEnabled },
                    set: { newValue in
                        Task { await viewModel.updateNotifications(newValue, token: authState.token) }
                    }
                ))
                .labelsHidden()
                .tint(Color.accentColor)
            }
            .padding(Spacing.lg)
            .background(
                RoundedRectangle(cornerRadius: CornerRadius.default)
                    .stroke(Color.borderColor, lineWidth: 1)
            )
        }
    }

    // MARK: - Account

    private var accountSection: some View {
        VStack(alignment: .leading, spacing: Spacing.md) {
            Text("Account")
                .font(.bodyFont(size: Typography.sm, weight: .medium))
                .foregroundStyle(Color.mutedForeground)

            VStack(alignment: .leading, spacing: Spacing.md) {
                if let email = authState.currentUser?.email {
                    Text(email)
                        .font(.bodyFont(size: Typography.base))
                        .foregroundStyle(Color.mutedForeground)
                }

                Button(role: .destructive) {
                    Task { await authState.logout() }
                } label: {
                    Label("Log out", systemImage: "rectangle.portrait.and.arrow.right")
                        .font(.bodyFont(size: Typography.base, weight: .medium))
                }
            }
            .padding(Spacing.lg)
            .frame(maxWidth: .infinity, alignment: .leading)
            .background(
                RoundedRectangle(cornerRadius: CornerRadius.default)
                    .stroke(Color.borderColor, lineWidth: 1)
            )
        }
    }
}
