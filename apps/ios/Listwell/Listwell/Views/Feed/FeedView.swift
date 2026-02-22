import SwiftUI

struct FeedView: View {
    @Environment(AuthState.self) private var authState
    @State private var viewModel = FeedViewModel()
    @State private var showNewListing = false
    @State private var navigationPath = NavigationPath()

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
        .task {
            await viewModel.loadListings(token: authState.token)
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
                .font(.system(size: Typography.pageTitle, weight: .bold))
                .foregroundStyle(Color.appForeground)
            Spacer()
            Menu {
                Button(role: .destructive) {
                    Task { await authState.logout() }
                } label: {
                    Label("Log out", systemImage: "rectangle.portrait.and.arrow.right")
                }
            } label: {
                Image(systemName: "ellipsis")
                    .font(.system(size: 18))
                    .foregroundStyle(Color.mutedForeground)
                    .frame(width: Sizing.minTapTarget, height: Sizing.minTapTarget)
            }
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
        ScrollView {
            LazyVStack(spacing: Spacing.md) {
                ForEach(viewModel.listings) { listing in
                    Button {
                        navigationPath.append(listing.id)
                    } label: {
                        ListingCardView(listing: listing)
                    }
                    .buttonStyle(.plain)
                }
            }
            .padding(.horizontal, Sizing.pagePadding)
            .padding(.vertical, Spacing.lg)
            .animation(.easeOut(duration: 0.2), value: viewModel.listings.map(\.id))
        }
        .refreshable {
            await viewModel.refresh(token: authState.token)
        }
    }
}
