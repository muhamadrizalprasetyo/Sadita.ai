# 📘 Modern LMS Platform  
A fully featured Learning Management System (LMS) built with **Next.js 16**, **TypeScript**, **TailwindCSS**, **ShadCN UI**, **Prisma ORM**, **PostgreSQL**, **React Hook Form**, **Zod**, and **Better-Auth** for secure authentication & authorization.

This LMS provides a complete learning experience including user roles, course management, lessons, progress tracking, quizzes, analytics, and a modern high-performance UI.

---

## 🚀 Features

### 🔐 Authentication & Authorization  
- Secure auth powered by **Better-Auth**  
- Role-based access (Admin, Instructor, Student)  
- Protected routes / server actions  
- JWT-based session strategy  
- Password hashing & session rotation  

### 📚 Core LMS Features  
- Course creation & management  
- Lessons, modules, attachments  
- Student enrollment system  
- Video lessons with progress tracking  
- Quizzes & assessments  
- Certificates generation  
- Discussion & Q&A  
- Dashboard for students and instructors  
- Bookmarking, wishlist, and history  

### ⚙️ Developer Experience  
- 100% **TypeScript**  
- Validation with **Zod**  
- Form handling via **React Hook Form**  
- Database with **Prisma ORM**  
- Modern UI using **TailwindCSS + ShadCN UI**  
- File uploads (local or cloud integrations)  
- Clean, scalable folder structure  
- API routes + Server Actions  
- Error handling & loading states  
- SEO optimized  

---

## 🧰 Tech Stack

| Layer | Technology |
|------|------------|
| Frontend | Next.js 16, TypeScript, TailwindCSS, ShadCN UI |
| Forms | React Hook Form, Zod |
| Backend | Next.js Server Actions / API routes |
| Database | PostgreSQL + Prisma ORM |
| Authentication | Better-Auth |
| Deployment | Vercel / Railway / Render |
| Other | ESLint, Prettier, SWR / React Query (optional) |

## 🛠 Installation & Setup
1️⃣ Clone the repo :
```txt
git clone https://github.com/mehedihasanshefat/learnstack-lms.git
cd learnstack-lms
```

2️⃣ Install dependencies :
```txt
npm install
```

3️⃣ Setup database
```txt
npx prisma migrate dev
npx prisma db push
```

4️⃣ Run development server
```txt
npm run dev
```

