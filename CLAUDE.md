# CLAUDE.md - DesignBid Project Rules

> Project-specific rules for Claude Code. This file is read automatically.

---

## Project Overview

**Project Name:** DesignBid
**Description:** Proposal management platform for freelance designers and creative small businesses
**Tech Stack:**
- Backend: FastAPI + Python 3.11+
- Frontend: React + Vite + TypeScript
- Database: PostgreSQL + SQLAlchemy
- Auth: Email/Password (JWT)
- UI: Tailwind CSS + shadcn/ui
- Payments: Razorpay (post-MVP)

---

## Project Structure

```
DesignBid/
├── backend/
│   ├── app/
│   │   ├── main.py
│   │   ├── config.py
│   │   ├── database.py
│   │   ├── models/
│   │   │   ├── user.py
│   │   │   ├── client.py
│   │   │   ├── proposal.py
│   │   │   ├── project.py
│   │   │   └── payment.py
│   │   ├── schemas/
│   │   │   ├── user.py
│   │   │   ├── client.py
│   │   │   ├── proposal.py
│   │   │   └── project.py
│   │   ├── routers/
│   │   │   ├── auth.py
│   │   │   ├── clients.py
│   │   │   ├── proposals.py
│   │   │   ├── projects.py
│   │   │   └── dashboard.py
│   │   ├── services/
│   │   │   ├── auth.py
│   │   │   ├── client.py
│   │   │   ├── proposal.py
│   │   │   ├── project.py
│   │   │   ├── email.py
│   │   │   └── file_upload.py
│   │   └── auth/
│   │       ├── jwt.py
│   │       └── dependencies.py
│   ├── alembic/
│   ├── tests/
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── ui/          # shadcn/ui components
│   │   │   ├── layout/      # Header, Sidebar, Footer
│   │   │   ├── clients/
│   │   │   ├── proposals/
│   │   │   ├── projects/
│   │   │   └── dashboard/
│   │   ├── pages/
│   │   │   ├── auth/
│   │   │   ├── clients/
│   │   │   ├── proposals/
│   │   │   ├── projects/
│   │   │   └── dashboard/
│   │   ├── hooks/
│   │   ├── services/        # API client functions
│   │   ├── context/         # Auth context, theme
│   │   └── types/           # TypeScript interfaces
│   ├── package.json
│   └── tailwind.config.ts
├── .claude/
│   └── commands/
├── skills/
├── agents/
└── PRPs/
```

---

## Code Standards

### Python (Backend)
```python
# ALWAYS use type hints
def get_client(db: Session, client_id: int) -> Client:
    pass

# ALWAYS use async endpoints
@router.get("/clients/{id}")
async def get_client(id: int, db: Session = Depends(get_db)):
    pass

# Use logging, never print()
import logging
logger = logging.getLogger(__name__)
logger.info("Client created: %s", client.id)
```

### TypeScript (Frontend)
```typescript
// ALWAYS define interfaces for props and data
interface Proposal {
  id: number;
  title: string;
  clientId: number;
  status: ProposalStatus;
  totalAmount: number;
  lineItems: ProposalLineItem[];
}

// NO any types allowed
const fetchProposal = async (id: number): Promise<Proposal> => {
  // ...
};
```

---

## Forbidden Patterns

### Backend
- ❌ Never use `print()` — use `logging` module
- ❌ Never store passwords in plain text — use bcrypt
- ❌ Never hardcode secrets — use environment variables
- ❌ Never use `SELECT *` — specify columns
- ❌ Never skip input validation

### Frontend
- ❌ Never use `any` type
- ❌ Never leave `console.log` in production
- ❌ Never skip error handling in async operations
- ❌ Never use inline styles — use Tailwind CSS classes

---

## Module-Specific Rules

### Clients Module
- All clients must belong to a user (user_id foreign key)
- Client email must be unique per user
- Deleting a client soft-deletes (is_active = false), does not hard delete
- Lifetime value is auto-calculated from accepted proposals

### Proposals Module
- All proposals must belong to a user and link to a client
- Status transitions: draft → sent → viewed → accepted/rejected/expired
- Cannot edit a proposal after it's been sent (create a new version instead)
- Public token must be a secure random UUID
- Line items must have positive quantities and prices
- Total = sum of line item totals + tax

### Projects Module
- Projects can be created standalone or auto-created from accepted proposals
- Status transitions: active → completed/on_hold/cancelled
- Budget must be >= 0
- Spent amount cannot exceed budget (warn, don't block)

---

## API Conventions

- All endpoints prefixed with `/api/v1/`
- Use plural nouns for resources: `/clients`, `/proposals`, `/projects`
- Return appropriate HTTP status codes:
  - 200: Success
  - 201: Created
  - 400: Bad Request
  - 401: Unauthorized
  - 403: Forbidden
  - 404: Not Found
  - 409: Conflict
  - 422: Validation Error

---

## Authentication

### JWT Configuration
- Access token expires: 30 minutes
- Refresh token expires: 7 days
- Algorithm: HS256
- All protected endpoints use `Depends(get_current_user)`

### Password Requirements
- Minimum 8 characters
- Must contain uppercase, lowercase, and a number
- Hashed with bcrypt

---

## Environment Variables

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/designbid

# Auth
SECRET_KEY=your-secret-key-change-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
FROM_EMAIL=noreply@designbid.com

# File Uploads
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=10485760

# Razorpay (post-MVP)
RAZORPAY_KEY_ID=rzp_test_...
RAZORPAY_KEY_SECRET=your-secret

# Frontend
VITE_API_URL=http://localhost:8000
```

---

## Development Commands

```bash
# Backend
cd backend
pip install -r requirements.txt
alembic upgrade head
uvicorn app.main:app --reload

# Frontend
cd frontend
npm install
npm run dev

# Docker
docker-compose up -d

# Tests
pytest backend/tests -v
cd frontend && npm test

# Linting
ruff check backend/
cd frontend && npm run lint
```

---

## Commit Message Format

```
feat(proposals): add line item calculation
fix(clients): fix search filter query
refactor(auth): extract JWT utility functions
test(projects): add status transition tests
docs: update API documentation
```

---

## Workflow

```
1. Edit INITIAL.md (define product)
2. /generate-prp INITIAL.md
3. /execute-prp PRPs/designbid-prp.md
```

---

## Skills Reference

| Task | Skill to Read |
|------|---------------|
| Database models | skills/DATABASE.md |
| API + Auth | skills/BACKEND.md |
| React + UI | skills/FRONTEND.md |
| Testing | skills/TESTING.md |
| Deployment | skills/DEPLOYMENT.md |

---

## Agents

| Agent | Role |
|-------|------|
| DATABASE-AGENT | Models + migrations |
| BACKEND-AGENT | API + auth |
| FRONTEND-AGENT | UI + pages |
| DEVOPS-AGENT | Docker + CI/CD |

---

## Validation

```bash
ruff check backend/ && pytest
npm run lint && npm run type-check
docker-compose build
```
