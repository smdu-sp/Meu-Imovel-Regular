# Implementação no MIR — registro para portar ao CMS pai

**Estado em 16/11/2026:** código e testes concluídos no repositório `Meu-Imovel-Regular`. Os novos objetos de banco ainda não foram migrados no PostgreSQL de um ambiente compartilhado; nenhuma mídia da Home foi importada. O `SMUL-PayloadCMS` não foi alterado.

## O que foi aplicado

| Área | Arquivos MIR | Resultado |
| --- | --- | --- |
| Biblioteca | `src/collections/Media.ts`, `src/lib/payload/media-metadata.ts`, `src/lib/payload/media-folders.ts`, `src/payload.config.ts` | Pastas nativas; Editor cria/edita; Admin exclui pasta vazia; PDFs exigem título e assinatura; `alt` permanece obrigatório para imagens. |
| Compatibilidade | `Media` `afterRead`, `src/blocks/shared/MediaImage.tsx` | Mídia antiga sem `title` recebe nome de leitura derivado de `alt`/`filename`; PDF não é enviado a `next/image`. |
| Páginas | `src/blocks/DocumentList/`, `src/blocks/catalog.ts`, `src/collections/Pages.ts`, `src/components/RenderBlocks/index.tsx` | Bloco `documentList` usa relação com `Media`, aceita apenas MIME PDF e emite links diretos com nome, formato e tamanho. PDFs antigos com `usage` legado continuam selecionáveis. |
| Admin | src/components/admin/MediaPreviewCell.tsx, MediaTitleCell.tsx, MediaBulkEditLabel.tsx, CustomNav.tsx, src/app/(payload)/custom.scss, public/admin-icons/ | Prévias, ícone de PDF, link para ficha completa, rótulo Editar em Massa e ações com cores do tema. |
| Tipos | `src/payload-types.ts` | Regenerados pelo Payload 3.88.0. |
| Testes | `src/lib/payload/media-upgrade.test.ts`, `media-folders.integration.test.ts`, `src/blocks/DocumentList/Component.test.tsx` e expectativas do catálogo | Cobrem formato, título, acessibilidade, permissões e link público. |

O link do PDF vai à rota de arquivo do Payload. O comportamento de abrir ou baixar depende do navegador; a aplicação não incorpora visualizador. Não houve inclusão de DOCX ou PPTX, papel Gestor, escopo por site ou visibilidade restrita.

## Ajuste das abas de Mídias

As abas nativas da coleção de Mídias agora exibem **Todas as Mídias** e **Navegação Por Pastas**. Os ícones de imagem e pasta ficam em `public/admin-icons/` e são aplicados somente às abas da coleção de Mídias em `src/app/(payload)/custom.scss`. Os rótulos são sobrescritos pela configuração de traduções do Payload em `src/payload.config.ts`.

## Tags nas pastas

O campo nativo folderType define quais coleções são aceitas pela pasta; com apenas Media habilitada, sua única opção é Mídias. Ele foi renomeado no Admin para **Coleções permitidas**. A coleção nativa de pastas recebeu o campo opcional **Tags editoriais** (tags, texto com múltiplos valores), preenchível por Editor ou Admin no formulário da pasta. As tags são metadados livres da pasta; não concedem acesso, não alteram arquivos e não substituem o nome da pasta. A navegação nativa do Payload continua organizada por nome e hierarquia de pastas.

Esse campo é uma adição de schema na coleção payload-folders. Pastas existentes continuam sem tags. A migration incremental de cada ambiente deve incluir o novo campo antes de usar o recurso em banco persistente.

## Ações de seleção nas abas de Mídias

Ao selecionar uma pasta com um clique, o Payload mostra as ações no topo da lista. Na navegação de Mídias, Editar e Mover usam a cor primária do tema; Excluir usa contorno e fundo discretos na cor de erro; Limpar seleção usa cores neutras. O mesmo contorno e as cores foram aplicados à seleção de arquivos em Todas as Mídias. O estilo fica restrito às duas abas de Mídias, preserva o foco de teclado e acompanha os temas claro e escuro. Nenhuma permissão ou comportamento foi alterado.

## Prévias de mídia

A lista Todas as Mídias inclui uma coluna Prévia: imagens exibem miniatura, PDFs exibem o SVG institucional. O componente usa Thumbnail do Payload, que trata falha de carregamento, e prefere thumbnailURL quando disponível. Na navegação por pastas, a grade mostra miniaturas e o SVG de PDF; a tabela nativa continua com ícones genéricos. O campo Prévia é apenas de interface.

## Acesso à ficha completa da mídia

O título editorial em Todas as Mídias abre a ficha completa do arquivo. Editar em Massa continua abrindo a edição em lote, mesmo com uma única mídia selecionada. Na navegação por pastas, duplo clique abre a ficha; a lista nativa não permite substituir o título ou a ação de edição sem trocar a view.

## Rótulo da edição em massa

Nas duas abas de Mídias, o botão nativo de edição em massa agora exibe Editar em Massa, inclusive no nome acessível. Montado na navegação personalizada, o componente MediaBulkEditLabel atualiza somente o botão com a classe edit-many__toggle, sem mudar a tradução global de Editar nem o botão de edição individual de pasta. Este adaptador depende das classes de DOM do Payload 3.88.0 e precisa ser revisto ao atualizar o pacote.

## Ícone de PDF nas prévias

Arquivos PDF exibem o SVG public/admin-icons/pdf-file.svg na coluna Prévia de Todas as Mídias e na grade da Navegação por Pastas. O estilo da grade substitui apenas o ícone genérico exibido quando não há miniatura. A tabela nativa de pastas continua com seu ícone de documento, pois não expõe o MIME no DOM nem uma célula customizável.

## Validação executada

| Comando | Resultado |
| --- | --- |
| `npm run payload -- generate:types` e `generate:importmap` com `NODE_ENV=development` | Passaram |
| `npm run typecheck` | Passou após as últimas alterações |
| `npm test` | 284/284 passaram após ajustes do catálogo e da ajuda |
| Testes focados de PDF/imagem | 8/8 passaram após o ajuste de compatibilidade |
| Teste de integração das pastas com SQLite temporário | 1/1 passou; confirmou Editor cria/renomeia, Admin exclui pasta vazia e não exclui pasta com subpasta |
| `npx eslint` nos arquivos alterados | Passou |
| npm run build com LDAP_AUTH_MODE=external | Passou após a inclusão do ícone de PDF e do rótulo Editar em Massa. |
| `npm run lint` global | Falhou por varrer milhares de arquivos do snapshot `old-wordpress`; o lint dos arquivos alterados passou |

O teste de integração usa banco SQLite em memória. Ainda faltam validação manual do Admin e de download com arquivo real e prova da migração sobre cópia do PostgreSQL do MIR.

## Migração e transporte ao repositório pai

1. No MIR, gerar migration **incremental** do PostgreSQL apenas depois de estabelecer snapshot/baseline do schema atual. O gerador do Payload, sem snapshot, parte de um schema vazio e produziria uma migration integral inadequada para uma base já existente. Não aplicar isso automaticamente.
2. Fazer backup e testar a migration em cópia; persistir o backfill de `Media.title` a partir de `alt`/`filename` e revisar PDFs com `usage` legado. Até lá, o código oferece fallback de leitura e o `title` segue nullable no banco.
3. Testar upload e movimentação de mídia no Admin do MIR, links da Home e arquivo acessado pela URL direta; depois liberar para edição real.
4. Para o `SMUL-PayloadCMS`, transportar os arquivos da tabela acima, adaptar referências de documentação e gerar **nova** migration SQLite. Não copiar SQL PostgreSQL para SQLite.
5. Atualizar a documentação corrente do CMS pai (`docs/cms/media-library.md` e `schema-evolution-migrations.md`) ao aplicar o port.

Não executar seeds de pastas do MIR no repositório pai. As pastas de `MIR/Home/Imagens` e `MIR/Home/Manuais` são decisão editorial da instância MIR.


## Correção da seleção pelo título no seletor de mídia — 18/11/2026

A célula personalizada `MediaTitleCell` criava uma âncora fixa para a edição e chamava `stopPropagation`, ignorando o callback de seleção do Payload. No seletor aberto pelos campos de upload, clicar no título navegava para a ficha em vez de escolher a mídia.

A célula agora delega a `DefaultCell` do Payload, propagando `onClick`, `link`, `linkURL`, contexto e dados da linha. Quando há callback, desabilita a navegação por link e usa o botão nativo de seleção. Na listagem, respeita as propriedades de navegação fornecidas pelo Payload. O fallback de título para nome do arquivo/ID foi mantido. Não há alteração de schema, importMap, dados persistidos ou migrations.

Para replicar no repositório pai, transportar `src/components/admin/MediaTitleCell.tsx`; a collection mantém o mesmo registro do componente. A regressão está em `src/components/admin/MediaTitleCell.test.ts` e renderiza a célula real do Payload com seu provider de configuração, verificando botão no seletor, preservação de callback e navegação da listagem e fallbacks. O teste ignora imports CSS apenas no processo Node de testes.

Validação: testes da célula e contratos de mídia (sete passaram), `npm run typecheck`, lint dos dois arquivos TypeScript alterados e `git diff --check`. Sem validação manual de navegador nesta correção. Conferir no Admin a seleção de imagem/PDF, inclusive dentro de pasta, e a abertura da ficha pela listagem.
