import { PrismaClient, Role, VerificationStatus } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import * as dotenv from 'dotenv'

dotenv.config({ path: './.env' })
dotenv.config({ path: '../geolearning-frontend/.env.local' })

const connectionString = process.env.DATABASE_URL
const adapter = connectionString ? new PrismaPg({ connectionString }) : undefined
const prisma = new PrismaClient({ adapter })

async function forceAdmin() {
  const email = process.env.SUPERADMIN_EMAIL || 'admin@sekolah.sch.id'
  
  const user = await prisma.user.findUnique({ where: { email } })
  if (!user) {
    console.log('User not found in Prisma DB')
    return
  }

  await prisma.user.update({
    where: { email },
    data: {
      role: Role.ADMIN,
      verification_status: VerificationStatus.VERIFIED
    }
  })
  
  console.log(`Successfully updated ${email} to ADMIN role in Prisma!`)
}

forceAdmin().catch(console.error).finally(() => prisma.$disconnect())
