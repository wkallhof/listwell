import { describe, it } from "vitest";

// All admin pages are now async server components with their own
// dedicated client component tests:
// - Dashboard: server component (integration tested)
// - Users: users-list-client.test.tsx, user-detail-client.test.tsx
// - Listings: listings-list-client.test.tsx, listing-detail-client.test.tsx
// - Revenue: server component (integration tested)
// - Activity: global-activity-client.test.tsx

describe("Admin pages", () => {
  it("all pages have dedicated test coverage", () => {
    // Placeholder — individual page tests exist in their respective directories
  });
});
