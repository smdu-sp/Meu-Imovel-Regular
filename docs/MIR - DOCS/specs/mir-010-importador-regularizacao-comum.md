---
spec: MIR-010
title: Importador editorial de Regularização Comum WordPress
status: implemented
date: 2026-11-17
---

# MIR-010 — Importador editorial de Regularização Comum

## 1. Resultado esperado

Definir a especificação técnica para importação editorial da página **Regularização Comum** (slug `regularizacao-comum`), mapeando a estrutura e os conteúdos do legado para os blocos nativos do Payload CMS (`fullWidthImageBanner`, `richText`, blocos `imageText` para Tipos de Uso, Exigências, Anuências, Impedimentos e Outorga Onerosa, `imageBlock` com o infográfico do processo, `iconGrid` compacto com 4 manuais em PDF e `alertBox` com o aviso de comunicado único).

O importador deve simular a migração offline (`--dry-run`), cadastrar as imagens exclusivas da modalidade em `MIR/Modalidades/Comum/Imagens`, reutilizar mídias já cadastradas (como os assets de Outorga Onerosa compartilhados com a Declaratória, o infográfico de processo e os 4 manuais D01–D04), corrigir ativamente os links corrompidos do WordPress legado (incluindo link para tela de `/wp-admin/` no corpo do texto e link invertido de decreto) e salvar a página em rascunho com registro no manifesto.

## 2. Referências e precedência

- [MIR-001 — Importador editorial da Home](./mir-001-importador-home.md): arquitetura do runner, manifesto e grade de manuais.
- [Mapeamento de todas as páginas](../mapas/todas-paginas.md): inventário de links e diagnóstico das falhas de URL na Regularização Comum.
- [Blocos Payload](../../../src/blocks/catalog.ts): `fullWidthImageBanner`, `richText`, `imageText`, `imageBlock`, `iconGrid`, `alertBox`.
- [Guardrails do Projeto](../../../AGENTS.md): orientação institucional clara sem emissão de protocolos diretos ou decisões jurídicas em componentes visuais.

## 3. Escopo

- Tradução explícita do post WordPress ID `206`, slug `regularizacao-comum`, para a collection `pages`.
- Sete imagens no total: quatro específicas (`capa_reg_comum_1200px_70dpi-1.jpg`, `Comum_tipo-de-uso.jpg`, `Comum_anuências.jpg`, `Comum_impedimentos.jpg`), duas compartilhadas com a Declaratória (`Declaratória_outorga-onerosa.jpg` e `Declaratória_Outorga-Onerosa-1.jpg`) e o infográfico comum (`pag.comum_como-obter-o-certificado-04-05-04.jpg`).
- Quatro manuais em PDF (`D01`–`D04`) através do bloco `iconGrid` compacto, corrigindo os caminhos desatualizados herdados do legado.
- Correção de links legislativos corrompidos:
  - Link de "Lei 17.202" na seção de impedimentos apontava erroneamente para o editor administrativo (`/wp-admin/admin.php?page=livecomposer_editor&page_id=206`); deve ser saneado para o link oficial da legislação municipal (`http://legislacao.prefeitura.sp.gov.br/leis/lei-17202-de-16-de-outubro-de-2019`).
  - Link de "Decreto 59.164" que apontava para a Lei nº 17.202 deve ser ajustado para a URL oficial do decreto (`http://legislacao.prefeitura.sp.gov.br/leis/decreto-59164-de-27-de-dezembro-de-2019`).
- Pasta lógica: `MIR/Modalidades/Comum/Imagens`.
- Alerta processual: no rito comum admite-se a emissão de apenas **um comunicado**, com prazo de 30 dias contados a partir da publicação no Diário Oficial da Cidade para atendimento das correções.

Fora do escopo: protocolo eletrônico, validação de peças técnicas ou alteração de schemas.

## 4. Estrutura proposta

```text
src/imports/wordpress/
  pages/
    regularizacao-comum.ts         # montagem da página e blocos
    regularizacao-comum-content.ts # textos conceituais, correções de links e alerta
```

## 5. Entrada e extração

- **Fonte**: `old-wordpress/db/meuimovelregular.sql` e diretório de uploads.
- **Snapshot SHA-256**: `ea309012c96c456c8c0568959a1f1bce5ae5d077239e9605bc9bdd333986264b`.
- **Registro de origem**: `wp_posts.ID = 206`, `post_name = "regularizacao-comum"`, `post_title = "Regularização Comum"`.
- **Composição**: `wp_postmeta` com `post_id = 206` e `meta_key = "dslc_code"` (2 seções, `$[0]` e `$[1]`).

## 6. Contrato dos comandos

```bash
npm run import:wordpress -- regularizacao-comum --dry-run
npm run import:wordpress -- regularizacao-comum --apply --actor-id 1 --target-label mir-local
```

### Simulação (`--dry-run`)
Validação offline dos 7 arquivos de imagem e da resolução dos 4 manuais D01–D04. Verificação de schema de todos os blocos Lexical gerados e checagem de que nenhum link remanescente aponta para `/wp-admin/`.

### Aplicação (`--apply`)
Cria a pasta lógica, efetua upload das imagens exclusivas, reusa os assets de outorga e o infográfico comum, vincula os documentos na grade e salva o rascunho com registro no manifesto.

## 7. Tradução de Regularização Comum

Destino: `title="Regularização Comum"`, `slug="regularizacao-comum"`, `_status="draft"`, `lifecycleStatus="active"`.

| Ordem | Origem no JSON legado | Destino no Payload | Configuração e Campos |
| --- | --- | --- | --- |
| 1 | `$[0]`, DSLC_Image (anexo 721) | `fullWidthImageBanner` | `desktopImage=I01`, `imageHeight=auto`, `overlay=none`. Alternativa: "Banner Regularização Comum". |
| 2 | `$[1]`, DSLC_Text_Simple (itens 0 e 1) | `richText` | Título H1 "Regularização Comum", introdução conceitual (edificações residenciais e não residenciais com área construída superior a 1.500 m² ou locais de reunião com lotação superior a 250 pessoas). |
| 3 | `$[1]`, Texto e Imagem (anexo 1125) | `imageText` | **Tipos de uso**: `image=I02`, `variant="image-right"`. Edificações que extrapolam os limites das modalidades anteriores. |
| 4 | `$[1]`, Texto de Exigências | `richText` | H2 "Exigências": conclusão até 31 de julho de 2014, observância dos parâmetros da Lei nº 17.202/2019 e Decreto nº 59.164/2019. |
| 5 | `$[1]`, Texto e Imagem (anexo 1126) | `imageText` | **Anuências**: `image=I03`, `variant="image-left"`. Prévia anuência ou autorização de órgãos competentes (patrimônio histórico, ambiental, etc.). |
| 6 | `$[1]`, Texto e Imagem (anexo 1127) | `imageText` | **Impedimentos**: `image=I04`, `variant="image-right"`. Imóveis não passíveis de regularização. **Correção**: remoção do link corrompido que apontava para `/wp-admin/` e ajuste do link do decreto. |
| 7 | `$[1]`, Texto e Imagem (anexo 1116) | `imageText` | **Outorga Onerosa**: `image=I05`, `variant="image-left"`. Conceito de potencial construtivo básico e máximo. |
| 8 | `$[1]`, Texto e Imagem (anexo 1120) | `imageText` | **Cálculo da Outorga Onerosa**: `image=I06`, `variant="image-right"`. Parâmetros e fórmula para recolhimento. |
| 9 | `$[1]`, Como solicitar | `richText` | H2 "Como solicitar sua regularização pela modalidade comum", orientando o protocolo eletrônico no Portal de Licenciamento e modelos de peças gráficas da SMUL. |
| 10 | `$[1]`, DSLC_Image (anexo 223) | `imageBlock` | `media=I07` (Infográfico do fluxo processual). |
| 11 | `$[1]`, Manuais de auxílio | `iconGrid` (variante `compact`) | Grade compacta com 4 manuais (D01–D04) via links Documento PDF. |
| 12 | `$[1]`, Informações importantes | `alertBox` | `variant="warning"`, `title="Informações Importantes: Comunicado Único"`, avisando que se admite apenas 1 comunicado, com prazo improrrogável de 30 dias contados a partir da publicação oficial. |

## 8. Mídias e pastas

- **Pasta destino**: `MIR/Modalidades/Comum/Imagens`.

| Ref | Anexo WP | Arquivo físico em uploads | Hash SHA-256 | MIME | Tamanho | Reuso |
| --- | --- | --- | --- | --- | --- | --- |
| I01 | 721 | `2019/10/capa_reg_comum_1200px_70dpi-1.jpg` | `6a626b913d1de6754fbfdbdd8f63869ec581fae70d1bfbf4a152d746c9a8af4c` | `image/jpeg` | 139.584 B | Novo |
| I02 | 1125 | `2020/01/Comum_tipo-de-uso.jpg` | `c19eb897c762e251a86f1e778eeaba764d4afaafa54611874556a9264268f4fb` | `image/jpeg` | 272.074 B | Novo |
| I03 | 1126 | `2020/01/Comum_anuências.jpg` | `bc0592fcb5bb8851d1a3f2752f2811051f2a7fe78d89f008631e48ed0fd7d989` | `image/jpeg` | 213.237 B | Novo |
| I04 | 1127 | `2020/01/Comum_impedimentos.jpg` | `95c807785cb663d2f42ee7609ee897e540b7dae9f5c1f5d6e2091288b84cbb88` | `image/jpeg` | 17.401 B | Novo |
| I05 | 1116 | `2020/01/Declaratória_outorga-onerosa.jpg` | `9d0d01d0e07e2664473b743c7b6834ccfc91eee40a1cc4a168421d55f5295429` | `image/jpeg` | 167.908 B | Reuso Declaratória (I06) |
| I06 | 1120 | `2020/01/Declaratória_Outorga-Onerosa-1.jpg` | `acb97a2fd505a33a95b1455cd43ff502706deb3ceb939b06a452dfea2b947544` | `image/jpeg` | 341.934 B | Reuso Declaratória (I07) |
| I07 | 223 | `2019/10/pag.comum_como-obter-o-certificado-04-05-04.jpg` | `d6bb87fedb792ce89bd0857b20e50bff386bfb465e1e3e62fe6aad4ef9b76eff` | `image/jpeg` | 9.218 B | Compartilhado |
| D01 | 1196 | `2023/04/MANUAL-01-COMO-PREENCHER-O-REQUERIMENTO-v032023.pdf` | `9926a0d70c10b3d4bd1b622a626e8f069afb20ab5a5d18a22f9e3b07101d78d1` | `application/pdf` | 1.475.867 B | Reuso Home (D01) |
| D02 | 1191 | `2021/07/MANUAL-DE-APRESENTAÇÃO-DE-PEÇAS-GRAFICAS-16-03-2020.pdf` | `5ade8c40159fde49681e4a76dac6c1265182af9ab5f265616ebc15b09332fffd` | `application/pdf` | 1.241.517 B | Reuso Home (D02) |
| D03 | 1188 | `2021/06/MANUAL-COMO-REALIZAR-OS-ACEITES-Jun2021.pdf` | `81a04ec7f386d5da527953ffdc0f6fcd738e78e12f6b538a28a143dd73a2e0c8` | `application/pdf` | 1.005.383 B | Reuso Home (D03) |
| D04 | 1187 | `2021/06/MANUAL-COMO-EMITIR-DTCO-E-GUIA-DE-PAGAMENTO-Jun2021.pdf` | `3017fe3221cb7db9f5619415e7bafcb246e9df95b0a84d1429920441b51237b5` | `application/pdf` | 693.981 B | Reuso Home (D04) |

## 9. Manifesto, identidade e conflitos

- Mapeia post WP `206` para `pages.id`.
- Reuso dos IDs de mídias compartilhadas cadastradas pela Declaratória e pela Home.
- Detecção e proteção de conflitos de edição manual.

## 10. Escrita, falhas e auditoria

- Carga atômica com propagação do ator administrativo e rollback seguro em caso de falha.

## 11. Arquivos previstos e impacto persistido

| Arquivo / Coleção | Impacto | Migração necessária? |
| --- | --- | --- |
| `src/imports/wordpress/pages/regularizacao-comum.ts` | Montagem da página e blocos | Não |
| `src/imports/wordpress/pages/regularizacao-comum-content.ts` | Textos, correções de links e alerta | Não |
| `src/imports/wordpress/run.ts` | Registro da opção no runner | Não |
| Coleção `pages` | Criação de 1 rascunho | Não |
| Coleção `media` | Upload de 4 imagens novas e reuso de 7 assets | Não |
| `payload-folders` | Criação de pasta específica | Não |

## 12. Validação e critérios de aceite

- [x] Simulação offline verifica os 7 arquivos de imagem e 4 PDFs.
- [x] Correção explícita do link de `/wp-admin/` para a Lei nº 17.202/2019 e do link do Decreto nº 59.164/2019.
- [x] Alerta de comunicado único configurado via `alertBox`.
- [x] Rascunho salvo no Payload sem erros ou publicação precoce.

## 13. Registro desta especificação

- Decisões: correção sanitizada dos links corrompidos do editor administrativo do WordPress legado; reuso pleno dos assets de outorga e manuais oficiais.


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
