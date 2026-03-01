<h1 align="center">🛍️ EcompLiy</h1>

<h3 align="center">Full-Stack E-Commerce Platform</h3>

<p align="center">
  <b>Project Progress Summary</b><br/>
  📅 <b>Last Updated:</b> February 28, 2026<br/>
  ⏱️ <b>Timestamp:</b> 2026-02-28T10:30:00Z
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Backend-NestJS-red" />
  <img src="https://img.shields.io/badge/Frontend-React-blue" />
  <img src="https://img.shields.io/badge/Database-PostgreSQL-blueviolet" />
  <img src="https://img.shields.io/badge/ORM-Prisma-2D3748" />
  <img src="https://img.shields.io/badge/Status-In%20Progress-yellow" />
</p>

<hr/>

<h2>🚀 Project Overview</h2>

<p>
  <strong>EcompLiy</strong> is a modern full-stack e-commerce platform built with a scalable architecture. The project uses a monorepo-style setup with separate backend and frontend applications.
</p>

<ul>
  <li><b>Backend:</b> NestJS + PostgreSQL</li>
  <li><b>Frontend:</b> React 19 + Vite 7</li>
  <li><b>ORM:</b> Prisma with PostgreSQL adapter</li>
  <li><b>Authentication:</b> JWT (Access + Refresh tokens)</li>
</ul>

<hr/>

<h2>📁 Project Structure</h2>

<pre>
/backend          # NestJS backend application
/frontend         # React frontend application
package.json      # Root package with concurrent dev scripts
</pre>

<p>
  Monorepo-style setup with concurrent execution for development.
</p>

<hr/>

<h2>🔧 Backend Development (NestJS)</h2>

<h3>Core Configuration</h3>
<ul>
  <li>Global API prefix: <code>/api/v1</code></li>
  <li>Environment-based port (default: 3000)</li>
  <li>Global error handling with Logger</li>
</ul>

<h3>🗄️ Prisma Setup</h3>

<ul>
  <li>Custom PrismaService extending PrismaClient</li>
  <li>Uses <code>@prisma/adapter-pg</code></li>
  <li>Lifecycle hooks implemented</li>
  <li>Development-only <code>cleanDatabase()</code> utility</li>
</ul>

<h3>Database Models</h3>

<ul>
  <li>👤 <b>User</b> - User accounts with roles (USER, ADMIN)</li>
  <li>📦 <b>Product</b> - Product catalog with SKU, pricing, stock</li>
  <li>🗂️ <b>Category</b> - Product categories with slug</li>
  <li>🛒 <b>Cart</b> - Shopping cart per user</li>
  <li>🛒 <b>CartItem</b> - Items in cart (unique per cart + product)</li>
  <li>📦 <b>Order</b> - Customer orders with status tracking</li>
  <li>📦 <b>OrderItem</b> - Individual items in an order</li>
  <li>💳 <b>Payment</b> - Payment records with transaction tracking</li>
</ul>

<h4>Order Status</h4>
<p>
  PENDING → PROCESSING → SHIPPED → DELIVERED | CANCELLED
</p>

<h4>Payment Status</h4>
<p>
  PENDING | COMPLETED | FAILED | REFUNDED
</p>

<h3>🔐 Authentication</h3>

<ul>
  <li>Register endpoint: <code>POST /api/v1/auth/register</code></li>
  <li>Login endpoint: <code>POST /api/v1/auth/login</code></li>
  <li>Access token: 15 minutes expiry</li>
  <li>Refresh token: 7 days expiry</li>
  <li>JWT Strategy configured (access + refresh)</li>
  <li>Password hashing with bcrypt</li>
</ul>

<h3>📦 Available Scripts</h3>

```bash
# Install dependencies
npm install

# Development (runs both frontend and backend)
npm run dev

# Backend only
cd backend
npm run start:dev

# Frontend only
cd frontend
npm run dev
```

<hr/>

<h2>🎨 Frontend (React + Vite)</h2>

<ul>
  <li>React 19 with Vite 7</li>
  <li>Default template stage (no custom UI yet)</li>
</ul>

<hr/>

<h2>📊 Current Progress</h2>

<table>
  <tr>
    <td><b>Feature</b></td>
    <td><b>Status</b></td>
  </tr>
  <tr>
    <td>Project Setup</td>
    <td>✅ Complete</td>
  </tr>
  <tr>
    <td>Database Schema</td>
    <td>✅ Complete</td>
  </tr>
  <tr>
    <td>Prisma Setup</td>
    <td>✅ Configured & Migrated</td>
  </tr>
  <tr>
    <td>Basic Structure</td>
    <td>✅ Complete</td>
  </tr>
  <tr>
    <td>JWT Authentication</td>
    <td>🟡 Partial (Register + Login + Refresh Strategy Ready)</td>
  </tr>
  <tr>
    <td>API Endpoints</td>
    <td>🟡 Partial (Auth Only)</td>
  </tr>
  <tr>
    <td>Frontend UI</td>
    <td>❌ Default Template Only</td>
  </tr>
  <tr>
    <td>Product/Order APIs</td>
    <td>❌ Not Implemented</td>
  </tr>
  <tr>
    <td>Cart Logic</td>
    <td>❌ Not Implemented</td>
  </tr>
  <tr>
    <td>Payment Integration</td>
    <td>❌ Not Implemented</td>
  </tr>
</table>

<hr/>

<h2>📝 Next Steps</h2>

<ul>
  <li>🔐 Complete Authentication (Login, Refresh Token endpoints)</li>
  <li>📦 Product Management APIs</li>
  <li>🗂️ Category Management APIs</li>
  <li>🛒 Cart Management APIs</li>
  <li>📦 Order Processing APIs</li>
  <li>💳 Payment Integration</li>
  <li>🎨 Custom Frontend UI</li>
</ul>

<hr/>

<p align="center">
  <b>🟢 Foundation Complete | 🟡 Core Features In Progress | 🔴 Business Logic Pending</b>
</p>

<hr/>

<p align="center">
  Built with ❤️ using NestJS, React, and Prisma
</p>
