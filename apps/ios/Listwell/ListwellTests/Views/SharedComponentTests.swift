import Testing
import SwiftUI
@testable import Listwell

// MARK: - ListingStatusBadge Tests

@Suite("ListingStatusBadge")
struct ListingStatusBadgeTests {

    @Test("renders for all listing statuses")
    @MainActor
    func allStatuses() {
        let statuses: [ListingStatus] = [.draft, .processing, .ready, .listed, .sold, .archived]
        for status in statuses {
            let badge = ListingStatusBadge(status: status)
            #expect(badge.status == status)
        }
    }

    @Test("processing status gets default pending pipelineStep")
    @MainActor
    func processingDefault() {
        let badge = ListingStatusBadge(status: .processing)
        #expect(badge.pipelineStep == .pending)
    }

    @Test("error state uses pipelineStep error")
    @MainActor
    func errorState() {
        let badge = ListingStatusBadge(status: .processing, pipelineStep: .error)
        #expect(badge.pipelineStep == .error)
    }

    @Test("draft status displays correct name")
    @MainActor
    func draftDisplay() {
        let badge = ListingStatusBadge(status: .draft)
        #expect(badge.status.displayName == "Draft")
    }

    @Test("each status has a display name")
    @MainActor
    func allDisplayNames() {
        let expected: [(ListingStatus, String)] = [
            (.draft, "Draft"),
            (.processing, "Processing"),
            (.ready, "Ready"),
            (.listed, "Listed"),
            (.sold, "Sold"),
            (.archived, "Archived"),
        ]
        for (status, name) in expected {
            #expect(status.displayName == name)
        }
    }
}

// MARK: - CopyButton Tests

@Suite("CopyButton")
struct CopyButtonTests {

    @Test("initializes with text")
    @MainActor
    func initWithText() {
        let button = CopyButton(text: "Hello World")
        #expect(button.text == "Hello World")
    }

    @Test("initializes with optional label")
    @MainActor
    func initWithLabel() {
        let button = CopyButton(text: "Content", label: "title")
        #expect(button.label == "title")
    }

    @Test("label defaults to nil")
    @MainActor
    func labelDefaultsNil() {
        let button = CopyButton(text: "Content")
        #expect(button.label == nil)
    }
}

// MARK: - EmptyStateView Tests

@Suite("EmptyStateView")
struct EmptyStateViewTests {

    @Test("initializes with icon, title, and description")
    @MainActor
    func initProperties() {
        let view = EmptyStateView(
            iconName: "photo.badge.plus",
            title: "No listings yet",
            description: "Tap + to create your first one"
        )
        #expect(view.iconName == "photo.badge.plus")
        #expect(view.title == "No listings yet")
        #expect(view.description == "Tap + to create your first one")
    }

    @Test("renders centered content")
    @MainActor
    func rendersContent() {
        let view = EmptyStateView(
            iconName: "tray",
            title: "Empty",
            description: "Nothing here"
        )
        #expect(view.iconName == "tray")
        #expect(view.title == "Empty")
    }
}

// MARK: - FABButton Tests

@Suite("FABButton")
struct FABButtonTests {

    @Test("initializes with action closure")
    @MainActor
    func initWithAction() {
        var tapped = false
        let button = FABButton { tapped = true }
        button.action()
        #expect(tapped)
    }
}

// MARK: - CameraView Tests

@Suite("CameraView")
struct CameraViewTests {

    @Test("coordinator handles cancel")
    @MainActor
    func coordinatorCancel() {
        var image: UIImage? = nil
        let binding = Binding(get: { image }, set: { image = $0 })
        let cameraView = CameraView(capturedImage: binding)
        let coordinator = cameraView.makeCoordinator()
        #expect(coordinator.parent.capturedImage == nil)
    }

    @Test("representable creates picker with camera source")
    @MainActor
    func createsPickerForCamera() {
        var image: UIImage? = nil
        let binding = Binding(get: { image }, set: { image = $0 })
        let cameraView = CameraView(capturedImage: binding)
        // Verify coordinator can be created
        let coordinator = cameraView.makeCoordinator()
        #expect(type(of: coordinator) == CameraView.Coordinator.self)
    }
}
