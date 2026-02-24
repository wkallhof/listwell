import SwiftUI
import Kingfisher

struct ImageCarouselView: View {
    let images: [ListingImage]
    let listingId: String
    let token: String?
    var onImagesChanged: (() -> Void)?

    @State private var currentIndex = 0
    @State private var showFullScreen = false
    @State private var enhancementVM: EnhancementViewModel?
    @State private var imageToDelete: ListingImage?

    var body: some View {
        VStack(spacing: Spacing.md) {
            if images.isEmpty {
                placeholderView
            } else {
                ScrollView(.horizontal) {
                    LazyHStack(spacing: 0) {
                        ForEach(Array(images.enumerated()), id: \.element.id) { index, image in
                            Color.clear
                                .aspectRatio(4/3, contentMode: .fit)
                                .overlay {
                                    KFImage(image.imageURL)
                                        .placeholder {
                                            Color.mutedBackground
                                        }
                                        .fade(duration: 0.2)
                                        .resizable()
                                        .scaledToFill()
                                }
                                .clipped()
                                .overlay {
                                    ScanLineOverlay(
                                        isActive: enhancementVM?.enhancingImageId == image.id
                                    )
                                }
                                .overlay(alignment: .bottomTrailing) {
                                    if image.isOriginal && enhancementVM?.enhancingImageId != image.id {
                                        enhanceButton(for: image)
                                    }
                                }
                                .contentShape(Rectangle())
                                .onTapGesture {
                                    currentIndex = index
                                    showFullScreen = true
                                }
                                .containerRelativeFrame(.horizontal)
                                .id(index)
                                .accessibilityLabel("Photo \(index + 1) of \(images.count)")
                        }
                    }
                    .scrollTargetLayout()
                }
                .scrollTargetBehavior(.paging)
                .scrollIndicators(.hidden)
                .scrollPosition(id: Binding(
                    get: { currentIndex },
                    set: { if let newValue = $0, newValue != currentIndex { currentIndex = newValue } }
                ))
                .aspectRatio(4/3, contentMode: .fit)
                .clipShape(RoundedRectangle(cornerRadius: CornerRadius.default))

                if images.count > 1 {
                    dotIndicators
                }
            }
        }
        .fullScreenCover(isPresented: $showFullScreen) {
            FullScreenImageViewer(
                images: images,
                currentIndex: $currentIndex,
                onDelete: { image in
                    showFullScreen = false
                    imageToDelete = image
                },
                onDismiss: {
                    showFullScreen = false
                }
            )
        }
        .alert(
            "Delete this image?",
            isPresented: Binding(
                get: { imageToDelete != nil },
                set: { if !$0 { imageToDelete = nil } }
            ),
            presenting: imageToDelete
        ) { image in
            Button("Delete", role: .destructive) {
                Task {
                    let vm = getOrCreateEnhancementVM()
                    await vm.deleteImage(image.id, token: token)
                    onImagesChanged?()
                }
            }
            Button("Cancel", role: .cancel) {}
        } message: { _ in
            Text("This image will be permanently removed from the listing.")
        }
        .onChange(of: enhancementVM?.newlyEnhancedImageId) { _, newId in
            guard let newId else { return }
            if let index = images.firstIndex(where: { $0.id == newId }) {
                withAnimation {
                    currentIndex = index
                }
            }
        }
    }

    // MARK: - Enhance Button

    private func enhanceButton(for image: ListingImage) -> some View {
        Button {
            let vm = getOrCreateEnhancementVM()
            Task {
                await vm.requestEnhancement(for: image.id, token: token)
            }
        } label: {
            HStack(spacing: Spacing.xs) {
                Image(systemName: "wand.and.stars")
                    .font(.system(size: 12))
                Text("Enhance")
                    .font(.bodyFont(size: Typography.caption, weight: .medium))
            }
            .foregroundStyle(Color.appForeground)
            .padding(.horizontal, Spacing.md)
            .padding(.vertical, Spacing.sm)
            .background(.ultraThinMaterial)
            .clipShape(RoundedRectangle(cornerRadius: CornerRadius.small))
        }
        .disabled(enhancementVM?.isEnhancing == true)
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

    // MARK: - Helpers

    private func getOrCreateEnhancementVM() -> EnhancementViewModel {
        if let vm = enhancementVM { return vm }
        let vm = EnhancementViewModel(listingId: listingId)
        vm.onEnhancementComplete = { _ in
            onImagesChanged?()
        }
        enhancementVM = vm
        return vm
    }
}
