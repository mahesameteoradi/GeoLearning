const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.$executeRawUnsafe('NOTIFY pgrst, reload_schema;')
  .then(() => { 
    console.log('Schema cache reload triggered!'); 
    return prisma.$disconnect(); 
  })
  .catch(e => { 
    console.error(e); 
    return prisma.$disconnect(); 
  });
