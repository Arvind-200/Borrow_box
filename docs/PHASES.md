# BorrowBox Development Phases

## Phase 0 - Planning
- finalize requirements
- architecture
- data model
- UI direction

## Phase 1 - Foundation
- create repository
- frontend/backend structure
- environment files
- MongoDB connection
- basic API health check
- base Tailwind theme
- routing
- shared UI primitives

## Phase 2 - UI foundation
- navbar
- footer
- landing page
- product card
- categories
- responsive layout
- loading/empty/error states

## Phase 3 - Authentication
- signup
- login
- logout
- auth middleware
- protected routes
- profile basics

## Phase 4 - Products
- [x] Phase 4A: Category/Product models, idempotent seed, public read APIs
- [x] Phase 4B: Public catalog frontend integration (landing/browse/categories/search) and product detail page
- [x] Phase 4C: Add product, edit own product, publish/unpublish own product (server-side ownership checks)
- [x] product listing (frontend integration)
- [x] product detail (frontend page)
- [x] delete own product
- [x] image handling

## Phase 5 - Search
- [x] text search
- [x] category filter
- [x] price filter
- [x] availability
- [x] exact area/location filter, area options endpoint, and nearby-ready empty state

## Phase 6 - Borrow workflow
- [x] create request
- [x] pending state
- [x] owner incoming requests
- [x] accept/reject
- [x] borrower status
- [x] history

## Phase 7 - Reviews
- [x] Phase 7A: `Completed` borrow status plus owner "Mark returned" (releases the product)
- [x] Phase 7B: Review model + validation (borrower -> owner/product only)
- [x] Phase 7C: Review APIs, eligibility, and rating aggregation
- [x] Phase 7D: Frontend review submission
- [x] Phase 7E: Rating/review display
- [x] Phase 7F: Moderation foundation (backend only)
- [x] Phase 7G: Verification and docs

## Phase 8 - Reports and moderation
- [x] report product/user/review
- [x] admin report queue
- [x] warnings
- [x] hide/remove/restore
- [x] block/unblock

## Phase 9 - Admin
- [x] dashboard
- [x] users
- [x] products
- [x] requests
- [x] reports
- [x] reviews
- [x] categories
- [x] activity logs
- [x] settings

## Phase 10 - Polish
- responsive QA
- accessibility basics
- error handling
- security review
- performance cleanup
- seed/demo data
- final build

## Phase 11 - College submission
- README
- screenshots
- project documentation
- database explanation
- API explanation
- PPT
- viva questions/answers
- demo script
