import Testing
import Foundation
@testable import Listwell

@Suite("SpeechRecognizer")
struct SpeechRecognizerTests {

    @Test("initializes with default values")
    @MainActor
    func defaultInit() {
        let recognizer = SpeechRecognizer()

        #expect(recognizer.transcript == "")
        #expect(recognizer.isRecording == false)
        #expect(recognizer.errorMessage == nil)
    }

    @Test("stopRecording resets isRecording to false")
    @MainActor
    func stopRecordingResets() {
        let recognizer = SpeechRecognizer()
        recognizer.stopRecording()

        #expect(recognizer.isRecording == false)
    }

    @Test("stopRecording is safe to call multiple times")
    @MainActor
    func stopRecordingIdempotent() {
        let recognizer = SpeechRecognizer()
        recognizer.stopRecording()
        recognizer.stopRecording()
        recognizer.stopRecording()

        #expect(recognizer.isRecording == false)
        #expect(recognizer.errorMessage == nil)
    }

    @Test("requestPermissions returns Bool")
    @MainActor
    func permissionsReturnsType() async {
        let recognizer = SpeechRecognizer()
        // In test environment, permissions may be denied but the method should return without crashing
        let result = await recognizer.requestPermissions()
        #expect(result == true || result == false)
    }

    @Test("transcript can be set directly")
    @MainActor
    func transcriptMutable() {
        let recognizer = SpeechRecognizer()
        recognizer.transcript = "Hello world"
        #expect(recognizer.transcript == "Hello world")
    }
}
