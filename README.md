# Inventra

Inventory, orders and invoicing for small businesses. A full-stack portfolio project — **Next.js 14** on **.NET 8** with **PostgreSQL**, fully Dockerised, tested, and CI-checked.

Built as a real product an actual KMU could use for their day-to-day: track SKUs, manage stock, take orders, ship them, invoice, and see how the month is going.

---

## Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 14 (App Router) · TypeScript · Tailwind CSS |
| Backend | ASP.NET Core 8 · Entity Framework Core 8 |
| Database | PostgreSQL 16 |
| Auth | JWT (Bearer) · BCrypt · role-based policies |
| Tests | xUnit + FluentAssertions (backend) · Next `build` + `tsc` (frontend) |
| Container | Docker · docker compose |
| CI | GitHub Actions (backend tests, frontend build, docker build) |

## Features

- **Products** — SKU, price, stock, reorder level, categories, active/inactive.
- **Stock adjustments** — one-off deltas with negative-stock protection.
- **Categories** — grouped catalog with per-category product count.
- **Customers** — company + contact fields with search.
- **Orders** — draft → confirmed → shipped, cancel with automatic stock refund. Price snapshots on lines so historical orders stay correct even when prices change.
- **Invoices** — issue from a confirmed order, due-date tracking, mark paid / overdue.
- **Dashboard** — active products, low-stock count, orders today/this month, monthly revenue, outstanding amount, top products, revenue-by-day bars.
- **Auth & roles** — three roles (`Admin` / `Manager` / `Staff`) enforced by ASP.NET Core authorization policies and mirrored in the UI.
- **Design** — monochrome, tight, tabular. Deliberately restrained. Dense tables, one accent colour, real type hierarchy.

## Roles

| Role | Can do |
|------|--------|
| `Admin` | Everything, including creating users and deleting products/customers/categories. |
| `Manager` | Create/edit products, categories, customers. Create orders, confirm, ship, cancel. Issue and settle invoices. |
| `Staff` | Read the catalog and create draft orders. |

Seed accounts (password shown for local dev only):

- `admin@inventra.local` / `Admin!23`
- `manager@inventra.local` / `Manager!23`
- `staff@inventra.local` / `Staff!23`

---

## Quickstart with Docker

```bash
git clone https://github.com/Ni7i/inventra.git
cd inventra
docker compose up --build
```

Then open:

- Web UI — <http://localhost:3000>
- API + Swagger — <http://localhost:5080/swagger>
- Postgres — `localhost:5432` (`inventra` / `inventra` / `inventra`)

The API applies EF Core migrations and seeds demo data on first boot.

## Run it locally (without Docker)

### Prerequisites

- .NET SDK 8
- Node 20
- PostgreSQL 16 running on `localhost:5432` with a database named `inventra`

### Backend

```bash
cd backend
dotnet restore
dotnet ef database update --project src/Inventra.Api
dotnet run --project src/Inventra.Api
```

API is on `http://localhost:5080`.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Web app is on `http://localhost:3000`. In dev mode all `/api/*` calls are rewritten to the backend via `next.config.mjs`.

## Testing

```bash
# Backend
cd backend
dotnet test

# Frontend
cd frontend
npm run typecheck
npm run build
```

Backend has 11 tests covering the password hasher, product CRUD/validation, and the full order lifecycle (draft → confirm → cancel, including stock reduction and refund on cancel).

---

## Project structure

```
inventra/
├── backend/
│   ├── src/Inventra.Api/       # Web API, EF Core, JWT, controllers
│   │   ├── Auth/               # JWT, BCrypt, roles + policies
│   │   ├── Controllers/        # Auth, Products, Categories, Customers, Orders, Invoices, Stats
│   │   ├── Data/               # DbContext, seeder
│   │   ├── Domain/             # Entities
│   │   ├── Dtos/
│   │   ├── Middleware/         # ExceptionHandlingMiddleware + typed exceptions
│   │   ├── Migrations/         # EF Core migrations
│   │   └── Services/           # ProductService, OrderService, InvoiceService, StatsService
│   └── tests/Inventra.Api.Tests/
├── frontend/
│   └── src/
│       ├── app/
│       │   ├── login/
│       │   └── (app)/          # Authenticated layout with sidebar + topbar
│       │       ├── dashboard/
│       │       ├── products/
│       │       ├── categories/
│       │       ├── customers/
│       │       ├── orders/
│       │       ├── invoices/
│       │       └── users/
│       ├── components/         # Sidebar, Topbar, UI primitives
│       └── lib/                # API client, auth session, formatters
├── .github/workflows/ci.yml
├── docker-compose.yml
└── .env.example
```

## Configuration

Everything in `backend/src/Inventra.Api/appsettings.json` can be overridden by environment variables using the standard `Section__Key` convention. The compose file already does this for the DB connection string and the JWT signing key. See `.env.example` for the surface.

## API

Selected endpoints — all under `/api`:

| Method | Route | Auth |
|--------|-------|------|
| `POST` | `/auth/login` | anonymous |
| `GET` | `/auth/me` | any |
| `POST` | `/auth/register` | Admin |
| `GET/POST/PUT/DELETE` | `/products` | mixed (see below) |
| `POST` | `/products/{id}/adjust-stock` | Manager+ |
| `GET/POST/PUT/DELETE` | `/categories` · `/customers` | mixed |
| `GET/POST` | `/orders` | any |
| `POST` | `/orders/{id}/confirm` · `/ship` · `/cancel` | Manager+ |
| `POST` | `/invoices` · `/invoices/{id}/mark-paid` · `/mark-overdue` | Manager+ |
| `GET` | `/stats/dashboard` · `/stats/low-stock` | any |

Full Swagger UI at `/swagger` in Development.

## License

MIT — see [LICENSE](LICENSE).
