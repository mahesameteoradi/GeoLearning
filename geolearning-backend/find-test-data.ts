import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  const student = await prisma.user.findFirst({
    where: { role: 'STUDENT' },
    include: { enrollments: true }
  })
  
  const cls = await prisma.class.findFirst({
    where: { enrollments: { some: { student_id: student?.id } } },
    include: {
      modules: {
        include: { materials: true }
      }
    }
  })

  console.log('Student:', student?.email)
  console.log('Class:', cls?.id)
  if (cls?.modules[0]?.materials[0]) {
    console.log('Material:', cls.modules[0].materials[0].id)
  }
}

main().finally(() => prisma.$disconnect())
