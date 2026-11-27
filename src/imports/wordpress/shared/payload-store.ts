import type { Payload, PayloadRequest } from "payload";
import { RolledBack, type Doc } from "./migration-manifest.ts";
import type { Store } from "./apply.ts";

// Payload 3.88 retains its initial pool checkout; track owned clients so CLI teardown closes sockets.
export async function isolatedAdapter(uri: string, push = false) {
  const [{ default: pg }, { postgresAdapter }] = await Promise.all([
    import("pg"),
    import("@payloadcms/db-postgres"),
  ]);
  const pools: InstanceType<typeof pg.Pool>[] = [];
  const held = new Set<import("pg").PoolClient>();
  class ImportPool extends pg.Pool {
    constructor(options: import("pg").PoolConfig) {
      super(options);
      pools.push(this);
      this.on("acquire", (client) => held.add(client));
      this.on("release", (_error, client) => held.delete(client));
    }
  }
  const adapter = postgresAdapter({
    pool: { connectionString: uri },
    push,
    disableCreateDatabase: true,
    extensions: [],
    pg: { ...pg, Pool: ImportPool },
  });
  return {
    adapter: { ...adapter, allowIDOnCreate: false, name: "postgres" },
    close: async () => {
      for (const client of held) client.release();
      await Promise.all(pools.map((pool) => pool.end()));
    },
  };
}

let connectionSequence = 0;
export async function connectStore(
  uri: string,
  actorId: number,
  globalSlug: "header" | "footer" | "both" = "header",
) {
  process.env.DISABLE_PAYLOAD_HMR = "true";
  if (process.env.PAYLOAD_DROP_DATABASE === "true")
    throw new Error("PAYLOAD_DROP_DATABASE não pode estar habilitado.");
  const [{ getPayload, createLocalReq }, { sql }, { default: configuration }] =
    await Promise.all([
      import("payload"),
      import("@payloadcms/db-postgres"),
      import("../../../payload.config.ts"),
    ]);
  const config = await configuration;
  const database = await isolatedAdapter(uri);
  config.db = database.adapter;
  let payload: Payload;
  try {
    payload = await getPayload({
      config,
      key: `wordpress-import-${++connectionSequence}`,
    });
  } catch (error) {
    await database.close();
    throw error;
  }
  try {
    const actor = await payload.findByID({
      collection: "users",
      id: actorId,
      depth: 0,
    });
    if (actor.role !== "admin")
      throw new Error("Executor deve ser um Admin existente.");
    let req: PayloadRequest = await createLocalReq(
      { user: { ...actor, collection: "users" } },
      payload,
    );
    const find: Store["find"] = async (collection, where) => {
      const result = await payload.find({
        collection,
        where,
        draft: !where._status,
        limit: 1000,
        depth: 0,
        overrideAccess: false,
        req,
      } as Parameters<Payload["find"]>[0]);
      return result.docs as unknown as Doc[];
    };
    const store: Store = {
      find,
      getGlobal: async (slug = "header") =>
        (await payload.findGlobal({
          slug,
          depth: 0,
          overrideAccess: false,
          req,
        })) as unknown as Doc,
      get: async (collection, id, draft = true) =>
        (await payload.findByID({
          collection,
          id,
          draft,
          depth: 0,
          overrideAccess: false,
          req,
        } as Parameters<Payload["findByID"]>[0])) as unknown as Doc,
      create: async (collection, data, filePath) =>
        (await payload.create({
          collection,
          data,
          filePath,
          draft: collection === "pages",
          depth: 0,
          overrideAccess: false,
          req,
        } as Parameters<Payload["create"]>[0])) as unknown as Doc,
      update: async (id, data) =>
        (await payload.update({
          collection: "pages",
          id,
          data,
          draft: true,
          depth: 0,
          overrideAccess: false,
          req,
        } as Parameters<Payload["update"]>[0])) as unknown as Doc,
      updateGlobal: async (data, slug = "header") =>
        (await payload.updateGlobal({
          slug,
          data,
          context:
            slug === "header" ? { wordpressImportHeaderDraftLinks: true } : {},
          depth: 0,
          overrideAccess: false,
          req,
        } as Parameters<Payload["updateGlobal"]>[0])) as unknown as Doc,
      transaction: async (fn) => {
        if (req.transactionID)
          throw new Error("Transação aninhada não suportada.");
        const id = await payload.db.beginTransaction();
        if (!id) throw new Error("Transações PostgreSQL indisponíveis.");
        req = await createLocalReq(
          {
            user: { ...actor, collection: "users" },
            req: { transactionID: id },
          },
          payload,
        );
        try {
          // Locks conflict with normal Admin writes, not just other importer processes.
          await (
            payload.db as unknown as {
              sessions: Record<
                string,
                { db: { execute: (query: unknown) => Promise<unknown> } }
              >;
            }
          ).sessions[String(id)].db.execute(
            globalSlug === "both"
              ? sql`LOCK TABLE pages, _pages_v, media, payload_folders, header, footer IN SHARE ROW EXCLUSIVE MODE`
              : globalSlug === "footer"
                ? sql`LOCK TABLE pages, _pages_v, media, payload_folders, footer IN SHARE ROW EXCLUSIVE MODE`
                : sql`LOCK TABLE pages, _pages_v, media, payload_folders, header IN SHARE ROW EXCLUSIVE MODE`,
          );
          let result;
          try {
            result = await fn();
          } catch (error) {
            await payload.db.rollbackTransaction(id);
            throw new RolledBack(
              error instanceof Error ? error.message : "Operação revertida.",
            );
          }
          // A commit failure is indeterminate: leave the journal pending for reconciliation.
          await payload.db.commitTransaction(id);
          return result;
        } catch (e) {
          if (!(e instanceof RolledBack))
            await payload.db.rollbackTransaction(id).catch(() => {});
          throw e;
        } finally {
          req = await createLocalReq(
            { user: { ...actor, collection: "users" } },
            payload,
          );
        }
      },
    };
    // Queries validate columns/relations against the existing schema; no DDL is run.
    for (const collection of ["pages", "media", "payload-folders"])
      await store.find(collection, {});
    for (const slug of globalSlug === "both"
      ? (["header", "footer"] as const)
      : [globalSlug])
      await store.getGlobal?.(slug);
    return {
      store,
      close: async () => {
        await payload.destroy();
        await database.close();
      },
    };
  } catch (e) {
    await payload.destroy();
    await database.close();
    throw e;
  }
}
