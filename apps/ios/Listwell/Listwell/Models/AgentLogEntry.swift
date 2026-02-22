import Foundation

struct AgentLogEntry: Codable, Sendable, Identifiable {
    let ts: TimeInterval
    let type: String
    let content: String

    var id: String { "\(ts)-\(type)" }

    var iconName: String {
        switch type {
        case "status": return "info.circle"
        case "search": return "magnifyingglass"
        case "fetch": return "arrow.down"
        case "text": return "text.bubble"
        case "write": return "pencil"
        case "complete": return "checkmark"
        case "error": return "exclamationmark.triangle"
        default: return "circle"
        }
    }

    var date: Date {
        Date(timeIntervalSince1970: ts / 1000)
    }
}
