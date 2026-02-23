import SwiftUI
import MarkdownUI

struct ListingDetailView: View {
    let listingId: String

    @Environment(AuthState.self) private var authState
    @Environment(\.dismiss) private var dismiss
    @State private var viewModel = ListingDetailViewModel()
    @State private var showDeleteConfirmation = false
    @State private var isCopied = false
    @State private var statusChanged = false
    @State private var editingTitle = false
    @State private var editTitleText = ""
    @State private var editingDescription = false
    @State private var editDescriptionText = ""
    @State private var editingPrice = false
    @State private var editPriceText = ""

    var body: some View {
        Group {
            if viewModel.isLoading && viewModel.listing == nil {
                detailSkeleton
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
                .accessibilityLabel("Back")
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
        .sensoryFeedback(.selection, trigger: statusChanged)
        .sensoryFeedback(.warning, trigger: showDeleteConfirmation)
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
                ImageCarouselView(
                    images: listing.images ?? [],
                    listingId: listingId,
                    token: authState.token,
                    onImagesChanged: {
                        Task {
                            await viewModel.loadListing(
                                id: listingId, token: authState.token
                            )
                        }
                    }
                )

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
                    ImageCarouselView(
                        images: listing.images ?? [],
                        listingId: listingId,
                        token: authState.token,
                        onImagesChanged: {
                            Task {
                                await viewModel.loadListing(
                                    id: listingId, token: authState.token
                                )
                            }
                        }
                    )

                    VStack(spacing: Spacing.xl) {
                        statusRow(listing)

                        if let title = listing.title {
                            ListingDetailTitleSection(
                                title: title,
                                isEditing: $editingTitle,
                                editText: $editTitleText,
                                onSave: {
                                    await viewModel.updateField(title: editTitleText, token: authState.token)
                                }
                            )
                        }

                        if let price = listing.suggestedPrice {
                            ListingDetailPriceCard(
                                price: price,
                                priceRangeLow: listing.priceRangeLow,
                                priceRangeHigh: listing.priceRangeHigh,
                                isEditing: $editingPrice,
                                editText: $editPriceText,
                                onSave: {
                                    if let newPrice = Double(editPriceText) {
                                        await viewModel.updateField(suggestedPrice: newPrice, token: authState.token)
                                    }
                                }
                            )
                        }

                        if let description = listing.description {
                            ListingDetailDescriptionSection(
                                description: description,
                                isEditing: $editingDescription,
                                editText: $editDescriptionText,
                                onSave: {
                                    await viewModel.updateField(description: editDescriptionText, token: authState.token)
                                }
                            )
                        }

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

            ListingDetailBottomBar(
                onCopy: { viewModel.copyFullListing() },
                isCopied: $isCopied
            )
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

    // MARK: - Market Notes

    @ViewBuilder
    private func marketNotes(_ listing: Listing) -> some View {
        if let notes = listing.researchNotes {
            VStack(alignment: .leading, spacing: Spacing.sm) {
                Text("Market Notes")
                    .font(.system(size: Typography.sectionHeading, weight: .semibold))
                    .foregroundStyle(Color.appForeground)
                Markdown(notes)
                    .markdownTextStyle {
                        FontSize(Typography.body)
                        ForegroundColor(Color.mutedForeground)
                    }
            }
        }
    }

    // MARK: - Menu Button

    private func menuButton(for listing: Listing) -> some View {
        Menu {
            if listing.status == .ready {
                Button {
                    Task {
                        await viewModel.updateStatus(ListingStatus.listed.rawValue, token: authState.token)
                        statusChanged.toggle()
                    }
                } label: {
                    Label("Mark as Listed", systemImage: "tag")
                }
            }
            if listing.status == .listed {
                Button {
                    Task {
                        await viewModel.updateStatus(ListingStatus.sold.rawValue, token: authState.token)
                        statusChanged.toggle()
                    }
                } label: {
                    Label("Mark as Sold", systemImage: "checkmark.seal")
                }
            }
            Button {
                Task {
                    await viewModel.updateStatus(ListingStatus.archived.rawValue, token: authState.token)
                    statusChanged.toggle()
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
        .accessibilityLabel("Listing actions")
    }

    // MARK: - Skeleton Loading

    private var detailSkeleton: some View {
        ScrollView {
            VStack(spacing: Spacing.xl) {
                RoundedRectangle(cornerRadius: CornerRadius.default)
                    .fill(Color.mutedBackground)
                    .aspectRatio(4/3, contentMode: .fit)

                VStack(alignment: .leading, spacing: Spacing.lg) {
                    RoundedRectangle(cornerRadius: CornerRadius.small)
                        .fill(Color.mutedBackground)
                        .frame(height: 24)
                        .frame(maxWidth: 200)
                    RoundedRectangle(cornerRadius: CornerRadius.small)
                        .fill(Color.mutedBackground)
                        .frame(height: 40)
                        .frame(maxWidth: 120)
                    RoundedRectangle(cornerRadius: CornerRadius.small)
                        .fill(Color.mutedBackground)
                        .frame(height: 60)
                    RoundedRectangle(cornerRadius: CornerRadius.small)
                        .fill(Color.mutedBackground)
                        .frame(height: 80)
                }
                .padding(.horizontal, Sizing.pagePadding)
            }
        }
        .redacted(reason: .placeholder)
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
