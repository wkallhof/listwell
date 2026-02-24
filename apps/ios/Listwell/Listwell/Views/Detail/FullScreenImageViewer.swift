import SwiftUI
import Kingfisher

struct FullScreenImageViewer: View {
    let images: [ListingImage]
    @Binding var currentIndex: Int
    let onDelete: ((ListingImage) -> Void)?
    let onDismiss: () -> Void

    @State private var dragOffset: CGSize = .zero
    @State private var dragScale: CGFloat = 1

    var body: some View {
        ZStack {
            Color.black
                .opacity(1 - min(abs(dragOffset.height) / CGFloat(400), 0.5))
                .ignoresSafeArea()

            VStack(spacing: 0) {
                // Top bar
                HStack {
                    Button {
                        onDismiss()
                    } label: {
                        Image(systemName: "xmark")
                            .font(.system(size: 16, weight: .semibold))
                            .foregroundStyle(.white)
                            .frame(width: Sizing.minTapTarget, height: Sizing.minTapTarget)
                    }

                    Spacer()

                    if !images.isEmpty {
                        Text("\(currentIndex + 1) of \(images.count)")
                            .font(.bodyFont(size: Typography.body, weight: .medium))
                            .foregroundStyle(.white)
                    }

                    Spacer()

                    if let onDelete, !images.isEmpty {
                        Button {
                            onDelete(images[currentIndex])
                        } label: {
                            Image(systemName: "trash")
                                .font(.system(size: 16))
                                .foregroundStyle(.white)
                                .frame(width: Sizing.minTapTarget, height: Sizing.minTapTarget)
                        }
                    } else {
                        Color.clear
                            .frame(width: Sizing.minTapTarget, height: Sizing.minTapTarget)
                    }
                }
                .padding(.horizontal, Spacing.sm)

                // Image viewer
                TabView(selection: $currentIndex) {
                    ForEach(Array(images.enumerated()), id: \.element.id) { index, image in
                        KFImage(image.imageURL)
                            .placeholder {
                                Color.black
                            }
                            .fade(duration: 0.2)
                            .resizable()
                            .scaledToFit()
                            .tag(index)
                    }
                }
                .tabViewStyle(.page(indexDisplayMode: .never))
                .scaleEffect(dragScale)
                .offset(dragOffset)
                .gesture(
                    DragGesture()
                        .onChanged { value in
                            let verticalDrag = value.translation.height
                            if abs(verticalDrag) > abs(value.translation.width) {
                                dragOffset = CGSize(width: 0, height: verticalDrag)
                                dragScale = max(0.8, 1 - abs(verticalDrag) / 1000)
                            }
                        }
                        .onEnded { value in
                            if abs(value.translation.height) > 150 {
                                onDismiss()
                            } else {
                                withAnimation(.spring(response: 0.3)) {
                                    dragOffset = .zero
                                    dragScale = 1
                                }
                            }
                        }
                )

                // Bottom dot indicators
                if images.count > 1 {
                    HStack(spacing: 6) {
                        ForEach(0..<images.count, id: \.self) { index in
                            Circle()
                                .fill(index == currentIndex ? Color.white : Color.white.opacity(0.3))
                                .frame(width: 6, height: 6)
                        }
                    }
                    .padding(.bottom, Spacing.md)
                }
            }
        }
        .onChange(of: images.count) { _, newCount in
            if currentIndex >= newCount && newCount > 0 {
                currentIndex = newCount - 1
            }
        }
        .statusBarHidden()
    }
}
