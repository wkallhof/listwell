import SwiftUI

struct PhotoGridView: View {
    let images: [UIImage]
    let canAddMore: Bool
    let onRemove: (Int) -> Void
    let onAddTapped: () -> Void

    private let columns = Array(repeating: GridItem(.flexible(), spacing: Spacing.sm), count: 3)

    var body: some View {
        LazyVGrid(columns: columns, spacing: Spacing.sm) {
            ForEach(Array(images.enumerated()), id: \.offset) { index, image in
                imageCell(image: image, index: index)
            }
            if canAddMore {
                addSlot
            }
        }
    }

    private func imageCell(image: UIImage, index: Int) -> some View {
        Image(uiImage: image)
            .resizable()
            .scaledToFill()
            .frame(minHeight: 0)
            .aspectRatio(1, contentMode: .fill)
            .clipped()
            .clipShape(RoundedRectangle(cornerRadius: CornerRadius.image))
            .overlay(alignment: .topTrailing) {
                Button {
                    onRemove(index)
                } label: {
                    Image(systemName: "xmark.circle.fill")
                        .font(.system(size: 20))
                        .foregroundStyle(.white)
                        .shadow(radius: 2)
                }
                .padding(Spacing.xs)
            }
    }

    private var addSlot: some View {
        Button {
            onAddTapped()
        } label: {
            RoundedRectangle(cornerRadius: CornerRadius.image)
                .strokeBorder(Color.borderColor, style: StrokeStyle(lineWidth: 2, dash: [8, 4]))
                .aspectRatio(1, contentMode: .fill)
                .overlay {
                    Image(systemName: "photo.badge.plus")
                        .font(.system(size: 24))
                        .foregroundStyle(Color.mutedForeground)
                }
        }
        .accessibilityLabel("Add photo")
    }
}
