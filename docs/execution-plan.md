# Magic Mirror Application - Execution Plan

## Project Setup (30 mins)

### 1. Initialize Project Structure

```bash
# Create Next.js project with TypeScript
npx create-next-app@latest magic-mirror --typescript --tailwind --app
cd magic-mirror

# Install essential dependencies
npm install react-webcam
npm install face-api.js
npm install @prisma/client prisma
npm install axios
```

### 2. Project Structure Setup

```txt
magic-mirror/
├── app/
│   ├── api/
│   │   ├── users/
│   │   │   └── route.ts
│   │   └── recognize/
│   │       └── route.ts
│   ├── components/
│   │   ├── Webcam.tsx
│   │   ├── FaceDetection.tsx
│   │   └── Greeting.tsx
│   ├── lib/
│   │   ├── face-recognition.ts
│   │   └── db.ts
│   └── page.tsx
├── prisma/
│   └── schema.prisma
├── public/
│   └── models/      # face-api.js models
└── types/
    └── index.ts
```

## Phase 1: Basic Camera & Face Detection (2 hours)

### Task 1.1: Setup Webcam Component

- [ ] Create `Webcam.tsx` component with react-webcam
- [ ] Add camera permissions handling
- [ ] Implement screenshot capture functionality
- [ ] Add camera on/off toggle

```typescript
// Basic structure
interface WebcamProps {
  onCapture: (imageSrc: string) => void;
}
```

### Task 1.2: Download and Setup face-api.js Models

- [ ] Download models from face-api.js repo
- [ ] Place in `public/models/` directory
- [ ] Create model loading utility in `lib/face-recognition.ts`

```typescript
// Models needed:
// - ssd_mobilenetv1_model
// - face_landmark_68_model
// - face_recognition_model
```

### Task 1.3: Implement Face Detection

- [ ] Create `FaceDetection.tsx` component
- [ ] Load face-api models on component mount
- [ ] Implement face detection on captured images
- [ ] Draw bounding boxes on detected faces
- [ ] Add detection confidence threshold

## Phase 2: Database Setup (1 hour)

### Task 2.1: Setup Prisma

- [ ] Initialize Prisma with SQLite (for quick dev)
- [ ] Create User model schema

```prisma
model User {
  id            String   @id @default(cuid())
  name          String
  email         String?  @unique
  faceDescriptor Json    // Store face embedding
  photos        Json?   // Store training photo URLs
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
}
```

### Task 2.2: Database Utilities

- [ ] Create database connection in `lib/db.ts`
- [ ] Implement CRUD operations for users
- [ ] Add face descriptor storage/retrieval functions

## Phase 3: Training Interface (2 hours)

### Task 3.1: Create Training Page

- [ ] Create `/app/train/page.tsx`
- [ ] Build form for user registration (name, email)
- [ ] Implement multi-photo capture (5-10 photos)
- [ ] Show capture progress

### Task 3.2: Process Training Data

- [ ] Extract face descriptors from captured photos
- [ ] Average multiple descriptors for better accuracy
- [ ] Store in database via API

### Task 3.3: Training API Endpoint

- [ ] Create POST `/api/users/route.ts`
- [ ] Validate face descriptors
- [ ] Store user with face data
- [ ] Return success/error response

## Phase 4: Recognition System (2 hours)

### Task 4.1: Recognition Logic

- [ ] Implement face matching algorithm in `lib/face-recognition.ts`
- [ ] Use Euclidean distance for descriptor comparison
- [ ] Set recognition threshold (typically 0.6)
- [ ] Handle multiple face scenarios

```typescript
interface RecognitionResult {
  userId: string;
  name: string;
  confidence: number;
}
```

### Task 4.2: Recognition API

- [ ] Create POST `/api/recognize/route.ts`
- [ ] Receive face descriptor
- [ ] Compare against all stored users
- [ ] Return best match or "unknown"

### Task 4.3: Real-time Recognition

- [ ] Implement continuous detection mode
- [ ] Add debouncing (recognize every 2 seconds)
- [ ] Cache recent recognitions
- [ ] Optimize for performance

## Phase 5: UI/UX Polish (1.5 hours)

### Task 5.1: Greeting Component

- [ ] Create `Greeting.tsx` with personalized messages
- [ ] Add smooth animations (fade in/out)
- [ ] Implement different greetings based on time of day
- [ ] Add text-to-speech option (Web Speech API)

### Task 5.2: Mirror Interface

- [ ] Style as full-screen mirror
- [ ] Add clock/date display
- [ ] Implement dark theme
- [ ] Add loading states and error handling

### Task 5.3: Admin Interface

- [ ] Create `/app/admin/page.tsx`
- [ ] List all registered users
- [ ] Delete user functionality
- [ ] Retrain user option

## Phase 6: Testing & Optimization (1 hour)

### Task 6.1: Testing

- [ ] Test with different lighting conditions
- [ ] Test with multiple users
- [ ] Test edge cases (no face, multiple faces)
- [ ] Performance testing

### Task 6.2: Optimization

- [ ] Implement WebWorker for face processing
- [ ] Add image preprocessing (brightness/contrast)
- [ ] Optimize model loading
- [ ] Add caching strategies

## Quick Start Commands

```bash
# After each major phase, test with:
npm run dev

# Database commands:
npx prisma generate
npx prisma db push
npx prisma studio  # View database

# Build for production:
npm run build
```

## Environment Variables

```env
# .env.local
DATABASE_URL="file:./dev.db"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

## Success Criteria

- [ ] Camera works on page load
- [ ] Face detection shows bounding box
- [ ] Can register new users with face training
- [ ] Recognizes registered users within 2 seconds
- [ ] Shows personalized greeting
- [ ] Works with at least 5 different users
- [ ] Performance: Recognition under 500ms

## Next Steps After MVP

- Add authentication
- Implement user preferences
- Add more mirror widgets (weather, news)
- Mobile responsive design
- Deploy to Vercel

---

**Estimated Total Time: 8-10 hours for MVP**

Start with Phase 1 and test each phase before moving forward. This incremental approach ensures a working prototype at each stage. 