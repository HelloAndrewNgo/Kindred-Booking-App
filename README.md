# Kindred Booking App

 Escape Room Reservation System app for managing escape room bookings with temporary holds, idempotency support, and comprehensive testing.

## 🚀 Features

- **Temporary Holds**: Reserve slots with configurable TTL before confirmation
- **Idempotent Operations**: Safe retry mechanisms for same booking operations
- **Concurrency Control**: Prevents double-booking with database constraints
- **Internal APIs**: Maintenance endpoints for system administration (soft deletes)
- **Comprehensive Testing**: Full test suite with Jest

## 📋 Prerequisites

- **Node.js** 18+ and npm
- **SQLite** (included with Node.js)
- **Git** for cloning the repository

## 🛠️ Installation & Setup

### 1. Clone and Install Dependencies

```bash
git clone <repository-url>
cd kindred-booking-app
npm ci
```

### 2. Environment Configuration

Create a `.env` file in the root directory:

```bash
# Database configuration
DATABASE_URL="file:./prisma/dev.db"

# Hold configuration (optional - defaults to 300 seconds)
HOLD_TTL_SECONDS=300

# Internal API security (optional)
INTERNAL_API_KEY="your-secret-key-here"

# Server configuration (optional - defaults to 3000)
PORT=3000
```

### 3. Database Setup

```bash
# Generate Prisma client
npm run prisma:generate

# Push schema to database
npm run prisma:push

# Seed with sample data
npm run seed
```

## 🚀 Running the Application

### Development Mode

```bash
# Start the server
npm start

# Or run directly
node index.js
```

The server will start on `http://localhost:3000` (or your configured PORT).

### Viewing Prisma Studio GUI
```bash
# Start Prisma studio server
npx prisma studio
```

The Prisma studio server will start on `http://localhost:5555`

### Database Management

```bash
# Reset database and re-seed
npm run reset

# Re-seed only
npm run seed
```

## 📚 API Documentation

### Base URL
```
http://localhost:3000
```

### Interactive API Docs
Visit `http://localhost:3000/docs` for Swagger UI documentation.

### Core Endpoints

https://.postman.co/workspace/My-Workspace~99773d94-a8e4-4de1-86bb-9e2f6be39631/collection/7642978-8211866b-ab54-4451-88b7-2b502950881a?action=share&creator=7642978

**Create a Hold**
```http
POST /holds
Content-Type: application/json

{
  "slot_id": 1
}
```

Response:
```json
{
  "id": 123,
  "hold_token": "uuid-here",
  "expires_at": "2025-01-15T14:05:00.000Z"
}
```

**Confirm a Hold (Create Booking)**
```http
POST /holds/123/confirm
x-hold-token: uuid-here
Idempotency-Key: unique-key-123
```

**Release a Hold**
```http
DELETE /holds/123
x-hold-token: uuid-here
```

## 🔧 Configuration Options

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `DATABASE_URL` | `file:./prisma/dev.db` | SQLite database file path |
| `HOLD_TTL_SECONDS` | `300` | Hold expiration time in seconds |
| `INTERNAL_API_KEY` | `undefined` | Secret key for internal API access |
| `PORT` | `3000` | Server port number |

## 🧪 Testing

### Test Structure

- **`tests/holds.test.js`**: Core booking flow tests
- **`tests/internal_cleanup.test.js`**: Internal API tests

### Running Tests

```bash
# Run all tests
npm test
```

## 🏗️ Architecture Overview

### Database Schema

- **Rooms**: Available escape rooms
- **Slots**: Time slots for each room
- **Holdings**: Temporary reservations with TTL
- **Bookings**: Confirmed reservations
- **IdempotencyKey**: Prevents duplicate operations

### Data Flow

```
1. User creates hold → Slot marked as "held"
2. Hold expires → Slot becomes "available"
3. User confirms hold → Booking created, hold released
4. Slot marked as "booked" → No more holds allowed
```

## 🔒 Security Considerations

- Internal APIs require `x-api-key` header
- Hold tokens are UUIDs for uniqueness 
- Database constraints prevent double-booking
- Environment-based configuration

## 📝 Development

### Code Structure

```
src/
├── models/          # Database models
├── routes/          # API endpoints
├── services/        # Business logic
├── middleware/      # Express middleware
├── utils/           # Utility functions
└── generated/       # Prisma client
```

### Key architecture decisions and trade-offs

• **Hold-Confirm Pattern**: Two-step booking process prevents double-booking while allowing users time to complete payment/confirmation
  - Trade-off: Increased complexity and high consistency vs. immediate booking and high availability

• **Database-level Concurrency Control**: Uses database transactions and constraints to prevent double-booking
  - Trade-off: Database performance which provides stronger consistency guarantees and atomic operations vs. application-level locking

• **TTL-based Expiration**: Holds automatically expire after configurable time (default: 5 minutes)
  - Trade-off: Memory/DB space usage with Holding table vs. automatic cleanup, with cron jobs or Redis eviction policies

• **Idempotency Support**: Optional idempotency keys prevent duplicate operations on retries
  - Trade-off: Additional storage overhead vs. safe retry mechanisms, but essential for production reliability

• **Soft Deletes**: Holdings are marked as released rather than physically deleted for auditability
  - Trade-off: Database growth vs. complete audit trail, but enables better debugging and compliance

• **SQLite Choice**: Lightweight database for development and testing
  - Trade-off: Limited concurrent users vs. simplicity and zero-config setup, but can be swapped for PostgreSQL/MySQL in production

• **Internal API Separation**: Separate endpoints for system administration with API key authentication
  - Trade-off: Additional complexity vs. secure maintenance operations, but enables safe system management and protected APIs

• **UUID-based Hold Tokens**: Cryptographically secure tokens for hold authentication
  - Trade-off: Token storage size vs. security, but prevents unauthorized hold manipulation

• **Environment-based Configuration**: TTL and security settings configurable via environment variables
  - Trade-off: Runtime flexibility vs. deployment complexity, but enables different configurations per environment

### Fast Follows

• **Database Cleanup Automation**: Implement cron jobs to permanently remove expired hold entries from the database
  - Currently using soft deletes for better auditability, but automated cleanup prevents database bloat
  - Consider retention policies for compliance vs. storage optimization (e.g. run clean up for hold entries older then 7 days)

• **Redis Integration**: Replace database-based holds with Redis for better TTL management
  - Automatic key expiration eliminates need for manual cleanup
  - Better performance for high-frequency hold operations
  - Requires Redis infrastructure but provides better scalability


### AI Tools
Assistance from Cursor for the following:

- Documentation
- Boilerplate
- Commenting
- Queries
- Error handling
- Tests

**Ready to start?** Run `npm ci && npm start` to get the server running!


# Kindred-Booking-App
