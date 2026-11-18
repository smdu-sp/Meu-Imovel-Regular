---
spec: MIR-008
title: Importador editorial de Regularização Declaratória Simplificada WordPress
status: implemented
date: 2026-11-17
---

# MIR-008 — Importador editorial de Regularização Declaratória Simplificada

## 1. Resultado esperado

Definir o contrato para importação editorial da página **Regularização Declaratória Simplificada** (slug `regularizacao-declaratoria-simplificada`), traduzindo a composição do builder legado para os blocos nativos do Payload CMS (`fullWidthImageBanner`, `richText`, blocos `imageText` temáticos, `imageBlock` com o infográfico de processo, `iconGrid` compacto com 4 manuais em PDF e `alertBox` com aviso crítico sobre ausência de comunicado).

O comando deve simular a migração offline (`--dry-run`), cadastrar as imagens exclusivas da modalidade em `MIR/Modalidades/DeclaratoriaSimplificada/Imagens`, reusar mídias compartilhadas (infográfico e os 4 manuais D01–D04), corrigir as referências a PDFs legados inexistentes e gravar a página em rascunho com registro no manifesto.

## 2. Referências e precedência

- [MIR-001 — Importador editorial da Home](./mir-001-importador-home.md): arquitetura do runner, manifesto, locks e grade de manuais.
- [Mapeamento de todas as páginas](../mapas/todas-paginas.md): inventário de links da Declaratória Simplificada.
- [Blocos Payload](../../../src/blocks/catalog.ts): `fullWidthImageBanner`, `richText`, `imageText`, `imageBlock`, `iconGrid`, `alertBox`.
- [Guardrails do Projeto](../../../AGENTS.md): orientação preliminar sem promessa de deferimento ou interpretação jurídica definitiva.

## 3. Escopo

- Tradução explícita do post WordPress ID `760`, slug `regularizacao-declaratoria-simplificada`, para a collection `pages`.
- Cinco arquivos de imagem (`I01`–`I05`): `declaratoria-simplificada-banner.jpg`, `Declaratória-Simplificada_tipo-de-uso.png`, `Declaratória-Simplificada_exigências.png`, `Declaratória-Simplificada_impedimentos.png` e a imagem compartilhada do fluxo `pag.comum_como-obter-o-certificado-04-05-04.jpg`.
- Quatro manuais oficiais em PDF (`D01`–`D04`) incorporados via `iconGrid` compacto, corrigindo os caminhos legados quebrados de 2020/2021.
- Pasta lógica: `MIR/Modalidades/DeclaratoriaSimplificada/Imagens`.
- Alerta mandatório sobre a regra processual específica: o procedimento simplificado **não admite a emissão de comunicado** (comunique-se).

Fora do escopo: protocolo eletrônico, validação de ART/RRT ou alteração de schemas.

## 4. Estrutura proposta

```text
src/imports/wordpress/
  pages/
    regularizacao-declaratoria-simplificada.ts         # montagem dos blocos
    regularizacao-declaratoria-simplificada-content.ts # textos, exigências e alerta
```

## 5. Entrada e extração

- **Fonte**: `old-wordpress/db/meuimovelregular.sql` e diretório de uploads.
- **Snapshot SHA-256**: `ea309012c96c456c8c0568959a1f1bce5ae5d077239e9605bc9bdd333986264b`.
- **Registro de origem**: `wp_posts.ID = 760`, `post_name = "regularizacao-declaratoria-simplificada"`, `post_title = "Regularização Declaratória Simplificada"`.
- **Composição**: `wp_postmeta` com `post_id = 760` e `meta_key = "dslc_code"` (2 seções, `$[0]` e `$[1]`).

## 6. Contrato dos comandos

```bash
npm run import:wordpress -- regularizacao-declaratoria-simplificada --dry-run
npm run import:wordpress -- regularizacao-declaratoria-simplificada --apply --actor-id 1 --target-label mir-local
```

### Simulação (`--dry-run`)
Validação offline dos 5 arquivos de imagem e da resolução dos 4 manuais D01–D04. Verificação de schema de todos os blocos Lexical gerados.

### Aplicação (`--apply`)
Cria a pasta lógica, faz upload das imagens não registradas, reutiliza os assets compartilhados, relaciona os documentos na grade e salva o rascunho com registro no manifesto.

## 7. Tradução de Regularização Declaratória Simplificada

Destino: `title="Regularização Declaratória Simplificada"`, `slug="regularizacao-declaratoria-simplificada"`, `_status="draft"`, `lifecycleStatus="active"`.

| Ordem | Origem no JSON legado | Destino no Payload | Configuração e Campos |
| --- | --- | --- | --- |
| 1 | `$[0]`, DSLC_Image (anexo 777) | `fullWidthImageBanner` | `desktopImage=I01`, `imageHeight=auto`, `overlay=none`. Alternativa: "Banner Regularização Declaratória Simplificada". |
| 2 | `$[1]`, DSLC_Text_Simple (itens 0 e 1) | `richText` | Título H1 "Regularização Declaratória Simplificada", contextualização legal (imóveis residenciais unifamiliares com área construída de até 500 m²). |
| 3 | `$[1]`, Texto e Imagem (anexo 1106) | `imageText` | **Tipos de uso**: `image=I02`, `variant="image-right"`. Edificações residenciais R, R1 e R2h. |
| 4 | `$[1]`, Texto e Imagem (anexo 1107) | `imageText` | **Exigências**: `image=I03`, `variant="image-left"`. Área total de no máximo 500 m² e conclusão da obra até 31 de julho de 2014. |
| 5 | `$[1]`, Texto e Imagem (anexo 1108) | `imageText` | **Impedimentos**: `image=I04`, `variant="image-right"`. Hipóteses de vedação da Lei nº 17.202/2019 e Decreto nº 59.164/2019. |
| 6 | `$[1]`, Como solicitar | `richText` | H2 "Como solicitar sua regularização", orientando o protocolo eletrônico no Portal de Licenciamento e documentação técnica exigida. |
| 7 | `$[1]`, DSLC_Image (anexo 223) | `imageBlock` | `media=I05` (Infográfico do processo de obtenção do certificado). |
| 8 | `$[1]`, Manuais de auxílio | `iconGrid` (variante `compact`) | 4 manuais com links Documento PDF: Passo a passo (D01), Peças Gráficas (D02), Como realizar o aceite (D03) e DTCO/Guia (D04). |
| 9 | `$[1]`, Informações importantes | `alertBox` | `variant="danger"`, `title="Informações Importantes: Ausência de Comunicado"`, ressaltando com ênfase máxima que o procedimento declaratório simplificado **não admite comunicado** e a ausência de peças corretas enseja indeferimento sumário. |

## 8. Mídias e pastas

- **Pasta destino**: `MIR/Modalidades/DeclaratoriaSimplificada/Imagens`.

| Ref | Anexo WP | Arquivo físico em uploads | Hash SHA-256 | MIME | Tamanho | Reuso |
| --- | --- | --- | --- | --- | --- | --- |
| I01 | 777 | `2019/12/declaratoria-simplificada-banner.jpg` | `580288ca3254240e06fe82d627e41716b8b2206779395c08fac817f086a53254` | `image/jpeg` | 36.339 B | Novo |
| I02 | 1106 | `2020/01/Declaratória-Simplificada_tipo-de-uso.png` | `f8330e44155de2cd9b29e72d7f5bc2770d3fc972476c843cd4469d56368420bc` | `image/png` | 25.541 B | Novo |
| I03 | 1107 | `2020/01/Declaratória-Simplificada_exigências.png` | `341eb8255ae31496ffd86a02166637c70f535450bbb8662a2353446c0bab1dd3` | `image/png` | 6.657 B | Novo |
| I04 | 1108 | `2020/01/Declaratória-Simplificada_impedimentos.png` | `df672cefbff31be6ccbbc7caf68b760a4d84b752015f51c94219a24e48171544` | `image/png` | 19.180 B | Novo |
| I05 | 223 | `2019/10/pag.comum_como-obter-o-certificado-04-05-04.jpg` | `d6bb87fedb792ce89bd0857b20e50bff386bfb465e1e3e62fe6aad4ef9b76eff` | `image/jpeg` | 9.218 B | Compartilhado |
| D01 | 1196 | `2023/04/MANUAL-01-COMO-PREENCHER-O-REQUERIMENTO-v032023.pdf` | `9926a0d70c10b3d4bd1b622a626e8f069afb20ab5a5d18a22f9e3b07101d78d1` | `application/pdf` | 1.475.867 B | Reuso Home (D01) |
| D02 | 1191 | `2021/07/MANUAL-DE-APRESENTAÇÃO-DE-PEÇAS-GRAFICAS-16-03-2020.pdf` | `5ade8c40159fde49681e4a76dac6c1265182af9ab5f265616ebc15b09332fffd` | `application/pdf` | 1.241.517 B | Reuso Home (D02) |
| D03 | 1188 | `2021/06/MANUAL-COMO-REALIZAR-OS-ACEITES-Jun2021.pdf` | `81a04ec7f386d5da527953ffdc0f6fcd738e78e12f6b538a28a143dd73a2e0c8` | `application/pdf` | 1.005.383 B | Reuso Home (D03) |
| D04 | 1187 | `2021/06/MANUAL-COMO-EMITIR-DTCO-E-GUIA-DE-PAGAMENTO-Jun2021.pdf` | `3017fe3221cb7db9f5619415e7bafcb246e9df95b0a84d1429920441b51237b5` | `application/pdf` | 693.981 B | Reuso Home (D04) |

## 9. Manifesto, identidade e conflitos

- Mapeia post WP `760` para `pages.id`.
- Reuso de IDs de mídias já criadas, evitando duplicação.
- Bloqueio imediato caso a página já tenha sido modificada manualmente após carga prévia.

## 10. Escrita, falhas e auditoria

- Carga em fases com gravação do rascunho e registro de auditoria via Local API.

## 11. Arquivos previstos e impacto persistido

| Arquivo / Coleção | Impacto | Migração necessária? |
| --- | --- | --- |
| `src/imports/wordpress/pages/regularizacao-declaratoria-simplificada.ts` | Montagem da página | Não |
| `src/imports/wordpress/pages/regularizacao-declaratoria-simplificada-content.ts` | Textos e critérios | Não |
| `src/imports/wordpress/run.ts` | Registro da opção no runner | Não |
| Coleção `pages` | Criação de 1 rascunho | Não |
| Coleção `media` | Upload de 4 imagens e reuso de 5 assets | Não |
| `payload-folders` | Criação de pasta específica | Não |

## 12. Validação e critérios de aceite

- [x] Simulação offline verifica integridade física de arquivos e hashes.
- [x] Correção de links de manuais comprovada na grade compacta.
- [x] Configuração do alerta crítico destacando a ausência de comunicado no rito simplificado.
- [x] Rascunho salvo no Payload sem erros de schema ou publicação prematura.

## 13. Registro desta especificação

- Decisões: destaque ao alerta de não emissão de comunicado via `alertBox`; saneamento dos links de manuais quebrados.


## 14. Implementação e validação

Implementado em 18/11/2026; consulte o [guia operacional](../relatorio-specs/importador-regularizacao-declaratoria-simplificada.md).

- Origem conferida: post 760/meta 4109, duas seções, nove arquivos e nove blocos.
- Quatro imagens exclusivas e reuso dos anexos 223/1196/1191/1188/1187 pelo manifesto, preservando pastas e metadados existentes. PDFs novos, se necessários, ficam em `MIR/Modalidades/DeclaratoriaSimplificada/Manuais`.
- Diferenças: alerta usa `type=danger`, campo atual; preserva ausência de comunicado, profissional habilitado e oito casos de encaminhamento à modalidade comum. A expressão “indeferimento sumário” não aparece na fonte e não foi acrescentada. Os oito casos foram convertidos para lista semântica.
- Sem mudança de schema, migration, componente ou Globals; persistência e atomicidade por operação com checkpoints compartilhados.
- Validado: simulação real, `npm run typecheck`, `npx eslint src/imports`, `DISABLE_PAYLOAD_HMR=true npm test` (120 passaram, um opcional ignorado), integração PostgreSQL 17 descartável e `git diff --check`.
- Integração confirmou rascunho, nove blocos, quatro relações Documento, alerta crítico, reuso de cinco IDs sem mover/alterar a mídia compartilhada, reexecução sem gravação, colisão de slug sem manifesto e conflito após edição manual. Após as oito páginas, 43 mídias e 23 pastas.
- O banco da instância não foi usado; container temporário removido após validação. Pendentes revisão institucional, conteúdo/alternativas das imagens, preview no Admin, downloads e funcionamento dos links.
