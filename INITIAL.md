# INITIAL.md - DesignBid Product Definition

> A SaaS platform that helps small business owners create, send, and track professional design proposals and bids to win more clients.

---

## PRODUCT

### Name
DesignBid

### Description
DesignBid is a proposal management platform built for freelance designers, design agencies, and creative small businesses. It streamlines the entire bidding process — from creating professional proposals with itemized line items, to sending them to clients, tracking their status, and converting accepted proposals into active projects. With a built-in CRM, project tracker, and analytics dashboard, DesignBid gives small business owners a complete view of their sales pipeline and project delivery.

### Target User
Small business owners — specifically freelance designers, design agencies, creative consultants, and local businesses that regularly send proposals or bids to win client work.

### Type
- [x] SaaS (Software as a Service)

---

## TECH STACK

| Layer | Choice |
|-------|--------|
| Backend | FastAPI + Python 3.11+ |
| Frontend | React + Vite + TypeScript |
| Database | PostgreSQL + SQLAlchemy |
| Auth | Email/Password (JWT-based) |
| UI | Tailwind CSS + shadcn/ui |
| Payments | Razorpay (post-MVP) |

---

## MODULES

### Module 1: Authentication (Required)

**Description:** User authentication and authorization with JWT tokens.

**Models:**
```
User:
  - id, email, hashed_password, full_name, company_name
  - phone, avatar_url, is_active, is_verified
  - role (user/admin), created_at, updated_at

RefreshToken:
  - id, user_id (FK), token, expires_at, revoked, created_at
```

**Endpoints:**
- POST /api/v1/auth/register - Create new account
- POST /api/v1/auth/login - Login with email/password
- POST /api/v1/auth/refresh - Refresh access token
- POST /api/v1/auth/logout - Revoke refresh token
- POST /api/v1/auth/forgot-password - Request password reset
- POST /api/v1/auth/reset-password - Reset password with token
- GET /api/v1/auth/me - Get current user profile
- PUT /api/v1/auth/me - Update profile

**Pages:**
- /login - Login page
- /register - Registration page
- /forgot-password - Forgot password page
- /reset-password - Reset password page
- /profile - User profile page (protected)

---

### Module 2: Clients

**Description:** Full CRM for managing client contacts, communication history, and relationship tracking.

**Models:**
```
Client:
  - id, user_id (FK), name, email, phone, company
  - address, city, state, country, zip_code, website
  - notes, tags (JSON), source, lifetime_value
  - avatar_url, is_active, created_at, updated_at

ClientNote:
  - id, client_id (FK), user_id (FK), content, created_at

ClientDocument:
  - id, client_id (FK), user_id (FK)
  - file_name, file_url, file_type, file_size, created_at
```

**Endpoints:**
- GET /api/v1/clients - List all clients (search, filter, pagination)
- POST /api/v1/clients - Create new client
- GET /api/v1/clients/{id} - Get client details
- PUT /api/v1/clients/{id} - Update client
- DELETE /api/v1/clients/{id} - Delete client
- GET /api/v1/clients/{id}/proposals - Get client's proposals
- GET /api/v1/clients/{id}/projects - Get client's projects
- POST /api/v1/clients/{id}/notes - Add note to client
- GET /api/v1/clients/{id}/notes - Get client notes
- POST /api/v1/clients/{id}/documents - Upload document
- GET /api/v1/clients/{id}/documents - List client documents

**Pages:**
- /clients - Client list with search and filters
- /clients/new - Create new client form
- /clients/{id} - Client detail view (tabs: info, proposals, projects, notes, documents)
- /clients/{id}/edit - Edit client form

---

### Module 3: Proposals

**Description:** Create, edit, send, and track professional design proposals with itemized line items.

**Models:**
```
Proposal:
  - id, user_id (FK), client_id (FK)
  - title, description
  - status (draft/sent/viewed/accepted/rejected/expired)
  - subtotal, tax_rate, tax_amount, total_amount, currency
  - valid_until, sent_at, viewed_at, responded_at
  - notes, created_at, updated_at

ProposalLineItem:
  - id, proposal_id (FK)
  - service_name, description, quantity, unit_price, total_price
  - sort_order

ProposalActivity:
  - id, proposal_id (FK)
  - action (created/sent/viewed/accepted/rejected)
  - ip_address, user_agent, created_at
```

**Endpoints:**
- GET /api/v1/proposals - List all proposals (search, filter by status, pagination)
- POST /api/v1/proposals - Create new proposal
- GET /api/v1/proposals/{id} - Get proposal details
- PUT /api/v1/proposals/{id} - Update proposal
- DELETE /api/v1/proposals/{id} - Delete proposal (draft only)
- POST /api/v1/proposals/{id}/send - Send proposal to client via email
- POST /api/v1/proposals/{id}/duplicate - Duplicate a proposal
- GET /api/v1/proposals/{id}/activity - Get proposal activity log
- GET /api/v1/proposals/public/{token} - Public view for client (no auth)
- POST /api/v1/proposals/public/{token}/accept - Client accepts proposal
- POST /api/v1/proposals/public/{token}/reject - Client rejects proposal
- GET /api/v1/proposals/stats - Proposal statistics (sent, accepted, win rate)

**Pages:**
- /proposals - Proposal list with status filters and search
- /proposals/new - Create new proposal (multi-step form)
- /proposals/{id} - Proposal detail/preview
- /proposals/{id}/edit - Edit proposal
- /proposals/public/{token} - Public client view (no auth required)

---

### Module 4: Projects

**Description:** Track active projects linked to accepted proposals, with status management and budget tracking.

**Models:**
```
Project:
  - id, user_id (FK), client_id (FK), proposal_id (FK, nullable)
  - name, description
  - status (active/completed/on_hold/cancelled)
  - start_date, end_date, budget, spent_amount, currency
  - notes, created_at, updated_at
```

**Endpoints:**
- GET /api/v1/projects - List all projects (search, filter by status, pagination)
- POST /api/v1/projects - Create new project
- GET /api/v1/projects/{id} - Get project details
- PUT /api/v1/projects/{id} - Update project
- DELETE /api/v1/projects/{id} - Delete project
- PUT /api/v1/projects/{id}/status - Update project status
- GET /api/v1/projects/stats - Project statistics

**Pages:**
- /projects - Project list with status filters
- /projects/new - Create new project form
- /projects/{id} - Project detail view
- /projects/{id}/edit - Edit project form

---

### Module 5: Dashboard

**Description:** Overview dashboard with key metrics, recent activity, and quick actions.

**Endpoints:**
- GET /api/v1/dashboard/stats - Aggregated dashboard statistics
- GET /api/v1/dashboard/recent-activity - Recent activity feed
- GET /api/v1/dashboard/revenue-chart - Revenue data for charts

**Pages:**
- /dashboard - Main dashboard with widgets:
  - Total revenue (from accepted proposals)
  - Proposals sent this month / win rate
  - Active projects count
  - Recent proposals (last 5)
  - Recent client activity
  - Proposal status breakdown chart
  - Revenue over time chart
- /settings - User settings and preferences

---

### Module 6: Admin Panel (Post-MVP)

**Description:** Admin-only management interface for platform administration.

**Endpoints:**
- GET /api/v1/admin/users - List all users (admin only)
- PUT /api/v1/admin/users/{id} - Update user status/role
- GET /api/v1/admin/stats - Platform-wide statistics

**Pages:**
- /admin - Admin dashboard (protected, admin only)
- /admin/users - User management table
- /admin/stats - Platform analytics

---

### Module 7: Payments & Subscriptions (Post-MVP)

**Description:** Razorpay integration for SaaS subscription billing.

**Models:**
```
Subscription:
  - id, user_id (FK), razorpay_subscription_id, plan_id
  - status, current_period_start, current_period_end, created_at

Payment:
  - id, user_id (FK), subscription_id (FK)
  - razorpay_payment_id, razorpay_order_id
  - amount, currency, status, created_at
```

**Endpoints:**
- POST /api/v1/payments/create-order - Create Razorpay order
- POST /api/v1/payments/verify - Verify payment signature
- POST /api/v1/payments/webhook - Razorpay webhook handler
- GET /api/v1/payments/subscription - Get current subscription
- POST /api/v1/payments/subscribe - Create subscription
- POST /api/v1/payments/cancel - Cancel subscription

---

## MVP SCOPE

### Must Have (MVP)
- [x] User registration and login (email/password)
- [x] Password reset flow
- [x] Client management (CRUD + notes + documents)
- [x] Proposal creation with line items
- [x] Send proposals via email with public link
- [x] Client can view, accept, or reject proposals
- [x] Proposal status tracking and activity log
- [x] Project creation and tracking (linked to proposals)
- [x] Dashboard with key metrics and recent activity
- [x] File uploads for client documents
- [x] Responsive design (mobile-friendly)

### Nice to Have (Post-MVP)
- [ ] Admin panel
- [ ] Advanced analytics dashboard with charts
- [ ] Razorpay subscription billing
- [ ] Email notifications (proposal sent/viewed/accepted)
- [ ] Proposal templates
- [ ] PDF export for proposals
- [ ] Team/multi-user support
- [ ] Client portal

---

## ACCEPTANCE CRITERIA

### Authentication
- [ ] User can register with email and password
- [ ] User can login with email and password
- [ ] JWT tokens work correctly with refresh
- [ ] Protected routes redirect to login
- [ ] Password reset via email works
- [ ] Profile can be updated

### Clients
- [ ] User can create, edit, and delete clients
- [ ] Client list supports search and filtering
- [ ] Can add notes and documents to clients
- [ ] Client detail shows linked proposals and projects
- [ ] Client lifetime value is calculated automatically

### Proposals
- [ ] User can create proposals with line items
- [ ] Totals calculate automatically (subtotal, tax, total)
- [ ] Proposals can be saved as drafts
- [ ] Proposals can be sent to clients via email
- [ ] Clients can view proposals via public link (no login)
- [ ] Clients can accept or reject proposals
- [ ] Proposal activity is logged (sent, viewed, accepted, rejected)
- [ ] Proposals can be duplicated
- [ ] Win rate is calculated correctly

### Projects
- [ ] Projects can be created manually or from accepted proposals
- [ ] Project status can be updated
- [ ] Budget tracking works correctly
- [ ] Projects link to their source proposal and client

### Dashboard
- [ ] Dashboard shows accurate revenue metrics
- [ ] Win rate and proposal stats are correct
- [ ] Recent activity feed works
- [ ] Charts render correctly

### Quality
- [ ] All API endpoints documented in OpenAPI
- [ ] Backend test coverage 80%+
- [ ] Frontend TypeScript strict mode passes
- [ ] Docker builds and runs successfully
- [ ] Responsive on mobile, tablet, and desktop

---

## SPECIAL REQUIREMENTS

### Security
- [x] Rate limiting on auth endpoints
- [x] Input validation on all endpoints
- [x] SQL injection prevention (SQLAlchemy ORM)
- [x] XSS prevention
- [x] CORS configured properly
- [x] File upload validation (type, size limits)

### Integrations
- [x] Email service for sending proposals and notifications
- [x] Razorpay for subscription payments (post-MVP)
- [x] File upload service (local or S3-compatible)

---

## AGENTS

> These 6 agents will build your product in parallel:

| Agent | Role | Works On |
|-------|------|----------|
| DATABASE-AGENT | Creates all models and migrations | User, Client, Proposal, Project models |
| BACKEND-AGENT | Builds API endpoints and services | All modules' backends |
| FRONTEND-AGENT | Creates UI pages and components | All modules' frontends |
| DEVOPS-AGENT | Sets up Docker, CI/CD, environments | Infrastructure |
| TEST-AGENT | Writes unit and integration tests | All code |
| REVIEW-AGENT | Security and code quality audit | All code |

---

# READY?

```bash
/generate-prp INITIAL.md
```

Then:

```bash
/execute-prp PRPs/designbid-prp.md
```
