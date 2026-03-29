import SwiftUI

struct FeedView: View {
    @Environment(AuthState.self) private var authState
    @State private var viewModel = FeedViewModel()
    @State private var showNewListing = false
    @State private var navigationPath = NavigationPath()
    @State private var newListingViewModel = NewListingViewModel()
    @State private var newListingStep = NewListingStep.capture
    @State private var creditsViewModel = CreditsViewModel()
    @State private var showPurchaseCredits = false
    @State private var listingToDelete: Listing?

    private enum NewListingStep {
        case capture, describe
    }

    var body: some View {
        NavigationStack(path: $navigationPath) {
            ZStack(alignment: .bottomTrailing) {
                mainContent
                FABButton { showNewListing = true }
                    .padding(.trailing, Sizing.pagePadding)
                    .padding(.bottom, Spacing.xxl)
            }
            .navigationDestination(for: String.self) { listingId in
                ListingDetailView(listingId: listingId)
            }
            .background(Color.appBackground)
        }
        .sheet(isPresented: $showNewListing) {
            newListingViewModel.reset()
            newListingStep = .capture
        } content: {
            NavigationStack {
                switch newListingStep {
                case .capture:
                    CaptureView(viewModel: newListingViewModel) {
                        newListingStep = .describe
                    }
                case .describe:
                    DescribeView(viewModel: newListingViewModel) { listingId in
                        showNewListing = false
                        navigationPath.append(listingId)
                    }
                }
            }
        }
        .sheet(isPresented: $showPurchaseCredits) {
            PurchaseCreditsView()
        }
        .task {
            await viewModel.loadListings(token: authState.token)
            await creditsViewModel.fetchBalance(token: authState.token)
        }
        .onChange(of: navigationPath) {
            if navigationPath.isEmpty {
                Task { await viewModel.refresh(token: authState.token) }
            }
        }
        .onChange(of: showNewListing) {
            if !showNewListing {
                Task {
                    await viewModel.refresh(token: authState.token)
                    await creditsViewModel.fetchBalance(token: authState.token)
                }
            }
        }
        .onChange(of: showPurchaseCredits) {
            if !showPurchaseCredits {
                Task { await creditsViewModel.fetchBalance(token: authState.token) }
            }
        }
        .onReceive(NotificationCenter.default.publisher(for: .navigateToListing)) { notification in
            if let listingId = notification.userInfo?["listingId"] as? String {
                navigationPath.append(listingId)
            }
        }
    }

    // MARK: - Main Content

    private var mainContent: some View {
        VStack(spacing: 0) {
            headerView
            if viewModel.isLoading && viewModel.listings.isEmpty {
                skeletonContent
            } else if viewModel.listings.isEmpty {
                emptyStateContent
            } else {
                listingsContent
            }
        }
    }

    // MARK: - Skeleton

    private var skeletonContent: some View {
        ScrollView {
            LazyVStack(spacing: Spacing.md) {
                ForEach(0..<4, id: \.self) { _ in
                    skeletonCard
                }
            }
            .padding(.horizontal, Sizing.pagePadding)
            .padding(.vertical, Spacing.lg)
        }
    }

    private var skeletonCard: some View {
        HStack(spacing: Spacing.md) {
            RoundedRectangle(cornerRadius: CornerRadius.image)
                .fill(Color.mutedBackground)
                .frame(width: Sizing.thumbnailSize, height: Sizing.thumbnailSize)

            VStack(alignment: .leading, spacing: Spacing.sm) {
                RoundedRectangle(cornerRadius: CornerRadius.small)
                    .fill(Color.mutedBackground)
                    .frame(height: 16)
                    .frame(maxWidth: 140)
                RoundedRectangle(cornerRadius: CornerRadius.small)
                    .fill(Color.mutedBackground)
                    .frame(height: 12)
                    .frame(maxWidth: 60)
                RoundedRectangle(cornerRadius: CornerRadius.small)
                    .fill(Color.mutedBackground)
                    .frame(height: 12)
                    .frame(maxWidth: 80)
            }
            Spacer()
        }
        .padding(Spacing.md)
        .background(Color.cardBackground)
        .clipShape(RoundedRectangle(cornerRadius: CornerRadius.default))
        .overlay(
            RoundedRectangle(cornerRadius: CornerRadius.default)
                .stroke(Color.borderColor, lineWidth: 1)
        )
        .redacted(reason: .placeholder)
    }

    // MARK: - Header

    private var headerView: some View {
        HStack {
            Text("Your Listings")
                .font(.display(size: Typography.pageTitle, weight: .bold))
                .foregroundStyle(Color.appForeground)
            Spacer()
            Button { showPurchaseCredits = true } label: {
                HStack(spacing: Spacing.xs) {
                    Image(systemName: "creditcard.fill")
                        .font(.system(size: 14))
                    Text("\(creditsViewModel.balance)")
                        .font(.mono(size: Typography.sm, weight: .medium))
                }
                .foregroundStyle(Color.accentColor)
                .padding(.horizontal, Spacing.sm)
                .padding(.vertical, Spacing.xs)
                .background(
                    Capsule()
                        .fill(Color.accentColor.opacity(0.1))
                )
            }
            .accessibilityLabel("\(creditsViewModel.balance) credits")
            NavigationLink(destination: SettingsView()) {
                UserAvatarView(name: authState.currentUser?.name)
                    .frame(width: Sizing.minTapTarget, height: Sizing.minTapTarget)
            }
            .accessibilityLabel("Preferences")
        }
        .padding(.horizontal, Sizing.pagePadding)
        .padding(.top, Spacing.sm)
    }

    // MARK: - Empty State

    private var emptyStateContent: some View {
        EmptyStateView(
            iconName: "photo.badge.plus",
            title: "No listings yet",
            description: "Tap + to create your first one"
        )
        .frame(maxHeight: .infinity)
    }

    // MARK: - Listings

    private var listingsContent: some View {
        List {
            ForEach(viewModel.listings) { listing in
                Button {
                    navigationPath.append(listing.id)
                } label: {
                    ListingCardView(listing: listing)
                }
                .buttonStyle(.plain)
                .swipeActions(edge: .trailing, allowsFullSwipe: true) {
                    Button(role: .destructive) {
                        listingToDelete = listing
                    } label: {
                        Label("Delete", systemImage: "trash")
                    }
                }
                .swipeActions(edge: .leading, allowsFullSwipe: true) {
                    leadingSwipeActions(for: listing)
                }
                .listRowSeparator(.hidden)
                .listRowInsets(EdgeInsets(
                    top: Spacing.md / 2,
                    leading: Sizing.pagePadding,
                    bottom: Spacing.md / 2,
                    trailing: Sizing.pagePadding
                ))
                .listRowBackground(Color.clear)
            }
        }
        .listStyle(.plain)
        .scrollContentBackground(.hidden)
        .background(Color.appBackground)
        .animation(.easeOut(duration: 0.2), value: viewModel.listings.map(\.id))
        .refreshable {
            await viewModel.refresh(token: authState.token)
        }
        .confirmationDialog(
            "Delete Listing",
            isPresented: Binding(
                get: { listingToDelete != nil },
                set: { if !$0 { listingToDelete = nil } }
            ),
            titleVisibility: .visible
        ) {
            Button("Delete", role: .destructive) {
                guard let listing = listingToDelete else { return }
                Task {
                    await viewModel.deleteListing(id: listing.id, token: authState.token)
                }
            }
        } message: {
            Text("This listing will be permanently deleted.")
        }
    }

    // MARK: - Swipe Actions

    @ViewBuilder
    private func leadingSwipeActions(for listing: Listing) -> some View {
        switch listing.status {
        case .ready:
            Button {
                Task {
                    await viewModel.updateStatus(
                        ListingStatus.listed.rawValue,
                        listingId: listing.id,
                        token: authState.token
                    )
                }
            } label: {
                Label("Mark Listed", systemImage: "tag.fill")
            }
            .tint(.blue)

            Button {
                Task {
                    await viewModel.updateStatus(
                        ListingStatus.archived.rawValue,
                        listingId: listing.id,
                        token: authState.token
                    )
                }
            } label: {
                Label("Archive", systemImage: "archivebox.fill")
            }
            .tint(.orange)

        case .listed:
            Button {
                Task {
                    await viewModel.updateStatus(
                        ListingStatus.sold.rawValue,
                        listingId: listing.id,
                        token: authState.token
                    )
                }
            } label: {
                Label("Mark Sold", systemImage: "checkmark.circle.fill")
            }
            .tint(.green)

            Button {
                Task {
                    await viewModel.updateStatus(
                        ListingStatus.archived.rawValue,
                        listingId: listing.id,
                        token: authState.token
                    )
                }
            } label: {
                Label("Archive", systemImage: "archivebox.fill")
            }
            .tint(.orange)

        default:
            EmptyView()
        }
    }
}
