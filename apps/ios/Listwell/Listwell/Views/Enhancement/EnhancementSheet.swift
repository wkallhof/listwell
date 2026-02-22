import SwiftUI
import Kingfisher

struct EnhancementSheet: View {
    @Bindable var viewModel: EnhancementViewModel
    let token: String?
    let onDismiss: () -> Void

    @State private var variantToDelete: ListingImage?

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: Spacing.lg) {
                    headerDescription
                    originalImageSection
                    variantsSection
                    enhanceAction
                }
                .padding(.horizontal, Sizing.pagePadding)
                .padding(.vertical, Spacing.lg)
            }
            .background(Color.appBackground)
            .navigationTitle("Enhance Photo")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .confirmationAction) {
                    Button("Done") { onDismiss() }
                }
            }
            .sensoryFeedback(.success, trigger: viewModel.enhancedVariants.count)
            .alert(
                "Delete enhanced version?",
                isPresented: Binding(
                    get: { variantToDelete != nil },
                    set: { if !$0 { variantToDelete = nil } }
                ),
                presenting: variantToDelete
            ) { variant in
                Button("Delete", role: .destructive) {
                    Task {
                        await viewModel.deleteVariant(variant, token: token)
                    }
                }
                Button("Cancel", role: .cancel) {}
            } message: { _ in
                Text("This enhanced version will be permanently removed.")
            }
        }
    }

    // MARK: - Header Description

    private var headerDescription: some View {
        Text("AI will clean up lighting and background")
            .font(.system(size: Typography.body))
            .foregroundStyle(Color.mutedForeground)
            .frame(maxWidth: .infinity, alignment: .leading)
    }

    // MARK: - Original Image

    private var originalImageSection: some View {
        ZStack(alignment: .topLeading) {
            KFImage(viewModel.originalImage.imageURL)
                .resizable()
                .scaledToFill()
                .frame(maxWidth: .infinity)
                .aspectRatio(4/3, contentMode: .fit)
                .clipped()
                .clipShape(RoundedRectangle(cornerRadius: CornerRadius.default))

            Text("Original")
                .font(.system(size: Typography.caption))
                .foregroundStyle(.white)
                .padding(.horizontal, Spacing.sm)
                .padding(.vertical, Spacing.xs)
                .background(.black.opacity(0.5))
                .clipShape(RoundedRectangle(cornerRadius: CornerRadius.small))
                .padding(Spacing.sm)
        }
    }

    // MARK: - Variants Grid

    @ViewBuilder
    private var variantsSection: some View {
        if !viewModel.enhancedVariants.isEmpty {
            VStack(alignment: .leading, spacing: Spacing.sm) {
                Text("Enhanced versions")
                    .font(.system(size: Typography.body, weight: .medium))
                    .foregroundStyle(Color.appForeground)

                LazyVGrid(
                    columns: [
                        GridItem(.flexible(), spacing: Spacing.sm),
                        GridItem(.flexible(), spacing: Spacing.sm),
                    ],
                    spacing: Spacing.sm
                ) {
                    ForEach(viewModel.enhancedVariants) { variant in
                        variantCard(variant)
                    }
                }
            }
        }
    }

    private func variantCard(_ variant: ListingImage) -> some View {
        ZStack(alignment: .topTrailing) {
            KFImage(variant.imageURL)
                .resizable()
                .scaledToFill()
                .aspectRatio(4/3, contentMode: .fit)
                .clipped()
                .clipShape(RoundedRectangle(cornerRadius: CornerRadius.image))

            Button {
                variantToDelete = variant
            } label: {
                Image(systemName: "trash")
                    .font(.system(size: 14))
                    .foregroundStyle(.white)
                    .frame(width: 28, height: 28)
                    .background(.black.opacity(0.4))
                    .clipShape(RoundedRectangle(cornerRadius: CornerRadius.small))
            }
            .padding(Spacing.xs)
        }
    }

    // MARK: - Enhance Action

    @ViewBuilder
    private var enhanceAction: some View {
        if viewModel.isEnhancing {
            HStack(spacing: Spacing.sm) {
                ProgressView()
                    .tint(Color.accentColor)
                Text("Enhancing...")
                    .font(.system(size: Typography.body))
                    .foregroundStyle(Color.mutedForeground)
            }
            .frame(maxWidth: .infinity)
            .padding(.vertical, Spacing.xxxl)
        } else {
            Button {
                Task {
                    await viewModel.requestEnhancement(token: token)
                }
            } label: {
                HStack(spacing: Spacing.sm) {
                    Image(systemName: "wand.and.stars")
                        .font(.system(size: 16))
                    Text("Generate Enhanced Version")
                        .font(.system(size: Typography.body, weight: .medium))
                }
                .frame(maxWidth: .infinity)
                .frame(height: Sizing.minTapTarget)
                .foregroundStyle(Color.appForeground)
                .background(Color.appBackground)
                .clipShape(RoundedRectangle(cornerRadius: CornerRadius.default))
                .overlay(
                    RoundedRectangle(cornerRadius: CornerRadius.default)
                        .stroke(Color.borderColor, lineWidth: 1)
                )
            }
        }

        if let error = viewModel.errorMessage {
            Text(error)
                .font(.system(size: Typography.caption))
                .foregroundStyle(Color.destructive)
                .frame(maxWidth: .infinity, alignment: .leading)
        }
    }
}
