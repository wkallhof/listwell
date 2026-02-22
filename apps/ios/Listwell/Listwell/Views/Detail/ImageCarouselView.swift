import SwiftUI
import Kingfisher

struct ImageCarouselView: View {
    let images: [ListingImage]

    @State private var currentIndex = 0

    var body: some View {
        VStack(spacing: Spacing.md) {
            if images.isEmpty {
                placeholderView
            } else {
                TabView(selection: $currentIndex) {
                    ForEach(Array(images.enumerated()), id: \.element.id) { index, image in
                        KFImage(image.imageURL)
                            .resizable()
                            .scaledToFill()
                            .frame(maxWidth: .infinity)
                            .aspectRatio(4/3, contentMode: .fit)
                            .clipped()
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
    }

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
