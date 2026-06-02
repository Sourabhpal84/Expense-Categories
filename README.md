# MAGNEETOZ Business OS

Production-ready AI-powered business expense management web app built with Next.js 14, TypeScript, Tailwind CSS, shadcn-style UI, Firebase, OpenAI, OCR, Recharts, and Netlify.

## Features

- Firebase Email/Password and Google authentication
- Protected dashboard routes with persistent auth state
- Expense CRUD foundation with receipt upload, category filters, search, notes, and history
- AI receipt scanner using Tesseract.js OCR plus optional OpenAI Vision parsing
- Voice expense entry for spoken multilingual expense text
- AI business insights for spending analysis, budget warnings, cost savings, growth ideas, and financial health score
- Revenue tracking with orders, channels, best-selling products, and analytics
- Inventory management with low-stock warnings and restock status
- Monthly budgets with usage warnings
- Monthly PDF reports and CSV export
- Settings for profile, business name, currency, and theme
- Dark-first premium SaaS UI with glassmorphism, responsive layout, charts, and PWA support
- Netlify-ready deployment config
- Secure Firestore and Firebase Storage rules
- WhatsApp webhook placeholder for future Twilio logging

## Tech Stack

- Next.js 14 App Router
- TypeScript
- Tailwind CSS
- shadcn/ui-compatible primitives
- Firebase Auth, Firestore, Storage
- OpenAI API
- Tesseract.js
- Recharts
- Lucide React
- React PDF
- Netlify Next.js plugin

## Commands

Install dependencies:

```bash
npm install
```

Run locally:

```bash
npm run dev
```

Type-check:

```bash
npm run typecheck
```

Lint:

```bash
npm run lint
```

Build production:

```bash
npm run build
```

Start production build locally:

```bash
npm run start
```

## Environment Variables

Create `.env.local` from `.env.example`:

```bash
cp .env.example .env.local
```

Paste Firebase values from Firebase Console > Project settings > Your apps > Web app:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
```

Paste OpenAI values:

```env
OPENAI_API_KEY=
OPENAI_MODEL=gpt-4o-mini
```

Never commit `.env.local`.

## Firebase Setup Guide

1. Create a Firebase project at Firebase Console.
2. Add a Web app and copy the Firebase client config into `.env.local`.
3. Enable Authentication providers:
   - Email/Password
   - Google
4. Create Firestore Database in production mode.
5. Create Firebase Storage.
6. Deploy rules:

```bash
firebase login
firebase use YOUR_PROJECT_ID
firebase deploy --only firestore:rules,storage
```

The app uses these Firestore collections:

- `profiles`
- `expenses`
- `revenues`
- `inventory`
- `budgets`

Receipt images are stored under:

- `receipts/{userId}/{fileName}`

## Netlify Deployment Steps

1. Push this repository to GitHub/GitLab/Bitbucket.
2. In Netlify, create a new site from the repository.
3. Build command:

```bash
npm run build
```

4. Publish directory:

```bash
.next
```

5. Add all environment variables from `.env.example` in Netlify Site configuration > Environment variables.
6. Deploy. `netlify.toml` already enables `@netlify/plugin-nextjs` and Node 20.

## Folder Structure

```text
app/                 Next.js App Router pages, layouts, and API routes
components/          Reusable UI, dashboard, expense, report, and provider components
data/                Sample dummy data for demo mode
firebase/            Firebase client initialization
hooks/               Client hooks for business data and speech recognition
lib/                 Shared utilities and AI client wrappers
services/            Firebase data, profile, and storage services
types/               Shared TypeScript business types
utils/               OCR and browser helpers
public/              PWA manifest, service worker, icons, offline page
styles/              Reserved for additional global style modules
firestore.rules      Secure Firestore rules
storage.rules        Secure Storage rules
netlify.toml         Netlify deployment config
```

## Notes

- Without Firebase keys, the app shows demo data and blocks writes.
- Without `OPENAI_API_KEY`, AI endpoints return useful setup placeholders and basic fallback parsing.
- The WhatsApp route at `/api/whatsapp/expense` is a Twilio-compatible placeholder. Map incoming numbers to Firebase user IDs before enabling automatic writes in production.
