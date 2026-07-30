import { PrismaClient, Role, VerificationStatus } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: './.env' })
dotenv.config({ path: '../geolearning-frontend/.env.local' })

const connectionString = process.env.DATABASE_URL
const adapter = connectionString ? new PrismaPg({ connectionString }) : undefined
const prisma = new PrismaClient({ adapter })

async function seedSuperAdmin() {
  const email = process.env.SUPERADMIN_EMAIL || 'admin@sekolah.sch.id'
  const password = process.env.SUPERADMIN_PASSWORD || 'GantiSegera123!'

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing Supabase environment variables (URL or SERVICE_ROLE_KEY).')
    console.log('Cannot create super admin via Supabase Auth without service role key.')
    process.exit(1)
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  console.log(`Checking if super admin (${email}) already exists...`)
  
  // Check in Prisma
  const existingUser = await prisma.user.findUnique({
    where: { email },
  })

  if (existingUser) {
    console.log('✅ Akun super admin sudah ada, seed dilewati.')
    return
  }

  console.log('Creating super admin in Supabase Auth...')
  
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email: email,
    password: password,
    email_confirm: true,
    user_metadata: {
      full_name: 'Super Admin',
      role: 'ADMIN',
    },
  })

  if (authError) {
    if (authError.message.includes('already registered')) {
      console.log('User already registered in Supabase Auth, but not in Prisma. Checking users list...')
      // Try to find the user id from auth.users (requires DB query usually, or we can use admin API)
      const { data: listData } = await supabase.auth.admin.listUsers()
      const user = listData?.users.find((u: any) => u.email === email)
      if (user) {
        await insertIntoPrisma(user.id, email)
        return
      }
    }
    console.error('❌ Error creating user in Supabase Auth:', authError.message)
    process.exit(1)
  }

  if (authData?.user) {
    await insertIntoPrisma(authData.user.id, email)
  }
}

async function insertIntoPrisma(id: string, email: string) {
  console.log('Inserting super admin into Prisma DB...')
  
  try {
    await prisma.user.create({
      data: {
        id: id,
        name: 'Super Admin',
        email: email,
        role: Role.ADMIN,
        verification_status: VerificationStatus.VERIFIED,
      },
    })
    console.log(`✅ Akun super admin berhasil dibuat: ${email}`)
    console.log('Segera login dan ganti password default lewat menu Edit Profil.')
  } catch (error) {
    console.error('❌ Error inserting into Prisma:', error)
  }
}

seedSuperAdmin()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
