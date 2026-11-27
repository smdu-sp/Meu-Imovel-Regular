import { sql, type MigrateUpArgs } from "@payloadcms/db-postgres";

// Additive only; existing rows retain the previous solid border, including saved versions.
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    DO $$ BEGIN
      CREATE TYPE "public"."enum_pages_blocks_icon_grid_appearance_border_style" AS ENUM ('solid', 'dashed', 'dotted', 'none');
    EXCEPTION WHEN duplicate_object THEN NULL; END $$;
    DO $$ BEGIN
      CREATE TYPE "public"."enum__pages_v_blocks_icon_grid_appearance_border_style" AS ENUM ('solid', 'dashed', 'dotted', 'none');
    EXCEPTION WHEN duplicate_object THEN NULL; END $$;
    ALTER TABLE "pages_blocks_icon_grid" ADD COLUMN IF NOT EXISTS "appearance_border_style" "public"."enum_pages_blocks_icon_grid_appearance_border_style" DEFAULT 'solid';
    ALTER TABLE "_pages_v_blocks_icon_grid" ADD COLUMN IF NOT EXISTS "appearance_border_style" "public"."enum__pages_v_blocks_icon_grid_appearance_border_style" DEFAULT 'solid';
  `);
}
export async function down(): Promise<void> {
  throw new Error(
    "Rollback automático desabilitado para preservar as preferências de borda. A versão anterior pode ignorar as novas colunas; restaure o schema revisado somente com backup.",
  );
}
