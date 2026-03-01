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
<strong>EcompLiy</strong> is a modern full-stack e-commerce platform built with a scalable architecture.
</p>

<ul>
  <li><b>Backend:</b> NestJS + PostgreSQL</li>
  <li><b>Frontend:</b> React 19 + Vite 7</li>
  <li><b>ORM:</b> Prisma with PostgreSQL adapter</li>
</ul>

<hr/>

<h2>📁 Project Structure</h2>

<pre>
/backend
/frontend
package.json (root)
</pre>

<p>
Monorepo-style setup with <coMonorepo-style setup with <coMonorepo-style setup wite>nMonorepo-style se
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
  <li>👤 User</li>
  <li>📦 Product</li>
  <li>🗂️ Category</li>
  <li>🛒 Cart</li>
  <li>🛒 CartItem</li>
  <li>📦 Order</li>
  <li>📦 OrderItem</li>
  <li>💳 Payment</li>
</ul>

<p>
✅ Initial migration applied successfully.✅ Initial migration applied successfully.✅ Initii>Register endpoint: <code>POST /api/v1/auth/register</code></li✅ <li>Access token: 15 minutes expiry</l✅ Initial migration applied successfully.✅ Initial migration applied successfully.✅ Initii>Regi<li>JWT Strategy configured (access + refresh)</li>
                           lemente                           lemente               t<                           lemente              3.1</li>
  <li>Default template stage (no custom UI yet)</li>
</ul>

<hr/>

<h2>📊 Curre<h2>📊 Curre<h2>📊 Curre<h2>📊 Curre<h2>📊 Cu
                                            ataba                                     td>
  </tr>
  <tr>
    <td>Prisma Setup</td>
    <td>✅ Configured & Migr    <td>✅ Configured >
    <t    <t    <t    <t d>
    <td>✅ Basic Struc    <td>✅ Basic Struc   <tr>
    <td>JWT Authentication</td>
    <td>🟡 Partial (Register + Refresh Strategy Ready)</t    <td>🟡 Partia   <td>API Endpoints</td>
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
    <td>❌ Not Implemented    <td>❌ Not Implemented    <td>❌ Not Implemented    <td>❌ Not Implemented    <td>❌ Not Implemented    <td>❌ Not Implemented    <go    <td>❌ Not Implemented    <tAPIs</li>
  <li>🗂️ Category M  <li>🗂️ Category M  <li>🗂️ Category M  <li>🗂️ Cateeckout Flow</li>
  <li>💳 Payment Integration</li>
  <li>🎨 Custom Frontend UI</li>
</ul>

<hr/>

<p align="center">
  <b>🟢 Foundation Complete | 🟡 Core Features In Progress | 🔴 Business Logic Pending</b>
</p>
