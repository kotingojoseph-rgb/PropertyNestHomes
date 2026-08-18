# PropertyNestHomes — Technical Overview

## 1. Architecture

PropertyNestHomes is a full-stack real-estate marketplace consisting of:

- React/Vite frontend
- Node.js/Express backend
- PostgreSQL database
- Socket.IO realtime server
- Capacitor Android application
- Cloudinary media infrastructure
- Render deployment infrastructure

---

## 2. Frontend

Location:

frontend/

Technology:

- React
- Vite
- JavaScript
- CSS
- Capacitor
- Socket.IO client

Major frontend areas include:

- Home
- Property search
- Property details
- Buy
- Favorites
- Dashboard
- Add property
- Edit property
- Authentication
- Password recovery
- Chat
- Realtime communication
- Admin-related interfaces
- Advertising components
- Android application integration

Production build command:

npm run build

Latest verified result:

SUCCESSFUL

---

## 3. Backend

Location:

backend/

Technology:

- Node.js
- Express
- Socket.IO
- PostgreSQL
- JWT
- bcrypt
- Multer
- Cloudinary
- Nodemailer
- Resend
- Brevo
- Paystack integration
- Helmet
- CORS
- Express rate limiting

The backend provides REST API endpoints for authentication, properties, messaging, payments, promotions, advertising, administration, password recovery, two-factor authentication and other platform functionality.

---

## 4. Database

Production database:

PostgreSQL

Database provider:

Neon

Current database tables include:

- users
- properties
- property_images
- property_documents
- property_verification_logs
- bookings
- conversations
- messages
- calls
- user_presence
- password_resets
- payments
- advertisements
- property_promotions
- platform_wallet
- platform_wallet_transactions
- payout_accounts
- withdrawal_requests
- ad_revenue
- withdrawals
- admin_wallet

Current database snapshot:

- Users: 4
- Properties: 11
- Conversations: 8
- Messages: 25
- Payments: 1
- Property documents: 3
- Property images: 3

The public property API currently returns 10 verified properties.

---

## 5. Property Verification

The platform contains a property verification workflow.

Properties can have:

- Verification status
- Verification notes
- Verification timestamp
- Verifying administrator
- Property registration ID
- Verification history

The public property API currently exposes verified properties.

---

## 6. Authentication and Security

Implemented functionality includes:

- JWT authentication
- Password hashing
- Protected API routes
- Admin authorization
- Two-factor authentication
- Password reset functionality
- Rate limiting
- Helmet security middleware
- CORS configuration

Production credentials are stored separately in environment variables and are not intended to be included in the public source package.

---

## 7. Realtime Communication

Socket.IO provides realtime communication functionality including:

- Direct messaging
- Message delivery
- User presence
- Typing indicators
- Call signaling
- Voice-call infrastructure
- Video-call infrastructure

---

## 8. Media

The application supports media handling for property and communication features.

Cloudinary is used for cloud media storage.

Backend upload middleware handles media uploads.

---

## 9. Monetization Infrastructure

The platform contains infrastructure for multiple potential revenue streams:

### Property Promotions

Property owners can potentially pay to promote listings.

### Advertising

Advertisement infrastructure exists for displaying paid promotional content.

### Payments

Payment infrastructure exists for processing platform transactions.

### Wallet

Platform wallet and transaction infrastructure exists for tracking earnings.

### Withdrawals

Withdrawal request infrastructure exists for future payout workflows.

### Revenue Tracking

Ad revenue and platform transaction records can be tracked in the database.

---

## 10. Android Application

Application name:

PropertyNestHomes

Package ID:

com.propertynesthomes.app

Technology:

Capacitor

Web directory:

dist

Android project:

frontend/android/

The Android project is included in the source code and can be developed further for Google Play Store distribution.

---

## 11. Deployment

Frontend:

Render

Backend:

Render

Database:

Neon PostgreSQL

Media:

Cloudinary

Source control:

Git/GitHub

Production API:

https://propertynesthomes.onrender.com

The production API was tested and returned HTTP 200 for the public properties endpoint.

---

## 12. Source Code

Git repository:

https://github.com/kotingojoseph-rgb/PropertyNestHomes

The repository contains the frontend, backend, database migrations, Android project and application assets.

---

## 13. Production Verification

The following checks have been performed:

Frontend production build:

PASS

Backend JavaScript syntax check:

PASS

Socket.IO JavaScript syntax check:

PASS

Production properties API:

HTTP 200

Production API verified properties:

10

---

## 14. Acquisition Handover

A buyer can receive:

- Frontend source
- Backend source
- Database schema
- Database migrations
- Android project
- Application assets
- Deployment configuration
- Technical documentation

Production secrets should be transferred separately and securely after an acquisition agreement.

---

## 15. Expansion Opportunities

Potential future development includes:

- Agent subscription plans
- Featured property packages
- Developer accounts
- Property management subscriptions
- Advertising marketplace
- Transaction commissions
- Mortgage/financing partnerships
- Verification services
- Real-estate professional accounts
- Expansion across African markets
- Native Android/iOS refinement
- Larger property inventory
- Marketing and user acquisition

