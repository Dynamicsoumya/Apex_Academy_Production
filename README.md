# 🎓 Apex Academy — MERN Coaching Website (11th & 12th)

A full-stack coaching website with Student/Admin login, study material upload,
and Razorpay payment gateway integration.

## Stack
- **Frontend:** React.js, React Router, Axios
- **Backend:** Node.js, Express.js
- **Database:** MongoDB (Mongoose)
- **Auth:** JWT + bcrypt
- **Payments:** Razorpay
- **File Upload:** Cloudinary (images & videos) · AWS S3 or local (PDFs & PYQ)

## Quick Start

### 1. Backend
```bash
cd backend
npm install
cp .env.example .env   # fill in MONGO_URI, JWT_SECRET, RAZORPAY keys, AWS S3
npm run dev
```
Runs on http://localhost:8080

### 2. Frontend
```bash
cd frontend
npm install
npm start
```
Runs on http://localhost:3000

## Creating the First Admin
Register normally via `/register`, then either:
- Manually update that user's `role` to `"admin"` in MongoDB, OR
- Send `role: "admin"` and `adminSecret: "<your JWT_SECRET>"` in the register API body.

## Get Razorpay Keys
1. Sign up at https://razorpay.com
2. Dashboard → Settings → API Keys → Generate Test Key
3. Paste `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` into `backend/.env`

## Cloudinary (images & videos)
Admin-uploaded **video lectures** and **images** are stored on **Cloudinary** (not in your project folder).

1. Sign up at https://cloudinary.com
2. Dashboard → copy **Cloud name**, **API Key**, **API Secret**
3. Add to `backend/.env`:
```env
CLOUDINARY_URL=cloudinary://API_KEY:API_SECRET@CLOUD_NAME
```

## AWS S3 (PDFs & PYQ — optional)

1. Create an S3 bucket (e.g. `apex-academy-uploads`) in AWS Console
2. Create an IAM user with `s3:PutObject`, `s3:GetObject`, `s3:DeleteObject` on that bucket
3. Add to `backend/.env`:
   - `AWS_ACCESS_KEY_ID`
   - `AWS_SECRET_ACCESS_KEY`
   - `AWS_REGION` (e.g. `ap-south-1`)
   - `AWS_S3_BUCKET`
4. Allow public read on uploaded objects (bucket policy or CloudFront). Example bucket policy for public `GetObject` on `pdfs/*`, `videos/*`, `pyq/*`, `images/*`

Without AWS credentials, files fall back to local `backend/uploads/` for development only.

## Folder Structure
```
apex-academy/
  backend/
    models/        User, Document, Course, Payment
    routes/        authRoutes, documentRoutes, courseRoutes, paymentRoutes
    middleware/    authMiddleware, uploadMiddleware
    config/        db, cors, s3
    utils/         s3Storage, sendEmail
    uploads/        (legacy local files only — new uploads go to S3)
    server.js
  frontend/
    src/pages/      Home, Login, Register, Courses, StudentDashboard, AdminDashboard
    src/components/ Navbar, ProtectedRoute
    src/api/api.js
apex-academy-logo.svg / .png
Apex_Academy_Project_Report.pdf
```

See **Apex_Academy_Project_Report.pdf** for full architecture, API list, DB schema, and payment flow documentation.
