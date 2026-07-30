const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const classes = await prisma.class.findMany();
  const classStudents = await prisma.classStudent.findMany();
  
  console.log('Class IDs:', classes.map(c => c.id));
  console.log('ClassStudent class_ids:', classStudents.map(cs => cs.class_id));
  
  const classSummary = await prisma.classStudent.findMany({
    where: { class_id: classes[0].id }
  });
  console.log(`Found ${classSummary.length} students for class 0 (${classes[0].id})`);
}

main().finally(() => prisma.$disconnect());
