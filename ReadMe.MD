<h1 align="center">🛍️ EcompLiy</h1>

<h3 align="center">Full-Stack E-Commerce Platform</h3>

<p align=\"center\">
  <b>Project Progress Summary</b><br/>
  📅 <b>Last Updated:</b> Oct 2026<br/>
  ⏱️ <b>Timestamp:</b> `date`<br/>
  Backend: ✅ 100% Complete | Frontend: 🟡 75% (Advanced UI)
</p>

<p align=\"center\">
  <img src=\"https://img.shields.io/badge/Backend-NestJS%2011-brightgreen\" />
  <img src=\"https://img.shields.io/badge/Frontend-React%2019-blue\" />
  <img src=\"https://img.shields.io/badge/UI-PrimeReact%2010-orange\" />
  <img src=\"https://img.shields.io/badge/Database-PostgreSQL%2017-blueviolet\" />
  <img src=\"https://img.shields.io/badge/ORM-Prisma%207-2D3748\" />
  <img src=\"https://img.shields.io/badge/Storage-MinIO%2FS3-yellow\" />
  <img src=\"https://img.shields.io/badge/Auth-JWT%20+%20Google-teal\" />
  <img src=\"https://img.shields.io/badge/Cache-Redis-red\" />
</p>

<hr/>

<h2>🚀 Project Overview</h2>

<p>
  <strong>EcompLiy</strong> is a production-ready full-stack e-commerce platform with complete backend APIs and advanced frontend UI. Monorepo with Docker orchestration.
</p>

**Backend:** NestJS 11 + Prisma 7 + PostgreSQL 17 + MinIO/S3 storage + Redis cache
**Frontend:** React 19 + Vite 7 + PrimeReact 10 + Zustand state + Axios auth
**Auth:** JWT (access/refresh) + Google OAuth
**Infra:** Docker Compose (prod/dev), Github Actions Docker publish

---

<h2>🗄️ Database Schema</h2>

<p>Comprehensive ER diagram:</p>

<p align=\"center\">
  <img src=\"./DB_Diagram.png\" alt=\"Database Schema\" width=\"100%\" />
</p>

**Models & Relations:**
| Model | Description |
|-------|-------------|
| 👤 **User** | Roles (USER/ADMIN), Google OAuth fields, refreshToken |
| 📦 **Product** | SKU, price, stock, images (1:N ProductImage) |
| 🗂️ **Category** | Slug SEO, products (1:N) |
| 🛒 **Cart** | Per user, items (1:N), orders/cart checkout |
| 📦 **Order** | Status flow, items (1:N), payment (1:1) |
| 💳 **Payment** | Status, Stripe-ready |

**Enums:** Role {USER,ADMIN}, OrderStatus {PENDING,PROCESSING,SHIPPED,DELIVERED,CANCELLED}, PaymentStatus {PENDING,COMPLETED,FAILED,REFUNDED}

---

<h2>📁 Project Structure</h2>

```
EcompLiy/
├── backend/           # NestJS API
│   ├── modules/       # Features: auth/users/products/categories/cart/orders/payments/storage/report
│   ├── prisma/        # Schema/migrations
│   └── Dockerfile
├── frontend/          # React app
│   ├── pages/         # Home/Products/Cart/Checkout/Orders/Admin*
│   ├── store/         # Zustand auth/cart
│   └── utils/api.js   # Auth interceptor
├── docker-compose.yml # Prod: Postgres/MinIO/Nginx
├── docker-compose.dev.yml # Dev hot-reload
└── ReadMe.MD
```

---

<h2>🔧 Backend APIs (/api/v1) - ✅ COMPLETE</h2>

**Core:** Global prefix `/api/v1`, Swagger docs, Guards (JWT/Roles/Throttle/Google), Redis cache, rate-limiting.

### Authentication
| Endpoint | Method | Guards | Description |
|----------|--------|--------|-------------|
| `/auth/register` | POST | - | Create user |
| `/auth/login` | POST | - | JWT login |
| `/auth/refresh` | POST | RefreshToken | New access token |
| `/auth/logout` | POST | JWT | Invalidate refresh |
| `/auth/google` | GET | GoogleGuard | OAuth init |
| `/auth/google/callback` | GET | GoogleGuard | Callback → frontend tokens |

**Tokens:** Access 15m, Refresh 7d (bcrypt hash), Google providerId.

### Products (Admin CRUD)
| Endpoint | Method | Guards | Description |
|----------|--------|--------|-------------|
| `/products` | POST | Admin | Create |
| `/products` | GET | - | Paginated/search/category/active |
| `/products/:id` | GET | - | Detail |
| `/products/:id` | PATCH | Admin | Update |
| `/products/:id/stock` | PATCH | Admin | Adjust stock |
| `/products/:id` | DELETE | Admin | Soft delete |

### Categories (Admin CRUD, Cached)
| Endpoint | Method | Guards | Description |
|----------|--------|--------|-------------|
| `/category` | POST | Admin | Create |
| `/category` | GET | - | Paginated (cached 60s) |
| `/category/:id` | GET | - | By ID |
| `/category/slug/:slug` | GET | - | SEO slug |

### Cart (User-only)
| Endpoint | Method | Guards | Description |
|----------|--------|--------|-------------|
| `/cart` | GET | User | Active cart |
| `/cart/items` | POST | User | Add item |
| `/cart/items/:id` | PATCH | User | Update qty |
| `/cart/items/:id` | DELETE | User | Remove |
| `/cart` | DELETE | User | Clear |
| `/cart/merge` | POST | User | Guest → user |

### Orders
| Endpoint | Method | Guards | Description |
|----------|--------|--------|-------------|
| `/orders` | POST | User | Create from cart |
| `/orders` | GET | User | Own paginated |
| `/orders/admin/all` | GET | Admin | All paginated |
| `/orders/:id` | GET/PATCH/DELETE | User/Admin | Own/Admin ops |

### Storage (Images)
| Endpoint | Method | Guards | Description |
|----------|--------|--------|-------------|
| `/storage/upload` | POST multipart | Admin | Image to MinIO (products/categories, 5MB, public URL) |

### Reports (Admin)
| Endpoint | Method | Guards | Description |
|----------|--------|--------|-------------|
| `/report/download` | GET | Admin | Excel orders (date/status filter) |
| `/report/run-report` | GET | Admin | Generate yesterday → email |

**Prisma:** Extended client, pg adapter, lifecycle hooks, dev cleanDb().

---

<h2>🎨 Frontend UI - 🟡 75% COMPLETE</h2>

**Tech:** React 19/Vite 7/PrimeReact 10 (Cards/Toasts/Paginator/Dropdown...), Zustand (auth/cart), Axios (JWT refresh auto), responsive/mobile.

**Pages & Features:**
| Page | Status | Key Features |
|------|--------|--------------|
| Home | ✅ | Hero, featured products paginated, categories carousel, add-to-cart |
| Products | ✅ | Grid/List view, search/filter/paginate/cat, stock tags, free delivery |
| ProductDetail | 🔄 | (Open in tabs) |
| Cart/Checkout | 🔄 | Zustand integration |
| Orders/OrderDetail | 🔄 | User history |
| Profile | 🔄 | Self mgmt |
| Auth (Login/Register/Callback) | ✅ | Google callback tokens |
| Admin Dashboard/Products/Categories/Orders/Users | ✅ | CRUD UIs (tabs open) |

**Components:** MobilePaginator, ProtectedRoute, SearchBar, UserMenu.
**Stores:** authStore, cartStore.
**API Utils:** Auto JWT/refresh/redirect.

---

<h2>🐳 Docker & Deployment</h2>

**Prod (`docker-compose.yml`):**
```bash
docker-compose up -d  # Backend(3000):5173 Frontend(Nginx):8080 DB:5433 MinIO:9000/9001
```
Services: Backend/Nginx-Frontend/Postgres/MinIO (auto bucket public).

**Dev (`docker-compose.dev.yml`):**
```bash
docker-compose -f docker-compose.dev.yml up  # Hot-reload Vite:5173 Nest:3000 DB:5433
```

**Local Dev:**
```bash
npm run dev  # Concurrent backend+frontend+MinIO
npx prisma migrate dev  # DB setup
```

---

<h2>📦 Scripts</h2>

```bash
npm install  # All deps
npm run dev  # Concurrent dev
cd backend && npm run start:dev
cd frontend && npm run dev
docker-compose up  # Prod stack
```

---

<h2>📊 Progress</h2>

| Feature | Status |
|---------|--------|
| Backend APIs (Full Flow) | ✅ |
| Auth (JWT+Google) | ✅ |
| Prisma/DB | ✅ |
| Products/Categories/Cart/Orders | ✅ |
| MinIO/S3 Storage | ✅ |
| Reports/Cron/Email | ✅ |
| Roles/Guards/Cache/Throttle | ✅ |
| Frontend Core Pages (Home/Products/Auth) | ✅ |
| Admin UI | ✅ |
| Zustand/API Utils | ✅ |
| Docker Prod/Dev | ✅ |
| Full Frontend Integration | 🔄 75% |
| Stripe Payments UI | 🔄 |
| E2E Tests/Deploy | 🔴 |

---

<h2>📝 Next Steps</h2>
- Integrate remaining frontend pages (Cart/Checkout/Profile)
- Stripe Elements UI + payments flow
- Full responsive testing
- E2E tests (Cypress/Playwright)
- Deploy: Railway backend + Vercel frontend
- CI/CD polish

---

<p align=\"center\">
  🟢 Backend Complete | 🟡 Frontend Advanced | 🚀 Production Ready
</p>

<p align=\"center\">
  Built with ❤️ using modern stack | Stars welcome! ⭐
</p>
