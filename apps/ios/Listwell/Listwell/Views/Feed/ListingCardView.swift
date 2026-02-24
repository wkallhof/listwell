import SwiftUI
import Kingfisher

struct ListingCardView: View {
    let listing: Listing

    var body: some View {
        HStack(spacing: Spacing.md) {
            thumbnailView
            contentView
            Spacer(minLength: 0)
        }
        .padding(Spacing.md)
        .background(Color.cardBackground)
        .clipShape(RoundedRectangle(cornerRadius: CornerRadius.default))
        .overlay(
            RoundedRectangle(cornerRadius: CornerRadius.default)
                .stroke(Color.borderColor, lineWidth: 1)
        )
    }

    // MARK: - Thumbnail

    private var thumbnailView: some View {
        Group {
            if let url = listing.primaryImageURL {
                KFImage(url)
                    .placeholder {
                        Color.mutedBackground
                    }
                    .fade(duration: 0.2)
                    .downsampling(size: CGSize(width: Sizing.thumbnailSize * 2, height: Sizing.thumbnailSize * 2))
                    .resizable()
                    .scaledToFill()
            } else {
                Color.mutedBackground
                    .overlay {
                        Image(systemName: "photo")
                            .foregroundStyle(Color.mutedForeground.opacity(0.5))
                    }
            }
        }
        .frame(width: Sizing.thumbnailSize, height: Sizing.thumbnailSize)
        .clipShape(RoundedRectangle(cornerRadius: CornerRadius.image))
    }

    // MARK: - Content

    private var contentView: some View {
        VStack(alignment: .leading, spacing: Spacing.xs) {
            titleRow
            ListingStatusBadge(
                status: listing.status,
                pipelineStep: listing.pipelineStep
            )
            bottomRow
        }
    }

    private var titleRow: some View {
        Group {
            if listing.isProcessing {
                Text("Processing...")
                    .font(.bodyFont(size: Typography.cardTitle, weight: .medium))
                    .italic()
                    .foregroundStyle(Color.mutedForeground)
            } else {
                Text(listing.title ?? "Untitled")
                    .font(.bodyFont(size: Typography.cardTitle, weight: .medium))
                    .foregroundStyle(Color.appForeground)
                    .lineLimit(1)
            }
        }
    }

    private var bottomRow: some View {
        HStack {
            if let price = listing.suggestedPrice, !listing.isProcessing {
                Text("$\(Int(price))")
                    .font(.mono(size: Typography.body, weight: .semibold))
                    .foregroundStyle(Color.appForeground)
            }

            if listing.isProcessing {
                HStack(spacing: Spacing.xs) {
                    ProgressView()
                        .controlSize(.mini)
                    Text(listing.pipelineStep.displayName)
                        .font(.bodyFont(size: Typography.caption))
                        .foregroundStyle(Color.mutedForeground)
                }
            }

            Spacer()

            Text(TimeAgo.string(from: listing.createdAt))
                .font(.bodyFont(size: Typography.caption))
                .foregroundStyle(Color.mutedForeground)
        }
    }
}
