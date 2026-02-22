import SwiftUI

// MARK: - Typography

enum Typography {
    static let pageTitle: CGFloat = 24
    static let sectionHeading: CGFloat = 18
    static let cardTitle: CGFloat = 16
    static let body: CGFloat = 14
    static let caption: CGFloat = 12
    static let priceLarge: CGFloat = 30
    static let priceCard: CGFloat = 18
}

// MARK: - Spacing

enum Spacing {
    static let xs: CGFloat = 4
    static let sm: CGFloat = 8
    static let md: CGFloat = 12
    static let lg: CGFloat = 16
    static let xl: CGFloat = 20
    static let xxl: CGFloat = 24
    static let xxxl: CGFloat = 32
}

// MARK: - Corner Radius

enum CornerRadius {
    static let `default`: CGFloat = 10
    static let small: CGFloat = 6
    static let image: CGFloat = 8
    static let full: CGFloat = 9999
}

// MARK: - Sizing

enum Sizing {
    static let minTapTarget: CGFloat = 44
    static let fabSize: CGFloat = 56
    static let fabIconSize: CGFloat = 24
    static let thumbnailSize: CGFloat = 80
    static let smallThumbnailSize: CGFloat = 64
    static let maxContainerWidth: CGFloat = 576
    static let pagePadding: CGFloat = 20
}

// MARK: - API Configuration

enum APIConfig {
    static let baseURL: String = {
        if let url = ProcessInfo.processInfo.environment["API_BASE_URL"] {
            return url
        }
        #if DEBUG
        return "http://localhost:4000/api"
        #else
        return "https://api.listwell.app/api"
        #endif
    }()

    static let pollingInterval: TimeInterval = 4
    static let enhancementPollingInterval: TimeInterval = 3
    static let maxPhotos: Int = 5
    static let imageCompressionQuality: CGFloat = 0.8
    static let maxImageDimension: CGFloat = 2048
}

// MARK: - Keychain Keys

enum KeychainKeys {
    static let authToken = "com.listwell.auth.token"
}

// MARK: - Color Extension

extension Color {
    static let appBackground = Color("AppBackground")
    static let appForeground = Color("AppForeground")
    static let cardBackground = Color("CardBackground")
    static let mutedBackground = Color("MutedBackground")
    static let mutedForeground = Color("MutedForeground")
    static let destructive = Color("Destructive")
    static let borderColor = Color("BorderColor")
    static let secondaryBackground = Color("SecondaryBackground")
    static let secondaryForeground = Color("SecondaryForeground")

    // MARK: Status Colors

    static func statusBackground(for status: ListingStatus) -> Color {
        switch status {
        case .processing: return Color("StatusProcessingBg")
        case .ready: return Color("StatusReadyBg")
        case .listed: return Color("StatusListedBg")
        case .sold: return Color("StatusSoldBg")
        case .archived: return Color("StatusArchivedBg")
        case .error: return Color("StatusErrorBg")
        case .draft: return Color("StatusDraftBg")
        }
    }

    static func statusForeground(for status: ListingStatus) -> Color {
        switch status {
        case .processing: return Color("StatusProcessingFg")
        case .ready: return Color("StatusReadyFg")
        case .listed: return Color("StatusListedFg")
        case .sold: return Color("StatusSoldFg")
        case .archived: return Color("StatusArchivedFg")
        case .error: return Color("StatusErrorFg")
        case .draft: return Color("StatusDraftFg")
        }
    }
}
