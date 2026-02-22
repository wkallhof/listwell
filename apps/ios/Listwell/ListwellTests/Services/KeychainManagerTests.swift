import Testing
import Foundation
@testable import Listwell

@Suite("KeychainManager")
struct KeychainManagerTests {

    private let testKey = "com.listwell.test.token.\(UUID().uuidString)"

    @Test("saves and retrieves a token")
    func saveAndRetrieve() throws {
        let token = "test-bearer-token-\(UUID().uuidString)"
        try KeychainManager.save(token: token, forKey: testKey)

        let retrieved = KeychainManager.retrieve(forKey: testKey)
        #expect(retrieved == token)

        // Cleanup
        try KeychainManager.delete(forKey: testKey)
    }

    @Test("returns nil for missing key")
    func retrieveMissing() {
        let result = KeychainManager.retrieve(forKey: "com.listwell.test.nonexistent.\(UUID().uuidString)")
        #expect(result == nil)
    }

    @Test("deletes an existing token")
    func deleteToken() throws {
        let token = "delete-me-\(UUID().uuidString)"
        try KeychainManager.save(token: token, forKey: testKey)

        try KeychainManager.delete(forKey: testKey)

        let result = KeychainManager.retrieve(forKey: testKey)
        #expect(result == nil)
    }

    @Test("overwrites existing token on save")
    func overwrite() throws {
        let original = "original-\(UUID().uuidString)"
        let updated = "updated-\(UUID().uuidString)"

        try KeychainManager.save(token: original, forKey: testKey)
        try KeychainManager.save(token: updated, forKey: testKey)

        let retrieved = KeychainManager.retrieve(forKey: testKey)
        #expect(retrieved == updated)

        // Cleanup
        try KeychainManager.delete(forKey: testKey)
    }

    @Test("delete on nonexistent key does not throw")
    func deleteNonexistent() throws {
        try KeychainManager.delete(forKey: "com.listwell.test.nope.\(UUID().uuidString)")
    }
}
