import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Sending NOTIFY pgrst...')
  // We need to notify PostgREST to reload schema
  await prisma.$executeRaw`NOTIFY pgrst, 'reload schema';`
  console.log('Done!')
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
