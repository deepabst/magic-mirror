# 🪞 Magic Mirror - Face Recognition System

A modern, intelligent Magic Mirror application with real-time face detection and recognition capabilities. Train the system to recognize you and receive personalized greetings!

## ✨ Features

- **🎯 Real-time Face Detection**: Live face detection with bounding boxes and confidence scores
- **👤 User Training System**: Multi-photo capture workflow for accurate face recognition
- **📊 Database Management**: Store and manage user profiles with face descriptors
- **🌐 Modern Web Interface**: Responsive design with navigation between Mirror, Training, and Admin views
- **⚡ Real-time Processing**: Face detection runs at 1-second intervals with live feedback
- **📱 Camera Integration**: Full webcam support with permission handling

## 🚀 Tech Stack

### Frontend

- **[Next.js 15.3.3](https://nextjs.org/)** - React framework with App Router
- **[React 19](https://react.dev/)** - UI library
- **[TypeScript](https://www.typescriptlang.org/)** - Type safety
- **[Tailwind CSS v4](https://tailwindcss.com/)** - Styling
- **[shadcn/ui](https://ui.shadcn.com/)** - UI component library
- **[Lucide React](https://lucide.dev/)** - Icons

### AI/ML & Camera

- **[face-api.js](https://github.com/justadudewhohacks/face-api.js)** - Face detection and recognition
- **[react-webcam](https://github.com/mozmorris/react-webcam)** - Camera integration
- **TensorFlow.js** - Machine learning backend

### Database & Backend

- **[Prisma](https://www.prisma.io/)** - Database ORM
- **[SQLite](https://www.sqlite.org/)** - Database (development)
- **Next.js API Routes** - Backend endpoints

### Models Used

- **SSD MobileNetV1** - Face detection
- **Face Landmark 68** - Facial landmark detection
- **Face Recognition Net** - 128-dimension face descriptors

## 🎯 Project Goals

1. **Phase 1** ✅ - Real-time face detection with visual feedback
2. **Phase 2** ✅ - Database setup with user management
3. **Phase 3** 🚧 - Training interface for user registration
4. **Phase 4** 📋 - Face recognition and matching system
5. **Phase 5** 📋 - Personalized greetings and mirror interface
6. **Phase 6** 📋 - Admin panel and optimizations

## 🛠️ Local Development Setup

### Prerequisites

- **Node.js 18+**
- **npm** or **yarn**
- **Camera/Webcam** for face detection

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/magic-mirror.git
cd magic-mirror
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Setup

Create a `.env.local` file in the root directory:

```env
DATABASE_URL="file:./prisma/dev.db"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### 4. Database Setup

```bash
# Generate Prisma client
npx prisma generate

# Create and migrate database
npx prisma db push

# (Optional) Open database GUI
npx prisma studio
```

### 5. Start Development Servers

**Terminal 1 - Main Application:**

```bash
npm run dev
```

**Terminal 2 - Database GUI (Optional):**

```bash
npx prisma studio
```

### 6. Access the Application

- **Main App**: http://localhost:3000
- **Training Interface**: http://localhost:3000/train
- **Database GUI**: http://localhost:5555 (if running Prisma Studio)

## 📸 Adding Your Face to the Database

### Method 1: Web Interface (Recommended)

1. **Navigate to Training Page**: http://localhost:3000/train
2. **Fill Registration Form**:
   - Enter your full name
   - (Optional) Enter email address
3. **Photo Capture Process**:
   - Click "Start Training"
   - Allow camera permissions
   - The system will capture 8 photos automatically
   - 3-second countdown before each capture
   - Green checkmarks indicate successful face detection
4. **Processing**: The system will automatically process and store your face data
5. **Completion**: You'll see a success message when training is complete

### Method 2: API Commands (Advanced)

```bash
# Test database connection
curl "http://localhost:3000/api/users?action=stats"

# Add user via API (requires 128-dimension face descriptor)
curl -X POST "http://localhost:3000/api/users" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Your Name",
    "email": "your.email@example.com",
    "faceDescriptor": [/* 128 numbers */]
  }'

# List all users
curl "http://localhost:3000/api/users"
```

## 🎮 Usage Guide

### Navigation

- **🪞 Mirror** - Main face detection interface
- **👤 Train User** - Register new users with face training
- **⚙️ Admin** - Manage users and system settings (coming soon)

### Face Detection

1. Visit the main page (http://localhost:3000)
2. Allow camera permissions
3. Turn on the camera using the green button
4. Position your face in the camera view
5. Green bounding boxes will appear around detected faces
6. View real-time statistics and confidence scores

### Training New Users

1. Click "Train New User" or navigate to `/train`
2. Fill out the registration form
3. Follow the 8-photo capture process
4. Wait for automatic processing
5. Receive confirmation of successful registration

## 📁 Project Structure

```
magic-mirror/
├── src/
│   ├── app/
│   │   ├── components/
│   │   │   ├── FaceDetection.tsx      # Face detection component
│   │   │   ├── Navigation.tsx         # Global navigation
│   │   │   └── Webcam.tsx            # Basic webcam component
│   │   ├── lib/
│   │   │   ├── face-recognition.ts    # Face-api.js utilities
│   │   │   └── db.ts                 # Database operations
│   │   ├── api/
│   │   │   ├── users/route.ts        # User management API
│   │   │   └── recognize/route.ts    # Face recognition API
│   │   ├── train/
│   │   │   └── page.tsx              # Training interface
│   │   ├── layout.tsx                # Root layout
│   │   ├── page.tsx                  # Main mirror page
│   │   └── globals.css               # Global styles
│   ├── components/ui/                 # shadcn/ui components
│   └── lib/utils.ts                  # Utility functions
├── prisma/
│   ├── schema.prisma                 # Database schema
│   └── dev.db                        # SQLite database
├── public/
│   └── models/                       # Face-api.js model files
├── types/
│   └── index.ts                      # TypeScript definitions
└── docs/
    └── execution-plan.md             # Development roadmap
```

## 🗄️ Database Schema

```prisma
model User {
  id             String    @id @default(cuid())
  name           String
  email          String?   @unique
  faceDescriptor Json      // 128-dimension face embedding
  photos         Json?     // Training photos metadata
  createdAt      DateTime  @default(now())
  updatedAt      DateTime  @updatedAt
  sessions       Session[]
}

model Session {
  id         String   @id @default(cuid())
  userId     String
  timestamp  DateTime @default(now())
  confidence Float
  user       User     @relation(fields: [userId], references: [id])
}
```

## 🚀 API Endpoints

### Users API

- `GET /api/users` - List all users
- `POST /api/users` - Create new user with face data
- `GET /api/users?action=stats` - Database statistics

### Recognition API

- `POST /api/recognize` - Recognize face from descriptor
- `GET /api/recognize?action=test` - Test recognition endpoint

## 🔧 Development Commands

```bash
# Development
npm run dev              # Start development server
npm run build           # Build for production
npm run start           # Start production server
npm run lint            # Run ESLint

# Database
npx prisma generate     # Generate Prisma client
npx prisma db push      # Apply schema changes
npx prisma studio       # Open database GUI
npx prisma db seed      # Seed database (if configured)

# Testing
npm run test            # Run tests (when configured)
```

## 🔍 Troubleshooting

### Camera Issues

- **Permission Denied**: Refresh page and allow camera access
- **Camera Not Found**: Check if camera is connected and not used by other apps
- **Poor Detection**: Ensure good lighting and face clearly visible

### Model Loading Issues

- **Tensor Shape Errors**: Models are loaded from CDN as fallback
- **Slow Loading**: Models download on first use (~15-20MB total)
- **Network Issues**: Check internet connection for model download

### Database Issues

- **Connection Failed**: Verify `DATABASE_URL` in `.env.local`
- **Schema Errors**: Run `npx prisma db push` to sync schema
- **Data Issues**: Use `npx prisma studio` to inspect database

## 🎯 Current Status

- ✅ **Phase 1**: Face Detection System
- ✅ **Phase 2**: Database Infrastructure
- ✅ **Phase 3.1**: Training Interface
- 🚧 **Phase 3.2**: Training Data Processing
- 📋 **Phase 4**: Recognition System
- 📋 **Phase 5**: Mirror Interface & Greetings
- 📋 **Phase 6**: Admin Panel & Optimization

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [face-api.js](https://github.com/justadudewhohacks/face-api.js) for face detection capabilities
- [shadcn/ui](https://ui.shadcn.com/) for beautiful UI components
- [Next.js](https://nextjs.org/) team for the amazing framework
- [Prisma](https://www.prisma.io/) for database tooling

---

Built with ❤️ using Next.js, TypeScript, and face-api.js
