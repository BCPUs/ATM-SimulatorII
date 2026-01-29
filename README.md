# ATM-SimulatorII

**ATM Simulator** with Node.js, Express & MongoDB.  
Features user banking operations (withdrawal, deposit, balance check, PIN change), admin panel for user/transaction/config management, persistent admin login, real-time reports with CSV export, and secure access control. Educational project demonstrating full-stack development.

A full-stack ATM simulator built with Node.js, Express, MongoDB, and vanilla JavaScript.  
Simulates real banking operations for users and includes a secure admin panel for management.

## Project Structure
├── server.js
├── db.js
├── routes/
│   ├── usuarios.js
│   ├── cajero.js
│   ├── transacciones.js
│   └── configuracion.js
└── frontend/
├── cajero.html
└── admin/
├── admin-login.html
├── admin-dashboard.html
├── admin-usuarios.html
├── admin-transacciones.html
├── admin-configuracion.html
└── admin-reportes.html
## Features

  ### User Features
  - Secure login with 4-digit PIN
  - Withdrawal (predefined & custom amounts, commission for non-Pichincha banks)
  - Deposit to other accounts (max $5,000)
  - Balance inquiry (with optional commission)
  - PIN change (forced on first login)
  - Personal transaction report (PDF export)

  ### Admin Features
  - Separate admin login (default: 9999 / 2570)
  - Persistent session (no repeated logins)
  - User management: create, block/unblock accounts
  - Manual transaction registration
  - System configuration: limits, commissions, max attempts
  - Global reports: all transactions, filter by account, CSV export (visible rows only)

## Security
  - Admin-only access to management routes
  - Account lockout after failed login attempts
  - Normalized uppercase states ("ACTIVO", "BLOQUEADO", "OPERATIVO", "FUERA_SERVICIO")
  - No password exposure in API responses

## Tech Stack
  - **Backend**: Node.js + Express
  - **Database**: MongoDB (NoSQL)
  - **Frontend**: HTML5 + CSS3 + Vanilla JavaScript (no frameworks)
  - **API Communication**: Fetch API

## Installation

  1. Clone the repository:
     git clone https://github.com/yourusername/ATM-SimulatorII.git
  2. Install dependencies: npm install
  3. Configure MongoDB connection in db.js (or use .env): const uri = "mongodb://127.0.0.1:27017/atm_simulator";
  4. Start MongoDB (local)
  5. Run the server:node server.js
  6. Open in browser:
    User interface: http://localhost:3000/cajero.html
    Admin login: http://localhost:3000/admin/admin-login.html
      ## Default Credentials
      Test user (example): 1001 / 1234 (change PIN on first login)
      Admin: 9999 / 2570
