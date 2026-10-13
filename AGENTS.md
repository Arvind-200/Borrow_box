# BorrowBox - OpenCode Project Instructions

## Project goal
BorrowBox is a local peer-to-peer item borrowing/rental marketplace.
A user can both LIST items for others and BORROW items from nearby users.

Core example:
A user needs a drill machine for a few days. They search "drill machine",
see nearby listings, open a product, review details/rating, and send a borrow
request. The owner can Accept or Reject the request.

## Tech stack
- Frontend: React.js
- Styling: Tailwind CSS
- Backend: Node.js + Express.js
- Database: MongoDB
- Authentication: JWT + secure password hashing
- API style: REST
- Development: local MongoDB first
- Do not introduce extra libraries unless they solve a real requirement.

## Product principles
1. UI quality is a first-class requirement. Do not make a generic CRUD-looking UI.
2. Responsive desktop/tablet/mobile design.
3. A user can be both borrower and lender.
4. Landing page shows default products before login.
5. Opening a protected action/product detail while logged out must lead to login/signup as appropriate.
6. Search and product results should support area/location relevance.
7. Borrow request lifecycle:
   Pending -> Accepted OR Rejected
   Later, if implemented: Accepted -> Active -> Returned -> Completed
8. Owners must be able to manage their own listings.
9. Admin is separate from normal user UI and protected by backend role authorization.
10. Never trust frontend role checks alone.

## Admin requirements
Admin dashboard should cover:
- dashboard metrics
- users
- products/listings
- borrow requests
- reports
- reviews
- categories
- blocked users
- activity/audit logs
- settings

Admin actions may include view, warn, block/unblock, hide/remove/restore
listing, moderate reviews, manage categories, and resolve reports.

Do not hard-code one prohibited-item example. Use a configurable moderation/report
system with reasons such as prohibited item, fake listing, scam/fraud,
wrong information, offensive content, duplicate listing, and other.

## Architecture rules
- Keep frontend and backend concerns separated.
- Keep database access in backend models/services/repositories as appropriate.
- Keep controllers thin; put reusable business logic in services.
- Validate request data on the backend.
- Centralize API error handling.
- Never commit secrets, API keys, passwords, or .env files.
- Use .env.example for required environment variables.
- Do not edit generated build output directly.
- Prefer reusable components over duplicated UI.
- Do not rewrite working features unnecessarily.

## Token/context discipline
- Do not read the entire repository for a small task.
- Inspect only relevant files first.
- Use @path to attach specific files when needed.
- Before implementing a feature, identify the smallest relevant file set.
- Do not paste large files into responses unless necessary.
- Make one coherent feature change at a time.
- After a feature is complete, update docs/PROJECT_STATE.md.
- Run focused verification before broad verification.
- If context becomes long, use /compact or start a fresh session with the
  project state files as the source of truth.
- Never solve an unrelated issue while implementing a feature unless required.

## Verification
After changes:
1. Check the changed files.
2. Run the smallest relevant lint/typecheck/test/build command available.
3. Fix errors caused by the change.
4. Summarize what changed and what was verified.
5. Update docs/PROJECT_STATE.md only with confirmed facts.

## Current scope
Build the project in phases. Do not implement every future feature at once.
The initial MVP should prioritize:
- landing page
- authentication
- product listings
- product details
- search/filter
- owner listing management
- borrow request flow
- user dashboard
- admin moderation panel

Payments, real maps, live chat, advanced identity verification, and production
cloud deployment are later phases unless explicitly requested.
