import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting database seed...');

  // Create demo user
  const hashedPassword = await bcrypt.hash('Password123!', 12);

  const demoUser = await prisma.user.upsert({
    where: { email: 'demo@example.com' },
    update: {},
    create: {
      email: 'demo@example.com',
      password: hashedPassword,
      name: 'Demo User',
      role: 'user',
      emailVerified: true,
    },
  });

  console.log('Created demo user:', { id: demoUser.id, email: demoUser.email });

  // Create admin user
  const adminPassword = await bcrypt.hash('Admin123!', 12);

  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      password: adminPassword,
      name: 'Admin User',
      role: 'admin',
      emailVerified: true,
    },
  });

  console.log('Created admin user:', { id: adminUser.id, email: adminUser.email });

  // Create a sample conversation for demo user
  const conversation = await prisma.conversation.create({
    data: {
      userId: demoUser.id,
      title: 'Getting Started with English',
      messages: {
        create: [
          {
            role: 'user',
            content: 'Hello! I want to improve my English.',
            format: 'text',
            status: 'sent',
          },
          {
            role: 'assistant',
            content:
              "Hello! I'm here to help you improve your English. What area would you like to focus on - grammar, vocabulary, pronunciation, or conversation practice?",
            format: 'text',
            status: 'sent',
            metadata: {
              model: 'mock-agent',
              tokens: 35,
            },
          },
        ],
      },
    },
  });

  console.log('Created sample conversation:', { id: conversation.id });

  console.log('Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('Error during seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
