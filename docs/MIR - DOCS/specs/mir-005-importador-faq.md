---
spec: MIR-005
title: Importador editorial de Dúvidas Frequentes (FAQ) WordPress
status: proposed
date: 2026-11-17
---

# MIR-005 — Importador editorial de Dúvidas Frequentes (FAQ)

## 1. Resultado esperado

Estabelecer a especificação para importação editorial da página de **Dúvidas Frequentes** (slug `faq`), convertendo o catálogo de 29 perguntas e respostas do módulo `DSLC_Accordion` e os canais de atendimento legados para os blocos estruturados do Payload CMS (`fullWidthImageBanner`, `richText`, dois blocos `faqAccordion` e um bloco `cards` para os canais de suporte).

O importador deve simular a operação offline (`--dry-run`), cadastrar as imagens dos canais em `MIR/FAQ/Imagens`, tratar o limite estrutural do bloco nativo `faqAccordion` (`maxRows: 20`) através de particionamento temático de dois blocos, expurgar a terminologia proibida ("anistia") e gravar o documento em rascunho com total rastreabilidade.

## 2. Referências e precedência

- [MIR-001 — Importador editorial da Home](./mir-001-importador-home.md): arquitetura do runner, manifesto e locks.
- [Mapeamento de todas as páginas](../mapas/todas-paginas.md): inventário de links, manuais e legislação municipal.
- [FAQBlock](../../../src/blocks/FAQ/config.ts): especificação do bloco Payload (`faqAccordion`), variante, campos e limite máximo de 20 perguntas por bloco (`maxRows: 20`).
- [CardsBlock](../../../src/blocks/Cards/config.ts): suporte a cards com imagem, título e links para os canais de atendimento.
- [Guardrails do Projeto](../../../AGENTS.md):
  - Proibição absoluta do termo "anistia" na interface institucional.
  - O portal não substitui canais oficiais de licenciamento ou fiscalização.

## 3. Escopo

- Tradução explícita da página WordPress ID `174`, slug `faq`, para a collection `pages`.
- Seis imagens (`I01`–`I06`) verificadas no acervo físico de uploads (`capa_dúvidas_1920px_70dpi-e1572617398633.jpg`, `Proposta__Página-Dúvidas-Frequentes-01.png`, `bt-1.png`, `faq-suporte-tecnico.png`, `bt_arthur-saboya-1.png`, `bt_SP156-1.png`).
- 29 perguntas e respostas extraídas do array serializado de `DSLC_Accordion`.
- Divisão dos 29 itens em dois blocos `faqAccordion` (15 e 14 perguntas) para respeitar o limite de `maxRows: 20` sem alterações de schema no CMS.
- Organização dos canais de suporte ao munícipe (Sala Arthur Saboya, Suporte Técnico do Portal, Dúvidas de Processos em Andamento e Central SP156).
- Saneamento terminológico mandatório sobre todas as perguntas e respostas.

Fora do escopo: alteração de schema em `FAQBlock`, criação de sistema de busca interativo em JavaScript no cliente, sistema de tickets ou chat em tempo real.

## 4. Estrutura proposta

```text
src/imports/wordpress/
  pages/
    faq.ts                     # montagem do plano, partição do FAQ e layout
    faq-content.ts             # 29 perguntas e respostas saneadas e canais de contato
```

## 5. Entrada e extração

- **Fonte**: `old-wordpress/db/meuimovelregular.sql` e diretório de uploads.
- **Snapshot SHA-256**: `ea309012c96c456c8c0568959a1f1bce5ae5d077239e9605bc9bdd333986264b`.
- **Registro de origem**: `wp_posts.ID = 174`, `post_name = "faq"`, `post_title = "Dúvidas frequentes"`.
- **Composição**: `wp_postmeta` com `post_id = 174` e `meta_key = "dslc_code"` (6 seções, sendo as seções `$[4]` e `$[5]` vazias).
- **Extração do acordeão**: o módulo `DSLC_Accordion` na seção `$[1]` contém as chaves `accordion_nav` (títulos) e `accordion_content` (respostas em HTML), delimitadas pela sequência `(dslc_sep)`. O lexer deve separar as strings por esse marcador, remover espaços espúrios e validar a correspondência biunívoca (29 títulos para 29 respostas).

## 6. Contrato dos comandos

```bash
npm run import:wordpress -- faq --dry-run
npm run import:wordpress -- faq --apply --actor-id 1 --target-label mir-local
```

### Simulação (`--dry-run`)
Execução offline. Valida o desmembramento das 29 perguntas/respostas, validação de caracteres de cada pergunta (máximo de 140 caracteres em `question`), conformidade do particionamento nos dois blocos (15 + 14 itens) e verificação dos 6 arquivos de imagem.

### Aplicação (`--apply`)
Cadastra as imagens em `MIR/FAQ/Imagens`, gera a página `faq` em rascunho com os blocos convertidos e registra o hash da projeção no manifesto.

## 7. Tradução de Dúvidas Frequentes

Destino: `title="Dúvidas Frequentes"`, `slug="faq"`, `_status="draft"`, `lifecycleStatus="active"`.

| Ordem | Origem no JSON legado | Destino no Payload | Configuração e Campos |
| --- | --- | --- | --- |
| 1 | `$[0]`, DSLC_Image (anexo 731) | `fullWidthImageBanner` | `desktopImage=I01`, `imageHeight=auto`, `overlay=none`. Alternativa: "Banner Dúvidas Frequentes". |
| 2 | `$[1]`, DSLC_Text_Simple | `richText` | Título H1 "Dúvidas Frequentes" e resumo introdutório sobre a aplicação da Lei nº 17.202/2019. |
| 3 | `$[1]`, DSLC_Accordion (itens 1 a 15) | `faqAccordion` (Bloco 1) | `title="Sobre a Lei e Modalidades de Regularização"`, `variant="default"`, `items` (15 perguntas e respostas sobre conceito da lei, modalidades, IPTU, impedimentos, responsabilidade técnica, prazos e áreas construídas). |
| 4 | `$[1]`, DSLC_Accordion (itens 16 a 29) | `faqAccordion` (Bloco 2) | `title="Procedimentos, Custos e Atendimento"`, `variant="default"`, `items` (14 perguntas e respostas sobre IPTU retroativo, custos/taxas, templos, onde solicitar, problemas no portal, protocolos e usucapião). |
| 5 | `$[2]` e `$[3]`, textos e ícones (anexos 733, 800, 732, 734) | `cards` | Bloco `cards` com 4 itens (ou `actionBanners`), centralizando os canais oficiais:<br>1. **Legislação (Sala Arthur Saboya)**: atendimento presencial;<br>2. **Suporte Técnico do Portal**: envio de tela e protocolo por e-mail;<br>3. **Processos em Andamento**: orientação de protocolo;<br>4. **Central SP156**: portal, aplicativo e telefone 156. |

As seções vazias `$[4]` e `$[5]` são descartadas.

### Saneamento terminológico obrigatório
A palavra "anistia" deve ser sistematicamente substituída nas perguntas:
- **Pergunta 1 original**: *"O que é a Lei de Anistia de imóveis? Todos os imóveis podem ser regularizados?"*<br>**Revisão**: *"O que é a Lei de Regularização de Edificações? Todos os imóveis podem ser regularizados?"*
- **Pergunta 14 original**: *"Com o protocolo de Anistia fica suspensa a fiscalização?"*<br>**Revisão**: *"Com o protocolo de regularização fica suspensa a fiscalização?"*
- **Pergunta 17 original**: *"Haverá custo para anistiar os imóveis?"*<br>**Revisão**: *"Haverá custo para regularizar os imóveis?"*

Nas respostas correspondentes, preservar o conteúdo pedagógico original que esclarece: *"O termo 'anistia', comumente utilizado nos processos de regularização, deve ser evitado. A Prefeitura não está 'perdoando' as irregularidades... mas apresentando uma alternativa de ajuste àqueles que estiverem em desacordo com a legislação de ordenamento do território"*.

## 8. Mídias e pastas

- **Pasta destino**: `MIR/FAQ/Imagens`.

| Ref | Anexo WP | Arquivo físico em uploads | Hash SHA-256 | MIME | Tamanho | Título editorial / Alt |
| --- | --- | --- | --- | --- | --- | --- |
| I01 | 731 | `2019/10/capa_dúvidas_1920px_70dpi-e1572617398633.jpg` | `be57677e78e2eb37ca51275003b4c6156f9b8705f7a7f7c6b14d8390814ab433` | `image/jpeg` | 190.013 B | Banner Dúvidas Frequentes |
| I02 | 1096 | `2020/01/Proposta__Página-Dúvidas-Frequentes-01.png` | `d9a1b4e6b542291df792b141f048a33ef9164edfc2be54a302ab59a6827c2bbb` | `image/png` | 4.026 B | Ilustração Dúvidas Frequentes |
| I03 | 733 | `2019/10/bt-1.png` | `68f64c37d5df1894f4836ba1184afa0a5a243c48e121d2192c1b3e5d0e4de587` | `image/png` | 64.208 B | Ícone Sala Arthur Saboya |
| I04 | 800 | `2020/01/faq-suporte-tecnico.png` | `c1bc7b089387fab9eb6eded71b58bb9641ea0bd8c12f66f2957b27a3abb85092` | `image/png` | 47.916 B | Suporte Técnico do Portal |
| I05 | 732 | `2019/10/bt_arthur-saboya-1.png` | `245ff49c20ef443c1748b7532db76d26074600ae7fb7dfbbf02af0e1c573485a` | `image/png` | 55.842 B | Ícone Pedidos em Andamento |
| I06 | 734 | `2019/10/bt_SP156-1.png` | `a448d513c861cc1aab26df7361d50b113bb4581600bf165a4c8bc27192e0559f` | `image/png` | 74.505 B | Ícone Central SP156 |

## 9. Manifesto, identidade e conflitos

- Mapeia post WP `174` para `pages.id`.
- Se `slug="faq"` já existir sem registro correspondente, a operação é abortada.
- As 29 perguntas e respostas são normalizadas em uma representação canônica ordenada para cálculo de hash de projeção.

## 10. Escrita, falhas e auditoria

- Carga atômica com transação e checkpoints de manifesto.
- Auditoria preservada com identificação do administrador executor.
- Validação estrita do comprimento de cada pergunta em relação ao campo `maxLength: 140` de `FAQBlock.items.question`.

## 11. Arquivos previstos e impacto persistido

| Arquivo / Coleção | Impacto | Migração necessária? |
| --- | --- | --- |
| `src/imports/wordpress/pages/faq.ts` | Parser do acordeão e tradução de blocos | Não |
| `src/imports/wordpress/pages/faq-content.ts` | Coleção de 29 perguntas/respostas saneadas | Não |
| `src/imports/wordpress/run.ts` | Registro da opção `faq` | Não |
| Coleção `pages` | Criação de 1 documento rascunho (`slug="faq"`) | Não |
| Coleção `media` | Upload de até 6 arquivos em `MIR/FAQ/Imagens` | Não |
| `payload-folders` | Criação de `MIR/FAQ/Imagens` | Não |

## 12. Validação e critérios de aceite

- [ ] Simulação offline verifica separação exata dos 29 itens e seus conteúdos.
- [ ] Divisão dos 29 itens em 2 blocos `faqAccordion` válidos perante a restrição de schema `maxRows: 20`.
- [ ] Eliminação da palavra "anistia" nos títulos das perguntas 1, 14 e 17.
- [ ] Validação de que nenhuma pergunta ultrapassa 140 caracteres.
- [ ] Imagens dos 4 canais de atendimento cadastradas e relacionadas em `cards`.
- [ ] Rascunho criado com segurança e registrado no manifesto.

## 13. Registro desta especificação

- Decisões: particionar o acordeão em dois blocos temáticos para evitar quebra do limite de `maxRows: 20` de `FAQBlock` sem alterar o schema do Payload; substituição rigorosa de termos proibidos.
