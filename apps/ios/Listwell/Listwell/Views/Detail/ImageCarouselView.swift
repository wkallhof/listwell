import SwiftUI
import Kingfisher

struct ImageCarouselView: View {
    let images: [ListingImage]
    let listingId: String
    let token: String?
    var onImagesChanged: (() -> Void)?

    @State private var currentIndex = 0
    @State private var enhancingImage: ListingImage?

    var body: some View {
        VStack(spacing: Spacing.md) {
            if images.isEmpty {
                placeholderView
            } else {
                TabView(selection: $currentIndex) {
                    ForEach(Array(images.enumerated()), id: \.element.id) { index, image in
                        ZStack(alignment: .bottomTrailing) {
                            KFImage(image.imageURL)
                                .resizable()
                                .scaledToFill()
                                .frame(maxWidth: .infinity)
                                .aspectRatio(4/3, contentMode: .fit)
                                .clipped()

                            if image.isOriginal {
                                enhanceButton(for: image)
                            }
                        }
                        .tag(index)
                    }
                }
                .tabViewStyle(.page(indexDisplayMode: .never))
                .aspectRatio(4/3, contentMode: .fit)
                .clipShape(RoundedRectangle(cornerRadius: CornerRadius.default))

                if images.count > 1 {
                    dotIndicators
                }
            }
        }
        .sheet(item: $enhancingImage) { image in
            EnhancementSheet(
                viewModel: EnhancementViewModel(
                    originalImage: image,
                    listingId: listingId,
                    allImages: images
                ),
                token: token,
                onDismiss: {
                    enhancingImage = nil
                    onImagesChanged?()
                }
            )
        }
    }

    // MARK: - Enhance Button

    private func enhanceButton(for image: ListingImage) -> some View {
        Button {
            enhancingImage = image
        } label: {
            HStack(spacing: Spacing.xs) {
                Image(systemName: "wand.and.stars")
                    .font(.system(size: 12))
                Text("Enhance")
                    .font(.system(size: Typography.caption, weight: .medium))
            }
            .foregroundStyle(Color.appForeground)
            .padding(.horizontal, Spacing.md)
            .padding(.vertical, Spacing.sm)
            .background(.ultraThinMaterial)
            .clipShape(RoundedRectangle(cornerRadius: CornerRadius.small))
        }
        .padding(Spacing.md)
    }

    // MARK: - Placeholder

    private var placeholderView: some View {
        Color.mutedBackground
            .aspectRatio(4/3, contentMode: .fit)
            .clipShape(RoundedRectangle(cornerRadius: CornerRadius.default))
            .overlay {
                Image(systemName: "photo")
                    .font(.system(size: 48))
                    .foregroundStyle(Color.mutedForeground.opacity(0.3))
            }
    }

    // MARK: - Dot Indicators

    private var dotIndicators: some View {
        HStack(spacing: 6) {
            ForEach(0..<images.count, id: \.self) { index in
                Circle()
                    .fill(index == currentIndex ? Color.accentColor : Color.mutedForeground.opacity(0.3))
                    .frame(width: 6, height: 6)
            }
        }
    }
}
