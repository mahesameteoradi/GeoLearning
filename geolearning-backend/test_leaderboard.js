require('dotenv').config({ path: '../geolearning-frontend/.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

async function test() {
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: 'guru@example.com',
    password: 'password123'
  })
  
  if (authError) {
    console.error('Login failed:', authError)
    return
  }
  console.log('Logged in as:', authData.user.id)

  const { data: enrollments, error: enrollError } = await supabase
    .from('class_students')
    .select('student_id')
    .eq('class_id', 'ac22d7db-f828-4b58-959e-c34ffbc130ee')

  console.log('Teacher Enrollments:', enrollments, enrollError)

  if (enrollments && enrollments.length > 0) {
    const studentIds = enrollments.map(e => e.student_id)
    const { data: usersData, error: usersError } = await supabase
      .from('users')
      .select(`id, name, xp, avatar_url, user_badges ( is_equipped, badges ( id, icon, display_name ) )`)
      .in('id', studentIds)
    console.log('Teacher UsersData:', usersData, usersError)
  }
}
test()
