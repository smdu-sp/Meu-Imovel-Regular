---
spec: MIR-007
title: Importador editorial de Regularização Automática WordPress
status: implemented
date: 2026-11-17
---

# MIR-007 — Importador editorial de Regularização Automática

## 1. Resultado esperado

Definir o contrato para importação editorial da página **Regularização Automática** (slug `regularizacao-automatica`), traduzindo o conteúdo do builder legado para os blocos nativos do Payload CMS (`fullWidthImageBanner`, `richText`, blocos `imageText` para Tipos de Uso/Exigências/Impedimentos, `imageBlock` para o infográfico do processo, `iconGrid` compacto com 4 manuais em PDF e `alertBox` para as informações importantes).

O importador deve simular a migração offline (`--dry-run`), cadastrar as imagens em `MIR/Modalidades/Automatica/Imagens`, reutilizar mídias já existentes (como o infográfico do fluxo e os 4 manuais oficiais D01–D04 já mapeados na Home), corrigir os links legados de PDFs que apontavam para caminhos inexistentes e gravar a página em rascunho com registro no manifesto.

## 2. Referências e precedência

- [MIR-001 — Importador editorial da Home](./mir-001-importador-home.md): arquitetura do runner, manifesto, locks e grade de manuais em `iconGrid`.
- [Mapeamento de todas as páginas](../mapas/todas-paginas.md): inventário de links da Automática.
- [Blocos Payload](../../../src/blocks/catalog.ts): `fullWidthImageBanner`, `richText`, `imageText`, `imageBlock`, `iconGrid`, `alertBox`.
- [Guardrails do Projeto](../../../AGENTS.md): o portal informa e orienta; não declara oficialmente que um imóvel está regular nem substitui certidões municipais.

## 3. Escopo

- Tradução explícita do post WordPress ID `193`, slug `regularizacao-automatica`, para a collection `pages`.
- Cinco imagens (`I01`–`I05`) identificadas no acervo (`capa_reg_comum_1200px_70dpi-2.jpg`, `Isenção-de-IPTU__automática_isenção-de-IPTU_automática.png`, `Isenção-de-IPTU__automática_isenção-de-IPTU_isenção-de-IPTU.png`, `Isenção-de-IPTU__automática_isenção-de-IPTU_impedimentos_impedimentos.png`, `pag.comum_como-obter-o-certificado-04-05-04.jpg`).
- Reutilização de 4 manuais em PDF (`D01`–`D04`) através do componente `iconGrid` na variante `compact` com ações do tipo documento.
- Correção de links legados: no HTML original da página, os links de requerimento e peças gráficas apontavam para arquivos em `2021/06/..._compressed.pdf` e `2020/03/...pdf` que não existem no disco; a importação deve associar os manuais físicos existentes e atualizados catalogados na Home (D01: anexo 1196 e D02: anexo 1191).
- Links para listas externas no portal da Prefeitura (`Lei-de-Regularizacao-de-Edificacoes-Edificacoes-Regularizadas-Automatico.pdf` e `.xls`).
- Bloco `alertBox` para a seção final de "INFORMAÇÕES IMPORTANTES".

Fora do escopo: download local das listas completas de imóveis da SMUL, emissão de certidão de regularização ou alteração de schema.

## 4. Estrutura proposta

```text
src/imports/wordpress/
  pages/
    regularizacao-automatica.ts         # montagem dos blocos e layout
    regularizacao-automatica-content.ts # textos instrucionais, critérios e links
```

## 5. Entrada e extração

- **Fonte**: `old-wordpress/db/meuimovelregular.sql` e diretório de uploads.
- **Snapshot SHA-256**: `ea309012c96c456c8c0568959a1f1bce5ae5d077239e9605bc9bdd333986264b`.
- **Registro de origem**: `wp_posts.ID = 193`, `post_name = "regularizacao-automatica"`, `post_title = "Regularização Automática"`.
- **Composição**: `wp_postmeta` com `post_id = 193` e `meta_key = "dslc_code"` (3 seções, sendo a seção `$[2]` vazia).

## 6. Contrato dos comandos

```bash
npm run import:wordpress -- regularizacao-automatica --dry-run
npm run import:wordpress -- regularizacao-automatica --apply --actor-id 1 --target-label mir-local
```

### Simulação (`--dry-run`)
Validação offline dos 5 arquivos de imagem e da resolução dos 4 manuais PDF D01–D04. Geração da árvore de blocos e conferência do texto de alerta.

### Aplicação (`--apply`)
Cria a pasta lógica em `MIR/Modalidades/Automatica/Imagens`, faz upload das imagens novas, reusa mídias compartilhadas, relaciona os documentos na grade de ícones e grava a página em rascunho.

## 7. Tradução de Regularização Automática

Configuração no destino: `title="Regularização Automática"`, `slug="regularizacao-automatica"`, `_status="draft"`, `lifecycleStatus="active"`.

| Ordem | Origem no JSON legado | Destino no Payload | Configuração e Campos |
| --- | --- | --- | --- |
| 1 | `$[0]`, DSLC_Image (anexo 727) | `fullWidthImageBanner` | `desktopImage=I01`, `imageHeight=auto`, `overlay=none`. Alternativa: "Banner Regularização Automática". |
| 2 | `$[1]`, DSLC_Text_Simple (itens 0 e 1) | `richText` | Título H1 "Regularização Automática", introdução conceitual (residências R, R1, R2h de baixo e médio padrão isentas de IPTU em 2014) e links externos para consulta das listas oficiais de imóveis regularizados em PDF e XLS. |
| 3 | `$[1]`, Texto e Imagem (anexo 1102) | `imageText` | **Tipos de uso**: `image=I02`, `variant="image-right"`. Residências unifamiliares e agrupadas horizontalmente com acesso independente. |
| 4 | `$[1]`, Texto e Imagem (anexo 1104) | `imageText` | **Exigências**: `image=I03`, `variant="image-left"`. Isenção total de IPTU em 2014 e edificação concluída até julho de 2014. |
| 5 | `$[1]`, Texto e Imagem (anexo 1105) | `imageText` | **Impedimentos**: `image=I04`, `variant="image-right"`. ZOE, ZEP, áreas ambientais, mananciais e áreas públicas não elegíveis para regularização automática. |
| 6 | `$[1]`, Texto explicativo CEDI | `richText` | H2 "Como saber se meu imóvel foi regularizado automaticamente?", orientando a consulta ao Histórico da Edificação via CEDI ou link para `/situacao/`. |
| 7 | `$[1]`, DSLC_Image (anexo 223) | `imageBlock` | `media=I05` (Infográfico do processo de obtenção do certificado). |
| 8 | `$[1]`, Manuais de apoio | `iconGrid` (variante `compact`) | Grade compacta com 4 manuais: Passo a passo (D01), Peças Gráficas (D02), Como realizar o aceite (D03) e DTCO/Guia (D04), com links Documento PDF. |
| 9 | `$[1]`, Texto final | `alertBox` | `variant="info"`, `title="Informações Importantes"`, destacando que na modalidade automática não há protocolo formal pelo cidadão, ocorrendo de ofício pela Prefeitura. |

A seção vazia `$[2]` é descartada.

## 8. Mídias e pastas

- **Pasta destino**: `MIR/Modalidades/Automatica/Imagens`.

| Ref | Anexo WP | Arquivo físico em uploads | Hash SHA-256 | MIME | Tamanho | Uso | Reuso |
| --- | --- | --- | --- | --- | --- | --- | --- |
| I01 | 727 | `2019/10/capa_reg_comum_1200px_70dpi-2.jpg` | `d673ecec4e98cd857e07c75418a73555dfee246dde65ba7cfb8fc7f4d69458f3` | `image/jpeg` | 99.482 B | `content` | Novo |
| I02 | 1102 | `2020/01/Isenção-de-IPTU__automática_isenção-de-IPTU_automática.png` | `9c64d9f463586398a893d79e600a7488742b9e063c950ca9d2da5d70eb1e50dc` | `image/png` | 18.356 B | `content` | Novo |
| I03 | 1104 | `2020/01/Isenção-de-IPTU__automática_isenção-de-IPTU_isenção-de-IPTU.png` | `6abe1db87b9e0f236d8c7ee1bd9612d8b8e7b0e977b8ab0cb5bc5f0299473be8` | `image/png` | 12.045 B | `content` | Novo |
| I04 | 1105 | `2020/01/Isenção-de-IPTU__automática_isenção-de-IPTU_impedimentos_impedimentos.png` | `dccb15a7410dd108fecb3dca629119ba148459666578aeaf1e4f096e104e4c38` | `image/png` | 21.116 B | `content` | Novo |
| I05 | 223 | `2019/10/pag.comum_como-obter-o-certificado-04-05-04.jpg` | `d6bb87fedb792ce89bd0857b20e50bff386bfb465e1e3e62fe6aad4ef9b76eff` | `image/jpeg` | 9.218 B | `content` | Compartilhado |
| D01 | 1196 | `2023/04/MANUAL-01-COMO-PREENCHER-O-REQUERIMENTO-v032023.pdf` | `9926a0d70c10b3d4bd1b622a626e8f069afb20ab5a5d18a22f9e3b07101d78d1` | `application/pdf` | 1.475.867 B | `document` | Reuso Home (D01) |
| D02 | 1191 | `2021/07/MANUAL-DE-APRESENTAÇÃO-DE-PEÇAS-GRAFICAS-16-03-2020.pdf` | `5ade8c40159fde49681e4a76dac6c1265182af9ab5f265616ebc15b09332fffd` | `application/pdf` | 1.241.517 B | `document` | Reuso Home (D02) |
| D03 | 1188 | `2021/06/MANUAL-COMO-REALIZAR-OS-ACEITES-Jun2021.pdf` | `81a04ec7f386d5da527953ffdc0f6fcd738e78e12f6b538a28a143dd73a2e0c8` | `application/pdf` | 1.005.383 B | `document` | Reuso Home (D03) |
| D04 | 1187 | `2021/06/MANUAL-COMO-EMITIR-DTCO-E-GUIA-DE-PAGAMENTO-Jun2021.pdf` | `3017fe3221cb7db9f5619415e7bafcb246e9df95b0a84d1429920441b51237b5` | `application/pdf` | 693.981 B | `document` | Reuso Home (D04) |

## 9. Manifesto, identidade e conflitos

- Mapeia post WP `193` para `pages.id`.
- Reutiliza os IDs das mídias D01–D04 e I05 já registradas no manifesto.
- Bloqueia a execução caso o rascunho ou página publicada de `regularizacao-automatica` tenha sido editado manualmente.

## 10. Escrita, falhas e auditoria

- Carga atômica via Local API com propagação do ator administrativo.
- Mídias novas gravadas com MIME validado; mídias existentes reutilizadas sem novo upload.

## 11. Arquivos previstos e impacto persistido

| Arquivo / Coleção | Impacto | Migração necessária? |
| --- | --- | --- |
| `src/imports/wordpress/pages/regularizacao-automatica.ts` | Montagem da página e blocos | Não |
| `src/imports/wordpress/pages/regularizacao-automatica-content.ts` | Textos e critérios | Não |
| `src/imports/wordpress/run.ts` | Registro da opção `regularizacao-automatica` | Não |
| Coleção `pages` | Criação de 1 rascunho | Não |
| Coleção `media` | Upload de 4 imagens novas e reuso de 5 assets | Não |
| `payload-folders` | Criação de `MIR/Modalidades/Automatica/Imagens` | Não |

## 12. Validação e critérios de aceite

- [x] Simulação offline verifica imagens e resolução dos 4 manuais D01–D04.
- [x] Correção dos caminhos quebrados legados de PDF confirmada no relatório.
- [x] Bloco `alertBox` configurado adequadamente para as informações importantes.
- [x] Rascunho salvo no Payload sem erros de validação ou publicação involuntária.

## 13. Registro desta especificação

- Decisões: correção ativa dos links de manuais quebrados do legado, reaproveitando os PDFs oficiais consolidados na MIR-001; conversão dos tópicos em blocos `imageText` e `alertBox`.


## 14. Implementação e validação

Implementado em 18/11/2026; consulte o [guia operacional](../relatorio-specs/importador-regularizacao-automatica.md).

- Origem conferida: post 193/meta 4106, três seções, nove assets e nove blocos.
- Diferenças da fonte: lista externa somente PDF, sem XLS; seção de certificado menciona Portal de Licenciamento e prazo histórico, sem CEDI. Foi acrescentada orientação para Situação sem consulta a dados oficiais. O alerta real trata de taxas e encaminhamento para Declaratória/Comum; esse conteúdo foi preservado com `type=info`, campo existente no schema.
- Manuais Inicial e Peças Gráficas com destinos legados indisponíveis foram substituídos pelos anexos 1196 e 1191 da Home. Reuso por anexo/hash no manifesto preserva metadados e pastas; PDFs novos, se necessários, ficam em `MIR/Modalidades/Automatica/Manuais`.
- O infográfico 223 não estava nas cargas Home–Cartilha. Após essas seis páginas, Automática adiciona cinco imagens e reutiliza quatro PDFs, em vez da previsão resumida de quatro imagens novas e cinco assets reutilizados. As próximas modalidades podem reutilizar o infográfico.
- Sem mudança de schema, migration, componente ou Globals. Atomicidade por operação com checkpoints, conforme o importador compartilhado.
- Validado: simulação real, `npm run typecheck`, `npx eslint src/imports`, `DISABLE_PAYLOAD_HMR=true npm test` (117 passaram, um opcional ignorado), integração PostgreSQL 17 descartável e `git diff --check`.
- Integração confirmou rascunho com nove blocos, grade com quatro relações Documento, reuso dos IDs sem alterar metadados da Home, alerta informativo, 39 mídias e 20 pastas após sete páginas, reexecução sem gravação, colisão de slug sem manifesto e conflito após edição manual.
- Banco da instância não usado; container temporário removido após validação. Pendentes revisão institucional, imagens/infográfico, preview no Admin e funcionamento dos links/downloads.
