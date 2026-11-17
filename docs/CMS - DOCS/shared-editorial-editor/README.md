# Editor editorial compartilhado nos blocos

Implementação MIR de 17/11/2026. Reaproveita as ferramentas já disponíveis no Texto editorial nos campos ricos de Mídia e Texto, respostas do FAQ e Caixa de aviso, com edição dentro do formulário. O repositório pai não foi alterado.

## Comportamento

Os quatro campos compartilham fontes e tamanhos controlados, cores semânticas, formatação padrão do Lexical, alinhamento, listas, títulos, links, uploads e tabelas. A barra fixa fica junto ao campo do editor. Os valores de fonte/tamanho/cor permanecem os do catálogo existente; não se introduzem CSS ou valores arbitrários.

O botão de tela cheia continua exclusivo do Texto editorial. Mídia e Texto, FAQ e Caixa de aviso recebem as ferramentas e a tradução do menu de tabelas, sem o componente RichTextFullScreen. Títulos simples, descrições textarea de cards e outros campos de texto comum não foram convertidos em rich text.

## Reuso no código

| Arquivo/área | Responsabilidade |
| --- | --- |
| [src/fields/editorial-editor.ts](../../../src/fields/editorial-editor.ts) | Factory do editor Lexical com as features existentes e configuração Admin separada, com fullscreen opt-in. |
| [src/blocks/shared/EditorialRichText.tsx](../../../src/blocks/shared/EditorialRichText.tsx) | Renderer comum: mantém converters padrão, aplica família/tamanho/cor aos text nodes e carrega as folhas das fontes usadas. |
| [src/components/admin/EditorialEditorFonts.tsx](../../../src/components/admin/EditorialEditorFonts.tsx) | Carrega as fontes controladas nos editores embutidos sem montar o componente de fullscreen. |
| RichText/config.ts e Component.tsx | Usam os helpers; preservam tela cheia, tema, largura e espaçamento do Texto editorial. |
| ImageText/config.ts e Component.tsx | Ferramentas inline e renderer formatado no conteúdo ao lado da mídia. |
| FAQ/config.ts e Component.tsx | Mesmas ferramentas e renderer nas respostas dos itens. |
| AlertBox/config.ts e Component.tsx | Mesmas ferramentas e renderer no conteúdo da caixa. |
| [src/fields/editorial-editor.test.ts](../../../src/fields/editorial-editor.test.ts) | Verifica configuração efetivamente resolvida pelo Payload e o HTML dos blocos. |

A feature cliente e seus imports permanecem em `src/blocks/RichText/typography-feature.*`; não foram duplicados ou renomeados. Catálogos de fontes, tamanhos e cores também são os existentes. A configuração do editor é de servidor; somente a feature interativa continua cliente.

## Uso no Admin

Abrir uma página e seu bloco Mídia e Texto. No campo Conteúdo, selecionar o trecho e usar os menus de fonte, tamanho e cor na barra do próprio editor. As demais ferramentas permitem formatação e inserção de tabela. Salvar rascunho e conferir o preview do site para validar a composição e os limites de espaço.

No FAQ, as ferramentas ficam na Resposta; na Caixa de aviso, no Conteúdo do aviso. Reiniciar o servidor e recarregar o Admin se ele ainda estiver com a configuração antiga.

## Compatibilidade de dados

Os caminhos `richText.content`, `imageText.content`, `faqAccordion.items[].answer` e `alertBox.content` continuam `richText`. Não há campo novo, rename, remoção, mudança de tipo ou de relacionamento. O estado Lexical antigo segue válido. Os estilos opcionais já usam o contrato existente de `TextNode.$` (`fontFamily`, `fontSize`, `textColor`); valores desconhecidos caem no estilo padrão.

Não há migration SQL ou backfill para esta tarefa: trata-se de compartilhamento da configuração de editor e expansão compatível do JSON nos campos existentes. Não foram regravadas páginas, versões ou dados importados. O renderer preserva negrito e os demais converters padrão, inclusive tabelas, em vez de trocar a formatação original por texto simples.

## Port para o repositório pai

1. Conferir as versões instaladas e a presença das features/catálogos já usados no Texto editorial.
2. Adicionar os dois helpers e o componente de fontes do Admin desta documentação e integrar suas chamadas nas quatro configurações e renderers, preservando customizações locais.
3. Manter `editorialEditorAdmin(true)` somente no Texto editorial; nos campos embutidos, usar a configuração sem argumento.
4. Regenerar o import map no pai com seu comando Payload. Não copiar o import map do MIR nem mudar caminhos da feature cliente por conveniência.
5. Validar conteúdo antigo e novo nos quatro campos, tabelas, fontes carregadas e a ausência de fullscreen nos campos embutidos.

Não transportar dados de páginas, importadores ou assets MIR. A tabela usa `EXPERIMENTAL_TableFeature`, a mesma API anterior: revisar esse ponto e o tradutor do menu ao atualizar o Payload.

## Validações e limites

- `NODE_ENV=development npm run payload -- generate:importmap`: passou; o import map inclui o componente EditorialEditorFonts. A feature de tipografia e os componentes anteriores mantêm seus caminhos.
- `npm run typecheck`: passou.
- `npx eslint` nos helpers e configs/renderers alterados: passou.
- `DISABLE_PAYLOAD_HMR=true npm test`: 98 passaram, zero falhas, um teste PostgreSQL opcional ignorado. A suíte rodou fora do sandbox por causa do subprocesso do teste de importação.
- `LDAP_AUTH_MODE=external npm run build`: passou com Turbopack fora do sandbox.
- Os testes conferem o carregamento das fontes do Admin sem fullscreen, as features resolvidas, fullscreen exclusivo do Texto editorial, estilo e folha de fonte nos três blocos embutidos, negrito legado, descarte de estilos desconhecidos e formatação dentro de tabela.

Não houve validação manual de seleção de texto/tabelas no navegador. Conferir especialmente responsividade de tabelas na coluna de Mídia e Texto, menus em vários editores abertos e contraste das cores escolhidas. Não foram alterados o componente de fullscreen nem o tradutor global do menu de tabelas.

Decisão: reutilizar a funcionalidade existente, separando editor, apresentação do Admin e renderer, sem novo bloco ou mudança de schema. Desvios: nenhum; expansão limitada aos campos que já eram rich text. A entrega preserva as alterações de links PDF e importador que já existiam no workspace.

Validação documental: links relativos conferidos e `git diff --check` aprovado. O import map foi regenerado pelo Payload; os tipos gerados não exigiram alteração nesta tarefa, pois os campos mantiveram o contrato rich text anterior.
