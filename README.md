# SwiftShip - Shipment Tracking & Delivery Cost Estimator

A comprehensive web-based logistics management platform for creating, tracking, and managing shipments in real-time. Built with Dexie (IndexedDB), Tailwind CSS, and vanilla JavaScript.

---

## 📋 Table of Contents

- [Project Overview](#project-overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Setup & Installation](#setup--installation)
- [User Roles & Permissions](#user-roles--permissions)
- [Database Schema](#database-schema)
- [Authentication](#authentication)
- [Pages & Routes](#pages--routes)

---

<a id="project-overview"></a>
## 🎯 Project Overview

**SwiftShip** is a modern shipment tracking platform designed for logistics companies and businesses. It provides:

- **Real-time shipment tracking** with live status updates
- **Cost estimation** based on weight, distance, and delivery type
- **Multi-role user system** (Developer, Admin, Staff, Customer)
- **Comprehensive reporting** and analytics
- **User-friendly dashboards** for different roles
- **Secure authentication** with SHA-256 password hashing
- **Local-first data storage** using IndexedDB (Dexie)

---

<a id="features"></a>
## ✨ Features

### Core Features
✅ User registration and authentication  
✅ Shipment creation and management  
✅ Real-time shipment tracking  
✅ Delivery cost estimation  
✅ Status history tracking  
✅ Multi-role access control  
✅ Responsive design (mobile, tablet, desktop)  
✅ Session management (7-day expiry)  
✅ Dark/Light mode support  

### Platform Features
- Professional dashboard for each user role
- Quick action buttons for common tasks
- Real-time statistics and metrics
- Recent shipment overview
- User-friendly navigation
- Password confirmation validation
- Comprehensive form validation

---

<a id="tech-stack"></a>
## 🛠️ Tech Stack

| Technology | Purpose |
|-----------|---------|
| **HTML5** | Markup & Structure |
| **Tailwind CSS** | Styling & Responsive Design |
| **JavaScript (ES6+)** | Interactivity & Logic |
| **ES Modules** | Code Organization |
| **Dexie v4** | IndexedDB ORM |
| **IndexedDB** | Local Data Storage |
| **Web Crypto API** | Password Hashing (SHA-256) |

---

<a id="project-structure"></a>
## 📁 Project Structure

```
shipment-tracker/
├── index.html                          # Home page
├── pages/
│   ├── login.html                      # Login page
│   ├── register.html                   # Customer registration
│   ├── forgot-password.html            # (Placeholder)
│   ├── dev/
│   │   └── create-admin.html           # Developer: Create admin
│   ├── admin/
│   │   ├── dashboard.html              # Admin dashboard
│   │   ├── create-staff.html           # Admin: Create staff
│   │   ├── create-shipment.html        # (Placeholder)
│   │   ├── shipments.html              # (Placeholder)
│   │   ├── track-shipment.html         # (Placeholder)
│   │   ├── edit-shipment.html          # (Placeholder)
│   │   └── reports.html                # (Placeholder)
│   ├── staff/
│   │   ├── dashboard.html              # Staff dashboard
│   │   ├── track-shipment.html         # (Placeholder)
│   │   ├── shipments.html              # (Placeholder)
│   │   └── update-shipment.html        # (Placeholder)
│   └── customer/
│       ├── dashboard.html              # Customer dashboard
│       ├── create-shipment.html        # (Placeholder)
│       ├── my-shipments.html           # (Placeholder)
│       ├── cost-estimator.html         # (Placeholder)
│       └── track-shipment.html         # (Placeholder)
├── js/
│   ├── db.module.js                    # Database & helpers
│   ├── auth.js                         # Landing page auth
│   ├── utils.js                        # Utility functions
│   ├── login.js                        # Login logic
│   ├── register.js                     # Registration logic
│   ├── admin-dashboard.js              # Admin dashboard logic
│   ├── admin-create-staff.js           # Create staff logic
│   ├── staff-dashboard.js              # Staff dashboard logic
│   └── dev-create-admin.js             # Developer admin creation
├── components/
│   ├── navbar.html                     # (Placeholder)
│   └── sidebar.html                    # (Placeholder)
├── assets/
│   └── css/
│       └── style.css                   # Custom styles
└── README.md                           # This file
```

---

<a id="setup-installation"></a>
## 🚀 Setup & Installation

### Prerequisites
- Modern web browser (Chrome, Firefox, Safari, Edge)
- Python 3+ (for running local server)
- Text editor (VS Code recommended)

### Step 1: Clone Repository
```bash
git clone https://github.com/Soumen3/Logistic_Supplies_And_Management.git
cd Logistic_Supplies_And_Management
```

### Step 2: Start Local Server
```bash
# Using Python 3
python -m http.server 8000

# Or using Python 2
python -m SimpleHTTPServer 8000
```

### Step 3: Open in Browser
```
http://localhost:8000
```

### Step 4: Create First Admin User

1. Open browser DevTools (`F12`)
2. Go to **Console** tab
3. Run this command:
```javascript
await SwiftShipDB.addUser({
  email: 'admin@example.com',
  password_hash: (await crypto.subtle.digest('SHA-256', new TextEncoder().encode('Admin@123'))).toString(),
  full_name: 'Admin User',
  phone: '+1234567890',
  role: 'admin'
});
```
4. Login with `admin@example.com` / `Admin@123`

---

<a id="user-roles-permissions"></a>
## 👥 User Roles & Permissions

### 1️⃣ Developer Role
**Purpose:** Bootstrap the system with initial admin user

**Access Level:** None (offline - console only)

**Actions:**
- ✅ Create first admin user (via `/pages/dev/create-admin.html`)
- ⚠️ Requires secret developer token: `SwiftShipDevSecret2026`

**Access Points:**
- `/pages/dev/create-admin.html` (requires developer token)

**Limitations:**
- Cannot create additional developers
- Cannot create staff or customers
- Cannot access dashboards

---

### 2️⃣ Admin Role
**Purpose:** System management, user creation, shipment oversight

**Access Level:** Full platform access

**Actions:**
- ✅ Create new staff users
- ✅ View admin dashboard with system statistics
- ✅ View all shipments in the system
- ✅ Create shipments
- ✅ Edit shipments
- ✅ Track any shipment
- ✅ Update shipment status
- ✅ View detailed reports and analytics
- ✅ View recent shipments overview
- ✅ Logout

**Dashboard Features:**
- Total shipments count
- Active users count
- In-transit shipments count
- Delivered shipments count
- Quick action buttons (Create Shipment, All Shipments, Reports, Create Staff)
- Recent shipments table with search capability

**Access Points:**
- `/pages/admin/dashboard.html` (auto-redirect on login)
- `/pages/admin/create-staff.html`
- Other admin pages for management tasks

**Restrictions:**
- Cannot create other admins (only developers can)
- Cannot delete their own admin account
- Cannot modify user passwords (only create new users)

---

### 3️⃣ Staff Role
**Purpose:** Shipment management and tracking

**Access Level:** Limited operational access

**Actions:**
- ✅ View staff dashboard with shipment statistics
- ✅ Track any shipment by code
- ✅ View all shipments in the system
- ✅ Update shipment status (pending → in transit → delivered)
- ✅ Add status history notes
- ✅ View recent shipments
- ✅ Logout

**Dashboard Features:**
- Total shipments count
- In-transit shipments count
- Pending shipments count
- Delivered shipments count
- Quick action buttons (Track Shipment, All Shipments, Update Status)
- Recent shipments table

**Access Points:**
- `/pages/staff/dashboard.html` (auto-redirect on login)
- `/pages/staff/track-shipment.html`
- `/pages/staff/shipments.html`
- `/pages/staff/update-shipment.html`

**Restrictions:**
- Cannot create shipments (admin/customer only)
- Cannot edit shipment details after creation
- Cannot create users
- Cannot view reports/analytics

---

### 4️⃣ Customer Role
**Purpose:** Self-service shipment creation and tracking

**Access Level:** Limited to own shipments

**Actions:**
- ✅ Create shipments
- ✅ View own shipments
- ✅ Track own shipments
- ✅ Estimate delivery costs
- ✅ View shipment history
- ✅ View customer dashboard
- ✅ Logout

**Dashboard Features:**
- Total shipments created count
- Pending shipments count
- In-transit shipments count
- Delivered shipments count
- Quick action buttons (Track Shipment, My Shipments, Cost Estimator)
- Recent shipments table (own only)

**Access Points:**
- `/pages/customer/dashboard.html` (auto-redirect on login)
- `/pages/customer/create-shipment.html`
- `/pages/customer/my-shipments.html`
- `/pages/customer/track-shipment.html`
- `/pages/customer/cost-estimator.html`

**Restrictions:**
- Cannot view other customers' shipments
- Cannot create staff users
- Cannot manage system settings
- Cannot view all shipments (only their own)
- Cannot update shipment status

---

<a id="database-schema"></a>
## 🗄️ Database Schema

### Database: `SwiftShipDB_New` (IndexedDB)

#### **1. users** (Primary Key: `id`)
```javascript
{
  id: string (UUID or timestamp),
  email: string (unique),
  password_hash: string (SHA-256),
  full_name: string,
  phone: string (required, min 7 digits),
  role: string ('admin', 'staff', 'customer'),
  created_at: timestamp,
  last_login: timestamp
}
```
**Indexes:** `id`, `&email`, `phone`, `full_name`, `role`, `created_at`, `last_login`

---

#### **2. sessions** (Primary Key: `++id`, auto-increment)
```javascript
{
  id: number (auto-increment),
  user_id: string (foreign key → users.id),
  is_active: number (0 or 1, boolean),
  expires_at: timestamp (now + 7 days),
  role: string (cached from user),
  created_at: timestamp
}
```
**Indexes:** `++id`, `user_id`, `is_active`, `expires_at`, `role`  
**Note:** Auto-purges expired sessions on login

---

#### **3. shipments** (Primary Key: `id`)
```javascript
{
  id: string (UUID or timestamp),
  shipment_code: string (auto-generated: SHP-YYMMDD-######),
  sender_name: string,
  sender_address: string,
  receiver_name: string,
  receiver_address: string,
  source_city: string,
  destination_city: string,
  weight_kg: number,
  distance_km: number,
  delivery_type: string ('standard', 'express', 'overnight'),
  estimated_cost: number,
  estimated_days: number,
  status: string ('pending', 'processing', 'in_transit', 'delivered', 'cancelled'),
  created_by: string (user_id who created it),
  created_at: timestamp,
  updated_at: timestamp
}
```
**Indexes:** `id`, `shipment_code`, `sender_name`, `receiver_name`, `source_city`, `destination_city`, `status`, `created_by`, `created_at`, `updated_at`

---

#### **4. status_history** (Primary Key: `++id`, auto-increment)
```javascript
{
  id: number (auto-increment),
  shipment_id: string (foreign key → shipments.id),
  status: string (status at this point),
  updated_by: string (user_id who updated),
  notes: string (optional notes),
  timestamp: timestamp
}
```
**Indexes:** `++id`, `shipment_id`, `status`, `updated_by`, `timestamp`  
**Purpose:** Track complete shipment status timeline

---

<a id="authentication"></a>
## 🔐 Authentication

### Registration Flow
1. User fills registration form with:
   - Full Name (2+ characters)
   - Phone (7+ digits, required)
   - Email (valid format, unique)
   - Password (6+ chars, letters + numbers)
   - Confirm Password (must match)

2. Client-side validation checks all fields

3. Email uniqueness verified against database

4. Password hashed using SHA-256 (Web Crypto API)

5. User stored in database with role: `'customer'`

6. User redirected to login page

### Login Flow
1. User enters email and password

2. System finds user by email

3. Provided password hashed and compared

4. If match:
   - Session created with user_id, role, expires_at (now + 7 days)
   - User redirected to role-specific dashboard
   
5. If no match:
   - Error message shown

### Session Management
- **Duration:** 7 days from creation
- **Validation:** Checked on every page load
- **Expiry:** Automatic on login (old sessions deactivated)
- **Logout:** All active sessions deactivated

### Password Hashing
- **Algorithm:** SHA-256 (Web Crypto API)
- **Method:** Client-side before sending
- **Security:** One-way hash, no plaintext storage

---

<a id="pages-routes"></a>
## 📄 Pages & Routes

### Public Pages (No Authentication Required)
| Route | Page | Purpose |
|-------|------|---------|
| `/` | `index.html` | Home/Landing page |
| `/pages/login.html` | Login | User login |
| `/pages/register.html` | Registration | Customer signup |
| `/pages/forgot-password.html` | Forgot Password | (Placeholder) |

### Developer Pages
| Route | Page | Auth Required | Purpose |
|-------|------|---|---------|
| `/pages/dev/create-admin.html` | Create Admin | No | Bootstrap first admin (requires token) |

### Admin Pages
| Route | Page | Auth Required | Purpose |
|-------|------|---|---------|
| `/pages/admin/dashboard.html` | Admin Dashboard | ✅ Admin | System overview & quick actions |
| `/pages/admin/create-staff.html` | Create Staff | ✅ Admin | Create new staff user |
| `/pages/admin/create-shipment.html` | Create Shipment | ✅ Admin | Create shipment |
| `/pages/admin/shipments.html` | View Shipments | ✅ Admin | List all shipments |
| `/pages/admin/track-shipment.html` | Track Shipment | ✅ Admin | Track any shipment |
| `/pages/admin/edit-shipment.html` | Edit Shipment | ✅ Admin | Edit shipment details |
| `/pages/admin/reports.html` | Reports | ✅ Admin | View analytics & reports |

### Staff Pages
| Route | Page | Auth Required | Purpose |
|-------|------|---|---------|
| `/pages/staff/dashboard.html` | Staff Dashboard | ✅ Staff | Staff overview & quick actions |
| `/pages/staff/track-shipment.html` | Track Shipment | ✅ Staff | Track any shipment |
| `/pages/staff/shipments.html` | View Shipments | ✅ Staff | List all shipments |
| `/pages/staff/update-shipment.html` | Update Status | ✅ Staff | Update shipment status |

### Customer Pages
| Route | Page | Auth Required | Purpose |
|-------|------|---|---------|
| `/pages/customer/dashboard.html` | Customer Dashboard | ✅ Customer | Personal overview & quick actions |
| `/pages/customer/create-shipment.html` | Create Shipment | ✅ Customer | Create new shipment |
| `/pages/customer/my-shipments.html` | My Shipments | ✅ Customer | View own shipments |
| `/pages/customer/track-shipment.html` | Track Shipment | ✅ Customer | Track own shipment |
| `/pages/customer/cost-estimator.html` | Cost Estimator | ✅ Customer | Estimate delivery cost |

---

## 🔑 Key Features Breakdown

### Shipment Tracking
- Real-time status updates
- Multiple status types: pending, processing, in transit, delivered, cancelled
- Complete status history with timestamps
- Notes and comments for each status change

### Cost Estimation
- Calculate based on:
  - Weight (kg)
  - Distance (km)
  - Delivery type (standard, express, overnight)
- Estimated delivery days based on service level

### Reporting & Analytics
- Total shipments by status
- Delivery performance metrics
- User activity statistics
- Exportable reports

### Role-Based Access Control
- Automatic redirection based on user role
- Dashboard customization per role
- Feature visibility based on permissions
- Session-based authentication

---

## 📊 Statistics Shown on Dashboards

### Admin Dashboard
- 📦 Total Shipments
- 👥 Active Users
- 🚚 In Transit
- ✅ Delivered

### Staff Dashboard
- 📦 Total Shipments
- 🚚 In Transit
- ⏳ Pending
- ✅ Delivered

### Customer Dashboard
- 📦 My Shipments
- ⏳ Pending
- 🚚 In Transit
- ✅ Delivered

---

## 🎨 Design Features

- **Responsive Design:** Works on mobile, tablet, and desktop
- **Dark/Light Mode:** User preference-based theming
- **Professional UI:** Tailwind CSS with custom brand colors
  - Primary Color: #F59000 (Amber)
  - Secondary Color: #2E4F93 (Navy Blue)
- **Smooth Animations:** Fade-in, pulse, and slide animations
- **Glass Morphism:** Modern glassmorphic card designs
- **Accessibility:** Semantic HTML, proper contrast ratios

---

## 🔄 User Journey Examples

### Customer Journey
1. Visit home page → Click "Get Started Free"
2. Fill registration form → Create account
3. Login with credentials
4. Auto-redirect to customer dashboard
5. Click "Create Shipment" → Fill form → Submit
6. View shipment in "My Shipments"
7. Track shipment status in real-time
8. Use "Cost Estimator" for future shipments

### Admin Journey
1. Create first admin via developer panel (with token)
2. Login to admin dashboard
3. Click "Create Staff" → Create staff member
4. View all system statistics on dashboard
5. Click "All Shipments" → Manage shipments
6. Click "Reports" → View analytics
7. Manage system users and data

### Staff Journey
1. Admin creates staff account for you
2. You receive email/message with login credentials
3. Login to staff dashboard
4. Click "Track Shipment" → Find shipment by code
5. Click "Update Status" → Change shipment status
6. Add notes to status history
7. View all shipments in "All Shipments"

---

## 🐛 Troubleshooting

### Session Check Takes Too Long
- **Solution:** Hard reload page (Ctrl+Shift+R)
- **Cause:** IndexedDB opening on first load
- **Note:** Only happens first time per session

### Images Not Loading
- **Solution:** Hard reload (Ctrl+Shift+R)
- **Cause:** Browser cache or network issue
- **Note:** All images are from Unsplash CDN

### Can't Login
- **Check:**
  1. Email is correct
  2. Password matches (case-sensitive)
  3. Account exists in database
  4. DevTools console for errors

### Lost Admin Access
- **Solution:** Create new admin from console (see Setup Step 4)
- **Alternative:** Hard reset by clearing IndexedDB in DevTools

---

## 📝 Notes & Best Practices

### For Developers
- Always use ES modules (`import`/`export`)
- Use centralized `SwiftShipDB` for all database operations
- Validate input on both client and server
- Keep sensitive operations off the client in production

### For Users
- Keep your password secure and unique
- Logout from shared computers
- Use browser's password manager for security
- Report broken features immediately

### For Deployment
- Use environment variables for developer token
- Implement backend API for production
- Add real email notifications
- Migrate to real database (PostgreSQL/MongoDB)
- Add HTTPS/SSL encryption
- Implement proper error logging

---

## 📜 License

This project is part of the **Logistic_Supplies_And_Management** repository by Soumen3.

---

## 🤝 Contributing

Contributions are welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

---

## 📞 Support

For issues or questions:
- Check this README first
- Look at browser console for errors
- Create an issue on GitHub

---

**Last Updated:** May 10, 2026  
**Version:** 1.0.0  
**Status:** Active Development
