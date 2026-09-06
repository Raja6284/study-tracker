# Study Log

A simple platform for tracking one student's daily study activity, and letting
a mentor review it — no AI coaching, no productivity scores, just an accurate
record: what was studied, when, for how long, and how it went.

## Structure

```
backend/    Node.js + Express API, PostgreSQL via Prisma, Cloudinary for files
frontend/   React + Vite + Tailwind
```

## 1. Backend setup

```bash
cd backend
cp .env.example .env
# edit .env: set DATABASE_URL (Postgres), JWT_SECRET, and Cloudinary keys
npm install
npx prisma migrate dev --name init
npm run seed        # creates the two accounts + starter subjects/topics
npm run dev          # starts the API on http://localhost:4000
```

Default accounts created by the seed script (change the password after first login):

| Role    | Email                | Password      |
|---------|-----------------------|---------------|
| Student | student@example.com  | changeme123   |
| Mentor  | mentor@example.com   | changeme123   |

You'll need a free [Cloudinary](https://cloudinary.com) account for
`CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` —
that's where attachments (lecture screenshots, handwritten notes, PDFs) are
stored. The database only keeps the Cloudinary reference (URL, public ID,
resource type), never the file itself.

## 2. Frontend setup

```bash
cd frontend
cp .env.example .env   # points at the backend API URL
npm install
npm run dev             # starts the app on http://localhost:5173
```

## How it's organized

- **Student** logs in and sees "Today's study log" first — a big
  **+ Add Study Session** button, a fast form (only date/time/subject/topic/
  activity type are required), and a "Save & add another" flow so a full
  day's sessions can be logged in a couple of minutes at night.
- **Mentor** logs in to an overview (today / last 7 days / this month),
  then can drill into the **Calendar**, full **History** (filterable by
  date, subject, topic, activity type), **Weekly**/**Monthly** reports, and
  a **Subject/Topic** view for testing the student on exactly what he
  claims to have studied. The mentor's access is read-only everywhere.
- Duration is always calculated by the system from start/end time — it's
  never typed in.
- Reports show raw numbers only (time, sessions, accuracy, breakdowns) —
  there are no recommendations, scores, or motivational text anywhere,
  by design.

## Data model

See `backend/prisma/schema.prisma`. It's intentionally flat: `User`,
`Subject`, `Topic`, `StudySession`, `Attachment` — no unnecessary
normalization.

## Notes on scope

This build covers the MVP list from the brief (auth, roles, subjects/topics,
multi-session daily entry, auto duration, activity types, question tracking,
Cloudinary uploads, daily view, calendar, history with filters, weekly/
monthly reports, subject/topic drill-down, mentor read-only dashboard, and
a simple "complete/incomplete" daily reminder indicator). A scheduled
push/email reminder at a configured time is future scope — the app currently
shows completion status when the student opens it, but doesn't send
notifications on its own.
