const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const cls = await prisma.class.findFirst({ where: { name: 'G' } });
  if (!cls) return console.log('Class G not found');
  
  const student = await prisma.classStudent.findFirst({
    where: { class_id: cls.id, no_absen: 34 },
    include: { student: true }
  });
  
  if (!student) return console.log('Student 34 not found');
  console.log(student.student);
}
main().catch(console.error).finally(() => prisma.$disconnect());
