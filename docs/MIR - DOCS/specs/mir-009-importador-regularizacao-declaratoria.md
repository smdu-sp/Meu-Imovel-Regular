---
spec: MIR-009
title: Importador editorial de Regularização Declaratória WordPress
status: implemented
date: 2026-11-17
---

# MIR-009 — Importador editorial de Regularização Declaratória

## 1. Resultado esperado

Definir a especificação para importação editorial da página **Regularização Declaratória** (slug `regularizacao-declaratoria`), transpondo a composição original para os blocos nativos do Payload CMS (`fullWidthImageBanner`, `richText`, blocos `imageText` temáticos para Tipos de Uso, Exigências, Anuências, Impedimentos e Outorga Onerosa, `imageBlock` com o infográfico de processo, `iconGrid` compacto com 4 manuais em PDF e `alertBox` com o aviso de comunicado único).

O runner deve simular a carga em modo offline (`--dry-run`), cadastrar as imagens exclusivas em `MIR/Modalidades/Declaratoria/Imagens`, reutilizar mídias compartilhadas (como o infográfico de processo e os manuais D01–D04), corrigir as rotas legadas de PDFs quebrados e gravar a página em rascunho com vínculo de auditoria e registro no manifesto.

## 2. Referências e precedência

- [MIR-001 — Importador editorial da Home](./mir-001-importador-home.md): arquitetura do runner, manifesto e grade de manuais.
- [Mapeamento de todas as páginas](../mapas/todas-paginas.md): inventário de links e referências legais.
- [Blocos Payload](../../../src/blocks/catalog.ts): `fullWidthImageBanner`, `richText`, `imageText`, `imageBlock`, `iconGrid`, `alertBox`.
- [Guardrails do Projeto](../../../AGENTS.md): orientação técnica e institucional sem concessão de garantias jurídicas automáticas no frontend.

## 3. Escopo

- Tradução explícita do post WordPress ID `204`, slug `regularizacao-declaratoria`, para a collection `pages`.
- Oito imagens no total: seis específicas (`capa_reg-declaratória_1200px_70dpi.jpg`, `Declaratória_tipo-de-uso.jpg`, `Declaratória_exigências.jpg`, `Declaratória_anuências-3.jpg`, `Declaratória_impedimentos.jpg`, `Declaratória_outorga-onerosa.jpg`, `Declaratória_Outorga-Onerosa-1.jpg`) e a imagem compartilhada do fluxo (`pag.comum_como-obter-o-certificado-04-05-04.jpg`).
- Quatro manuais em PDF (`D01`–`D04`) através do bloco `iconGrid` compacto, corrigindo os caminhos desatualizados herdados do legado.
- Pasta lógica: `MIR/Modalidades/Declaratoria/Imagens`.
- Tratamento da seção de Outorga Onerosa (fórmulas e imagens explicativas) e da seção de Anuências obrigatórias (CONPRESP, CONDEPHAAT, SVMA).
- Alerta processual: no rito declaratório admite-se apenas **um comunicado** para sanar pendências, com prazo improrrogável de 30 dias.

Fora do escopo: simulador de cálculo de outorga em JavaScript, protocolo no Portal de Licenciamento ou mudanças de schema no CMS.

## 4. Estrutura proposta

```text
src/imports/wordpress/
  pages/
    regularizacao-declaratoria.ts         # montagem da página e blocos
    regularizacao-declaratoria-content.ts # textos conceituais, outorga, anuências e alerta
```

## 5. Entrada e extração

- **Fonte**: `old-wordpress/db/meuimovelregular.sql` e diretório de uploads.
- **Snapshot SHA-256**: `ea309012c96c456c8c0568959a1f1bce5ae5d077239e9605bc9bdd333986264b`.
- **Registro de origem**: `wp_posts.ID = 204`, `post_name = "regularizacao-declaratoria"`, `post_title = "Regularização Declaratória"`.
- **Composição**: `wp_postmeta` com `post_id = 204` e `meta_key = "dslc_code"` (2 seções, `$[0]` e `$[1]`).

## 6. Contrato dos comandos

```bash
npm run import:wordpress -- regularizacao-declaratoria --dry-run
npm run import:wordpress -- regularizacao-declaratoria --apply --actor-id 1 --target-label mir-local
```

### Simulação (`--dry-run`)
Validação offline dos 8 arquivos de imagem e da resolução dos 4 manuais D01–D04. Verificação de schema de todos os blocos Lexical gerados.

### Aplicação (`--apply`)
Cria a pasta lógica, efetua upload das imagens exclusivas, reusa mídias compartilhadas, vincula os documentos na grade e salva o rascunho com registro no manifesto.

## 7. Tradução de Regularização Declaratória

Destino: `title="Regularização Declaratória"`, `slug="regularizacao-declaratoria"`, `_status="draft"`, `lifecycleStatus="active"`.

| Ordem | Origem no JSON legado | Destino no Payload | Configuração e Campos |
| --- | --- | --- | --- |
| 1 | `$[0]`, DSLC_Image (anexo 728) | `fullWidthImageBanner` | `desktopImage=I01`, `imageHeight=auto`, `overlay=none`. Alternativa: "Banner Regularização Declaratória". |
| 2 | `$[1]`, DSLC_Text_Simple (itens 0 e 1) | `richText` | Título H1 "Regularização Declaratória" e introdução (residências, comércios, escolas, pousadas, locais de culto com área de até 1.500 m²). |
| 3 | `$[1]`, Texto e Imagem (anexo 1113) | `imageText` | **Tipos de uso**: `image=I02`, `variant="image-right"`. Usos residenciais (R, R1, R2h, R2v) e não residenciais permitidos. |
| 4 | `$[1]`, Texto e Imagem (anexo 1111) | `imageText` | **Exigências**: `image=I03`, `variant="image-left"`. Área total de até 1.500 m² e conclusão até 31 de julho de 2014. |
| 5 | `$[1]`, Texto e Imagem (anexo 1117) | `imageText` | **Anuências obrigatórias**: `image=I04`, `variant="image-right"`. Casos sujeitos a autorização de órgãos de patrimônio histórico (CONPRESP/CONDEPHAAT/IPHAN) e meio ambiente (SVMA). |
| 6 | `$[1]`, Texto e Imagem (anexo 1119) | `imageText` | **Impedimentos**: `image=I05`, `variant="image-left"`. Situações impeditivas de acordo com a legislação. |
| 7 | `$[1]`, Texto e Imagem (anexo 1116) | `imageText` | **Outorga Onerosa**: `image=I06`, `variant="image-right"`. Conceito de potencial construtivo básico vs. máximo e contrapartida financeira. |
| 8 | `$[1]`, Texto e Imagem (anexo 1120) | `imageText` | **Cálculo da Outorga Onerosa**: `image=I07`, `variant="image-left"`. Apresentação da fórmula e parâmetros de cálculo. |
| 9 | `$[1]`, Como solicitar | `richText` | H2 "Como solicitar sua regularização pela modalidade declaratória", orientando o protocolo eletrônico no Portal de Licenciamento. |
| 10 | `$[1]`, DSLC_Image (anexo 223) | `imageBlock` | `media=I08` (Infográfico do fluxo processual). |
| 11 | `$[1]`, Manuais de auxílio | `iconGrid` (variante `compact`) | Grade compacta com 4 manuais (D01–D04) via links Documento PDF. |
| 12 | `$[1]`, Informações importantes | `alertBox` | `variant="warning"`, `title="Informações Importantes: Comunicado Único"`, avisando sobre o limite de apenas 1 comunicado para correção e prazo de 30 dias para atendimento. |

## 8. Mídias e pastas

- **Pasta destino**: `MIR/Modalidades/Declaratoria/Imagens`.

| Ref | Anexo WP | Arquivo físico em uploads | Hash SHA-256 | MIME | Tamanho | Reuso |
| --- | --- | --- | --- | --- | --- | --- |
| I01 | 728 | `2019/10/capa_reg-declaratória_1200px_70dpi.jpg` | `74a071066493946d6c3035282c0d373ba3a79e153691490f562b5f0b43e55331` | `image/jpeg` | 99.977 B | Novo |
| I02 | 1113 | `2020/01/Declaratória_tipo-de-uso.jpg` | `e0b301e6034c0b25d293cf73bc2de049fdf479f05d4425afe0389bbe63ce4178` | `image/jpeg` | 39.896 B | Novo |
| I03 | 1111 | `2020/01/Declaratória_exigências.jpg` | `209e05f79687a19e7892617c6be879a6e120feeba510a7a2c75ea6520be5d22d` | `image/jpeg` | 8.986 B | Novo |
| I04 | 1117 | `2020/01/Declaratória_anuências-3.jpg` | `0cacdeda52ce3844267b6cce8bd571b868ebfe0d8b4054b627273e8069d4a9e7` | `image/jpeg` | 208.066 B | Novo |
| I05 | 1119 | `2020/01/Declaratória_impedimentos.jpg` | `3971cda86f4c3362260577a9ba89b19c998b8c0888a3532e9f36b8c153de6bed` | `image/jpeg` | 127.787 B | Novo |
| I06 | 1116 | `2020/01/Declaratória_outorga-onerosa.jpg` | `9d0d01d0e07e2664473b743c7b6834ccfc91eee40a1cc4a168421d55f5295429` | `image/jpeg` | 167.908 B | Compartilhado (Comum) |
| I07 | 1120 | `2020/01/Declaratória_Outorga-Onerosa-1.jpg` | `acb97a2fd505a33a95b1455cd43ff502706deb3ceb939b06a452dfea2b947544` | `image/jpeg` | 341.934 B | Compartilhado (Comum) |
| I08 | 223 | `2019/10/pag.comum_como-obter-o-certificado-04-05-04.jpg` | `d6bb87fedb792ce89bd0857b20e50bff386bfb465e1e3e62fe6aad4ef9b76eff` | `image/jpeg` | 9.218 B | Compartilhado |
| D01 | 1196 | `2023/04/MANUAL-01-COMO-PREENCHER-O-REQUERIMENTO-v032023.pdf` | `9926a0d70c10b3d4bd1b622a626e8f069afb20ab5a5d18a22f9e3b07101d78d1` | `application/pdf` | 1.475.867 B | Reuso Home (D01) |
| D02 | 1191 | `2021/07/MANUAL-DE-APRESENTAÇÃO-DE-PEÇAS-GRAFICAS-16-03-2020.pdf` | `5ade8c40159fde49681e4a76dac6c1265182af9ab5f265616ebc15b09332fffd` | `application/pdf` | 1.241.517 B | Reuso Home (D02) |
| D03 | 1188 | `2021/06/MANUAL-COMO-REALIZAR-OS-ACEITES-Jun2021.pdf` | `81a04ec7f386d5da527953ffdc0f6fcd738e78e12f6b538a28a143dd73a2e0c8` | `application/pdf` | 1.005.383 B | Reuso Home (D03) |
| D04 | 1187 | `2021/06/MANUAL-COMO-EMITIR-DTCO-E-GUIA-DE-PAGAMENTO-Jun2021.pdf` | `3017fe3221cb7db9f5619415e7bafcb246e9df95b0a84d1429920441b51237b5` | `application/pdf` | 693.981 B | Reuso Home (D04) |

## 9. Manifesto, identidade e conflitos

- Mapeia post WP `204` para `pages.id`.
- Compartilhamento mútuo dos assets 1116 e 1120 com a página da Regularização Comum.
- Detecção e proteção contra conflito em caso de edições manuais no CMS.

## 10. Escrita, falhas e auditoria

- Carga em fases, respeitando o ecossistema de transações e hooks de auditoria do Payload.

## 11. Arquivos previstos e impacto persistido

| Arquivo / Coleção | Impacto | Migração necessária? |
| --- | --- | --- |
| `src/imports/wordpress/pages/regularizacao-declaratoria.ts` | Montagem da página e blocos | Não |
| `src/imports/wordpress/pages/regularizacao-declaratoria-content.ts` | Textos e critérios | Não |
| `src/imports/wordpress/run.ts` | Registro da opção no runner | Não |
| Coleção `pages` | Criação de 1 rascunho | Não |
| Coleção `media` | Upload de 5 imagens novas e reuso de 7 assets | Não |
| `payload-folders` | Criação de pasta específica | Não |

## 12. Validação e critérios de aceite

- [x] Simulação offline verifica integridade dos 8 arquivos de imagem e 4 PDFs.
- [x] Diagramação alternada de blocos `imageText` para as etapas e regras.
- [x] Alerta de comunicado único configurado via `alertBox`.
- [x] Rascunho salvo no Payload sem erros ou publicação precoce.

## 13. Registro desta especificação

- Decisões: estruturação dos tópicos de Outorga Onerosa em blocos `imageText`; compartilhamento dos assets de cálculo com a Regularização Comum; correção dos caminhos de PDFs.


## 14. Implementação e validação

Implementado em 18/11/2026; consulte o [guia operacional](../relatorio-specs/importadores-declaratoria-comum.md) e o [lote completo](../relatorio-specs/importacao-completa.md).

- Doze blocos existentes, grade compacta com quatro relações Documento, alerta no campo atual `type=warning` e rascunho com ator de auditoria.
- Fontes conferidas: Declaratória post 204/meta 4112, oito imagens/quatro PDFs; Comum post 206/meta 4115, sete imagens/quatro PDFs. As fórmulas ficam em imagens, sem simulador.
- O texto real permite uma prorrogação de 30 dias e recurso de 60 dias; não foi reproduzida a afirmação de prazo improrrogável do resumo da spec. Revisão institucional permanece pendente.
- A Comum corrige link administrativo da Lei e destino do Decreto; não foram copiadas estruturas HTML do editor. Os manuais quebrados usam as versões locais da Home.
- Reuso de Outorga 1116/1120, fluxo 223 e PDFs 1196/1191/1188/1187. Após as dez páginas: 54 mídias e 29 pastas. Declaratória introduz sete imagens, e Comum quatro; o resumo inicial de contagem de imagens exclusivas da 009 foi corrigido por conferência dos anexos.
- Nenhuma mudança de schema, migration, componente ou Globals. Persistência por Local API com checkpoints e proteção contra conteúdo editado/publicado.
- Validado: simulação real das duas páginas e do lote offline; `npm run typecheck`; `npx eslint src/imports`; suíte geral (123 passaram, dois testes de banco opcionais ignorados); integração PostgreSQL das dez páginas com reuso, idempotência e conflitos.
- Os links de domínio legado são tratados centralmente, conforme a auditoria e o relatório do lote. O banco da instância não recebeu carga.
- Pendentes revisão institucional, imagens/alternativas/créditos, preview no Admin e disponibilidade dos serviços externos.

O lote completo também foi validado em banco vazio, com dez rascunhos, 54 mídias, 29 pastas e nenhuma URL de domínio legado nos layouts persistidos. Uma segunda execução manteve as mesmas revisões e não duplicou mídia.
