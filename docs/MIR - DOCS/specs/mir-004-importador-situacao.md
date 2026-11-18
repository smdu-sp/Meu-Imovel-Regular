---
spec: MIR-004
title: Importador editorial de Situação do Imóvel WordPress
status: implemented
date: 2026-11-17
---

# MIR-004 — Importador editorial de Situação do Imóvel

## 1. Resultado esperado

Definir o contrato de importação editorial da página **Como saber a situação do meu imóvel?** (slug `situacao`, referenciada no menu como "Estou regular?"), traduzindo a estrutura legada para os blocos nativos do Payload CMS (`fullWidthImageBanner`, `richText`, `imageBlock` e `cta`).

O comando deve simular a migração offline (`--dry-run`), importar a capa e o mockup explicativo para `MIR/Situacao/Imagens`, registrar os textos instrucionais e links para a consulta oficial do CEDI, respeitando integralmente os guardrails arquiteturais do projeto sobre a integração com o CEDI e a não emissão de certidões diretas pelo portal.

## 2. Referências e precedência

- [MIR-001 — Importador editorial da Home](./mir-001-importador-home.md): arquitetura do runner, manifesto e locks.
- [Mapeamento de todas as páginas](../mapas/todas-paginas.md): links e referências do CEDI.
- [Guardrails do Projeto](../../../AGENTS.md):
  - "O sistema informa, orienta, realiza triagem preliminar e encaminha para serviços oficiais."
  - "O sistema **não** declara oficialmente que um imóvel está regular nem substitui o Portal de Licenciamento ou o CEDI."
  - "A aplicação não deve tratar dados locais como fonte oficial do CEDI; integrações externas possuem adapters próprios em `src/lib/cedi/`."
- [Blocos Payload](../../../src/blocks/catalog.ts): `fullWidthImageBanner`, `richText`, `imageBlock`, `cta`.

## 3. Escopo

- Tradução explícita do post WordPress ID `176`, slug `situacao`, para a collection `pages`.
- Dois arquivos de imagem (`I01` e `I02`) validados em uploads (`capa_situação_1920px_70dpi-1.jpg` e `mockup-CEDI.png`).
- Criação da pasta de mídia `MIR/Situacao/Imagens`.
- Estruturação do passo a passo para consulta do Histórico da Edificação no CEDI (número do contribuinte/SQL).
- Botão/CTA de encaminhamento para o serviço oficial do CEDI (`http://cediconshistorico.prefeitura.sp.gov.br/forms/consultarhistorico.aspx` ou HTTPS correspondente).

Fora do escopo: desenvolvimento do adapter em `src/lib/cedi/`, consulta síncrona a banco de dados municipal, tela de digitação de SQL/CAPTCHA embarcada ou validação de cadastros imobiliários.

## 4. Estrutura proposta

```text
src/imports/wordpress/
  pages/
    situacao.ts                # montagem da página e blocos
    situacao-content.ts        # textos instrucionais, passo a passo e link CEDI
```

## 5. Entrada e extração

- **Fonte**: `old-wordpress/db/meuimovelregular.sql` e diretório de uploads.
- **Snapshot SHA-256**: `ea309012c96c456c8c0568959a1f1bce5ae5d077239e9605bc9bdd333986264b`.
- **Registro de origem**: `wp_posts.ID = 176`, `post_name = "situacao"`, `post_title = "Como saber a situação do meu imóvel?"`.
- **Composição**: `wp_postmeta` com `post_id = 176` e `meta_key = "dslc_code"`, composto por 2 seções (`$[0]` e `$[1]`).

## 6. Contrato dos comandos

```bash
npm run import:wordpress -- situacao --dry-run
npm run import:wordpress -- situacao --apply --actor-id 1 --target-label mir-local
```

### Simulação (`--dry-run`)
Validação offline dos 2 arquivos de mídia, checagem de hashes e validação da árvore de blocos Lexical gerada para as orientações do CEDI.

### Aplicação (`--apply`)
Cria a pasta lógica, efetua upload das mídias com MIME seguro, grava a página em rascunho vinculada ao manifesto e propaga o ator de auditoria.

## 7. Tradução de Situação do Imóvel

Configuração no destino: `title="Como saber a situação do meu imóvel?"`, `slug="situacao"`, `_status="draft"`, `lifecycleStatus="active"`.

| Ordem | Origem no JSON legado | Destino no Payload | Configuração e Campos |
| --- | --- | --- | --- |
| 1 | `$[0]`, DSLC_Image (anexo 739) | `fullWidthImageBanner` | `desktopImage=I01`, `imageHeight=auto`, `overlay=none`. Alternativa textual: "Capa da seção Como saber a situação do meu imóvel". |
| 2 | `$[1]`, DSLC_Text_Simple (itens 0 e 1) | `richText` | Título H1 "Como saber a situação do meu imóvel?" e texto institucional contextualizando o Cadastro de Edificações do Município de São Paulo (CEDI), Auto de Regularização e Habite-se. |
| 3 | `$[1]`, DSLC_Image (anexo 718) | `imageBlock` | `media=I02`, legenda opcional: "Tela de exemplo do formulário de consulta ao CEDI por SQL". |
| 4 | `$[1]`, DSLC_Text_Simple (item 3) | `richText` | H2 "Como consultar?" com o passo a passo: 1. Acessar o CEDI; 2. Informar o número do contribuinte (SQL) sem pontos ou traços; 3. Preencher o código de segurança; 4. Visualizar o Histórico da Edificação. |
| 5 | Derivado do link de ação do texto | `cta` | Chamada para ação destacada: `label="Acessar Consulta do CEDI"`, `type="external"`, `newTab=true`, `url="http://cediconshistorico.prefeitura.sp.gov.br/forms/consultarhistorico.aspx"`. |

### Diretrizes de governança e responsabilidade
- O texto explicativo deve deixar evidente que a consulta indica o histórico registrado no banco de dados municipal, não substituindo a vistoria ou o protocolo formal.
- Preservar o aviso de que o número do contribuinte consta no carnê do IPTU (Setor, Quadra, Lote).
- Não embutir iframes ou scripts de consulta direta na página institucional.

## 8. Mídias e pastas

- **Pasta destino**: `MIR/Situacao/Imagens`.

| Ref | Anexo WP | Arquivo físico em uploads | Hash SHA-256 | MIME | Tamanho | Título editorial / Alt |
| --- | --- | --- | --- | --- | --- | --- |
| I01 | 739 | `2019/10/capa_situação_1920px_70dpi-1.jpg` | `503d47e616d0e65ee1e6c5cbbac9dbdb344780e8211ff6f7b173afd0b0defb15` | `image/jpeg` | 387.540 B | Capa Situação do Imóvel |
| I02 | 718 | `2019/10/mockup-CEDI.png` | `578ab50deea0f388fcda06379b3f96257c8337d0ad7eab1e55d71721ddc13ac2` | `image/png` | 68.998 B | Mockup da Consulta ao CEDI |

## 9. Manifesto, identidade e conflitos

- Mapeia post WP `176` para `pages.id`.
- Se a página `situacao` já estiver presente e publicada ou alterada manualmente, interrompe com aviso de proteção editorial.
- Identifica e reutiliza mídias já existentes através dos hashes SHA-256.

## 10. Escrita, falhas e auditoria

- Carga atômica com rollback e journal persistido.
- Hooks de auditoria preservados com propagação de ator.

## 11. Arquivos previstos e impacto persistido

| Arquivo / Coleção | Impacto | Migração necessária? |
| --- | --- | --- |
| `src/imports/wordpress/pages/situacao.ts` | Montagem e blocos | Não |
| `src/imports/wordpress/pages/situacao-content.ts` | Textos e passos de consulta | Não |
| `src/imports/wordpress/run.ts` | Registro da opção `situacao` | Não |
| Coleção `pages` | Criação de 1 rascunho (`slug="situacao"`) | Não |
| Coleção `media` | Upload de 2 arquivos | Não |
| `payload-folders` | Criação de `MIR/Situacao/Imagens` | Não |

## 12. Validação e critérios de aceite

- [x] Simulação offline verifica os dois arquivos físicos e validação Lexical.
- [x] Link do CEDI externo direciona para a página oficial em nova aba.
- [ ] Diagramação do passo a passo clara e acessível, com imagem ilustrativa.
- [x] Respeito aos limites do portal: nenhum código ou formulário de consulta falsa criado.
- [x] Rascunho criado com segurança e registrado no manifesto.

## 13. Registro desta especificação

- Decisões: uso de `imageBlock` e `cta` para destacar o fluxo de consulta do CEDI; separação clara entre a orientação institucional e o serviço oficial externo.


## 14. Implementação e validação

Implementado em 18/11/2026. Consulte o [guia operacional](../importador-situacao.md).

- Origem conferida: post 176, meta 4149, duas seções. Destino com cinco blocos existentes e duas mídias em `MIR/Situacao/Imagens`.
- Desvios: preservados os três passos efetivamente encontrados; CAPTCHA, Auto de Regularização e Habite-se não constam dos módulos textuais e não foram acrescentados. Qualificada a explicação do histórico para respeitar os limites do portal. Link HTTP preservado sem pressupor disponibilidade ou suporte a HTTPS.
- Reuso segue anexo legado e hash no manifesto, sem deduplicação global. Atomicidade por operação, com checkpoints e tratamento de rollback compartilhados com a Home, sem promessa de transação única entre banco, arquivos e manifesto.
- Nenhuma mudança de schema, migration, integração CEDI, componente ou Globals.
- Validações: simulação real; `npm run typecheck`; `npx eslint src/imports`; `DISABLE_PAYLOAD_HMR=true npm test` (107 passaram, um teste opcional ignorado); integração PostgreSQL 17 descartável (passou); `git diff --check`.
- Integração confirmou rascunho com cinco blocos, CTA externo com nova aba, duas novas mídias (26 após as quatro páginas), dez pastas, reexecução sem gravação, recusa de slug sem manifesto e conflito após edição manual.
- Pendentes: revisão visual no Admin/preview desktop e mobile, disponibilidade do serviço e revisão institucional. O banco da instância não foi usado e o container temporário foi removido após a validação.
