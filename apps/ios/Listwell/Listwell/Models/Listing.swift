import Foundation

struct Listing: Codable, Identifiable, Sendable {
    let id: String
    let userId: String
    let rawDescription: String?
    let title: String?
    let description: String?
    let suggestedPrice: Double?
    let priceRangeLow: Double?
    let priceRangeHigh: Double?
    let category: String?
    let condition: String?
    let brand: String?
    let model: String?
    let researchNotes: String?
    let comparables: [Comparable]?
    let status: ListingStatus
    let pipelineStep: PipelineStep
    let pipelineError: String?
    let agentLog: [AgentLogEntry]?
    let inngestRunId: String?
    let createdAt: Date
    let updatedAt: Date
    let images: [ListingImage]?

    /// Effective status for UI, accounting for pipeline error state
    var effectiveStatus: ListingStatus {
        if pipelineStep == .error {
            return .draft // UI uses this to determine "error" display
        }
        return status
    }

    /// Whether this listing is still being processed
    var isProcessing: Bool {
        status == .processing && pipelineStep != .complete && pipelineStep != .error
    }

    /// Whether this listing has completed generation
    var isReady: Bool {
        status == .ready && pipelineStep == .complete
    }

    /// Primary image URL if available
    var primaryImageURL: URL? {
        guard let images else { return nil }
        let primary = images.first(where: \.isPrimary) ?? images.first
        return primary.flatMap { URL(string: $0.blobUrl) }
    }
}
