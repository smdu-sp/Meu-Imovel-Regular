---
spec: MIR-003
title: Importador editorial de Benefícios de Regularizar o Imóvel WordPress
status: implemented
date: 2026-11-17
---

# MIR-003 — Importador editorial de Benefícios de Regularizar o Imóvel

## 1. Resultado esperado

Fornecer um comando de importação editorial dedicado para a página **Benefícios de Regularizar o Imóvel**, convertendo a composição do builder legado para os blocos nativos do Payload CMS (`fullWidthImageBanner`, `richText` e 4 blocos `imageText` temáticos).

O comando deve simular a importação offline (`--dry-run`), cadastrar os assets na pasta lógica `MIR/Beneficios/Imagens`, reutilizar mídias já existentes no manifesto sem duplicação física, gerar a página em rascunho com vínculo de auditoria e garantir total rastreabilidade e idempotência.

## 2. Referências e precedência

- [MIR-001 — Importador editorial da Home](./mir-001-importador-home.md): modelo de runner, preflight, manifesto e persistência.
- [MIR-002 — Importador editorial de Entenda a Lei](./mir-002-importador-entenda.md).
- [Mapeamento de todas as páginas](../mapas/todas-paginas.md): inventário de links.
- [Blocos Payload](../../../src/blocks/catalog.ts): `fullWidthImageBanner`, `richText`, `imageText`.
- [Guardrails do Projeto](../../../AGENTS.md): terminologia institucional obrigatória, ausência de alegações jurídicas definitivas no frontend.

## 3. Escopo

- Tradução explícita do post WordPress ID `210`, slug `beneficios-de-regularizar-o-imovel`, para a collection `pages`.
- Cinco imagens (`I01`–`I05`) identificadas no acervo físico de uploads (`capa_benefícios_1920px_70dpi.jpg`, `sergio-souza-IpvSreCKPrc-unsplash_1200px_70dpi.jpg`, `foto-alberto-simon-archdaily_1200px_70dpi.jpg`, `2580807_1200px_70dpi.jpg`, `eduardo-dutra-UsAHeWZcrnA-unsplash-e1571000451555.jpg`).
- Reutilização transparente do anexo `712` (já introduzido na Home e em Entenda), evitando uploads redundantes.
- Organização das imagens novas em `MIR/Beneficios/Imagens`.
- Quatro blocos estruturados de benefícios (`imageText`) categorizados por público-alvo: Cidade, Proprietário Residencial, Empreendedor/Comerciante e Imóveis Institucionais.

Fora do escopo: publicação da página, alteração de menus/Globals, criação de formulários ou componentes não existentes no catálogo.

## 4. Estrutura proposta

```text
src/imports/wordpress/
  pages/
    beneficios.ts              # montagem do plano, blocos e layout
    beneficios-content.ts      # conteúdo textual, listas de benefícios e metadados
```

Reaproveita os runners e helpers centrais de `src/imports/wordpress/shared/`.

## 5. Entrada e extração

- **Fonte**: `old-wordpress/db/meuimovelregular.sql` e diretório de uploads.
- **Snapshot SHA-256**: `ea309012c96c456c8c0568959a1f1bce5ae5d077239e9605bc9bdd333986264b`.
- **Registro de origem**: `wp_posts.ID = 210`, `post_name = "beneficios-de-regularizar-o-imovel"`, `post_title = "Benefícios de Regularizar o imóvel"`.
- **Composição**: `wp_postmeta` com `post_id = 210` e `meta_key = "dslc_code"`, composto por 6 seções (`$[0]` a `$[5]`).

## 6. Contrato dos comandos

```bash
npm run import:wordpress -- beneficios --dry-run
npm run import:wordpress -- beneficios --apply --actor-id 1 --target-label mir-local
```

### Simulação (`--dry-run`)
Validação offline sem conexão com o banco. Verifica snapshot, integridade dos 5 arquivos de imagem, geração das listas Lexical dos benefícios e emite relatório com referências simbólicas.

### Aplicação (`--apply`)
Executa verificações prévias, cria a pasta de mídia, efetua uploads necessários no Payload Media com verificação de MIME/assinatura, reusa o anexo 712 e grava a página em rascunho com registro no manifesto local.

## 7. Tradução de Benefícios

Configuração do destino: `title="Benefícios de Regularizar o Imóvel"`, `slug="beneficios-de-regularizar-o-imovel"`, `_status="draft"`, `lifecycleStatus="active"`.

| Ordem | Origem no JSON legado | Destino no Payload | Configuração e Campos |
| --- | --- | --- | --- |
| 1 | `$[0]`, DSLC_Image (anexo 736) | `fullWidthImageBanner` | `desktopImage=I01`, `imageHeight=auto`, `overlay=none`. Alternativa textual revisável. |
| 2 | `$[1]`, DSLC_Text_Simple | `richText` | Título H1 "Benefícios de regularizar o imóvel" e introdução contextualizando o valor social e urbanístico da posse regularizada, com link oficial para a Lei nº 17.202/2019. |
| 3 | `$[2]`, DSLC_Image (711) + texto | `imageText` | **Benefícios para a cidade**: `image=I02`, `variant="image-right"`. Lista com: ampliação da segurança do espaço construído, orientação do planejamento territorial e estímulo ao desenvolvimento econômico. |
| 4 | `$[3]`, DSLC_Image (712) + texto | `imageText` | **Benefícios para o proprietário residencial**: `image=I03`, `variant="image-left"`. Lista com: segurança jurídica, venda/transferência/locação legal, acesso a financiamento e garantia de comprovação de endereço. |
| 5 | `$[4]`, DSLC_Image (713) + texto | `imageText` | **Benefícios para o empreendedor e comerciante**: `image=I04`, `variant="image-right"`. Lista com: regularidade para licença de funcionamento, valorização do ponto comercial, segurança na sucessão e acesso a crédito. |
| 6 | `$[5]`, DSLC_Image (325) + texto | `imageText` | **Benefícios para imóveis institucionais**: `image=I05`, `variant="image-left"`. Lista com: segurança de uso para templos, entidades e serviços, celebração de convênios/parcerias e proteção patrimonial. |

### Diretrizes editoriais
- Formatação dos itens como listas ordenadas ou não ordenadas válidas em Lexical.
- Remoção de qualquer menção reflexa ao termo "anistia".
- Assegurar que os benefícios não configurem garantia jurídica expressa ou dispensa incondicional de fiscalização fora das hipóteses legais.

## 8. Mídias e pastas

- **Pasta destino**: `MIR/Beneficios/Imagens`.
- Classificação: `usage="content"`, MIME `image/jpeg`.

| Ref | Anexo WP | Arquivo físico em uploads | Hash SHA-256 | Tamanho | Título editorial / Alt | Reuso |
| --- | --- | --- | --- | --- | --- | --- |
| I01 | 736 | `2019/10/capa_benefícios_1920px_70dpi.jpg` | `00c8c5378038b5bcc9f02b611b04e696df089ef4264691fb7bb69e32e93f9086` | 422.632 B | Capa Benefícios de Regularizar | Novo |
| I02 | 711 | `2019/10/sergio-souza-IpvSreCKPrc-unsplash_1200px_70dpi.jpg` | `d50c3d8ceefc82d4fdd8b6dfa3a8466e441a1948540615cdcad71ab845d9dc5e` | 229.719 B | Benefícios para a Cidade | Novo |
| I03 | 712 | `2019/10/foto-alberto-simon-archdaily_1200px_70dpi.jpg` | `526eac80c62746144e1d9211591fe1f68be23a786202463678a7e31e3e2cdf60` | 100.777 B | Benefícios Proprietário Residencial | Reuso da Home (I03) |
| I04 | 713 | `2019/10/2580807_1200px_70dpi.jpg` | `da14d49ec982fbfdc78d7eecc053b596334ac957b1d748631c60a66c8e9fadbe` | 159.444 B | Benefícios Empreendedor | Novo |
| I05 | 325 | `2019/10/eduardo-dutra-UsAHeWZcrnA-unsplash-e1571000451555.jpg` | `a1da03f389fe30312b898e36d141eb963cc8c93169e77cfadeefa2e9e882cfd4` | 569.184 B | Benefícios Institucional | Novo |

## 9. Manifesto, identidade e conflitos

- Registra post WP `210` no manifesto da instância.
- Se a página `beneficios-de-regularizar-o-imovel` já existir sem registro no manifesto, interrompe a execução com erro de colisão de slug.
- Identifica se o anexo 712 já possui Media correspondente gravada e utiliza seu ID diretamente.

## 10. Escrita, falhas e auditoria

- Execução em lote via Local API com propagação do ator administrativo.
- Tratamento de rollback seguro via checkpoints de manifesto.
- Mídias gravadas com validação de tipo de arquivo e dimensão.

## 11. Arquivos previstos e impacto persistido

| Arquivo / Coleção | Impacto | Migração necessária? |
| --- | --- | --- |
| `src/imports/wordpress/pages/beneficios.ts` | Montagem da página e blocos | Não |
| `src/imports/wordpress/pages/beneficios-content.ts` | Listas de benefícios e textos | Não |
| `src/imports/wordpress/run.ts` | Registro da opção `beneficios` | Não |
| Coleção `pages` | Criação de 1 documento rascunho | Não |
| Coleção `media` | Upload de até 4 imagens novas e reuso de 1 | Não |
| `payload-folders` | Criação de `MIR/Beneficios/Imagens` | Não |

## 12. Validação e critérios de aceite

- [x] Simulação offline verifica integridade dos 5 arquivos e listas de conteúdo.
- [x] Diagramação alternada (direita/esquerda) nos 4 blocos de público-alvo.
- [x] Reuso do anexo 712 comprovado no manifesto e no layout sem duplicação.
- [x] Página gerada em rascunho com conteúdo fiel ao original, sem termos vedados.
- [x] Testes automatizados de snapshot do layout e verificação de integridade dos links.

## 13. Registro desta especificação

- Decisões: uso de 4 blocos `imageText` para as categorias temáticas com alternância visual de imagem; reuso de imagem já presente na base; listas formatadas semanticamente em Lexical.


## 14. Implementação e validação

Implementado em 18/11/2026. Operação e decisões detalhadas no [guia do importador de Benefícios](../importador-beneficios.md).

- Meta `dslc_code` conferida: `4081`; seis seções, cinco imagens e seis blocos.
- Preservados os itens reais do backup (4/4/5/3), que diferem dos resumos exemplificativos da seção 7. Não foram inventados benefícios de comprovação de endereço, crédito, sucessão ou parcerias ausentes da fonte.
- Introdução ajustada para não prometer posse, garantia total ou regularidade automática. Benefícios condicionados aos requisitos aplicáveis e referência à Outorga Onerosa qualificada, mantendo revisão editorial pendente.
- Nenhuma alteração de schema, migration, componente ou Globals. Conteúdo da instância não aplicado durante a implementação.
- Validação: simulação real; `npm run typecheck`; `npx eslint src/imports`; `DISABLE_PAYLOAD_HMR=true npm test` (104 passaram, um ignorado); integração PostgreSQL 17 descartável (passou); `git diff --check`.
- Integração confirmou seis blocos persistidos, rascunho, mídia 712 reutilizada sem mudança de metadados/pasta, total de 24 mídias após Home/Entenda/Benefícios, reexecução sem gravação, colisão de slug e conflito após edição manual.
- Pendentes: revisão institucional do conteúdo, funcionamento do link externo e conferência visual no Admin/preview desktop e mobile. Não houve validação jurídica ou navegação externa.
