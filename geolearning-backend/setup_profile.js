const { Client } = require('pg');
require('dotenv').config();

const client = new Client(process.env.DIRECT_URL);
client.connect().then(async () => {
  try {
    // 1. Add columns
    await client.query(`ALTER TABLE public.users ADD COLUMN IF NOT EXISTS nis_nip TEXT;`);
    await client.query(`ALTER TABLE public.users ADD COLUMN IF NOT EXISTS school_class TEXT;`);
    console.log("Added nis_nip and school_class to users.");

    // 2. Create avatars bucket
    await client.query(`
      INSERT INTO storage.buckets (id, name, public) 
      VALUES ('avatars', 'avatars', true) 
      ON CONFLICT (id) DO NOTHING;
    `);
    console.log("Ensured 'avatars' storage bucket exists.");

    // 3. RLS Policies for avatars
    // Anyone can read avatars
    await client.query(`
      CREATE POLICY "Avatar images are publicly accessible" 
      ON storage.objects FOR SELECT 
      USING ( bucket_id = 'avatars' );
    `).catch(() => console.log("Select policy might exist"));

    // Users can upload their own avatar
    await client.query(`
      CREATE POLICY "Users can upload their own avatars" 
      ON storage.objects FOR INSERT 
      WITH CHECK ( bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1] );
    `).catch(() => console.log("Insert policy might exist"));
    
    // Users can update their own avatar
    await client.query(`
      CREATE POLICY "Users can update their own avatars" 
      ON storage.objects FOR UPDATE 
      USING ( bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1] );
    `).catch(() => console.log("Update policy might exist"));

    // Users can delete their own avatar
    await client.query(`
      CREATE POLICY "Users can delete their own avatars" 
      ON storage.objects FOR DELETE 
      USING ( bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1] );
    `).catch(() => console.log("Delete policy might exist"));

    await client.query("NOTIFY pgrst, 'reload schema'");
    console.log("Reloaded schema.");

  } catch (err) {
    console.error("Error:", err);
  } finally {
    client.end();
  }
});
