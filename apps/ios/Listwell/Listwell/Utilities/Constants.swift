import SwiftUI

// MARK: - Typography

enum Typography {
    // Design system scale
    static let xs: CGFloat = 12
    static let sm: CGFloat = 13
    static let base: CGFloat = 14
    static let md: CGFloat = 16
    static let lg: CGFloat = 18
    static let xl: CGFloat = 22
    static let xxl: CGFloat = 28
    static let xxxl: CGFloat = 36

    // Backward-compatible aliases
    static let pageTitle: CGFloat = 28
    static let sectionHeading: CGFloat = 22
    static let cardTitle: CGFloat = 18
    static let body: CGFloat = 14
    static let caption: CGFloat = 12
    static let priceLarge: CGFloat = 28
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
    static let small: CGFloat = 6
    static let `default`: CGFloat = 10
    static let md: CGFloat = 12
    static let lg: CGFloat = 16
    static let xl: CGFloat = 20
    static let xxl: CGFloat = 24
    static let full: CGFloat = 9999

    // Backward-compatible alias
    static let image: CGFloat = 12
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

// MARK: - Font Helpers

extension Font {
    /// Display / Headings — Fraunces (serif variable font)
    static func display(size: CGFloat, weight: Font.Weight = .semibold) -> Font {
        let fontName: String
        switch weight {
        case .bold, .heavy, .black:
            fontName = "Fraunces-Bold"
        case .semibold:
            fontName = "Fraunces-SemiBold"
        case .light, .ultraLight, .thin:
            fontName = "Fraunces-Light"
        default:
            fontName = "Fraunces-Regular"
        }
        return .custom(fontName, size: size)
    }

    /// Body / UI text — Instrument Sans (sans-serif variable font)
    static func bodyFont(size: CGFloat, weight: Font.Weight = .regular) -> Font {
        let fontName: String
        switch weight {
        case .bold, .heavy, .black:
            fontName = "InstrumentSans-Bold"
        case .semibold:
            fontName = "InstrumentSans-SemiBold"
        case .medium:
            fontName = "InstrumentSans-Medium"
        default:
            fontName = "InstrumentSans-Regular"
        }
        return .custom(fontName, size: size)
    }

    /// Data / Monospace — JetBrains Mono (mono variable font)
    static func mono(size: CGFloat, weight: Font.Weight = .regular) -> Font {
        let fontName: String
        switch weight {
        case .bold, .heavy, .black:
            fontName = "JetBrainsMonoRoman-Bold"
        case .medium, .semibold:
            fontName = "JetBrainsMonoRoman-Medium"
        case .light:
            fontName = "JetBrainsMonoRoman-Light"
        default:
            fontName = "JetBrainsMono-Regular"
        }
        return .custom(fontName, size: size)
    }
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

    // New design system colors
    static let backgroundWarm = Color("BackgroundWarm")
    static let backgroundBright = Color("BackgroundBright")
    static let faintForeground = Color("FaintForeground")
    static let borderStrong = Color("BorderStrong")
    static let gold = Color("Gold")
    static let shed = Color("Shed")

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

// MARK: - View Extensions

extension View {
    func editFieldStyle() -> some View {
        self
            .padding(Spacing.sm)
            .background(Color.secondaryBackground)
            .clipShape(RoundedRectangle(cornerRadius: CornerRadius.small))
            .overlay(
                RoundedRectangle(cornerRadius: CornerRadius.small)
                    .stroke(Color.accentColor, lineWidth: 1)
            )
    }
}
