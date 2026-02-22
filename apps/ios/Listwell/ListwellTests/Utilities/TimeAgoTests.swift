import Testing
import Foundation
@testable import Listwell

@Suite("TimeAgo")
struct TimeAgoTests {

    @Test("produces relative string for recent date")
    func recentDate() {
        let date = Date().addingTimeInterval(-60)  // 1 minute ago
        let result = TimeAgo.string(from: date)
        #expect(result.contains("minute"))
    }

    @Test("produces relative string for hours ago")
    func hoursAgo() {
        let date = Date().addingTimeInterval(-7200)  // 2 hours ago
        let result = TimeAgo.string(from: date)
        #expect(result.contains("hour"))
    }

    @Test("produces relative string for days ago")
    func daysAgo() {
        let date = Date().addingTimeInterval(-259200)  // 3 days ago
        let result = TimeAgo.string(from: date)
        #expect(result.contains("day"))
    }

    @Test("produces relative string for future date")
    func futureDate() {
        let date = Date().addingTimeInterval(3600)  // 1 hour from now
        let result = TimeAgo.string(from: date)
        #expect(!result.isEmpty)
    }

    @Test("just now produces non-empty string")
    func justNow() {
        let result = TimeAgo.string(from: Date())
        #expect(!result.isEmpty)
    }
}
