# Upgrade da biblioteca de mídias — pastas e PDFs

**Estado:** código implementado no MIR como piloto; banco MIR não migrado e repositório pai ainda não alterado. Estes artefatos servem de referência para portar o upgrade ao `SMUL-PayloadCMS`. Os oito manuais da Home ainda não foram importados.

## Decisões fechadas

- Nesta etapa, manter os formatos de imagem atuais e **somente PDF** como documento. PDF já é aceito pelo `Media.upload.mimeTypes` dos dois repositórios; não há ampliação de formatos.
- O site exibirá um **link para consultar ou baixar o PDF**. Não haverá visualizador incorporado, conversão, leitura do conteúdo pelo frontend ou processamento de slides/documentos Office.
- Editores poderão criar, nomear e mover pastas e mídias. Exclusão de pasta será reservada ao Admin e recusada quando a pasta contiver arquivos ou subpastas.
- Pastas são organização editorial. Não alteram o caminho físico do arquivo, o ID da mídia, a URL existente nem a política de leitura pública.
- Papel Gestor, visibilidade restrita, permissões por site e multi-site ficam para uma etapa futura. Hoje há apenas Admin e Editor, e `canReadMedia` retorna `true`.

## Artefatos

1. [Especificação de implementação](./especificacao.md): contrato de dados, permissões, interface de pastas, vínculo do PDF nas páginas e arquivos previstos no repositório pai.
2. [Plano de migração e validação](./migracao-validacao.md): evolução do banco, compatibilidade, testes de aceite e ordem de entrega.
3. [Implementação no MIR](./implementacao-mir.md): arquivos alterados, decisões efetivas, comandos executados e pendências de implantação.

## Contexto confirmado

| Área | Estado no repositório pai |
| --- | --- |
| Payload | 3.88.0; suporte nativo a `folders` presente na instalação |
| `Media` | Imagens + PDF, `usage=document`, `alt` obrigatório e usado como título, sem pastas |
| Acesso | Editor cria/edita mídia; Admin também exclui; leitura de mídia pública |
| Banco | SQLite no repositório pai; MIR usa PostgreSQL |
| Página | `Pages.layout` registra os blocos em `src/collections/Pages.ts`, `src/blocks/catalog.ts` e `src/components/RenderBlocks/index.tsx` |

A referência do Payload para [pastas](https://payloadcms.com/docs/folders/overview) descreve o relacionamento lógico entre arquivos e pastas. A documentação de [uploads](https://payloadcms.com/docs/upload/overview) confirma o suporte a PDF e que a leitura do arquivo segue a política `read` da coleção.

## Sequência sugerida

1. Estabelecer a baseline e aplicar a migração do schema no banco PostgreSQL do MIR, após backup e teste em cópia.
2. Validar no Admin do MIR o fluxo com Editor e Admin, inclusive upload e download de PDF.
3. Portar os arquivos e decisões para o `SMUL-PayloadCMS`, gerando a migration própria do adaptador SQLite.
4. Importar os PDFs e imagens da Home como rascunho editorial; verificar os links antes de publicar.

Não criar pastas `MIR` no repositório pai como seed global. No MIR, a convenção editorial inicial pode ser `MIR/Home/Imagens` e `MIR/Home/Manuais`. Esse prefixo ajuda na navegação, sem representar isolamento de acesso.
