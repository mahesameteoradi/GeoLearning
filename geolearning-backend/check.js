const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const classes = await prisma.class.findMany();
  console.log('Classes:', classes.map(c => ({id: c.id, name: c.name})));
  
  if (classes.length > 0) {
    const classId = classes[0].id;
    console.log(`Checking class ${classId}...`);
    
    const students = await prisma.classStudent.findMany({
      where: { class_id: classId }
    });
    console.log('ClassStudents:', students);
    
    const allClassStudents = await prisma.classStudent.findMany();
    console.log('Total ClassStudents in DB:', allClassStudents.length);
  }
}

main().finally(() => prisma.$disconnect());
