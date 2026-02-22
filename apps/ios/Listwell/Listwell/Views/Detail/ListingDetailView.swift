import SwiftUI
import Kingfisher

struct ListingDetailView: View {
    let listingId: String

    @Environment(AuthState.self) private var authState
    @Environment(\.dismiss) private var dismiss
    @State private var viewModel = ListingDetailViewModel()
    @State private var showDeleteConfirmation = false
    @State private var isCopied = false

    var body: some View {
        Group {
            if viewModel.isLoading && viewModel.listing == nil {
                ProgressView()
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
            } else if let listing = viewModel.listing {
                if listing.isProcessing || listing.pipelineStep == .error {
                    processingContent(listing)
                } else {
                    readyContent(listing)
                }
            } else if let error = viewModel.errorMessage {
                loadErrorView(error)
            }
        }
        .background(Color.appBackground)
        .navigationTitle("")
        .navigationBarTitleDisplayMode(.inline)
        .navigationBarBackButtonHidden(true)
        .toolbar {
            ToolbarItem(placement: .navigationBarLeading) {
                Button { dismiss() } label: {
                    Image(systemName: "chevron.left")
                        .foregroundStyle(Color.appForeground)
                }
            }
            if let listing = viewModel.listing, !listing.isProcessing, listing.pipelineStep != .error {
                ToolbarItem(placement: .navigationBarTrailing) {
                    menuButton(for: listing)
                }
            }
        }
        .confirmationDialog(
            "Delete this listing?",
            isPresented: $showDeleteConfirmation,
            titleVisibility: .visible
        ) {
            Button("Delete", role: .destructive) {
                Task {
                    let success = await viewModel.deleteListing(token: authState.token)
                    if success { dismiss() }
                }
            }
            Button("Cancel", role: .cancel) {}
        } message: {
            Text("This action cannot be undone.")
        }
        .task {
            await viewModel.loadListing(id: listingId, token: authState.token)
        }
        .onDisappear {
            viewModel.cancelPolling()
        }
    }

    // MARK: - Processing Content

    private func processingContent(_ listing: Listing) -> some View {
        ScrollView {
            VStack(spacing: Spacing.xl) {
                processingHeader()
                photoPreview(listing)

                VStack(spacing: Spacing.xl) {
                    if listing.pipelineStep == .error {
                        errorCard(listing)
                    } else {
                        PipelineStepsView(currentStep: listing.pipelineStep)
                    }

                    if let agentLog = listing.agentLog, !agentLog.isEmpty {
                        VStack(alignment: .leading, spacing: Spacing.sm) {
                            Text("Activity")
                                .font(.system(size: Typography.caption, weight: .medium))
                                .foregroundStyle(Color.mutedForeground)
                            AgentLogView(entries: agentLog)
                        }
                    }

                    Text("This usually takes 30-90 seconds")
                        .font(.system(size: Typography.caption))
                        .foregroundStyle(Color.mutedForeground)
                }
                .padding(.horizontal, Sizing.pagePadding)
            }
        }
    }

    private func processingHeader() -> some View {
        HStack {
            Text("Generating...")
                .font(.system(size: Typography.sectionHeading, weight: .semibold))
                .foregroundStyle(Color.appForeground)
            Spacer()
        }
        .padding(.horizontal, Sizing.pagePadding)
    }

    @ViewBuilder
    private func photoPreview(_ listing: Listing) -> some View {
        Group {
            if let url = listing.primaryImageURL {
                KFImage(url)
                    .resizable()
                    .aspectRatio(4/3, contentMode: .fill)
                    .clipped()
            } else {
                Rectangle()
                    .fill(Color.mutedBackground)
                    .aspectRatio(4/3, contentMode: .fill)
            }
        }
        .clipShape(RoundedRectangle(cornerRadius: CornerRadius.image))
        .padding(.horizontal, Sizing.pagePadding)
    }

    // MARK: - Error Card

    private func errorCard(_ listing: Listing) -> some View {
        VStack(alignment: .leading, spacing: Spacing.md) {
            HStack(alignment: .top, spacing: Spacing.md) {
                Image(systemName: "exclamationmark.circle.fill")
                    .font(.system(size: 20))
                    .foregroundStyle(Color.destructive)

                VStack(alignment: .leading, spacing: Spacing.xs) {
                    Text("Generation failed")
                        .font(.system(size: Typography.body, weight: .medium))
                        .foregroundStyle(Color.appForeground)

                    if let error = listing.pipelineError {
                        Text(error)
                            .font(.system(size: Typography.body))
                            .foregroundStyle(Color.mutedForeground)
                    }
                }
            }

            HStack(spacing: Spacing.sm) {
                Button {
                    Task {
                        await viewModel.retryGeneration(token: authState.token)
                    }
                } label: {
                    Text("Retry")
                        .font(.system(size: Typography.body, weight: .medium))
                        .frame(maxWidth: .infinity)
                        .frame(height: Sizing.minTapTarget)
                        .background(Color.accentColor)
                        .foregroundStyle(.white)
                        .clipShape(RoundedRectangle(cornerRadius: CornerRadius.default))
                }

                Button {
                    showDeleteConfirmation = true
                } label: {
                    Text("Delete")
                        .font(.system(size: Typography.body, weight: .medium))
                        .frame(maxWidth: .infinity)
                        .frame(height: Sizing.minTapTarget)
                        .foregroundStyle(Color.destructive)
                        .clipShape(RoundedRectangle(cornerRadius: CornerRadius.default))
                        .overlay(
                            RoundedRectangle(cornerRadius: CornerRadius.default)
                                .stroke(Color.borderColor, lineWidth: 1)
                        )
                }
            }
        }
        .padding(Spacing.lg)
        .background(Color.cardBackground)
        .clipShape(RoundedRectangle(cornerRadius: CornerRadius.default))
        .overlay(
            RoundedRectangle(cornerRadius: CornerRadius.default)
                .stroke(Color.destructive.opacity(0.5), lineWidth: 1)
        )
    }

    // MARK: - Ready Content

    private func readyContent(_ listing: Listing) -> some View {
        ZStack(alignment: .bottom) {
            ScrollView {
                VStack(spacing: Spacing.xl) {
                    ImageCarouselView(images: listing.images ?? [])

                    VStack(spacing: Spacing.xl) {
                        statusRow(listing)
                        titleSection(listing)
                        priceCard(listing)
                        descriptionSection(listing)
                        ProductDetailsView(
                            brand: listing.brand,
                            model: listing.model,
                            condition: listing.condition,
                            category: listing.category
                        )
                        ComparablesView(comparables: listing.comparables ?? [])
                        marketNotes(listing)
                    }
                    .padding(.horizontal, Sizing.pagePadding)
                }
                .padding(.bottom, 80)
            }

            bottomBar(listing)
        }
    }

    // MARK: - Status Row

    private func statusRow(_ listing: Listing) -> some View {
        HStack(spacing: Spacing.sm) {
            ListingStatusBadge(status: listing.status, pipelineStep: listing.pipelineStep)
            if let category = listing.category {
                Text(category)
                    .font(.system(size: Typography.caption))
                    .foregroundStyle(Color.mutedForeground)
            }
            Spacer()
        }
    }

    // MARK: - Title Section

    @ViewBuilder
    private func titleSection(_ listing: Listing) -> some View {
        if let title = listing.title {
            HStack(alignment: .top, spacing: Spacing.sm) {
                Text(title)
                    .font(.system(size: Typography.pageTitle, weight: .bold))
                    .foregroundStyle(Color.appForeground)
                    .frame(maxWidth: .infinity, alignment: .leading)
                CopyButton(text: title, label: "title")
            }
        }
    }

    // MARK: - Price Card

    @ViewBuilder
    private func priceCard(_ listing: Listing) -> some View {
        if let price = listing.suggestedPrice {
            VStack(spacing: Spacing.sm) {
                HStack(alignment: .firstTextBaseline) {
                    Text("$\(Int(price))")
                        .font(.system(size: Typography.priceLarge, weight: .bold))
                        .foregroundStyle(Color.appForeground)
                    Spacer()
                    Text("suggested price")
                        .font(.system(size: Typography.caption))
                        .foregroundStyle(Color.mutedForeground)
                }

                if let low = listing.priceRangeLow, let high = listing.priceRangeHigh {
                    Text("Market range: $\(Int(low)) – $\(Int(high))")
                        .font(.system(size: Typography.body))
                        .foregroundStyle(Color.mutedForeground)
                        .frame(maxWidth: .infinity, alignment: .leading)
                }
            }
            .padding(Spacing.lg)
            .background(Color.cardBackground)
            .clipShape(RoundedRectangle(cornerRadius: CornerRadius.default))
            .overlay(
                RoundedRectangle(cornerRadius: CornerRadius.default)
                    .stroke(Color.borderColor, lineWidth: 1)
            )
        }
    }

    // MARK: - Description Section

    @ViewBuilder
    private func descriptionSection(_ listing: Listing) -> some View {
        if let description = listing.description {
            VStack(alignment: .leading, spacing: Spacing.sm) {
                HStack {
                    Text("Description")
                        .font(.system(size: Typography.sectionHeading, weight: .semibold))
                        .foregroundStyle(Color.appForeground)
                    Spacer()
                    CopyButton(text: description, label: "description")
                }
                Text(description)
                    .font(.system(size: Typography.body))
                    .foregroundStyle(Color.appForeground)
                    .lineSpacing(4)
            }
        }
    }

    // MARK: - Market Notes

    @ViewBuilder
    private func marketNotes(_ listing: Listing) -> some View {
        if let notes = listing.researchNotes {
            VStack(alignment: .leading, spacing: Spacing.sm) {
                Text("Market Notes")
                    .font(.system(size: Typography.sectionHeading, weight: .semibold))
                    .foregroundStyle(Color.appForeground)
                Text(notes)
                    .font(.system(size: Typography.body))
                    .foregroundStyle(Color.mutedForeground)
                    .lineSpacing(4)
            }
        }
    }

    // MARK: - Bottom Bar

    private func bottomBar(_ listing: Listing) -> some View {
        VStack(spacing: 0) {
            Divider()
            Button {
                viewModel.copyFullListing()
                isCopied = true
                DispatchQueue.main.asyncAfter(deadline: .now() + 2) {
                    isCopied = false
                }
            } label: {
                HStack(spacing: Spacing.sm) {
                    Image(systemName: isCopied ? "checkmark" : "doc.on.doc")
                        .font(.system(size: 16))
                    Text(isCopied ? "Copied!" : "Copy Full Listing")
                        .font(.system(size: Typography.body, weight: .semibold))
                }
                .frame(maxWidth: .infinity)
                .frame(height: Sizing.minTapTarget)
                .background(Color.accentColor)
                .foregroundStyle(.white)
                .clipShape(RoundedRectangle(cornerRadius: CornerRadius.default))
            }
            .sensoryFeedback(.success, trigger: isCopied)
            .padding(.horizontal, Sizing.pagePadding)
            .padding(.vertical, Spacing.md)
        }
        .background(Color.appBackground.opacity(0.8))
    }

    // MARK: - Menu Button

    private func menuButton(for listing: Listing) -> some View {
        Menu {
            if listing.status == .ready {
                Button {
                    Task {
                        await viewModel.updateStatus("LISTED", token: authState.token)
                    }
                } label: {
                    Label("Mark as Listed", systemImage: "tag")
                }
            }
            if listing.status == .listed {
                Button {
                    Task {
                        await viewModel.updateStatus("SOLD", token: authState.token)
                    }
                } label: {
                    Label("Mark as Sold", systemImage: "checkmark.seal")
                }
            }
            Button {
                Task {
                    await viewModel.updateStatus("ARCHIVED", token: authState.token)
                }
            } label: {
                Label("Archive", systemImage: "archivebox")
            }
            Divider()
            Button(role: .destructive) {
                showDeleteConfirmation = true
            } label: {
                Label("Delete Listing", systemImage: "trash")
            }
        } label: {
            Image(systemName: "ellipsis")
                .font(.system(size: 18))
                .foregroundStyle(Color.mutedForeground)
                .frame(width: Sizing.minTapTarget, height: Sizing.minTapTarget)
        }
    }

    // MARK: - Load Error View

    private func loadErrorView(_ message: String) -> some View {
        VStack(spacing: Spacing.lg) {
            Image(systemName: "exclamationmark.triangle")
                .font(.system(size: 48))
                .foregroundStyle(Color.mutedForeground.opacity(0.3))
            Text(message)
                .font(.system(size: Typography.body))
                .foregroundStyle(Color.mutedForeground)
                .multilineTextAlignment(.center)
            Button("Try Again") {
                Task {
                    await viewModel.loadListing(id: listingId, token: authState.token)
                }
            }
            .font(.system(size: Typography.body, weight: .medium))
        }
        .padding(Sizing.pagePadding)
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }
}
