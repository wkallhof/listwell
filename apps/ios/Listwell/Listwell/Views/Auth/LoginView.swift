import SwiftUI

struct LoginView: View {
    @Environment(AuthState.self) private var authState

    @State private var activeTab: AuthTab = .login
    @State private var email = ""
    @State private var password = ""
    @State private var confirmPassword = ""
    @State private var name = ""

    var body: some View {
        GeometryReader { geometry in
            ScrollView {
                VStack {
                    Spacer(minLength: 0)
                    cardContent
                    Spacer(minLength: 0)
                }
                .frame(minHeight: geometry.size.height)
            }
            .scrollDismissesKeyboard(.interactively)
        }
        .background(Color.appBackground)
    }

    private var cardContent: some View {
        VStack(spacing: Spacing.xxl) {
            VStack(spacing: Spacing.sm) {
                Text("Listwell")
                    .font(.system(size: Typography.pageTitle, weight: .bold))
                    .foregroundStyle(Color.appForeground)

                Text("Turn photos into listings")
                    .font(.system(size: Typography.body))
                    .foregroundStyle(Color.mutedForeground)
            }

            Picker("", selection: $activeTab) {
                Text("Log in").tag(AuthTab.login)
                Text("Sign up").tag(AuthTab.register)
            }
            .pickerStyle(.segmented)

            VStack(spacing: Spacing.lg) {
                if activeTab == .register {
                    FormField(label: "Name") {
                        TextField("Full name", text: $name)
                            .textContentType(.name)
                            .autocorrectionDisabled()
                    }
                }

                FormField(label: "Email") {
                    TextField("Email", text: $email)
                        .textContentType(.emailAddress)
                        .keyboardType(.emailAddress)
                        .textInputAutocapitalization(.never)
                        .autocorrectionDisabled()
                }

                FormField(label: "Password") {
                    SecureField("Password", text: $password)
                        .textContentType(activeTab == .login ? .password : .newPassword)
                }

                if activeTab == .register {
                    FormField(label: "Confirm password") {
                        SecureField("Confirm password", text: $confirmPassword)
                            .textContentType(.newPassword)
                    }
                }
            }

            if let error = authState.errorMessage {
                Text(error)
                    .font(.system(size: Typography.caption))
                    .foregroundStyle(Color.destructive)
                    .multilineTextAlignment(.center)
            }

            Button {
                submit()
            } label: {
                Group {
                    if authState.isLoading {
                        ProgressView()
                            .tint(.white)
                    } else {
                        Text(activeTab == .login ? "Log in" : "Create account")
                    }
                }
                .frame(maxWidth: .infinity)
                .frame(height: Sizing.minTapTarget)
            }
            .buttonStyle(.borderedProminent)
            .disabled(!isFormValid || authState.isLoading)
        }
        .padding(Spacing.xxl)
        .background(Color.cardBackground)
        .clipShape(RoundedRectangle(cornerRadius: CornerRadius.default))
        .padding(.horizontal, Sizing.pagePadding)
        .sensoryFeedback(.selection, trigger: activeTab)
        .onChange(of: activeTab) {
            clearForm()
        }
    }

    private var isEmailValid: Bool {
        let pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        return email.wholeMatch(of: pattern) != nil
    }

    private var isPasswordValid: Bool {
        password.count >= 8
    }

    private var isConfirmValid: Bool {
        activeTab == .login || password == confirmPassword
    }

    private var isNameValid: Bool {
        activeTab == .login || !name.trimmingCharacters(in: .whitespaces).isEmpty
    }

    private var isFormValid: Bool {
        isEmailValid && isPasswordValid && isConfirmValid && isNameValid
    }

    private func submit() {
        Task {
            if activeTab == .login {
                await authState.login(email: email, password: password)
            } else {
                await authState.register(
                    email: email,
                    password: password,
                    name: name.trimmingCharacters(in: .whitespaces)
                )
            }
        }
    }

    private func clearForm() {
        email = ""
        password = ""
        confirmPassword = ""
        name = ""
        authState.errorMessage = nil
    }
}

enum AuthTab: String, CaseIterable {
    case login
    case register
}

private struct FormField<Content: View>: View {
    let label: String
    @ViewBuilder let content: Content

    var body: some View {
        VStack(alignment: .leading, spacing: Spacing.xs) {
            Text(label)
                .font(.system(size: Typography.caption, weight: .medium))
                .foregroundStyle(Color.appForeground)
            content
                .font(.system(size: Typography.body))
                .padding(Spacing.md)
                .background(Color.secondaryBackground)
                .clipShape(RoundedRectangle(cornerRadius: CornerRadius.small))
                .overlay(
                    RoundedRectangle(cornerRadius: CornerRadius.small)
                        .stroke(Color.borderColor, lineWidth: 1)
                )
        }
    }
}

#Preview("Login") {
    LoginView()
        .environment(AuthState())
}
