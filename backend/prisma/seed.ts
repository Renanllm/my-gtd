import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  await prisma.user.createMany({
    data: [
      { email: 'alice@mail.com', password: 'hashed-pwd' },
      { email: 'bob@mail.com',   password: 'hashed-pwd' }
    ],
  });
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());