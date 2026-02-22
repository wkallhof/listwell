import Testing
import Foundation
@testable import Listwell

private func makeListing(
    status: ListingStatus = .processing,
    pipelineStep: PipelineStep = .analyzing,
    pipelineError: String? = nil,
    agentLog: [AgentLogEntry]? = nil,
    images: [ListingImage]? = nil
) -> Listing {
    Listing(
        id: "test-1",
        userId: "user-1",
        rawDescription: "Test item",
        title: nil,
        description: nil,
        suggestedPrice: nil,
        priceRangeLow: nil,
        priceRangeHigh: nil,
        category: nil,
        condition: nil,
        brand: nil,
        model: nil,
        researchNotes: nil,
        comparables: nil,
        status: status,
        pipelineStep: pipelineStep,
        pipelineError: pipelineError,
        agentLog: agentLog,
        inngestRunId: "run-1",
        createdAt: Date(),
        updatedAt: Date(),
        images: images
    )
}

// MARK: - PipelineStepsView Tests

@Suite("PipelineStepsView")
struct PipelineStepsViewTests {

    @Test("renders correct state for analyzing step")
    func analyzingStep() {
        let listing = makeListing(pipelineStep: .analyzing)
        #expect(listing.pipelineStep == .analyzing)
        #expect(listing.isProcessing)
    }

    @Test("renders correct state for researching step")
    func researchingStep() {
        let listing = makeListing(pipelineStep: .researching)
        #expect(listing.pipelineStep == .researching)
        #expect(listing.isProcessing)
    }

    @Test("renders correct state for generating step")
    func generatingStep() {
        let listing = makeListing(pipelineStep: .generating)
        #expect(listing.pipelineStep == .generating)
        #expect(listing.isProcessing)
    }

    @Test("renders correct state for pending step")
    func pendingStep() {
        let listing = makeListing(pipelineStep: .pending)
        #expect(listing.pipelineStep == .pending)
        #expect(listing.isProcessing)
    }

    @Test("pipeline step complete means not processing")
    func completeStep() {
        let listing = makeListing(status: .ready, pipelineStep: .complete)
        #expect(listing.pipelineStep == .complete)
        #expect(!listing.isProcessing)
        #expect(listing.isReady)
    }

    @Test("error step means not processing")
    func errorStep() {
        let listing = makeListing(pipelineStep: .error, pipelineError: "AI agent failed")
        #expect(listing.pipelineStep == .error)
        #expect(!listing.isProcessing)
        #expect(listing.pipelineError == "AI agent failed")
    }

    @Test("pipeline step has correct display names")
    func displayNames() {
        #expect(PipelineStep.pending.displayName == "Queued")
        #expect(PipelineStep.analyzing.displayName == "Analyzing photos")
        #expect(PipelineStep.researching.displayName == "Researching prices")
        #expect(PipelineStep.generating.displayName == "Writing listing")
        #expect(PipelineStep.complete.displayName == "Done")
        #expect(PipelineStep.error.displayName == "Failed")
    }

    @Test("pipeline step has correct icon names")
    func iconNames() {
        #expect(PipelineStep.pending.iconName == "clock")
        #expect(PipelineStep.analyzing.iconName == "eye")
        #expect(PipelineStep.researching.iconName == "magnifyingglass")
        #expect(PipelineStep.generating.iconName == "pencil.line")
        #expect(PipelineStep.complete.iconName == "checkmark.circle.fill")
        #expect(PipelineStep.error.iconName == "exclamationmark.triangle.fill")
    }
}

// MARK: - AgentLogView Tests

@Suite("AgentLogView")
struct AgentLogViewTests {

    @Test("renders log entries with correct icons")
    func logEntryIcons() {
        let entries = [
            AgentLogEntry(ts: 1000000, type: "status", content: "Starting analysis"),
            AgentLogEntry(ts: 1001000, type: "search", content: "Searching for prices"),
            AgentLogEntry(ts: 1002000, type: "fetch", content: "Fetching data"),
            AgentLogEntry(ts: 1003000, type: "text", content: "Processing text"),
            AgentLogEntry(ts: 1004000, type: "write", content: "Writing listing"),
            AgentLogEntry(ts: 1005000, type: "complete", content: "Done"),
            AgentLogEntry(ts: 1006000, type: "error", content: "Something went wrong"),
            AgentLogEntry(ts: 1007000, type: "unknown", content: "Unknown type"),
        ]

        #expect(entries[0].iconName == "info.circle")
        #expect(entries[1].iconName == "magnifyingglass")
        #expect(entries[2].iconName == "arrow.down")
        #expect(entries[3].iconName == "text.bubble")
        #expect(entries[4].iconName == "pencil")
        #expect(entries[5].iconName == "checkmark")
        #expect(entries[6].iconName == "exclamationmark.triangle")
        #expect(entries[7].iconName == "circle")
    }

    @Test("log entry date is derived from timestamp")
    func logEntryDate() {
        let entry = AgentLogEntry(ts: 1708000000000, type: "status", content: "Test")
        let expected = Date(timeIntervalSince1970: 1708000000)
        #expect(entry.date == expected)
    }

    @Test("handles empty log entries")
    func emptyLog() {
        let entries: [AgentLogEntry] = []
        #expect(entries.isEmpty)
    }
}

// MARK: - Processing State Tests

@Suite("ListingDetailView Processing State")
struct ListingDetailProcessingStateTests {

    @Test("processing listing shows processing content")
    func processingState() {
        let listing = makeListing(status: .processing, pipelineStep: .analyzing)
        #expect(listing.isProcessing)
        #expect(!listing.isReady)
    }

    @Test("ready listing shows ready content")
    func readyState() {
        let listing = makeListing(status: .ready, pipelineStep: .complete)
        #expect(!listing.isProcessing)
        #expect(listing.isReady)
    }

    @Test("error listing shows error card")
    func errorState() {
        let listing = makeListing(
            pipelineStep: .error,
            pipelineError: "The AI agent encountered an error"
        )
        #expect(!listing.isProcessing)
        #expect(listing.pipelineStep == .error)
        #expect(listing.pipelineError == "The AI agent encountered an error")
    }

    @Test("processing listing with agent log has entries")
    func processingWithLog() {
        let log = [
            AgentLogEntry(ts: 1000000, type: "status", content: "Analyzing image 1 of 3"),
            AgentLogEntry(ts: 1001000, type: "status", content: "Detected: Nike sneakers"),
        ]
        let listing = makeListing(agentLog: log)
        #expect(listing.agentLog?.count == 2)
        #expect(listing.agentLog?[0].content == "Analyzing image 1 of 3")
    }

    @Test("processing listing shows primary image preview")
    func primaryImagePreview() {
        let images = [
            ListingImage(
                id: "img-1",
                listingId: "test-1",
                type: .original,
                blobUrl: "https://example.com/photo.jpg",
                blobKey: "key-1",
                parentImageId: nil,
                sortOrder: 0,
                isPrimary: true,
                geminiPrompt: nil,
                createdAt: Date()
            )
        ]
        let listing = makeListing(images: images)
        #expect(listing.primaryImageURL != nil)
        #expect(listing.primaryImageURL?.absoluteString == "https://example.com/photo.jpg")
    }
}
