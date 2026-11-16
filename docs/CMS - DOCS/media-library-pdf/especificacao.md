# Especificação — pastas editoriais e links de PDF

## Objetivo e limite

Organizar `Media` em pastas editáveis no Admin e permitir que uma página publique links para PDFs cadastrados em `Media`. O usuário do site recebe um link direto ao arquivo; o site não incorpora visualizador de PDF. As imagens existentes continuam funcionando.

## 1. Pastas

- Habilitar `folders: true` somente em `src/collections/Media.ts`. O Payload 3.88.0 cria a coleção interna de pastas e o relacionamento entre pasta e mídia. Não criar uma coleção paralela `MediaFolders` nem transformar o nome da pasta em caminho de armazenamento.
- Usar `folders.collectionOverrides` em `src/payload.config.ts` para ajustar o acesso da coleção de pastas gerada: leitura para usuário autenticado do Admin, criação e edição para quem tenha `media.create`/`media.update`, exclusão somente para quem tenha `media.delete` (Admin no modelo atual). Preservar os hooks e campos nativos ao aplicar o override.
- Impedir a exclusão de pasta que contenha mídia ou subpastas. A implementação nativa observada no Payload 3.88.0 remove subpastas e desassocia documentos ao excluir uma pasta; o bloqueio evita uma reorganização em massa involuntária.
- Permitir mover mídia entre pastas e deixar itens antigos sem pasta na raiz. A escolha da pasta não muda `Media.id`, `filename` ou `url`.
- Filtro e navegação por pasta devem funcionar no seletor de mídia dos Blocks, além da lista principal. Verificar isso no Admin real; a API de pastas não substitui os testes de UX.

- O campo nativo Coleções permitidas define quais coleções cabem na pasta; hoje só Mídias está habilitada. Tags editoriais são texto livre e não mudam essa regra ou as permissões.

## 2. Metadados de imagem e PDF

| Campo | Imagem | PDF |
| --- | --- | --- |
| `title` novo | Nome editorial no Admin; obrigatório após backfill | Nome editorial e rótulo padrão de download; obrigatório após backfill |
| `alt` existente | Texto alternativo obrigatório | Não exigido; valor legado pode permanecer |
| `usage` existente | Papel editorial de imagem | `document` |
| `caption` existente | Opcional | Opcional; não é nome de link |
| `mimeType`, `filename`, `filesize`, `url` | Gerados pelo Payload | Gerados pelo Payload |

Adicionar `title` como opcional no schema, exigir título explícito para novos PDFs e preencher automaticamente o título de imagens novas. Em registros antigos, usar `alt`/`filename` como fallback de leitura e ao editar; o backfill persistente vem na migration. Só tornar a coluna obrigatória depois de revisar o backfill. Alterar a validação de `alt` para ser obrigatória apenas em imagens, inclusive quando o arquivo é substituído. No Admin, exibir `title`, `usage`, pasta, tipo e atualização; o `useAsTitle` passa a `title` depois do backfill. Não usar `alt` como chave de importação ou rótulo público de documento.

`application/pdf` já integra a lista permitida; não inserir MIME de Word, PowerPoint ou outros documentos. Validar que um item marcado como `usage=document` tenha MIME PDF e que PDFs sejam classificados como documento. Verificar tipo real do arquivo antes de disponibilizá-lo e definir limite de tamanho adequado ao ambiente. A edição de um PDF existente não deve remover sua URL por simples mudança de título/pasta.

## Interface editorial do piloto

- Todas as Mídias mostra coluna Prévia: miniatura para imagem e SVG institucional para PDF. O título editorial é um link para a ficha completa.
- Na navegação por pastas, a grade mostra miniaturas e o SVG de PDF; a tabela nativa ainda mostra ícones genéricos. Duplo clique na mídia abre sua ficha.
- As duas abas destacam as ações selecionadas com contorno e cores do tema. O botão Editar em Massa continua abrindo a edição em lote. O rótulo é ajustado por um adaptador de DOM restrito às abas de Mídias; rever esse adaptador ao atualizar o Payload.
- A lista nativa de pastas do Payload 3.88.0 não expõe extensão para a célula do título nem para trocar o destino do botão de edição em massa.

## 3. Inserção em páginas

Criar um bloco reutilizável `documentList` em `Pages.layout`, adequado à Home e a outras páginas:

```text
heading?: texto
items[]:
  label?: texto        # se vazio, usa Media.title
  file: upload -> media (obrigatório; somente PDF)
```

- O seletor deve listar registros de `Media` com `mimeType=application/pdf`. A validação no servidor também deve recusar outros tipos, pois filtro visual não é regra de integridade. PDFs legados com `usage` diferente de `document` continuam selecionáveis; novos uploads de PDF são classificados automaticamente como documento.
- O renderer mostra um link por item com nome compreensível e indicação `PDF` e tamanho quando disponível. Usa a URL atual do registro `Media`; não copia URLs para dentro do conteúdo da página. Um PDF ausente ou inválido não deve gerar link quebrado.
- O link vai à rota de arquivo do Payload. O navegador pode abrir ou baixar conforme seu comportamento/configuração; não construir visualizador na aplicação. Se o produto exigir download forçado de modo uniforme, tratar `Content-Disposition` e a resposta do arquivo numa decisão específica.
- Para a Home do MIR, preencher oito itens na ordem D01–D08 do mapa existente. Os links para PDFs permanecem revisáveis editorialmente antes da publicação.

## 4. Arquivos do repositório pai a tocar

| Arquivo/área | Mudança prevista |
| --- | --- |
| `src/collections/Media.ts` | `folders: true`, `title`, política de `alt` por tipo, rótulos no Admin e validação de PDF |
| `src/payload.config.ts` | Override de acesso e guarda de exclusão para a coleção de pastas gerada |
| `src/blocks/DocumentList/config.ts` e `Component.tsx` | Bloco e renderer de links |
| `src/blocks/catalog.ts` | Registrar `documentList` |
| `src/collections/Pages.ts` | Registrar configuração do bloco |
| `src/components/RenderBlocks/index.tsx` | Registrar renderer |
| `src/payload-types.ts` e import map | Regenerar com os comandos do projeto, sem edição manual |
| `docs/cms/media-library.md` e `docs/cms/schema-evolution-migrations.md` | Atualizar o estado implementado e a decisão de migração |

O esquema de `Pages.layout` e de `Media` exige a revisão de dados persistidos descrita em [migração e validação](./migracao-validacao.md). Não implementar site/tenant, Gestor ou arquivo restrito neste patch.
