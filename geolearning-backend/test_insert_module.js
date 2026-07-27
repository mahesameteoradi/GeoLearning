require('dotenv').config()
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.log('Missing env')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function testInsert() {
  // First, authenticate as teacher
  const { data: auth, error: authErr } = await supabase.auth.signInWithPassword({
    email: 'meteoradi16@gmail.com', // teacher email
    password: '12345678'
  })

  if (authErr) {
    console.log('Auth error:', authErr)
    return
  }
  
  console.log('Logged in as', auth.user.id)

  // Find a class owned by the teacher
  const { data: cls } = await supabase.from('classes').select('id').eq('teacher_id', auth.user.id).limit(1).single()
  
  if (!cls) {
    console.log('No classes found for teacher')
    return
  }
  console.log('Testing insert on class:', cls.id)

  const { data, error } = await supabase
    .from('modules')
    .insert({ class_id: cls.id, title: 'Test Module', order: 0 })
    .select('id')
    .single()

  if (error) {
    console.error('Insert error:', error)
  } else {
    console.log('Insert success:', data)
    // clean up
    await supabase.from('modules').delete().eq('id', data.id)
  }
}

testInsert()
