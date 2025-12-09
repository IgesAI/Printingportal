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

# File Upload Configuration (Vercel Blob)
# These are examples; set in Vercel Project Settings and .env.local
BLOB_READ_WRITE_TOKEN=your-blob-token
MAX_UPLOAD_MB=200
NEXT_PUBLIC_MAX_UPLOAD_MB=200

# Application
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# Admin Authentication (for dashboard)
ADMIN_PASSWORD="your-secure-password-here"  # REQUIRED - No default password
JWT_SECRET="your-jwt-secret-key"  # Optional - defaults to ADMIN_PASSWORD if not set
```

## Usage

### For Users (Submitting Requests)

1. Visit the home page and fill out the request form
2. Enter part number, quantity, optional description and deadline
3. Optionally upload a 3D model file
4. Submit the form - you'll receive a confirmation email
5. Track your requests at `/requests`

### For Admins (Managing Requests)

1. Visit `/dashboard` for the admin dashboard
2. **View-only access**: Anyone can view requests, search, filter, and export data
3. **Edit access**: Click "Login to Edit" button and enter the admin password to make changes
4. Update request statuses and add notes (requires authentication)
5. Delete requests (requires authentication)
6. Changes trigger email notifications to requesters

**Security Note**: 
- The dashboard uses JWT-based authentication with secure httpOnly cookies
- **REQUIRED**: Set the `ADMIN_PASSWORD` environment variable - there is NO default password
- Optional: Set `JWT_SECRET` for token signing (defaults to `ADMIN_PASSWORD` if not set)
- All API routes are protected with server-side authentication checks
- Rate limiting is enabled on the login endpoint (5 attempts per 15 minutes)

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

### Deploying to Vercel

1. **Connect your repository** to Vercel
2. **Configure Environment Variables** in Vercel dashboard:
   - Go to your project → Settings → Environment Variables
   - Add the following required variables:

   ```env
   DATABASE_URL=your-production-database-url
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your-email@gmail.com
   SMTP_PASS=your-app-password
   SMTP_FROM=noreply@yourdomain.com
   NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
   ```

3. **SMTP Configuration Options**:
   
   **Option 1: Gmail (Recommended for testing)**
   - Use Gmail SMTP: `smtp.gmail.com`
   - Port: `587`
   - Enable 2-factor authentication
   - Generate an App Password: [Google App Passwords](https://myaccount.google.com/apppasswords)
   - Use the app password as `SMTP_PASS`

   **Option 2: SendGrid (Recommended for production)**
   - Sign up at [SendGrid](https://sendgrid.com)
   - Create an API key
   - Use: `SMTP_HOST=smtp.sendgrid.net`
   - Use: `SMTP_PORT=587`
   - Use: `SMTP_USER=apikey`
   - Use: `SMTP_PASS=your-sendgrid-api-key`

   **Option 3: Mailgun**
   - Sign up at [Mailgun](https://www.mailgun.com)
   - Use your SMTP credentials from the dashboard
   - `SMTP_HOST=smtp.mailgun.org`
   - `SMTP_PORT=587`

   **Option 4: AWS SES**
   - Configure AWS SES
   - Use your SES SMTP endpoint
   - `SMTP_HOST=email-smtp.region.amazonaws.com`
   - `SMTP_PORT=587`

4. **Important Notes**:
   - ⚠️ **Never use localhost SMTP** (`127.0.0.1` or `localhost`) in production
   - The application will now validate SMTP configuration and prevent localhost connections
   - If SMTP is not configured, you'll get clear error messages
   - Email failures won't break your application - they're logged but don't block requests

5. **Deploy**: Push to your main branch or trigger a deployment manually

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