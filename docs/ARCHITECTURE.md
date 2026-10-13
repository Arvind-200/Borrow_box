# BorrowBox Architecture

## High-level
Frontend React app
        |
        | REST/JSON
        v
Node.js + Express API
        |
        v
MongoDB

## Suggested repository layout
borrowbox/
  AGENTS.md
  opencode.jsonc
  docs/
  frontend/
  backend/

## Frontend suggested layout
frontend/
  src/
    components/
    pages/
    layouts/
    hooks/
    services/
    context/
    utils/
    assets/

## Backend suggested layout
backend/
  src/
    config/
    controllers/
    middleware/
    models/
    routes/
    services/
    utils/
    validators/

## API conventions
- /api/auth/*
- /api/users/*
- /api/products/*
- /api/categories/*
- /api/borrow-requests/*
- /api/reviews/*
- /api/reports/*
- /api/admin/*

Use consistent JSON responses and centralized error handling.

## Database design direction
User:
- name
- email
- passwordHash
- avatar
- area/location fields
- role
- status
- createdAt
- updatedAt

Product:
- owner
- title
- description
- category
- images
- rentPerDay
- location/area
- availability
- rating summary
- moderation status
- createdAt
- updatedAt

BorrowRequest:
- product
- owner
- borrower
- requested dates/details
- status
- timestamps

Review:
- product
- reviewer
- reviewee/owner as needed
- rating
- comment
- status

Report:
- reporter
- target type
- target id
- reason
- description
- status
- admin action
- timestamps

AdminActivityLog:
- admin
- action
- target type/id
- reason
- metadata
- timestamp

Do not implement every field blindly. Finalize schema before coding each entity.

## Location strategy
For the MVP, use a practical location/area model first.
Do not add complex geospatial infrastructure until the core workflow works.
If proximity search is later implemented, use MongoDB geospatial indexes and
a clear coordinate format.

## Authentication
- signup/login endpoints
- password hashing
- JWT access token strategy
- auth middleware
- role middleware
- frontend protected routes

Do not store plaintext passwords.

## Image uploads
Start with a development-friendly solution.
Keep upload handling behind a service boundary so local storage can later be
replaced by a cloud image provider without rewriting product logic.
