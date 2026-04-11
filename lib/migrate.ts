import { supabaseAdmin } from "./supabase";

let migrationRun = false;

export async function ensureMigration(): Promise<void> {
  if (migrationRun) return;

  try {
    // Check if table exists by querying it
    const { error } = await supabaseAdmin.from("claws").select("id").limit(1);

    if (error && error.code === "42P01") {
      // Table doesn't exist — this shouldn't happen in production
      // but we log it clearly
      console.error("MIGRATION NEEDED: claws table does not exist. Run the SQL migration.");
      throw new Error("Database not initialised. Please run the migration SQL.");
    }

    migrationRun = true;
  } catch (err) {
    // Re-throw so provision knows DB isn't ready
    throw err;
  }
}
