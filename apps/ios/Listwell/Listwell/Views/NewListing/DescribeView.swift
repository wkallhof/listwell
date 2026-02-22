import SwiftUI

struct DescribeView: View {
    @Bindable var viewModel: NewListingViewModel
    @Environment(AuthState.self) private var authState
    @Environment(\.dismiss) private var dismiss
    @State private var speechRecognizer = SpeechRecognizer()
    @State private var showPushPrompt = false
    @Environment(PushNotificationManager.self) private var pushManager

    var onSubmitted: (String) -> Void

    var body: some View {
        VStack(spacing: 0) {
            ScrollView {
                VStack(spacing: Spacing.xl) {
                    thumbnailStrip
                    textEditor
                    helperText
                }
                .padding(.horizontal, Sizing.pagePadding)
                .padding(.vertical, Spacing.lg)
            }

            bottomBar
        }
        .navigationTitle("Describe It")
        .navigationBarTitleDisplayMode(.inline)
        .navigationBarBackButtonHidden(true)
        .toolbar {
            ToolbarItem(placement: .navigationBarLeading) {
                Button { dismiss() } label: {
                    Image(systemName: "chevron.left")
                        .foregroundStyle(Color.appForeground)
                }
            }
        }
        .overlay {
            if viewModel.isSubmitting {
                submittingOverlay
            }
        }
        .sensoryFeedback(.success, trigger: viewModel.submittedListingId)
        .onChange(of: viewModel.submittedListingId) { _, listingId in
            if let listingId {
                promptForPushIfFirstSubmission()
                onSubmitted(listingId)
            }
        }
        .alert("Enable Notifications?", isPresented: $showPushPrompt) {
            Button("Enable") {
                Task {
                    _ = await pushManager.requestPermission()
                }
            }
            Button("Not Now", role: .cancel) {}
        } message: {
            Text("Get notified when your listing is ready. We'll send a push notification when the AI finishes generating your listing.")
        }
    }

    // MARK: - Thumbnail Strip

    private var thumbnailStrip: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: Spacing.sm) {
                ForEach(viewModel.selectedImages.indices, id: \.self) { index in
                    Image(uiImage: viewModel.selectedImages[index])
                        .resizable()
                        .scaledToFill()
                        .frame(width: Sizing.smallThumbnailSize, height: Sizing.smallThumbnailSize)
                        .clipShape(RoundedRectangle(cornerRadius: CornerRadius.image))
                }
            }
        }
    }

    // MARK: - Text Editor

    private var textEditor: some View {
        VStack(spacing: Spacing.sm) {
            ZStack(alignment: .topLeading) {
                TextEditor(text: Bindable(viewModel).description)
                    .font(.system(size: Typography.body))
                    .frame(minHeight: 160)
                    .scrollContentBackground(.hidden)
                    .padding(Spacing.sm)
                    .background(Color.secondaryBackground)
                    .clipShape(RoundedRectangle(cornerRadius: CornerRadius.default))
                    .overlay(
                        RoundedRectangle(cornerRadius: CornerRadius.default)
                            .stroke(Color.borderColor, lineWidth: 1)
                    )
                    .overlay(alignment: .bottomTrailing) {
                        micButton
                            .padding(Spacing.sm)
                    }

                if viewModel.description.isEmpty && !speechRecognizer.isRecording {
                    Text("Tell us about this item — brand, condition, why you're selling... (optional)")
                        .font(.system(size: Typography.body))
                        .foregroundStyle(Color.mutedForeground)
                        .padding(.horizontal, Spacing.md)
                        .padding(.vertical, Spacing.md)
                        .allowsHitTesting(false)
                }
            }

            if speechRecognizer.isRecording {
                recordingIndicator
            }
        }
        .onChange(of: speechRecognizer.transcript) { _, newValue in
            if !newValue.isEmpty {
                viewModel.description = newValue
            }
        }
    }

    // MARK: - Mic Button

    private var micButton: some View {
        Button {
            Task { await toggleRecording() }
        } label: {
            Image(systemName: speechRecognizer.isRecording ? "mic.slash" : "mic")
                .font(.system(size: 18))
                .foregroundStyle(speechRecognizer.isRecording ? Color.destructive : Color.accentColor)
                .frame(width: Sizing.minTapTarget, height: Sizing.minTapTarget)
                .background(
                    Circle()
                        .fill(speechRecognizer.isRecording ? Color.destructive.opacity(0.1) : Color.accentColor.opacity(0.1))
                )
        }
        .accessibilityLabel(speechRecognizer.isRecording ? "Stop recording" : "Start voice input")
    }

    // MARK: - Recording Indicator

    private var recordingIndicator: some View {
        HStack(spacing: Spacing.sm) {
            Circle()
                .fill(Color.destructive)
                .frame(width: 8, height: 8)

            Text("Listening...")
                .font(.system(size: Typography.caption))
                .foregroundStyle(Color.mutedForeground)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }

    private func toggleRecording() async {
        if speechRecognizer.isRecording {
            speechRecognizer.stopRecording()
        } else {
            let granted = await speechRecognizer.requestPermissions()
            guard granted else { return }
            do {
                try speechRecognizer.startRecording()
            } catch {
                speechRecognizer.errorMessage = "Failed to start recording."
            }
        }
    }

    // MARK: - Helper Text

    private var helperText: some View {
        Text("More detail = better results. But you can also skip this.")
            .font(.system(size: Typography.caption))
            .foregroundStyle(Color.mutedForeground)
            .multilineTextAlignment(.center)
    }

    // MARK: - Bottom Bar

    private var bottomBar: some View {
        VStack(spacing: 0) {
            Divider()
            HStack(spacing: Spacing.md) {
                Button {
                    Task { await submit() }
                } label: {
                    Text("Skip")
                        .font(.system(size: Typography.body, weight: .medium))
                        .frame(maxWidth: .infinity)
                        .frame(height: Sizing.minTapTarget)
                        .background(Color.secondaryBackground)
                        .foregroundStyle(Color.secondaryForeground)
                        .clipShape(RoundedRectangle(cornerRadius: CornerRadius.default))
                }

                Button {
                    Task { await submit() }
                } label: {
                    Text("Generate Listing")
                        .font(.system(size: Typography.body, weight: .semibold))
                        .frame(maxWidth: .infinity)
                        .frame(height: Sizing.minTapTarget)
                        .background(Color.accentColor)
                        .foregroundStyle(.white)
                        .clipShape(RoundedRectangle(cornerRadius: CornerRadius.default))
                }
            }
            .padding(.horizontal, Sizing.pagePadding)
            .padding(.vertical, Spacing.md)
        }
        .background(Color.appBackground.opacity(0.8))
    }

    // MARK: - Submitting Overlay

    private var submittingOverlay: some View {
        Color.black.opacity(0.4)
            .ignoresSafeArea()
            .overlay {
                VStack(spacing: Spacing.lg) {
                    ProgressView()
                        .controlSize(.large)
                    Text("Creating listing...")
                        .font(.system(size: Typography.body, weight: .medium))
                        .foregroundStyle(.white)
                }
            }
    }

    private func submit() async {
        await viewModel.submitListing(token: authState.token)
    }

    private func promptForPushIfFirstSubmission() {
        let key = "hasPromptedForPush"
        guard !UserDefaults.standard.bool(forKey: key) else { return }
        guard !pushManager.isRegistered else { return }
        UserDefaults.standard.set(true, forKey: key)
        showPushPrompt = true
    }
}
