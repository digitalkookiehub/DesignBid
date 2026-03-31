# PRP: DesignBid

> Implementation blueprint for parallel agent execution

---

## METADATA

| Field | Value |
|-------|-------|
| **Product** | DesignBid |
| **Type** | SaaS (Software as a Service) |
| **Version** | 1.0 |
| **Created** | 2026-03-21 |
| **Complexity** | High |

---

## PRODUCT OVERVIEW

**Description:** DesignBid is a proposal management platform built for freelance designers, design agencies, and creative small businesses. It streamlines the entire bidding process — from creating professional proposals with itemized line items, to sending them to clients, tracking their status, and converting accepted proposals into active projects.

**Value Proposition:** Designers spend hours creating proposals in Word/Google Docs with no tracking. DesignBid gives them a professional, branded proposal builder with real-time status tracking, CRM, and project management — all in one place. Win more clients, close faster.

**Target User:** Small business owners — freelance designers, design agencies, creative consultants.

**MVP Scope:**
- [ ] User registration and login (email/password with JWT)
- [ ] Password reset flow
- [ ] Client management (CRUD + notes + documents)
- [ ] Proposal creation with line items
- [ ] Send proposals via email with public link
- [ ] Client can view, accept, or reject proposals via public link
- [ ] Proposal status tracking and activity log
- [ ] Project creation and tracking (linked to proposals)
- [ ] Dashboard with key metrics and recent activity
- [ ] File uploads for client documents
- [ ] Responsive design (mobile-friendly)

---

## TECH STACK

| Layer | Technology | Skill Reference |
|-------|------------|-----------------|
| Backend | FastAPI + Python 3.11+ | skills/BACKEND.md |
| Frontend | React + Vite + TypeScript | skills/FRONTEND.md |
| Database | PostgreSQL + SQLAlchemy | skills/DATABASE.md |
| Auth | JWT + bcrypt (email/password) | skills/BACKEND.md |
| UI | Tailwind CSS + shadcn/ui | skills/FRONTEND.md |
| Testing | pytest + React Testing Library | skills/TESTING.md |
| Deployment | Docker + docker-compose | skills/DEPLOYMENT.md |
| Email | SMTP (aiosmtplib) | skills/BACKEND.md |
| File Storage | Local filesystem / S3-compatible | skills/BACKEND.md |

---

## DATABASE MODELS

### User Model
```
User:
  - id: Integer, PK
  - email: String, unique, indexed
  - hashed_password: String
  - full_name: String
  - company_name: String, nullable
  - phone: String, nullable
  - avatar_url: String, nullable
  - is_active: Boolean, default=True
  - is_verified: Boolean, default=False
  - role: Enum(user, admin), default=user
  - created_at: DateTime
  - updated_at: DateTime
  Relations: has_many clients, proposals, projects
```

### RefreshToken Model
```
RefreshToken:
  - id: Integer, PK
  - user_id: Integer, FK(users.id)
  - token: String, unique, indexed
  - expires_at: DateTime
  - revoked: Boolean, default=False
  - created_at: DateTime
```

### Client Model
```
Client:
  - id: Integer, PK
  - user_id: Integer, FK(users.id), indexed
  - name: String
  - email: String
  - phone: String, nullable
  - company: String, nullable
  - address: String, nullable
  - city: String, nullable
  - state: String, nullable
  - country: String, nullable
  - zip_code: String, nullable
  - website: String, nullable
  - notes: Text, nullable
  - tags: JSON, default=[]
  - source: String, nullable
  - lifetime_value: Decimal, default=0
  - avatar_url: String, nullable
  - is_active: Boolean, default=True
  - created_at: DateTime
  - updated_at: DateTime
  Constraints: unique(user_id, email)
  Relations: has_many proposals, projects, client_notes, client_documents
```

### ClientNote Model
```
ClientNote:
  - id: Integer, PK
  - client_id: Integer, FK(clients.id)
  - user_id: Integer, FK(users.id)
  - content: Text
  - created_at: DateTime
```

### ClientDocument Model
```
ClientDocument:
  - id: Integer, PK
  - client_id: Integer, FK(clients.id)
  - user_id: Integer, FK(users.id)
  - file_name: String
  - file_url: String
  - file_type: String
  - file_size: Integer
  - created_at: DateTime
```

### Proposal Model
```
Proposal:
  - id: Integer, PK
  - user_id: Integer, FK(users.id), indexed
  - client_id: Integer, FK(clients.id), indexed
  - title: String
  - description: Text, nullable
  - status: Enum(draft, sent, viewed, accepted, rejected, expired), default=draft
  - public_token: String, unique, indexed (UUID4)
  - subtotal: Decimal, default=0
  - tax_rate: Decimal, default=0
  - tax_amount: Decimal, default=0
  - total_amount: Decimal, default=0
  - currency: String, default="INR"
  - valid_until: Date, nullable
  - sent_at: DateTime, nullable
  - viewed_at: DateTime, nullable
  - responded_at: DateTime, nullable
  - notes: Text, nullable
  - created_at: DateTime
  - updated_at: DateTime
  Relations: has_many line_items, activities; belongs_to user, client
```

### ProposalLineItem Model
```
ProposalLineItem:
  - id: Integer, PK
  - proposal_id: Integer, FK(proposals.id), on_delete=CASCADE
  - service_name: String
  - description: Text, nullable
  - quantity: Decimal, default=1
  - unit_price: Decimal
  - total_price: Decimal (computed: quantity * unit_price)
  - sort_order: Integer, default=0
```

### ProposalActivity Model
```
ProposalActivity:
  - id: Integer, PK
  - proposal_id: Integer, FK(proposals.id), on_delete=CASCADE
  - action: Enum(created, sent, viewed, accepted, rejected)
  - ip_address: String, nullable
  - user_agent: String, nullable
  - created_at: DateTime
```

### Project Model
```
Project:
  - id: Integer, PK
  - user_id: Integer, FK(users.id), indexed
  - client_id: Integer, FK(clients.id), indexed
  - proposal_id: Integer, FK(proposals.id), nullable
  - name: String
  - description: Text, nullable
  - status: Enum(active, completed, on_hold, cancelled), default=active
  - start_date: Date, nullable
  - end_date: Date, nullable
  - budget: Decimal, default=0
  - spent_amount: Decimal, default=0
  - currency: String, default="INR"
  - notes: Text, nullable
  - created_at: DateTime
  - updated_at: DateTime
  Relations: belongs_to user, client, proposal(optional)
```

---

## MODULES

### Module 1: Authentication
**Agents:** DATABASE-AGENT + BACKEND-AGENT + FRONTEND-AGENT

**Backend Endpoints:**
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | /api/v1/auth/register | Create new account | Public |
| POST | /api/v1/auth/login | Login, return JWT tokens | Public |
| POST | /api/v1/auth/refresh | Refresh access token | Public (refresh token) |
| POST | /api/v1/auth/logout | Revoke refresh token | Protected |
| POST | /api/v1/auth/forgot-password | Request password reset email | Public |
| POST | /api/v1/auth/reset-password | Reset password with token | Public |
| GET | /api/v1/auth/me | Get current user profile | Protected |
| PUT | /api/v1/auth/me | Update profile | Protected |

**Frontend Pages:**
| Route | Page | Key Components |
|-------|------|----------------|
| /login | LoginPage | LoginForm, Input, Button, Link |
| /register | RegisterPage | RegisterForm, Input, Button, Link |
| /forgot-password | ForgotPasswordPage | ForgotPasswordForm |
| /reset-password | ResetPasswordPage | ResetPasswordForm |
| /profile | ProfilePage | ProfileForm, AvatarUpload |

**Business Rules:**
- Password: min 8 chars, uppercase, lowercase, number
- Access token: 30 min expiry, HS256
- Refresh token: 7 day expiry
- Rate limit: 5 attempts per minute on login/register

---

### Module 2: Clients
**Agents:** BACKEND-AGENT + FRONTEND-AGENT

**Backend Endpoints:**
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | /api/v1/clients | List clients (search, filter, paginate) | Protected |
| POST | /api/v1/clients | Create client | Protected |
| GET | /api/v1/clients/{id} | Get client details | Protected |
| PUT | /api/v1/clients/{id} | Update client | Protected |
| DELETE | /api/v1/clients/{id} | Soft-delete client | Protected |
| GET | /api/v1/clients/{id}/proposals | Get client's proposals | Protected |
| GET | /api/v1/clients/{id}/projects | Get client's projects | Protected |
| POST | /api/v1/clients/{id}/notes | Add note | Protected |
| GET | /api/v1/clients/{id}/notes | List notes | Protected |
| POST | /api/v1/clients/{id}/documents | Upload document | Protected |
| GET | /api/v1/clients/{id}/documents | List documents | Protected |

**Frontend Pages:**
| Route | Page | Key Components |
|-------|------|----------------|
| /clients | ClientListPage | ClientTable, SearchBar, FilterDropdown, Pagination |
| /clients/new | ClientCreatePage | ClientForm, Input, Select, Button |
| /clients/{id} | ClientDetailPage | ClientInfo, TabPanel (Info, Proposals, Projects, Notes, Documents) |
| /clients/{id}/edit | ClientEditPage | ClientForm (prefilled) |

**Business Rules:**
- Client email unique per user (not globally)
- Soft delete: set is_active=false, hide from lists
- Lifetime value: auto-sum of accepted proposal amounts
- Tags stored as JSON array for flexible categorization

---

### Module 3: Proposals
**Agents:** BACKEND-AGENT + FRONTEND-AGENT

**Backend Endpoints:**
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | /api/v1/proposals | List proposals (search, filter, paginate) | Protected |
| POST | /api/v1/proposals | Create proposal with line items | Protected |
| GET | /api/v1/proposals/{id} | Get proposal with line items | Protected |
| PUT | /api/v1/proposals/{id} | Update proposal (draft only) | Protected |
| DELETE | /api/v1/proposals/{id} | Delete proposal (draft only) | Protected |
| POST | /api/v1/proposals/{id}/send | Send to client via email | Protected |
| POST | /api/v1/proposals/{id}/duplicate | Duplicate proposal | Protected |
| GET | /api/v1/proposals/{id}/activity | Get activity log | Protected |
| GET | /api/v1/proposals/stats | Proposal statistics | Protected |
| GET | /api/v1/proposals/public/{token} | Public view for client | Public |
| POST | /api/v1/proposals/public/{token}/accept | Client accepts | Public |
| POST | /api/v1/proposals/public/{token}/reject | Client rejects | Public |

**Frontend Pages:**
| Route | Page | Key Components |
|-------|------|----------------|
| /proposals | ProposalListPage | ProposalTable, StatusBadge, SearchBar, FilterTabs |
| /proposals/new | ProposalCreatePage | ProposalForm, LineItemEditor, ClientSelect, DatePicker |
| /proposals/{id} | ProposalDetailPage | ProposalPreview, ActivityTimeline, StatusBadge, ActionButtons |
| /proposals/{id}/edit | ProposalEditPage | ProposalForm (prefilled, draft only) |
| /proposals/public/{token} | PublicProposalPage | ProposalPreview, AcceptButton, RejectButton (no auth layout) |

**Business Rules:**
- Status flow: draft → sent → viewed → accepted/rejected/expired
- Cannot edit after sent (must duplicate)
- public_token: UUID4, generated on creation
- Line items: positive quantity and price required
- Total = sum(line_item.total_price) + tax_amount
- Tax_amount = subtotal * tax_rate
- Sending triggers email with public link
- Viewing by client logs ProposalActivity with IP/user-agent
- Auto-expire proposals past valid_until date

---

### Module 4: Projects
**Agents:** BACKEND-AGENT + FRONTEND-AGENT

**Backend Endpoints:**
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | /api/v1/projects | List projects (search, filter, paginate) | Protected |
| POST | /api/v1/projects | Create project | Protected |
| GET | /api/v1/projects/{id} | Get project details | Protected |
| PUT | /api/v1/projects/{id} | Update project | Protected |
| DELETE | /api/v1/projects/{id} | Delete project | Protected |
| PUT | /api/v1/projects/{id}/status | Update status | Protected |
| GET | /api/v1/projects/stats | Project statistics | Protected |

**Frontend Pages:**
| Route | Page | Key Components |
|-------|------|----------------|
| /projects | ProjectListPage | ProjectTable, StatusBadge, SearchBar, FilterTabs |
| /projects/new | ProjectCreatePage | ProjectForm, ClientSelect, ProposalSelect, DatePicker |
| /projects/{id} | ProjectDetailPage | ProjectInfo, BudgetTracker, LinkedProposal, StatusActions |
| /projects/{id}/edit | ProjectEditPage | ProjectForm (prefilled) |

**Business Rules:**
- Auto-create project when proposal is accepted (optional)
- Status flow: active → completed/on_hold/cancelled
- Budget >= 0, spent_amount tracks progress
- Link to source proposal (if created from one)

---

### Module 5: Dashboard
**Agents:** BACKEND-AGENT + FRONTEND-AGENT

**Backend Endpoints:**
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | /api/v1/dashboard/stats | Aggregated stats | Protected |
| GET | /api/v1/dashboard/recent-activity | Recent activity feed | Protected |
| GET | /api/v1/dashboard/revenue-chart | Revenue chart data | Protected |

**Frontend Pages:**
| Route | Page | Key Components |
|-------|------|----------------|
| /dashboard | DashboardPage | StatCards, RevenueChart, ProposalStatusChart, RecentProposals, RecentActivity |
| /settings | SettingsPage | SettingsForm, PasswordChange, NotificationPrefs |

**Dashboard Widgets:**
1. **Stat Cards:** Total Revenue, Proposals Sent (month), Win Rate, Active Projects
2. **Revenue Chart:** Line chart, revenue over last 6 months
3. **Proposal Status Chart:** Donut chart, breakdown by status
4. **Recent Proposals:** Last 5 proposals with status badges
5. **Recent Activity:** Activity feed from all modules

---

## PHASE EXECUTION PLAN

### Phase 1: Foundation (4 agents in parallel)

**DATABASE-AGENT:**
- Read: skills/DATABASE.md
- Create: backend/app/database.py (engine, session, Base)
- Create: All model files (user.py, client.py, proposal.py, project.py)
- Create: backend/app/models/__init__.py (export all models)
- Setup: Alembic configuration and initial migration
- Output: All SQLAlchemy models with relationships

**BACKEND-AGENT:**
- Read: skills/BACKEND.md
- Create: backend/app/main.py (FastAPI app, CORS, routers)
- Create: backend/app/config.py (Pydantic Settings)
- Create: backend/app/auth/jwt.py (token create/verify)
- Create: backend/app/auth/dependencies.py (get_current_user)
- Create: backend/requirements.txt
- Output: App skeleton, config, auth utilities

**FRONTEND-AGENT:**
- Read: skills/FRONTEND.md
- Setup: Vite + React + TypeScript project
- Install: Tailwind CSS + shadcn/ui
- Create: src/components/ui/ (Button, Input, Card, Badge, Table, Dialog, Tabs, etc.)
- Create: src/components/layout/ (AppLayout, Sidebar, Header, Footer)
- Create: src/context/AuthContext.tsx
- Create: src/services/api.ts (Axios instance with interceptors)
- Create: src/types/ (all TypeScript interfaces)
- Create: src/App.tsx (React Router setup)
- Output: Frontend skeleton with routing and shared components

**DEVOPS-AGENT:**
- Read: skills/DEPLOYMENT.md
- Create: docker-compose.yml (backend, frontend, postgres, redis)
- Create: backend/Dockerfile
- Create: frontend/Dockerfile
- Create: .env.example
- Create: .gitignore
- Output: Docker infrastructure ready

**Validation Gate 1:**
```bash
cd backend && pip install -r requirements.txt
cd backend && alembic upgrade head
cd frontend && npm install
docker-compose config
```

---

### Phase 2: Core Modules (backend + frontend parallel per module)

**Step 2A: Authentication Module**

BACKEND-AGENT:
- Create: backend/app/schemas/user.py (UserCreate, UserLogin, UserResponse, TokenResponse)
- Create: backend/app/services/auth.py (register, login, refresh, password reset)
- Create: backend/app/routers/auth.py (all auth endpoints)
- Create: backend/app/services/email.py (email sending utility)

FRONTEND-AGENT:
- Create: src/pages/auth/ (LoginPage, RegisterPage, ForgotPasswordPage, ResetPasswordPage)
- Create: src/services/authService.ts
- Create: src/hooks/useAuth.ts
- Create: Protected route wrapper component

**Step 2B: Clients Module**

BACKEND-AGENT:
- Create: backend/app/schemas/client.py
- Create: backend/app/services/client.py
- Create: backend/app/routers/clients.py
- Create: backend/app/services/file_upload.py

FRONTEND-AGENT:
- Create: src/pages/clients/ (ListPage, CreatePage, DetailPage, EditPage)
- Create: src/components/clients/ (ClientTable, ClientForm, NotesList, DocumentUpload)
- Create: src/services/clientService.ts
- Create: src/hooks/useClients.ts

**Step 2C: Proposals Module**

BACKEND-AGENT:
- Create: backend/app/schemas/proposal.py
- Create: backend/app/services/proposal.py (includes email sending, public token logic)
- Create: backend/app/routers/proposals.py

FRONTEND-AGENT:
- Create: src/pages/proposals/ (ListPage, CreatePage, DetailPage, EditPage, PublicPage)
- Create: src/components/proposals/ (ProposalForm, LineItemEditor, ProposalPreview, StatusBadge, ActivityTimeline)
- Create: src/services/proposalService.ts
- Create: src/hooks/useProposals.ts

**Step 2D: Projects Module**

BACKEND-AGENT:
- Create: backend/app/schemas/project.py
- Create: backend/app/services/project.py
- Create: backend/app/routers/projects.py

FRONTEND-AGENT:
- Create: src/pages/projects/ (ListPage, CreatePage, DetailPage, EditPage)
- Create: src/components/projects/ (ProjectTable, ProjectForm, BudgetTracker, StatusActions)
- Create: src/services/projectService.ts
- Create: src/hooks/useProjects.ts

**Step 2E: Dashboard Module**

BACKEND-AGENT:
- Create: backend/app/services/dashboard.py (aggregation queries)
- Create: backend/app/routers/dashboard.py

FRONTEND-AGENT:
- Create: src/pages/dashboard/ (DashboardPage, SettingsPage)
- Create: src/components/dashboard/ (StatCards, RevenueChart, ProposalStatusChart, RecentActivity)
- Create: src/services/dashboardService.ts

**Validation Gate 2:**
```bash
ruff check backend/
cd frontend && npm run lint
cd frontend && npm run type-check
```

---

### Phase 3: Quality (3 agents in parallel)

**TEST-AGENT:**
- Read: skills/TESTING.md
- Create: backend/tests/conftest.py (test DB, fixtures)
- Create: backend/tests/test_auth.py
- Create: backend/tests/test_clients.py
- Create: backend/tests/test_proposals.py
- Create: backend/tests/test_projects.py
- Create: backend/tests/test_dashboard.py
- Create: frontend/src/__tests__/ (component and page tests)
- Target: 80%+ backend coverage

**REVIEW-AGENT:**
- Security audit: SQL injection, XSS, CORS, rate limiting, input validation
- Performance review: N+1 queries, pagination, indexing
- Code quality: type hints, error handling, logging
- API consistency: naming, status codes, response format

**DEVOPS-AGENT:**
- Verify: docker-compose up -d works end-to-end
- Create: .github/workflows/ci.yml (lint, test, build)
- Create: backend/app/health.py (health check endpoint)
- Verify: All environment variables documented

**Final Validation:**
```bash
pytest backend/tests -v --cov --cov-fail-under=80
cd frontend && npm test
cd frontend && npm run build
docker-compose up -d
curl http://localhost:8000/health
curl http://localhost:5173
```

---

## VALIDATION GATES

| Gate | Phase | Commands | Pass Criteria |
|------|-------|----------|---------------|
| 1 | Foundation | `pip install -r requirements.txt` | No errors |
| 1 | Foundation | `alembic upgrade head` | All migrations applied |
| 1 | Foundation | `npm install` | No errors |
| 1 | Foundation | `docker-compose config` | Valid config |
| 2 | Modules | `ruff check backend/` | No lint errors |
| 2 | Modules | `npm run lint` | No lint errors |
| 2 | Modules | `npm run type-check` | No type errors |
| 3 | Quality | `pytest --cov --cov-fail-under=80` | 80%+ coverage |
| 3 | Quality | `npm test` | All tests pass |
| Final | Deploy | `docker-compose up -d` | All services healthy |
| Final | Deploy | `curl localhost:8000/health` | HTTP 200 |

---

## FILE MANIFEST

### Backend (23 files)
```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py                    # FastAPI app, CORS, router includes
│   ├── config.py                  # Pydantic Settings
│   ├── database.py                # Engine, session, Base
│   ├── health.py                  # Health check endpoint
│   ├── models/
│   │   ├── __init__.py            # Export all models
│   │   ├── user.py                # User, RefreshToken
│   │   ├── client.py              # Client, ClientNote, ClientDocument
│   │   ├── proposal.py            # Proposal, ProposalLineItem, ProposalActivity
│   │   └── project.py             # Project
│   ├── schemas/
│   │   ├── __init__.py
│   │   ├── user.py                # UserCreate, UserLogin, UserResponse, TokenResponse
│   │   ├── client.py              # ClientCreate, ClientUpdate, ClientResponse
│   │   ├── proposal.py            # ProposalCreate, ProposalUpdate, ProposalResponse
│   │   └── project.py             # ProjectCreate, ProjectUpdate, ProjectResponse
│   ├── routers/
│   │   ├── __init__.py
│   │   ├── auth.py                # Auth endpoints
│   │   ├── clients.py             # Client CRUD + notes + docs
│   │   ├── proposals.py           # Proposal CRUD + send + public
│   │   ├── projects.py            # Project CRUD
│   │   └── dashboard.py           # Dashboard stats
│   ├── services/
│   │   ├── __init__.py
│   │   ├── auth.py                # Auth business logic
│   │   ├── client.py              # Client business logic
│   │   ├── proposal.py            # Proposal business logic
│   │   ├── project.py             # Project business logic
│   │   ├── dashboard.py           # Aggregation queries
│   │   ├── email.py               # Email sending
│   │   └── file_upload.py         # File upload handling
│   └── auth/
│       ├── __init__.py
│       ├── jwt.py                 # Token create/verify
│       └── dependencies.py        # get_current_user dependency
├── alembic/
│   ├── env.py
│   └── versions/
├── tests/
│   ├── conftest.py
│   ├── test_auth.py
│   ├── test_clients.py
│   ├── test_proposals.py
│   ├── test_projects.py
│   └── test_dashboard.py
├── requirements.txt
├── Dockerfile
└── alembic.ini
```

### Frontend (40+ files)
```
frontend/
├── src/
│   ├── App.tsx                    # Router setup
│   ├── main.tsx                   # Entry point
│   ├── components/
│   │   ├── ui/                    # shadcn/ui (Button, Input, Card, Badge, Table, Dialog, Tabs, Select, etc.)
│   │   ├── layout/
│   │   │   ├── AppLayout.tsx      # Main layout with sidebar
│   │   │   ├── Sidebar.tsx        # Navigation sidebar
│   │   │   ├── Header.tsx         # Top header bar
│   │   │   └── ProtectedRoute.tsx # Auth guard wrapper
│   │   ├── clients/
│   │   │   ├── ClientTable.tsx
│   │   │   ├── ClientForm.tsx
│   │   │   ├── NotesList.tsx
│   │   │   └── DocumentUpload.tsx
│   │   ├── proposals/
│   │   │   ├── ProposalForm.tsx
│   │   │   ├── LineItemEditor.tsx
│   │   │   ├── ProposalPreview.tsx
│   │   │   ├── StatusBadge.tsx
│   │   │   └── ActivityTimeline.tsx
│   │   ├── projects/
│   │   │   ├── ProjectTable.tsx
│   │   │   ├── ProjectForm.tsx
│   │   │   ├── BudgetTracker.tsx
│   │   │   └── StatusActions.tsx
│   │   └── dashboard/
│   │       ├── StatCards.tsx
│   │       ├── RevenueChart.tsx
│   │       ├── ProposalStatusChart.tsx
│   │       └── RecentActivity.tsx
│   ├── pages/
│   │   ├── auth/
│   │   │   ├── LoginPage.tsx
│   │   │   ├── RegisterPage.tsx
│   │   │   ├── ForgotPasswordPage.tsx
│   │   │   └── ResetPasswordPage.tsx
│   │   ├── clients/
│   │   │   ├── ClientListPage.tsx
│   │   │   ├── ClientCreatePage.tsx
│   │   │   ├── ClientDetailPage.tsx
│   │   │   └── ClientEditPage.tsx
│   │   ├── proposals/
│   │   │   ├── ProposalListPage.tsx
│   │   │   ├── ProposalCreatePage.tsx
│   │   │   ├── ProposalDetailPage.tsx
│   │   │   ├── ProposalEditPage.tsx
│   │   │   └── PublicProposalPage.tsx
│   │   ├── projects/
│   │   │   ├── ProjectListPage.tsx
│   │   │   ├── ProjectCreatePage.tsx
│   │   │   ├── ProjectDetailPage.tsx
│   │   │   └── ProjectEditPage.tsx
│   │   └── dashboard/
│   │       ├── DashboardPage.tsx
│   │       └── SettingsPage.tsx
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   ├── useClients.ts
│   │   ├── useProposals.ts
│   │   └── useProjects.ts
│   ├── services/
│   │   ├── api.ts                 # Axios instance + interceptors
│   │   ├── authService.ts
│   │   ├── clientService.ts
│   │   ├── proposalService.ts
│   │   ├── projectService.ts
│   │   └── dashboardService.ts
│   ├── context/
│   │   └── AuthContext.tsx
│   └── types/
│       ├── user.ts
│       ├── client.ts
│       ├── proposal.ts
│       ├── project.ts
│       └── dashboard.ts
├── package.json
├── tailwind.config.ts
├── tsconfig.json
├── vite.config.ts
├── Dockerfile
└── index.html
```

### Infrastructure (4 files)
```
├── docker-compose.yml
├── .env.example
├── .gitignore
└── .github/workflows/ci.yml
```

---

## ENVIRONMENT VARIABLES

```env
# Database
DATABASE_URL=postgresql://designbid:password@localhost:5432/designbid

# Auth
SECRET_KEY=your-secret-key-change-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7

# Email (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
FROM_EMAIL=noreply@designbid.com

# File Uploads
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=10485760

# App
APP_URL=http://localhost:5173
API_URL=http://localhost:8000

# Frontend
VITE_API_URL=http://localhost:8000
```

---

## AGENT ASSIGNMENTS

| Agent | Phase | Responsibilities |
|-------|-------|------------------|
| DATABASE-AGENT | 1 | All SQLAlchemy models, Alembic setup, initial migration |
| BACKEND-AGENT | 1, 2 | App skeleton, config, all routers, services, schemas |
| FRONTEND-AGENT | 1, 2 | Vite setup, all pages, components, hooks, services |
| DEVOPS-AGENT | 1, 3 | Docker, CI/CD, env files, health checks |
| TEST-AGENT | 3 | All backend tests, frontend tests, 80%+ coverage |
| REVIEW-AGENT | 3 | Security audit, code quality, performance review |

---

## NEXT STEP

Execute with parallel agents:
```bash
/execute-prp PRPs/designbid-prp.md
```
