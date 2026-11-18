---
spec: MIR-006
title: Importador editorial da Cartilha WordPress
status: implemented
date: 2026-11-17
---

# MIR-006 — Importador editorial da Cartilha

## 1. Resultado esperado

Especificar a importação editorial da página **Cartilha** (slug `cartilha`), convertendo a capa panorâmica e o texto introdutório para os blocos nativos do Payload CMS (`fullWidthImageBanner`, `richText` e `cta` com link de documento).

O comando deve simular a importação offline (`--dry-run`), cadastrar a capa gráfica em `MIR/Cartilha/Imagens` e o documento PDF oficial da cartilha (`Cartilha_Lei_de_Regularização.pdf`, anexo 1129, 4,67 MB) em `MIR/Cartilha/Documentos`, gerando a página em rascunho com o botão de download devidamente associado à collection `media` via action link de documento.

## 2. Referências e precedência

- [MIR-001 — Importador editorial da Home](./mir-001-importador-home.md): modelo de importador, preflight, manifesto e suporte a documentos PDF.
- [Mapeamento de todas as páginas](../mapas/todas-paginas.md): inventário da Cartilha.
- [Media Library PDF](../../CMS%20-%20DOCS/media-library-pdf/especificacao.md) e [Document Action Links](../../CMS%20-%20DOCS/document-action-links/especificacao.md).
- [Blocos Payload](../../../src/blocks/catalog.ts): `fullWidthImageBanner`, `richText`, `cta`.
- [Guardrails do Projeto](../../../AGENTS.md): conformidade institucional e sem promessas jurídicas em componentes visuais.

## 3. Escopo

- Tradução explícita do post WordPress ID `1145`, slug `cartilha`, para a collection `pages`.
- Uma imagem de capa (`I01`, anexo 1150: `2020/01/capa-cartilha-meuimovelregular-2-scaled.jpg`).
- Um arquivo PDF oficial (`D01`, anexo 1129: `2020/01/Cartilha_Lei_de_Regularização.pdf`, 4.676.839 bytes, hash `4ae38a3bb7d48a8d1b00704dbf86bdd42e93b641ad8bd7d78833838326ac2c07`).
- Criação das pastas de mídia `MIR/Cartilha/Imagens` e `MIR/Cartilha/Documentos`.
- Ação de download acessível vinculada à Media via relação `document` do campo de link nativo.

Fora do escopo: embutimento de visualizador PDF no navegador (PDF.js ou iframe), publicação automática ou criação de páginas adicionais.

## 4. Estrutura proposta

```text
src/imports/wordpress/
  pages/
    cartilha.ts                # montagem da página, banner, richText e CTA
    cartilha-content.ts        # texto editorial da cartilha e metadados
```

## 5. Entrada e extração

- **Fonte**: `old-wordpress/db/meuimovelregular.sql` e diretório de uploads.
- **Snapshot SHA-256**: `ea309012c96c456c8c0568959a1f1bce5ae5d077239e9605bc9bdd333986264b`.
- **Registro de origem**: `wp_posts.ID = 1145`, `post_name = "cartilha"`, `post_title = "Cartilha"`.
- **Composição**: `wp_postmeta` com `post_id = 1145` e `meta_key = "dslc_code"` (2 seções, `$[0]` e `$[1]`).
- **Anexo PDF**: identificado no texto da seção `$[1]` e registrado em `wp_posts.ID = 1129` com `_wp_attached_file = "2020/01/Cartilha_Lei_de_Regularização.pdf"`.

## 6. Contrato dos comandos

```bash
npm run import:wordpress -- cartilha --dry-run
npm run import:wordpress -- cartilha --apply --actor-id 1 --target-label mir-local
```

### Simulação (`--dry-run`)
Validação offline sem conexão com o banco. Verifica a existência e integridade física da capa JPEG e do PDF da cartilha (4,67 MB), calcula hashes e valida a árvore Lexical do texto.

### Aplicação (`--apply`)
Cria as duas pastas em `MIR/Cartilha/`, faz o upload seguro da capa (`usage="content"`) e do PDF (`usage="document"`), cria a relação de documento no CTA e salva a página em rascunho com registro no manifesto.

## 7. Tradução da Cartilha

Configuração no destino: `title="Cartilha"`, `slug="cartilha"`, `_status="draft"`, `lifecycleStatus="active"`.

| Ordem | Origem no JSON legado | Destino no Payload | Configuração e Campos |
| --- | --- | --- | --- |
| 1 | `$[0]`, DSLC_Image (anexo 1150) | `fullWidthImageBanner` | `desktopImage=I01`, `imageHeight=auto`, `overlay=none`. Alternativa: "Capa da Cartilha Entenda a nova Lei de Regularização de Edificações". |
| 2 | `$[1]`, DSLC_Text_Simple | `richText` | Título H1 "Entenda a nova Lei de Regularização de Edificações" e apresentação editorial da SMUL sobre o propósito informativo e educativo da publicação. |
| 3 | Ação derivada do link do PDF | `cta` | Chamada destacada de download: `label="Baixar Cartilha Completa (PDF)"`, `type="document"`, `document=Media.id (D01)`, `newTab=false`, download direto habilitado. |

### Diretrizes editoriais
- O texto explicativo deve ser revisado institucionalmente antes da publicação para confirmar se o material reflete a vigência e os prazos atuais do município.
- O botão de ação utiliza o tipo de link `document`, apontando para a Media correspondente em vez de manter URLs estáticas hardcoded no rich text.

## 8. Mídias e pastas

- **Pastas destino**: `MIR/Cartilha/Imagens` e `MIR/Cartilha/Documentos`.

| Ref | Anexo WP | Arquivo físico em uploads | Hash SHA-256 | MIME | Tamanho | Pasta MIR | Uso |
| --- | --- | --- | --- | --- | --- | --- | --- |
| I01 | 1150 | `2020/01/capa-cartilha-meuimovelregular-2-scaled.jpg` | `3a3294ea1d00b54bdf7ac25d2715549055f1c2cae4503feaf8746f2301565d90` | `image/jpeg` | 187.461 B | `MIR/Cartilha/Imagens` | `content` |
| D01 | 1129 | `2020/01/Cartilha_Lei_de_Regularização.pdf` | `4ae38a3bb7d48a8d1b00704dbf86bdd42e93b641ad8bd7d78833838326ac2c07` | `application/pdf` | 4.676.839 B | `MIR/Cartilha/Documentos` | `document` |

## 9. Manifesto, identidade e conflitos

- Mapeia post WP `1145` para `pages.id` e o PDF anexo `1129` para `media.id`.
- Se a página `cartilha` já estiver criada ou alterada, interrompe a execução com conflito.
- A mídia do PDF é protegida contra re-uploads duplicados se o hash for idêntico.

## 10. Escrita, falhas e auditoria

- Carga por fases: pastas → upload de mídia → resolução de ID → criação da página.
- Transação atômica e auditoria associada ao ator administrador.

## 11. Arquivos previstos e impacto persistido

| Arquivo / Coleção | Impacto | Migração necessária? |
| --- | --- | --- |
| `src/imports/wordpress/pages/cartilha.ts` | Montagem da página e blocos | Não |
| `src/imports/wordpress/pages/cartilha-content.ts` | Textos e metadados da cartilha | Não |
| `src/imports/wordpress/run.ts` | Registro da opção `cartilha` | Não |
| Coleção `pages` | Criação de 1 rascunho (`slug="cartilha"`) | Não |
| Coleção `media` | Upload de 1 imagem e 1 PDF | Não |
| `payload-folders` | Criação de pastas em `MIR/Cartilha/` | Não |

## 12. Validação e critérios de aceite

- [x] Simulação offline valida os hashes da imagem e do PDF de 4,67 MB sem tocar no banco de dados.
- [x] Upload do PDF realizado com `usage="document"` na pasta de documentos.
- [x] CTA de download configurado com link de documento apontando para a Media cadastrada.
- [x] Rascunho da página gerado com conformidade sem tocar em páginas publicadas.

## 13. Registro desta especificação

- Decisões: separação física e lógica da imagem de capa e do documento PDF em pastas distintas; uso de `cta` com relação de documento nativa para o download do PDF.


## 14. Implementação e validação

Implementado em 18/11/2026; consulte o [guia operacional](../relatorio-specs/importador-cartilha.md).

- Origem conferida: post 1145/meta 4133; duas seções, capa e PDF validados por origem, hash, tamanho e assinatura.
- Três blocos existentes: banner, introdução com H1 e CTA Documento relacionado ao anexo 1129 na Media. O parágrafo do link legado foi convertido em CTA, preservando os demais textos da apresentação.
- Sem desvio estrutural, alteração de schema, migration, componente ou Globals. Atomicidade por operação com checkpoints, sem promessa de transação única entre banco, arquivos e manifesto.
- Validações: simulação real; `npm run typecheck`; `npx eslint src/imports`; `DISABLE_PAYLOAD_HMR=true npm test` (114 passaram, um opcional ignorado); integração PostgreSQL 17 descartável; `git diff --check`.
- Integração confirmou rascunho com três blocos, PDF com `usage=document`, pastas distintas para capa e documento, CTA com relação correta, reexecução sem gravações, colisão de slug sem manifesto e conflito após edição manual. Após as seis páginas, 34 mídias e 16 pastas.
- O banco da instância não recebeu carga. O container temporário foi removido após a validação. Pendentes revisão institucional do texto/PDF, conferência visual no Admin/preview e download manual.

Organização documental: o guia operacional foi criado em `relatorio-specs/`, acompanhando a reorganização dos guias feita durante a implementação.
