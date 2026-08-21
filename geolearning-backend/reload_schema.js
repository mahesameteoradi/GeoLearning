const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
p.$executeRawUnsafe("NOTIFY pgrst, 'reload schema';")
  .then(() => console.log('reloaded'))
  .catch(console.error)
  .finally(() => p.$disconnect());
