# 3D Print Request Portal

An internal web portal for managing 3D print requests with a clean, user-friendly interface. Built with Next.js, Material UI, and PostgreSQL.

## Features

- **Request Submission**: Easy form for submitting 3D print requests with part numbers, quantities, deadlines, and optional file uploads
- **Request Tracking**: View all submitted requests with filtering and status tracking
- **Admin Dashboard**: Manage requests, update statuses, and add notes
- **Email Notifications**: Automatic email confirmations and status updates
- **File Upload Support**: Optional upload of 3D model files (STL, OBJ, STEP, etc.)
- **Docker Deployment**: Containerized deployment with PostgreSQL

## Tech Stack

- **Frontend**: Next.js 14+, React, Material UI, TypeScript
- **Backend**: Next.js API Routes
- **Database**: PostgreSQL with Prisma ORM
- **File Storage**: Local filesystem (configurable)
- **Email**: Nodemailer
- **Deployment**: Docker & Docker Compose

## Quick Start

### Prerequisites

- Docker and Docker Compose
- Node.js 18+ (for local development)

### Setup with Docker (Recommended)

1. Clone the repository
2. Copy environment file and configure:
   ```bash
   cp .env.example .env
   ```
3. Update the `.env` file with your email settings and other configuration
4. Start the application:
   ```bash
   docker-compose up --build
   ```
5. Open [http://localhost:3000](http://localhost:3000) in your browser

The database will be automatically initialized and migrations will run on first startup.

### Local Development

1. Install dependencies:
   ```bash
   npm install
   ```

2. Set up PostgreSQL database (locally or with Docker):
   ```bash
   docker run --name postgres-printing -e POSTGRES_PASSWORD=password -e POSTGRES_DB=printingportal -p 5432:5432 -d postgres:15-alpine
   ```

3. Copy and configure environment:
   ```bash
   cp .env.example .env
   # Edit .env with your database URL and email settings
   ```

4. Generate Prisma client and run migrations:
   ```bash
   npx prisma generate
   npx prisma migrate dev
   ```

5. Start development server:
   ```bash
   npm run dev
   ```

## Environment Variables

Copy `.env.example` to `.env` and configure:

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/printingportal"

# Email Configuration
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"
SMTP_FROM="noreply@printingportal.com"

# File Upload Configuration
UPLOAD_DIR="./public/uploads"
MAX_FILE_SIZE=104857600

# Application
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

## Usage

### For Users (Submitting Requests)

1. Visit the home page and fill out the request form
2. Enter part number, quantity, optional description and deadline
3. Optionally upload a 3D model file
4. Submit the form - you'll receive a confirmation email
5. Track your requests at `/requests`

### For Admins (Managing Requests)

1. Visit `/admin` for the admin dashboard
2. View all requests with filtering options
3. Update request statuses and add notes
4. Changes trigger email notifications to requesters

## API Endpoints

- `POST /api/requests` - Create new request
- `GET /api/requests` - List all requests (with optional filters)
- `GET /api/requests/[id]` - Get specific request details
- `PUT /api/requests/[id]` - Update request status/notes
- `DELETE /api/requests/[id]` - Delete request
- `POST /api/upload` - Upload files

## File Upload

- **Supported formats**: STL, OBJ, STEP, STP, IGES, IGS, 3DS, DAE, FBX, PLY, X3D, GLTF, GLB
- **Maximum size**: 100MB (configurable)
- **Storage**: Local filesystem in `public/uploads/`
- **Optional**: Files are not required for request submission

## Database Schema

The main `PrintRequest` table includes:
- Part number, description, quantity, deadline
- Requester information (name, email)
- Status (pending, in_progress, completed, cancelled)
- Optional file information
- Timestamps and admin notes

## Deployment

### Production with Docker

1. Update environment variables in `docker-compose.yml`
2. Configure email settings
3. Run:
   ```bash
   docker-compose -f docker-compose.yml up -d
   ```

### Manual Deployment

1. Build the application:
   ```bash
   npm run build
   ```
2. Start production server:
   ```bash
   npm run start
   ```

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

### Database Management

```bash
# Generate Prisma client
npx prisma generate

# Create and run migrations
npx prisma migrate dev

# View database
npx prisma studio

# Reset database
npx prisma migrate reset
```

## Security Considerations

- File uploads are validated for type and size
- Input sanitization on all forms
- SQL injection prevention via Prisma ORM
- File paths are sanitized to prevent directory traversal

## Future Enhancements

- User authentication system
- Multiple file uploads per request
- Cost tracking and reporting
- Printer queue integration
- Advanced filtering and search
- Export functionality

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

## License

This project is licensed under the MIT License.