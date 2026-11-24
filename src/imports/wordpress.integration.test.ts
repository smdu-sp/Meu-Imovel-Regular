import assert from "node:assert/strict";
import { test } from "node:test";
import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { planHome } from "./wordpress/pages/home.ts";
import { applyHome, applyPage } from "./wordpress/shared/apply.ts";
import {
  SNAPSHOT,
  resolveSourceFile,
  resolveUploadsRoot,
} from "./wordpress/shared/source.ts";
import type { State } from "./wordpress/shared/migration-manifest.ts";

const uri = process.env.MIR_IMPORT_TEST_URI;
test(
  "PostgreSQL disposable: Payload validation, reexecution, folders, PDFs, audits and concurrent writes",
  { skip: !uri },
  async () => {
    if (new URL(uri!).pathname !== "/mir_import_test")
      throw new Error("Use exclusivamente banco descartável mir_import_test.");
    process.env.DISABLE_PAYLOAD_HMR = "true";
    process.env.DATABASE_URI = uri;
    process.env.LDAP_AUTH_MODE = "external";
    const [{ getPayload }, { default: configuration }] = await Promise.all([
      import("payload"),
      import("../payload.config.ts"),
    ]);
    const config = await configuration;
    const dir = await mkdtemp(path.join(os.tmpdir(), "mir-upload-test-"));
    const { isolatedAdapter } =
      await import("./wordpress/shared/payload-store.ts");
    const setupDb = await isolatedAdapter(uri!, true);
    config.db = setupDb.adapter;
    const users = config.collections.find((c) => c.slug === "users")!;
    users.hooks.beforeValidate = [];
    const mediaConfig = config.collections.find((c) => c.slug === "media")!;
    if (typeof mediaConfig.upload === "object")
      mediaConfig.upload.staticDir = dir;
    const setup = await getPayload({ config, key: "wordpress-setup-test" });
    try {
      const actor = await setup.create({
        collection: "users",
        data: {
          login: "test.import",
          nome: "Teste",
          email: "import@example.test",
          role: "admin",
        },
        overrideAccess: true,
      });
      await setup.destroy();
      await setupDb.close();
      const { connectStore } =
        await import("./wordpress/shared/payload-store.ts");
      const connection = await connectStore(uri!, actor.id);
      const { store } = connection;
      try {
        const plan = await planHome(
          resolveSourceFile(),
          resolveUploadsRoot(),
        );
        const state: State = {
          version: 1,
          target: "test",
          label: "test",
          snapshot: SNAPSHOT,
          entries: {},
        };
        let saves = 0;
        const save = async () => {
          saves++;
        };
        const create = store.create;
        let attempts = 0;
        store.create = async (collection, data, file) => {
          if (collection === "media" && ++attempts === 4)
            throw new Error("Falha parcial simulada");
          return create(collection, data, file);
        };
        await assert.rejects(
          applyHome(plan, store, state, save),
          /Falha parcial/,
        );
        assert.equal(state.pending, undefined);
        assert.equal((await store.find("media", {})).length, 3);
        store.create = create;
        const result = await applyHome(plan, store, state, save);
        assert.equal(Object.keys(result.media).length, 17);
        const page = await store.get("pages", result.pageId, true);
        assert.equal(page._status, "draft");
        const firstSaves = saves;
        await applyHome(plan, store, state, save);
        assert.equal(saves, firstSaves);
        assert.equal((await store.find("media", {})).length, 17);
        assert.equal((await store.find("payload-folders", {})).length, 4);
        const audits = await store.find("audit-logs", {});
        assert(audits.length > 0);
        assert.equal(audits[0].actor, actor.id);
        await assert.rejects(
          applyHome(plan, store, { ...state, entries: {} }, save),
          /preexistente/,
        );
        // A real concurrent Admin write must wait on the table lock, then survive.
        const { default: pg } = await import("pg");
        const client = new pg.Client({ connectionString: uri! });
        await client.connect();
        try {
          await store.transaction(async () => {
            await client.query("SET lock_timeout='100ms'");
            await assert.rejects(
              client.query("UPDATE pages SET title='Concurrent' WHERE id=$1", [
                result.pageId,
              ]),
              /lock timeout/,
            );
          });
        } finally {
          await client.end();
        }
        await store.transaction(() =>
          store.update(result.pageId, { title: "Editada no Admin" }),
        );
        await assert.rejects(applyHome(plan, store, state, save), /Conflito/);
        const { planEntenda, applyEntenda } =
          await import("./wordpress/pages/entenda.ts");
        const entendaPlan = await planEntenda(
          resolveSourceFile(),
          resolveUploadsRoot(),
        );
        const homeEntry = structuredClone(state.entries["page:87"]);
        const entenda = await applyEntenda(entendaPlan, store, state, save);
        assert.equal(entenda.media["712"], result.media["712"]);
        assert.equal(entenda.media["776"], result.media["776"]);
        assert.equal((await store.find("media", {})).length, 20);
        assert.equal((await store.find("payload-folders", {})).length, 6);
        assert.deepEqual(state.entries["page:87"], homeEntry);
        assert.equal(
          (await store.get("pages", result.pageId, true)).title,
          "Editada no Admin",
        );
        const savedEntenda = await store.get("pages", entenda.pageId, true);
        assert.equal(savedEntenda.slug, "entenda");
        assert.equal(savedEntenda._status, "draft");
        assert.equal((savedEntenda.layout as unknown[]).length, 8);
        const checkpoints = saves;
        await applyEntenda(entendaPlan, store, state, save);
        assert.equal(saves, checkpoints);
        const withoutEntenda = structuredClone(state);
        delete withoutEntenda.entries["page:172"];
        await assert.rejects(
          applyEntenda(entendaPlan, store, withoutEntenda, save),
          /preexistente/,
        );
        assert(
          state.reviews?.["172"].some((s) => s.includes("Destino temporário")),
        );
        const { planBeneficios, applyBeneficios } =
          await import("./wordpress/pages/beneficios.ts");
        const beneficiosPlan = await planBeneficios(
          resolveSourceFile(),
          resolveUploadsRoot(),
        );
        const sharedBefore = await store.get("media", result.media["712"]);
        const beneficios = await applyBeneficios(
          beneficiosPlan,
          store,
          state,
          save,
        );
        assert.equal(beneficios.media["712"], result.media["712"]);
        assert.deepEqual(
          await store.get("media", result.media["712"]),
          sharedBefore,
        );
        assert.equal((await store.find("media", {})).length, 24);
        assert.equal((await store.find("payload-folders", {})).length, 8);
        const savedBeneficios = await store.get(
          "pages",
          beneficios.pageId,
          true,
        );
        assert.equal(savedBeneficios._status, "draft");
        assert.equal(
          savedBeneficios.slug,
          "beneficios-de-regularizar-o-imovel",
        );
        assert.equal((savedBeneficios.layout as unknown[]).length, 6);
        const beforeRepeat = saves;
        await applyBeneficios(beneficiosPlan, store, state, save);
        assert.equal(saves, beforeRepeat);
        const withoutBeneficios = structuredClone(state);
        delete withoutBeneficios.entries["page:210"];
        await assert.rejects(
          applyBeneficios(beneficiosPlan, store, withoutBeneficios, save),
          /preexistente/,
        );
        await store.transaction(() =>
          store.update(beneficios.pageId, {
            title: "Benefícios revisados no Admin",
          }),
        );
        await assert.rejects(
          applyBeneficios(beneficiosPlan, store, state, save),
          /Conflito/,
        );
        const { planSituacao, applySituacao } =
          await import("./wordpress/pages/situacao.ts");
        const situacaoPlan = await planSituacao(
          resolveSourceFile(),
          resolveUploadsRoot(),
        );
        const situacao = await applySituacao(situacaoPlan, store, state, save);
        const savedSituacao = await store.get("pages", situacao.pageId, true);
        assert.equal(savedSituacao._status, "draft");
        assert.equal(savedSituacao.slug, "situacao");
        const layout = savedSituacao.layout as {
          blockType: string;
          action?: { url: string; newTab: boolean };
        }[];
        assert.deepEqual(
          layout.map((b) => b.blockType),
          ["fullWidthImageBanner", "richText", "imageBlock", "richText", "cta"],
        );
        assert.equal(layout[4].action?.url, situacaoPlan.url);
        assert.equal(layout[4].action?.newTab, true);
        assert.equal((await store.find("media", {})).length, 26);
        assert.equal((await store.find("payload-folders", {})).length, 10);
        const beforeSituacaoRepeat = saves;
        await applySituacao(situacaoPlan, store, state, save);
        assert.equal(saves, beforeSituacaoRepeat);
        const withoutSituacao = structuredClone(state);
        delete withoutSituacao.entries["page:176"];
        await assert.rejects(
          applySituacao(situacaoPlan, store, withoutSituacao, save),
          /preexistente/,
        );
        await store.transaction(() =>
          store.update(situacao.pageId, {
            title: "Situação revisada no Admin",
          }),
        );
        await assert.rejects(
          applySituacao(situacaoPlan, store, state, save),
          /Conflito/,
        );
        const { planFaq, applyFaq, faqData } =
          await import("./wordpress/pages/faq.ts");
        const faqPlan = await planFaq(
          resolveSourceFile(),
          resolveUploadsRoot(),
        );
        // Reproduce the previous importer before upgrading only its manual destinations.
        const previousFaq = await applyPage(
          {
            ...faqPlan,
            assets: faqPlan.assets.filter((a) => a.usage === "content"),
          },
          store,
          state,
          save,
          {
            id: "174",
            slug: "faq",
            folders: ["MIR", "MIR/FAQ", "MIR/FAQ/Imagens"],
            build: (media) => faqData(faqPlan, media),
          },
        );
        const sharedManual = await store.get("media", result.media["1196"]);
        const faq = await applyFaq(faqPlan, store, state, save);
        assert.equal(faq.pageId, previousFaq.pageId);
        for (const id of ["1196", "1188", "1187"])
          assert.equal(faq.media[id], result.media[id]);
        assert.deepEqual(
          await store.get("media", result.media["1196"]),
          sharedManual,
        );
        const savedFaq = await store.get("pages", faq.pageId, true);
        assert.equal(savedFaq._status, "draft");
        assert.equal(savedFaq.slug, "faq");
        const faqLayout = savedFaq.layout as {
          blockType: string;
          items?: { image?: number; question?: string; answer?: unknown }[];
        }[];
        assert.deepEqual(
          faqLayout.map((b) => b.blockType),
          [
            "mirBanner",
            "richText",
            "mirCards",
            "faqAccordion",
            "faqAccordion",
            "imageBlock",
          ],
        );
        assert.deepEqual(
          [faqLayout[3].items?.length, faqLayout[4].items?.length],
          [15, 14],
        );
        assert.deepEqual(
          faqLayout[2].items?.map((i) => i.image),
          [
            faq.media["733"],
            faq.media["800"],
            faq.media["732"],
            faq.media["734"],
          ],
        );
        for (const index of [3, 7]) {
          // Answers 19 and 23 in the second accordion.
          const answer = JSON.stringify(faqLayout[4].items![index].answer);
          for (const id of ["1196", "1188", "1187"]) {
            const document = await store.get("media", result.media[id]);
            assert(answer.includes(document.url as string));
          }
          assert.doesNotMatch(answer, /wp-content\/uploads/);
        }
        assert.doesNotMatch(JSON.stringify(savedFaq), /anisti/i);
        assert.equal((await store.find("media", {})).length, 32);
        assert.equal((await store.find("payload-folders", {})).length, 13);
        const beforeFaqRepeat = saves;
        await applyFaq(faqPlan, store, state, save);
        assert.equal(saves, beforeFaqRepeat);
        const withoutFaq = structuredClone(state);
        delete withoutFaq.entries["page:174"];
        await assert.rejects(
          applyFaq(faqPlan, store, withoutFaq, save),
          /preexistente/,
        );
        await store.transaction(() =>
          store.update(faq.pageId, { title: "FAQ revisada no Admin" }),
        );
        await assert.rejects(applyFaq(faqPlan, store, state, save), /Conflito/);
        const { planCartilha, applyCartilha } =
          await import("./wordpress/pages/cartilha.ts");
        const cartilhaPlan = await planCartilha(
          resolveSourceFile(),
          resolveUploadsRoot(),
        );
        const cartilha = await applyCartilha(cartilhaPlan, store, state, save);
        const savedCartilha = await store.get("pages", cartilha.pageId, true);
        assert.equal(savedCartilha._status, "draft");
        assert.equal(savedCartilha.slug, "cartilha");
        const cartilhaLayout = savedCartilha.layout as {
          blockType: string;
          action?: { type: string; document: number; newTab: boolean };
        }[];
        assert.deepEqual(
          cartilhaLayout.map((b) => b.blockType),
          ["fullWidthImageBanner", "richText", "cta"],
        );
        assert.equal(cartilhaLayout[2].action?.type, "document");
        assert.equal(
          cartilhaLayout[2].action?.document,
          cartilha.media["1129"],
        );
        assert.equal(cartilhaLayout[2].action?.newTab, false);
        const cartilhaPdf = await store.get("media", cartilha.media["1129"]);
        assert.equal(cartilhaPdf.mimeType, "application/pdf");
        assert.equal(cartilhaPdf.usage, "document");
        assert.equal(cartilhaPdf.filesize, 4676839);
        assert.equal(
          cartilhaPdf.folder,
          state.entries["folder:MIR/Cartilha/Documentos"].id,
        );
        assert.equal(
          (await store.get("media", cartilha.media["1150"])).folder,
          state.entries["folder:MIR/Cartilha/Imagens"].id,
        );
        assert.equal((await store.find("media", {})).length, 34);
        assert.equal((await store.find("payload-folders", {})).length, 16);
        const beforeCartilhaRepeat = saves;
        await applyCartilha(cartilhaPlan, store, state, save);
        assert.equal(saves, beforeCartilhaRepeat);
        const withoutCartilha = structuredClone(state);
        delete withoutCartilha.entries["page:1145"];
        await assert.rejects(
          applyCartilha(cartilhaPlan, store, withoutCartilha, save),
          /preexistente/,
        );
        await store.transaction(() =>
          store.update(cartilha.pageId, {
            title: "Cartilha revisada no Admin",
          }),
        );
        await assert.rejects(
          applyCartilha(cartilhaPlan, store, state, save),
          /Conflito/,
        );
        const { planAutomatica, applyAutomatica } =
          await import("./wordpress/pages/regularizacao-automatica.ts");
        const automaticaPlan = await planAutomatica(
          resolveSourceFile(),
          resolveUploadsRoot(),
        );
        const manualBefore = await store.get("media", result.media["1196"]);
        const automatica = await applyAutomatica(
          automaticaPlan,
          store,
          state,
          save,
        );
        const savedAutomatica = await store.get(
          "pages",
          automatica.pageId,
          true,
        );
        assert.equal(savedAutomatica._status, "draft");
        assert.equal(savedAutomatica.slug, "regularizacao-automatica");
        const automaticaLayout = savedAutomatica.layout as {
          blockType: string;
          type?: string;
          items?: { link: { type: string; document: number } }[];
        }[];
        assert.equal(automaticaLayout.length, 9);
        assert.equal(automaticaLayout[7].blockType, "iconGrid");
        assert.deepEqual(
          automaticaLayout[7].items?.map((i) => i.link.document),
          ["1196", "1191", "1188", "1187"].map((id) => result.media[id]),
        );
        assert(
          automaticaLayout[7].items?.every((i) => i.link.type === "document"),
        );
        assert.equal(automaticaLayout[8].type, "info");
        for (const id of ["1196", "1191", "1188", "1187"])
          assert.equal(automatica.media[id], result.media[id]);
        assert.deepEqual(
          await store.get("media", result.media["1196"]),
          manualBefore,
        );
        assert.equal((await store.find("media", {})).length, 39);
        assert.equal((await store.find("payload-folders", {})).length, 20);
        const beforeAutomaticaRepeat = saves;
        await applyAutomatica(automaticaPlan, store, state, save);
        assert.equal(saves, beforeAutomaticaRepeat);
        const withoutAutomatica = structuredClone(state);
        delete withoutAutomatica.entries["page:193"];
        await assert.rejects(
          applyAutomatica(automaticaPlan, store, withoutAutomatica, save),
          /preexistente/,
        );
        await store.transaction(() =>
          store.update(automatica.pageId, {
            title: "Automática revisada no Admin",
          }),
        );
        await assert.rejects(
          applyAutomatica(automaticaPlan, store, state, save),
          /Conflito/,
        );
        const { planSimplificada, applySimplificada } =
          await import("./wordpress/pages/regularizacao-declaratoria-simplificada.ts");
        const simplificadaPlan = await planSimplificada(
          resolveSourceFile(),
          resolveUploadsRoot(),
        );
        const flowBefore = await store.get("media", automatica.media["223"]);
        const simplificada = await applySimplificada(
          simplificadaPlan,
          store,
          state,
          save,
        );
        const savedSimplificada = await store.get(
          "pages",
          simplificada.pageId,
          true,
        );
        assert.equal(savedSimplificada._status, "draft");
        assert.equal(
          savedSimplificada.slug,
          "regularizacao-declaratoria-simplificada",
        );
        const simplificadaLayout = savedSimplificada.layout as {
          blockType: string;
          type?: string;
          items?: { link: { document: number } }[];
        }[];
        assert.equal(simplificadaLayout.length, 9);
        assert.equal(simplificadaLayout[8].type, "danger");
        assert.match(
          JSON.stringify(simplificadaLayout[8]),
          /não se admite a emissão de comunicado/,
        );
        assert.doesNotMatch(
          JSON.stringify(savedSimplificada),
          /indeferimento sumário|anisti|wp-content/,
        );
        assert.deepEqual(
          simplificadaLayout[7].items?.map((i) => i.link.document),
          ["1196", "1191", "1188", "1187"].map((id) => result.media[id]),
        );
        for (const id of ["223", "1196", "1191", "1188", "1187"])
          assert.equal(simplificada.media[id], automatica.media[id]);
        assert.deepEqual(
          await store.get("media", automatica.media["223"]),
          flowBefore,
        );
        assert.equal((await store.find("media", {})).length, 43);
        assert.equal((await store.find("payload-folders", {})).length, 23);
        const beforeSimplificadaRepeat = saves;
        await applySimplificada(simplificadaPlan, store, state, save);
        assert.equal(saves, beforeSimplificadaRepeat);
        const withoutSimplificada = structuredClone(state);
        delete withoutSimplificada.entries["page:760"];
        await assert.rejects(
          applySimplificada(simplificadaPlan, store, withoutSimplificada, save),
          /preexistente/,
        );
        await store.transaction(() =>
          store.update(simplificada.pageId, {
            title: "Simplificada revisada no Admin",
          }),
        );
        await assert.rejects(
          applySimplificada(simplificadaPlan, store, state, save),
          /Conflito/,
        );
        const { planDeclaratoria, applyDeclaratoria } =
          await import("./wordpress/pages/regularizacao-declaratoria.ts");
        const { planComum, applyComum } =
          await import("./wordpress/pages/regularizacao-comum.ts");
        const declaratoriaPlan = await planDeclaratoria(
          resolveSourceFile(),
          resolveUploadsRoot(),
        );
        const declaratoria = await applyDeclaratoria(
          declaratoriaPlan,
          store,
          state,
          save,
        );
        const comumPlan = await planComum(
          resolveSourceFile(),
          resolveUploadsRoot(),
        );
        const comum = await applyComum(comumPlan, store, state, save);
        for (const id of [
          "1116",
          "1120",
          "223",
          "1196",
          "1191",
          "1188",
          "1187",
        ])
          assert.equal(comum.media[id], declaratoria.media[id]);
        for (const [plan, apply, resultPage] of [
          [declaratoriaPlan, applyDeclaratoria, declaratoria],
          [comumPlan, applyComum, comum],
        ] as const) {
          const doc = await store.get("pages", resultPage.pageId, true);
          assert.equal(doc._status, "draft");
          assert.equal((doc.layout as unknown[]).length, 12);
          assert.doesNotMatch(JSON.stringify(doc.layout), /wp-admin/);
          const checkpoints = saves;
          await apply(plan, store, state, save);
          assert.equal(saves, checkpoints);
          const unmanaged = structuredClone(state);
          delete unmanaged.entries[
            doc.slug === "regularizacao-declaratoria" ? "page:204" : "page:206"
          ];
          await assert.rejects(
            apply(plan, store, unmanaged, save),
            /preexistente/,
          );
          await store.transaction(() =>
            store.update(resultPage.pageId, { title: "Revisada no Admin" }),
          );
          await assert.rejects(apply(plan, store, state, save), /Conflito/);
        }
        assert.equal((await store.find("media", {})).length, 54);
        assert.equal((await store.find("payload-folders", {})).length, 29);
      } catch (error) {
        console.error(error);
        throw error;
      } finally {
        await connection.close();
      }
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  },
);
