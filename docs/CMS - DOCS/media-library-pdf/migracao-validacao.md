# Plano de migração e validação

## Premissas

O repositório pai usa SQLite; o MIR usa PostgreSQL. Gerar e executar a evolução de schema por adaptador, sem reaproveitar SQL manual entre bancos. O repositório pai ainda não contém baseline integral de migrations do Payload; resolver essa baseline antes de aplicar uma migration incremental em ambiente compartilhado. O arquivo de backfill de roles existente não é baseline geral.

## Evolução segura

| Mudança | Tratamento |
| --- | --- |
| Pastas nativas em `Media` | Criar tabelas/relações geradas pelo Payload; itens existentes permanecem sem pasta. Validar o estado da raiz e referências existentes. |
| `Media.title` | Adicionado como opcional no código. Leitura e edição de registros antigos usam fallback de `alt`/`filename`; persistir backfill na migration do ambiente, revisar valores e só então tornar obrigatório no banco. |
| `Media.alt` | Relaxar nulidade para PDFs; manter validação obrigatória para imagens. Preservar textos existentes. |
| `Pages.layout.documentList` | Novo bloco; não reescrever os blocos existentes. Criar conteúdo da Home em rascunho após migrar PDFs. |
| payload-folders.tags | Campo opcional; incluir na migration gerada pelo adaptador. Pastas existentes ficam sem tags. |
| Regras de pasta | Configurar acesso e guarda de exclusão antes de liberar o Admin aos editores. |

Sequência por ambiente: inventariar mídias/Pages e suas URLs → backup e restauração em cópia → estabelecer baseline → gerar migration do adaptador → aplicar em cópia → backfill de `title` → conferir documentos com título vazio e relações de mídia → aplicar validação final → testar Admin, API e site → implantar no ambiente alvo. Se houver dados existentes em ambos os bancos, repetir o procedimento em cada um.

**Retorno seguro:** em caso de falha, recuar o código e preservar as colunas e tabelas novas até corrigir o problema. Não remover pastas ou campos automaticamente; uma reversão destrutiva exigiria inventário de relações e backup. Não renomear arquivos nem alterar IDs/URLs no backfill.

## Verificação funcional

- [ ] Nas duas abas, verificar contorno e foco dos botões, rótulo Editar em Massa e preservação do Editar individual de pasta.
- [ ] Na lista geral, imagens mostram miniatura, PDFs mostram o SVG institucional e o título editorial abre a ficha completa.
- [ ] Na grade de pastas, imagens mostram miniatura e PDFs mostram o SVG institucional; duplo clique abre a ficha. Registrar que a tabela nativa ainda usa ícone genérico.

- [ ] Editor adiciona tags livres a uma pasta, salva e confirma que persistem na reabertura.
- [ ] Editor entra no Admin, cria/renomeia pastas e move mídia; não consegue excluir pasta. Admin também não consegue excluir pasta com mídia ou subpasta.
- [ ] Mídias anteriores aparecem na raiz; continuam abrindo pelos mesmos IDs e URLs após serem movidas.
- [ ] Editor cadastra PDF com `title`; o Admin não exige `alt` de PDF. Imagem continua exigindo `alt`.
- [ ] Upload não PDF continua rejeitado como documento; o bloco recusa mídia que não seja PDF, inclusive via API. PDF legado com `usage` antigo continua elegível pelo MIME.
- [ ] Uma página publicada exibe link com nome, formato e tamanho; o clique chega ao PDF sem visualizador incorporado na aplicação.
- [ ] Remover ou alterar a relação de um PDF não deixa URL legada fixa em `Pages.layout`.
- [ ] A Home do MIR pode usar os oito PDFs D01–D08 na ordem documentada, com cada arquivo correto e link funcional.
- [ ] Leitura pública dos arquivos atuais e permissões de Admin/Editor permanecem coerentes com a política existente.

## Comandos de validação no repositório pai

No MIR, o lint global percorre também o snapshot `old-wordpress` e falha por código legado não relacionado. Validar os arquivos tocados com `npx eslint` e executar os demais gates. Os resultados efetivos estão em [Implementação no MIR](./implementacao-mir.md).

```text
npm run lint
npm run typecheck
npm test
npm run build
```

Além desses comandos, executar os cenários de Admin e de download em ambiente com banco e arquivos de teste. Inspecionar a migration gerada antes de aplicar em uma base com conteúdo. Registrar na implementação os resultados, desvios e a migration efetivamente usada.

## Referências de origem

- `SMUL-PayloadCMS/src/collections/Media.ts`, `src/access/policies/media.ts`, `src/access/role-permissions.ts` e `src/payload.config.ts`.
- `SMUL-PayloadCMS/docs/cms/schema-evolution-migrations.md`.
- `Meu-Imovel-Regular/docs/MIR - DOCS/mapas/home-extracao-e-mapa-payload.md` e `mapa-composicao-home.md`.
- Payload: [Folders](https://payloadcms.com/docs/folders/overview), [Uploads](https://payloadcms.com/docs/upload/overview).
