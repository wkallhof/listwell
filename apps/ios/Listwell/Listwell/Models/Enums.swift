import Foundation

enum ListingStatus: String, Codable, CaseIterable, Sendable {
    case draft = "DRAFT"
    case processing = "PROCESSING"
    case ready = "READY"
    case listed = "LISTED"
    case sold = "SOLD"
    case archived = "ARCHIVED"

    // Map pipeline error status to a pseudo-status for UI
    static let error = ListingStatus.draft // handled via pipelineStep

    var displayName: String {
        switch self {
        case .draft: return "Draft"
        case .processing: return "Processing"
        case .ready: return "Ready"
        case .listed: return "Listed"
        case .sold: return "Sold"
        case .archived: return "Archived"
        }
    }
}

enum PipelineStep: String, Codable, CaseIterable, Sendable {
    case pending = "PENDING"
    case analyzing = "ANALYZING"
    case researching = "RESEARCHING"
    case generating = "GENERATING"
    case complete = "COMPLETE"
    case error = "ERROR"

    var displayName: String {
        switch self {
        case .pending: return "Queued"
        case .analyzing: return "Analyzing photos"
        case .researching: return "Researching prices"
        case .generating: return "Writing listing"
        case .complete: return "Done"
        case .error: return "Failed"
        }
    }

    var iconName: String {
        switch self {
        case .pending: return "clock"
        case .analyzing: return "eye"
        case .researching: return "magnifyingglass"
        case .generating: return "pencil.line"
        case .complete: return "checkmark.circle.fill"
        case .error: return "exclamationmark.triangle.fill"
        }
    }
}

enum ImageType: String, Codable, Sendable {
    case original = "ORIGINAL"
    case enhanced = "ENHANCED"
}
