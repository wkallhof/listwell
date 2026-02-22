import SwiftUI

struct DescribeView: View {
    @Bindable var viewModel: NewListingViewModel
    @Environment(AuthState.self) private var authState
    @Environment(\.dismiss) private var dismiss

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
        .onChange(of: viewModel.submittedListingId) { _, listingId in
            if let listingId {
                onSubmitted(listingId)
            }
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

            if viewModel.description.isEmpty {
                Text("Tell us about this item — brand, condition, why you're selling... (optional)")
                    .font(.system(size: Typography.body))
                    .foregroundStyle(Color.mutedForeground)
                    .padding(.horizontal, Spacing.md)
                    .padding(.vertical, Spacing.md)
                    .allowsHitTesting(false)
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
}
