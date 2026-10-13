# BorrowBox Product Specification

## 1. Problem
People often need an item temporarily but do not want to buy it. Friends may
own the item but live far away. Local rental shops may be expensive or far away.

BorrowBox connects people nearby so one user can lend an item and another user
can borrow it for a temporary period.

## 2. Target experience
The application should feel like a polished modern marketplace, not a basic
college CRUD application.

Reference style:
https://techself.demos.tailgrids.com/

The reference is for visual quality/inspiration only. Do not copy proprietary
branding or assets.

## 3. Public experience
Landing page:
- premium hero section
- prominent search
- categories
- featured/default products
- how it works
- trust/safety section
- call to action
- footer

Public users may see product cards. Protected actions require authentication.

## 4. Product card
Recommended information:
- image
- product name
- category
- rent/day
- rating
- review count
- area/distance when available
- availability indicator

## 5. Product details
- image gallery
- name
- category
- description
- rental price
- availability
- rating and reviews
- owner summary
- area/location
- borrow request action
- report listing action
- related products

## 6. User capabilities
Authentication:
- signup
- login
- logout
- protected routes
- profile

Borrowing:
- search
- filter
- open product
- request borrow
- view request status
- cancel request when allowed
- view borrowing history

Lending:
- add product
- upload images
- set title/description/category
- set rental price
- set location/area
- set availability
- edit listing
- hide/unpublish listing
- view incoming requests
- accept/reject request
- view lending history

## 7. Request state
MVP:
- Pending
- Accepted
- Rejected

Possible later:
- Active
- Returned
- Completed
- Cancelled
- Disputed

## 8. Reviews
After an appropriate completed borrowing flow:
- borrower can review owner/product
- owner can review borrower if desired
- star rating
- text review
- moderation support

Do not allow arbitrary review manipulation.

## 9. Reporting
Users can report products/users/reviews.
Initial report reasons:
- prohibited/restricted item
- fake listing
- scam/fraud
- wrong information
- offensive content
- duplicate listing
- other

## 10. Admin
Dashboard:
- users
- active/blocked users
- products
- pending/active requests
- reports
- reviews
- categories
- activity logs

Moderation:
- warn user
- block/unblock user
- hide/remove/restore listing
- moderate reviews
- resolve/dismiss reports

## 11. Security
- hash passwords
- validate inputs
- sanitize/validate uploaded files
- authorization on every protected API
- ownership checks
- admin role checks
- rate-limit sensitive endpoints when appropriate
- never expose secrets to frontend
- never trust client-provided role/user IDs

## 12. UI quality
Required:
- consistent spacing
- modern typography
- polished cards
- responsive navigation
- accessible forms
- loading skeletons
- empty states
- error states
- success/error toasts
- confirmation dialogs for destructive actions
- mobile-friendly layouts
- no broken links/buttons
- no placeholder text left in final MVP

## 13. Out of scope until explicitly approved
- real payment gateway
- real-time chat
- advanced maps/navigation
- KYC/identity verification
- production cloud deployment
- complex recommendation AI
