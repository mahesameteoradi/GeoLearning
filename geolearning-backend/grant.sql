ALTER TABLE "public"."material_completions" DISABLE ROW LEVEL SECURITY;
GRANT ALL ON TABLE "public"."material_completions" TO anon;
GRANT ALL ON TABLE "public"."material_completions" TO authenticated;
GRANT ALL ON TABLE "public"."material_completions" TO service_role;
