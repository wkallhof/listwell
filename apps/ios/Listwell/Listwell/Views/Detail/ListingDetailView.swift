import SwiftUI
import Kingfisher

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
        .animation(.easeOut(duration: 0.2), value: viewModel.listing?.status)
        .animation(.easeOut(duration: 0.2), value: editingTitle)
        .animation(.easeOut(duration: 0.2), value: editingDescription)
        .animation(.easeOut(duration: 0.2), value: editingPrice)
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
            if editingTitle {
                VStack(alignment: .leading, spacing: Spacing.sm) {
                    TextField("Title", text: $editTitleText)
                        .font(.system(size: Typography.pageTitle, weight: .bold))
                        .textFieldStyle(.plain)
                        .editFieldStyle()
                    editActions {
                        await viewModel.updateField(title: editTitleText, token: authState.token)
                        editingTitle = false
                    } onCancel: {
                        editingTitle = false
                    }
                }
            } else {
                HStack(alignment: .top, spacing: Spacing.sm) {
                    Text(title)
                        .font(.system(size: Typography.pageTitle, weight: .bold))
                        .foregroundStyle(Color.appForeground)
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .onTapGesture {
                            editTitleText = title
                            editingTitle = true
                        }
                    CopyButton(text: title, label: "title")
                }
            }
        }
    }

    // MARK: - Price Card

    @ViewBuilder
    private func priceCard(_ listing: Listing) -> some View {
        if let price = listing.suggestedPrice {
            VStack(spacing: Spacing.sm) {
                if editingPrice {
                    VStack(alignment: .leading, spacing: Spacing.sm) {
                        HStack(spacing: Spacing.xs) {
                            Text("$")
                                .font(.system(size: Typography.priceLarge, weight: .bold))
                                .foregroundStyle(Color.appForeground)
                            TextField("Price", text: $editPriceText)
                                .font(.system(size: Typography.priceLarge, weight: .bold))
                                .keyboardType(.decimalPad)
                                .textFieldStyle(.plain)
                                .editFieldStyle()
                        }
                        editActions {
                            if let newPrice = Double(editPriceText) {
                                await viewModel.updateField(suggestedPrice: newPrice, token: authState.token)
                            }
                            editingPrice = false
                        } onCancel: {
                            editingPrice = false
                        }
                    }
                } else {
                    HStack(alignment: .firstTextBaseline) {
                        Text("$\(Int(price))")
                            .font(.system(size: Typography.priceLarge, weight: .bold))
                            .foregroundStyle(Color.appForeground)
                            .onTapGesture {
                                editPriceText = "\(Int(price))"
                                editingPrice = true
                            }
                        Spacer()
                        Text("suggested price")
                            .font(.system(size: Typography.caption))
                            .foregroundStyle(Color.mutedForeground)
                    }
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

                if editingDescription {
                    VStack(alignment: .leading, spacing: Spacing.sm) {
                        TextEditor(text: $editDescriptionText)
                            .font(.system(size: Typography.body))
                            .frame(minHeight: 120)
                            .scrollContentBackground(.hidden)
                            .editFieldStyle()
                        editActions {
                            await viewModel.updateField(description: editDescriptionText, token: authState.token)
                            editingDescription = false
                        } onCancel: {
                            editingDescription = false
                        }
                    }
                } else {
                    Text(description)
                        .font(.system(size: Typography.body))
                        .foregroundStyle(Color.appForeground)
                        .lineSpacing(4)
                        .onTapGesture {
                            editDescriptionText = description
                            editingDescription = true
                        }
                }
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

    // MARK: - Edit Actions Helper

    private func editActions(onSave: @escaping () async -> Void, onCancel: @escaping () -> Void) -> some View {
        HStack(spacing: Spacing.sm) {
            Button("Save") {
                Task { await onSave() }
            }
            .font(.system(size: Typography.body, weight: .medium))
            .foregroundStyle(Color.accentColor)

            Button("Cancel", action: onCancel)
                .font(.system(size: Typography.body))
                .foregroundStyle(Color.mutedForeground)
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
