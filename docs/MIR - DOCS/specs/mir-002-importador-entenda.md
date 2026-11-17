---
spec: MIR-002
title: Importador editorial de Entenda a Lei WordPress
status: implemented
date: 2026-11-17
---

# MIR-002 — Importador editorial de Entenda a Lei

Implementação e desvios registrados no [guia operacional](../importador-entenda.md). Código testado em banco descartável; aplicação na instância e validação manual não foram executadas. O contrato original abaixo é preservado como referência, com as divergências efetivas documentadas no guia.

## 1. Resultado esperado

Fornecer um comando de importação editorial dedicado para a página **Entenda a Lei**, com tradução explícita do conteúdo e da estrutura do Live Composer legado para os blocos atuais do Payload CMS (`fullWidthImageBanner`, `richText`, `videoBlock` e `imageText`).

O comando deve simular a carga em modo offline (`--dry-run`), importar os arquivos selecionados para a pasta `MIR/Entenda/Imagens`, incorporar o vídeo explicativo oficial via `videoBlock`, criar a página em rascunho com rastreabilidade completa no manifesto local e garantir idempotência e proteção contra sobrescrita de edições manuais no CMS.

## 2. Referências e precedência

- [MIR-001 — Importador editorial da Home](./mir-001-importador-home.md): arquitetura do runner, manifesto, locks e ciclo de vida de importações no MIR.
- [Mapeamento de todas as páginas](../mapas/todas-paginas.md): inventário de links, dependências e destinos internos/externos.
- [Levantamento de old-wordpress](../analise-old-wordpress.md): análise estática do dump e dos uploads.
- [Catalog de blocos](../../../src/blocks/catalog.ts), [VideoBlock](../../../src/blocks/VideoBlock/config.ts), [ImageText](../../../src/blocks/ImageText/config.ts), [RichText](../../../src/blocks/RichText/config.ts) e [Pages](../../../src/collections/Pages.ts).
- [Guardrails do Projeto](../../../AGENTS.md): proibição estrita do termo "anistia" na interface institucional, separação de responsabilidades e ausência de regras jurídicas ou de elegibilidade em componentes visuais.

Em divergências entre os dados brutos legados e as regras institucionais do MIR, prevalecem as diretrizes institucionais (especialmente a remoção da expressão vedada e o ajuste de links quebrados).

## 3. Escopo

- Um módulo de tradução específico para a página WordPress ID `172`, slug `entenda`, para a collection `pages`.
- Cinco imagens (`I01`–`I05`) identificadas e validadas fisicamente no acervo de uploads (`2019/10/capa_Entenda-a-lei_1920px_70dpi.jpg`, `2019/10/foto-alberto-simon-archdaily_1200px_70dpi.jpg`, `2019/12/declaratoria-simplificada.jpg`, `2019/10/jonathan-borba-gXHHHNdKDq4-unsplash_1200px_70dpi.jpg`, `2019/11/segio-souza-shopping_800x800.jpg`). Reuso de mídias já cadastradas pelo manifesto (ex.: `foto-alberto-simon` e `declaratoria-simplificada` compartilhadas com a Home).
- Organização lógica das imagens novas na pasta `MIR/Entenda/Imagens`, usando `payload-folders`.
- Incorporação do vídeo institucional via bloco nativo `videoBlock`, apontando para a URL pública do YouTube `https://www.youtube.com/watch?v=ECumpvJ-Yb8` (derivada do iframe original `https://www.youtube.com/embed/ECumpvJ-Yb8`).
- Quatro blocos de modalidades (`imageText`), corrigindo o erro legado em que o link da imagem da Declaratória Simplificada apontava erroneamente para a página da Automática.
- Preservação dos links legais (Lei nº 17.202/2019, Decreto nº 59.164/2019) e listas externas de regularizados em formato PDF/XLS.

Fora do escopo: publicação automática, despublicação de páginas existentes, alteração de Header/Footer/Globals, criação de páginas-alvo inexistentes, download local das planilhas externas da SMUL ou alterações no schema do Payload.

## 4. Estrutura proposta

```text
src/imports/wordpress/
  pages/
    entenda.ts                 # montagem do plano, blocos e layout; sem I/O direto
    entenda-content.ts         # textos revisados, URLs, metadados e notas de revisão
```

O runner central `src/imports/wordpress/run.ts` e os utilitários em `src/imports/wordpress/shared/` desenvolvidos na MIR-001 serão reutilizados para resolver assets, manifesto, preflight, transação e escrita.

## 5. Entrada e extração

- **Fonte**: `old-wordpress/db/meuimovelregular.sql` e diretório `old-wordpress/meuimovelregular/wp-content/uploads/`.
- **Snapshot SHA-256**: `ea309012c96c456c8c0568959a1f1bce5ae5d077239e9605bc9bdd333986264b`.
- **Registro de origem**: `wp_posts.ID = 172`, `post_name = "entenda"`, `post_title = "Entenda a Lei"`.
- **Metadados do builder**: `wp_postmeta` com `post_id = 172` e `meta_key = "dslc_code"`.
- O array JSON de `dslc_code` contém 8 seções (`$[0]` a `$[7]`). A seção `$[7]` está vazia e é descartada.

## 6. Contrato dos comandos

```bash
npm run import:wordpress -- entenda --dry-run
npm run import:wordpress -- entenda --apply --actor-id 1 --target-label mir-local
```

### Simulação (`--dry-run`)
Execução offline sem conectar ao banco de dados ou inicializar o Payload. Verifica snapshot, integridade e hashes dos arquivos físicos de mídia, resolução da URL do vídeo do YouTube e validação de schema dos blocos Lexical. Exibe relatório detalhado com referências simbólicas e pendências.

### Aplicação (`--apply`)
Exige `DATABASE_URI` explícita, `--target-label` e `--actor-id` de um administrador ativo. Executa preflight de pastas, importa mídias não cadastradas com checkpoint no manifesto, resolve relacionamentos internos com páginas já ativas e grava a página em rascunho.

## 7. Tradução de Entenda a Lei

A página é configurada como `title="Entenda a Lei"`, `slug="entenda"`, `_status="draft"`, `lifecycleStatus="active"`.

| Ordem | Origem no JSON legado | Destino no Payload | Configuração e Campos |
| --- | --- | --- | --- |
| 1 | `$[0]`, DSLC_Image (anexo 735) | `fullWidthImageBanner` | `desktopImage=I01`, `imageHeight=auto`, `overlay=none`. Alternativa textual revisável. |
| 2 | `$[1]`, DSLC_Text_Simple | `richText` | Título H1 "Entenda a Lei", objetivos da lei, link para Lei nº 17.202/2019 e links informativos para as listas de imóveis regularizados. |
| 3 | `$[2]`, DSLC_Html (iframe YouTube) | `videoBlock` | `url="https://www.youtube.com/watch?v=ECumpvJ-Yb8"`, `provider="youtube"`, `aspectRatio="16:9"`, título acessível "Vídeo explicativo sobre a Lei de Regularização de Edificações". |
| 4 | `$[2]`, DSLC_Text_Simple | `richText` | H2 "O que é a Lei de Regularização de Edificações?", explicação conceitual eliminando qualquer uso afirmativo do termo vedado. |
| 5 | `$[3]`, DSLC_Image (712) + textos | `imageText` | Modalidade Automática: imagem à direita ou alternada (`variant="image-right"`), descrição, CTA com link interno para `/regularizacao-automatica/`. |
| 6 | `$[4]`, DSLC_Image (776) + textos | `imageText` | Modalidade Declaratória Simplificada: imagem à esquerda (`variant="image-left"`), descrição, CTA com link interno para `/regularizacao-declaratoria-simplificada/`. **Correção**: eliminar o desvio legado em que o link da imagem apontava para a página errada. |
| 7 | `$[5]`, DSLC_Image (717) + textos | `imageText` | Modalidade Declaratória: imagem à direita (`variant="image-right"`), descrição, CTA com link interno para `/regularizacao-declaratoria/`. |
| 8 | `$[6]`, DSLC_Image (752) + textos | `imageText` | Modalidade Comum: imagem à esquerda (`variant="image-left"`), descrição, CTA com link interno para `/regularizacao-comum/`. |

A seção vazia `$[7]` não gera bloco.

### Diretrizes editoriais e terminológicas
1. **Terminologia obrigatória**: Substituir "Lei de Anistia de imóveis" por "Lei de Regularização de Edificações". No texto que debate a expressão ("O termo 'anistia', comumente utilizado... deve ser evitado"), preservar a explicação didática sobre a inadequação do termo informal, garantindo que o portal não use "anistia" como definição própria.
2. **Links internos**: Utilizar relação `pages` quando as páginas de modalidade estiverem publicadas e ativas. Se não estiverem migradas, manter URL absoluta temporária legada e registrar pendência no manifesto.

## 8. Mídias e pastas

- **Pasta destino**: `MIR/Entenda/Imagens` (pai: pasta raiz `MIR`).
- Classificação: `usage="content"`, MIME `image/jpeg`.

| Ref | Anexo WP | Arquivo físico em uploads | Hash SHA-256 | Tamanho | Título editorial / Alt | Reuso |
| --- | --- | --- | --- | --- | --- | --- |
| I01 | 735 | `2019/10/capa_Entenda-a-lei_1920px_70dpi.jpg` | `45b60962df8ce8aeeb74fc634246f952f423da76507af778d147196d7d6eae57` | 406.479 B | Banner Entenda a Lei | Novo |
| I02 | 712 | `2019/10/foto-alberto-simon-archdaily_1200px_70dpi.jpg` | `526eac80c62746144e1d9211591fe1f68be23a786202463678a7e31e3e2cdf60` | 100.777 B | Modalidade Automática | Reuso da Home (I03) |
| I03 | 776 | `2019/12/declaratoria-simplificada.jpg` | `d9f08b462b03e2562b942e79cd2dfcee26568f455ddcbcbcbd9d9659741a5d4e` | 71.773 B | Modalidade Declaratória Simplificada | Reuso da Home (I04) |
| I04 | 717 | `2019/10/jonathan-borba-gXHHHNdKDq4-unsplash_1200px_70dpi.jpg` | `efc818ec9b3c6751dfe3cb8abc08841af98340d4eab7c6e6f2f864baa00cd8bd` | 193.965 B | Modalidade Declaratória | Reuso/Nova (variante de I05) |
| I05 | 752 | `2019/11/segio-souza-shopping_800x800.jpg` | `d85ff66c23fead893f8491aa283f442127963a3ee07c8955ba073118661b2054` | 85.200 B | Modalidade Comum | Reuso/Nova (quadrada 800x800) |

## 9. Manifesto, identidade e conflitos

- Utiliza o arquivo de manifesto compartilhado em `.local/wordpress-import/manifest-<target>.json`.
- Mapeia post WP `172` para `pages.id`.
- Se `slug="entenda"` já existir no Payload sem registro no manifesto, a importação é bloqueada para evitar sobrescrita indevida de conteúdo manual.
- Compara hashes canônicos da projeção editorial da página antes de aplicar atualizações.

## 10. Escrita, falhas e auditoria

- Criação e atualização via Payload Local API com contexto de usuário Admin (`context.user`).
- Mídias reutilizadas não sofrem upload duplicado; seu `id` é referenciado diretamente nos blocos.
- Checkpoint atômico gravado no manifesto a cada operação concluída.
- Locks de concorrência ativos durante o processo.

## 11. Arquivos previstos e impacto persistido

| Arquivo / Coleção | Impacto | Migração necessária? |
| --- | --- | --- |
| `src/imports/wordpress/pages/entenda.ts` | Tradução de blocos e montagem da página | Não |
| `src/imports/wordpress/pages/entenda-content.ts` | Textos saneados e metadados | Não |
| `src/imports/wordpress/run.ts` | Registro da opção de página `entenda` | Não |
| Coleção `pages` | Criação de 1 documento rascunho (`slug="entenda"`) | Não |
| Coleção `media` | Upload de até 3 novas mídias e reuso de 2 | Não |
| `payload-folders` | Criação/reuso da pasta `MIR/Entenda/Imagens` | Não |

## 12. Validação e critérios de aceite

- [ ] Simulação offline (`--dry-run`) valida os 5 assets, hashes e estrutura sem tocar no banco de dados.
- [ ] Vídeo do YouTube configurado via `videoBlock` sem iframe cru ou scripts incorporados.
- [ ] Remoção da expressão "anistia" nos títulos institucionais e alinhamento do texto explicativo.
- [ ] Correção do link da modalidade Declaratória Simplificada para `/regularizacao-declaratoria-simplificada/`.
- [ ] Reuso bem-sucedido dos assets 712 e 776 já cadastrados pela Home.
- [ ] Criação da página `entenda` como rascunho (`_status="draft"`), protegendo páginas publicadas.
- [ ] Testes de unidade cobrindo o parser de conteúdo e a integridade da montagem dos blocos.

## 13. Registro desta especificação

- Decisões: uso do `videoBlock` nativo para acomodar o YouTube da seção `$[2]`; correção explícita da URL errada herdada do builder original na Declaratória Simplificada; reuso transparente dos anexos compartilhados com a Home.
- Nenhum código de importação foi implementado nesta entrega de especificação.
