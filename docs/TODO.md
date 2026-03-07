# Listwell — TODO

High-level features and initiatives still to implement. For granular task breakdowns, see [tasks.md](tasks.md).

---

## High Level Things
- [ ] Onboarding Flow
- [ ] Monetization
- [ ] Logo & Splash Screen & Icons
- [ ] Simplify "Researching" output, with expand for more verbose
- [ ] Clean up transcriptions in public container
- [ ] Create Admin Screen for web based on role of use
- [ ] Admin screen has dashboard showing estimated costs, memberships, sales, etc. 
- [ ] Support Social Login. Improve Login experience. Forgot password, etc. Research best practices
- [ ] Fix Image Enhancing experience on iOS
- [ ] Fix odd image delete experience on iOS

## iOS App

- [ ] TestFlight distribution
- [ ] App Store submission
- [ ] Image upload from iOS (presigned URL flow)
- [ ] Push notifications via APNs
- [ ] Listing editing (inline title, description, price editing)
- [ ] Voice input integration (on-device Speech framework)
- [ ] Settings/preferences sync with API
- [ ] Deep linking (open specific listing from notification)
- [ ] Offline draft support (queue submissions when offline)

## Web App Polish

- [ ] End-to-end testing of full user flow (register → capture → generate → review → copy)
- [ ] Mobile Safari PWA testing and fixes
- [ ] Performance audit (Core Web Vitals, LCP, bundle size)
- [ ] Accessibility audit (keyboard nav, screen reader, contrast ratios)
- [ ] Rate limiting on API endpoints
- [ ] Image optimization (compression before upload, responsive sizes)

## AI Pipeline

- [ ] Real-world testing of agent pipeline with diverse product categories
- [ ] Agent timeout handling and graceful degradation
- [ ] Cost tracking per listing generation (API usage)
- [ ] Prompt iteration based on real output quality
- [ ] Handle edge cases: obscure items, items with no comps, very high/low value items
- [ ] E2B sandbox reliability and cold start optimization

## Image Enhancement

- [ ] Gemini prompt tuning with real product photos across categories
- [ ] Before/after comparison UI improvements
- [ ] Enhancement quality feedback loop (track which variants users keep vs delete)

## User Experience

- [ ] Onboarding flow for first-time users
- [ ] Listing analytics (views on marketplace, time to sell — manual tracking)
- [ ] Batch listing support (multiple items in one session)
- [ ] Listing templates / saved defaults
- [ ] Relisting flow (re-generate with updated price/photos)
- [ ] Share listing via native share sheet

## Future Features (Post-MVP)

- [ ] Multi-user support (teams, shared listings)
- [ ] Direct marketplace posting via API (Facebook, eBay)
- [ ] Shipping cost estimation
- [ ] Inventory tracking / sales tracking
- [ ] Listing scheduling (post at optimal times)
- [ ] Category-specific photo guidance ("take a photo of the serial number")
- [ ] Buyer message template generation
