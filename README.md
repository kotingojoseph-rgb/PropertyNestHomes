# PropertyNestHomes

## Real Estate Marketplace — Web & Android Application

### Overview

PropertyNestHomes is a full-stack real-estate marketplace designed for property discovery, property management, user communication, promotions, and monetization.

The platform includes a responsive React web application, an Android application built with Capacitor, a Node.js/Express backend, PostgreSQL database integration, real-time communication, authentication and security features, and payment infrastructure.

### Technology Stack

**Frontend**

* React 19
* Vite 8
* React Router
* Tailwind CSS
* Socket.IO Client
* Capacitor 8
* AdMob integration

**Backend**

* Node.js
* Express 5
* PostgreSQL
* JWT authentication
* bcrypt password security
* Socket.IO
* WebRTC communication support
* Nodemailer
* Cloudinary
* Multer
* Helmet
* Express rate limiting

**Payments**

* Paystack integration
* Property promotion payments
* Payment references
* Paystack webhook handling
* Wallet and withdrawal infrastructure

### Core Features

#### Property Marketplace

* Browse property listings
* Property search
* Property details
* Property categories
* Property images
* Location information
* Featured properties
* Property verification
* Property registration identifiers
* Property ownership association

#### User Accounts

* Registration
* Login
* Protected routes
* JWT authentication
* Password reset
* Two-factor authentication
* User dashboard
* Favorites

#### Property Management

* Create properties
* Edit properties
* Manage listings
* View property statistics
* Property-owner dashboard
* Property verification workflow

#### Communication

* Real-time chat
* Message lists
* Typing indicators
* Socket.IO real-time infrastructure
* Video-call functionality
* Camera and microphone support

#### Monetization

* Paystack payment integration
* Featured promotion
* Premium promotion
* Business promotion
* Wallet infrastructure
* Withdrawal functionality
* AdMob integration

#### Administration

* Administrative functionality
* Property verification
* User/property management
* Payment-related administration
* Promotion management

### Android Application

**Application ID**

`com.propertynesthomes.app`

The Android application is built with Capacitor 8.

The current release build includes:

* Internet permission
* Camera permission
* Microphone permission
* AdMob integration
* Capacitor Android runtime
* Web application integration
* WebRTC-based communication support

A signed Android App Bundle has been successfully generated.

**Current AAB size:** approximately 6.7 MB.

### Production Infrastructure

The backend is deployed on Render.

**Production API**

https://api.propertynesthomes.com

The production API has been successfully tested and returns a running production status.

The application repository is hosted on GitHub.

### Payment Integration Status

Paystack payment initialization has been successfully connected to the production backend.

The promotion payment endpoint has successfully generated Paystack checkout authorization URLs.

The Paystack webhook endpoint also validates Paystack signatures.

The merchant's final live payment/settlement capability remains dependent on Paystack completing its business activation and review process.

The buyer should therefore treat Paystack merchant activation as a third-party account/verification dependency rather than as a guaranteed completed business approval.

### Security

The project includes:

* JWT authentication
* bcrypt password hashing
* Two-factor authentication
* Password-reset functionality
* Helmet security headers
* CORS configuration
* API rate limiting
* Protected routes
* Paystack webhook signature validation
* Environment-variable configuration

Production credentials are not included in the Git repository.

### Database

The backend includes PostgreSQL database configuration and migration files covering:

* Chat functionality
* User profiles
* Calls
* User presence
* Password resets
* Wallet withdrawals
* Payment reference safety
* Two-factor authentication

### Deployment

The project has been deployed successfully to Render.

The Git repository is clean and currently contains 172 tracked files.

Development dependencies such as `node_modules`, build output, and Gradle build directories are not tracked by Git.

### What the Buyer Receives

The sale package can include:

1. PropertyNestHomes source code
2. React frontend
3. Node.js/Express backend
4. PostgreSQL schema and migrations
5. Android project
6. Signed Android release build
7. Deployment configuration
8. Payment integration code
9. Authentication and security implementation
10. Chat and video-call implementation
11. Property management functionality
12. Wallet/withdrawal infrastructure
13. Documentation and setup instructions

### Important Transfer Items

Credentials should be transferred securely or replaced during ownership transfer rather than included publicly in the source repository.

Examples include:

* Render credentials
* PostgreSQL credentials
* Paystack credentials
* Cloudinary credentials
* Email credentials
* JWT secrets
* Android signing credentials

### Current External Dependencies

The buyer should be aware that certain services require their own accounts and verification:

* Paystack merchant activation
* Render hosting
* PostgreSQL hosting
* Cloudinary
* Email provider
* Google Play Developer account
* AdMob

### Current Development Status

PropertyNestHomes has progressed beyond a basic prototype and contains a substantial full-stack marketplace implementation.

The core platform, production backend, Android build, authentication, property management, real-time communication, monetization infrastructure, and deployment infrastructure are implemented.

Remaining work primarily concerns final production verification, third-party account activation, store publication, and ownership/deployment handover.

### Suggested Buyer Positioning

PropertyNestHomes can be positioned as:

> A ready-built real-estate marketplace platform with web and Android applications, property management, authentication, real-time chat, video communication, promotions, payment infrastructure, wallet functionality, administrative tools, and production deployment infrastructure.

The platform can be further customized for a real-estate company, property agency, marketplace operator, or SaaS business.
