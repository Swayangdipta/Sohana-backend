# Hotel Booking Platform — Backend API

## Overview
A production-ready hotel booking and reservation platform backend, similar to MakeMyTrip/Booking.com.
This system provides full functionality for users to search hotels, view room availability, and make secured, concurrent bookings.

## Tech Stack
- **Runtime:** Node.js, Express.js
- **Database:** MySQL 8.0+ / MariaDB 10.5+
- **Authentication:** JSON Web Tokens (JWT), bcrypt for hashing
- **Notifications:** Nodemailer (SMTP)

## Project Structure
```
backend/
├── src/
│   ├── config/            # Database, app, and email configuration
│   ├── middleware/        # Express middlewares (auth, validation, errors)
│   ├── modules/           # Feature modules
│   │   ├── auth/          # User authentication and management
│   │   ├── hotels/        # Hotel search, details, and rooms
│   │   ├── locations/     # City and state management
│   │   ├── bookings/      # Booking creation, retrieval, and cancellation
│   │   └── notifications/ # Email notification service
│   ├── templates/         # HTML templates
│   │   └── emails/        # Notification email templates
│   ├── utils/             # Helper functions, constants, error classes
│   └── index.js           # App entry point
├── database/              # SQL scripts and migrations
├── .env.example           # Environment variables template
└── package.json           # Project dependencies
```

## Getting Started

### Prerequisites
- Node.js v16 or higher
- MySQL 8.0+ or MariaDB 10.5+
- SMTP email account (Gmail App Password recommended for development)

### Installation
1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Copy environment configuration:
   ```bash
   cp .env.example .env
   ```
   *Edit the `.env` file with your database and SMTP credentials.*
4. Create the database:
   ```sql
   CREATE DATABASE hotel;
   ```
5. Import base data (if you have the legacy dump):
   ```bash
   mysql -u root -p hotel < database/hotel.sql
   ```
6. Run migrations to initialize the new schema:
   ```bash
   npm run db:init
   ```
7. Start the server:
   ```bash
   npm run dev
   ```

### Environment Variables
| Variable | Description |
|----------|-------------|
| `PORT` | The port the Express server will run on (default: 3000) |
| `DB_HOST` | MySQL database host |
| `DB_USER` | MySQL database user |
| `DB_PASS` | MySQL database password |
| `DB_NAME` | MySQL database name |
| `JWT_SECRET` | Secret key for signing JSON Web Tokens |
| `JWT_EXPIRES_IN` | Token expiration time (e.g., '1d', '24h') |
| `SMTP_HOST` | SMTP server for emails (e.g., smtp.gmail.com) |
| `SMTP_PORT` | SMTP port (465 for secure, 587 for TLS) |
| `SMTP_USER` | Email account username |
| `SMTP_PASS` | Email account password or app password |
| `EMAIL_FROM` | Sender address for outgoing emails |

## Database Design

### Existing Tables (Hotel Data)
- `states`, `cities`, `locations` — Hierarchy of regions for searching
- `hotels`, `hotel_images` — Core hotel information and media
- `hotel_rooms` — Room types, capacities, and base pricing

### New Tables (Booking Platform)
- `users`, `email_verification_tokens`, `password_reset_tokens` — User management
- `hotel_amenities`, `hotel_policies`, `room_amenities`, `room_rate_plans` — Metadata
- `room_availability` — Daily inventory tracking (Crucial for preventing overbooking)
- `bookings`, `booking_items`, `booking_guests`, `booking_cancellations` — Transactional booking data

## API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| **Authentication APIs** | | | |
| POST | `/api/auth/register` | No | Register a new user account |
| POST | `/api/auth/login` | No | Login and receive JWT |
| GET | `/api/auth/verify-email` | No | Verify user's email with token |
| POST | `/api/auth/resend-verification` | No | Resend the verification email |
| POST | `/api/auth/forgot-password` | No | Request password reset link |
| POST | `/api/auth/reset-password` | No | Reset password using token |
| POST | `/api/auth/logout` | Yes | Invalidate session |
| **User APIs** | | | |
| GET | `/api/users/me` | Yes | Get current authenticated user profile |
| PATCH| `/api/users/me` | Yes | Update user profile |
| **Hotel APIs** | | | |
| GET | `/api/hotels` | No | Search hotels with filters and pagination |
| GET | `/api/hotels/:id` | No | Get detailed hotel information |
| GET | `/api/hotels/:id/rooms` | No | Get available rooms for a hotel |
| GET | `/api/hotels/:id/availability` | No | Check availability for specific dates |
| **Location APIs** | | | |
| GET | `/api/locations` | No | Get all standard locations |
| GET | `/api/locations/search` | No | Search locations by name |
| **Booking APIs** | | | |
| POST | `/api/bookings` | Yes | Create a new hotel booking |
| GET | `/api/bookings` | Yes | Get all past and present bookings for user |
| GET | `/api/bookings/:id` | Yes | Get detailed booking information |
| POST | `/api/bookings/:id/cancel`| Yes | Cancel an existing booking |

## Authentication Flow
`Register` ➔ `Email Sent` ➔ `Click Verify Link` ➔ `Account Active` ➔ `Login` ➔ `Receive JWT` ➔ `Access Protected APIs via Authorization: Bearer <token>`

## Booking Flow
`Search Location/Dates` ➔ `Select Hotel` ➔ `Check Room Availability` ➔ `Create Booking (Locks DB Rows)` ➔ `Confirmation Email Sent` ➔ `User Views Booking`

## Security Features
- **Concurrency Protection**: Uses `MySQL row-level locking (UPDATE WHERE available_rooms >= N)` to prevent double booking.
- **Transactional Integrity**: All bookings execute within strict MySQL transactions (Begin ➔ Update Inventory ➔ Create Booking ➔ Commit/Rollback).
- **Price Snapshots**: Room prices are deep-copied to `booking_items` to ensure historical accuracy even if base prices change.
- **Password Security**: Passwords are hashed using `bcrypt` (Salt Rounds: 10).
- **Input Validation**: `Joi` schemas validate all incoming request bodies and parameters.
- **Authentication**: JWT strategy restricts access, ensuring users can only interact with their own data.

## Future Enhancements
- **Payment Gateway Integration**: Add Razorpay/Stripe processing flow (replacing default 'Pay at Hotel').
- **WhatsApp OTP Verification**: Real-time SMS/WhatsApp login.
- **Admin Panel**: Dashboard for hotel managers to adjust inventory and prices.
- **Dynamic Pricing Engine**: Automatically adjust rates based on demand patterns.
- **Review and Ratings System**: Verified guest reviews post-stay.
