require('dotenv').config();
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function upsertUser({ name, email, password, role }) {
  const passwordHash = await bcrypt.hash(password, 10);
  return prisma.user.upsert({
    where: { email },
    update: {},
    create: { name, email, passwordHash, role },
  });
}

async function upsertSubjectWithTopics(name, topicNames) {
  const subject = await prisma.subject.upsert({
    where: { name },
    update: {},
    create: { name },
  });
  for (const t of topicNames) {
    await prisma.topic.upsert({
      where: { subjectId_name: { subjectId: subject.id, name: t } },
      update: {},
      create: { subjectId: subject.id, name: t },
    });
  }
  return subject;
}

async function main() {
  console.log('Seeding accounts...');
  await upsertUser({ name: 'Student', email: 'student@example.com', password: 'changeme123', role: 'STUDENT' });
  await upsertUser({ name: 'Mentor', email: 'mentor@example.com', password: 'changeme123', role: 'MENTOR' });

  console.log('Seeding starter subjects/topics...');
  await upsertSubjectWithTopics('Polity', ['Fundamental Rights', 'Parliament', 'Judiciary']);
  await upsertSubjectWithTopics('History', ['Revolt of 1857', 'Freedom Movement']);
  await upsertSubjectWithTopics('Geography', ['Rivers', 'Climate']);
  await upsertSubjectWithTopics('Economy', ['Budget Basics']);
  await upsertSubjectWithTopics('Current Affairs', []);

  console.log('Done. Default login: student@example.com / mentor@example.com, password changeme123 — change these after first login.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
