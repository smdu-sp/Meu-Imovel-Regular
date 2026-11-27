# Operação do importador do Cabeçalho — MIR-011

Implementado no código em 19/11/2026. O comando converte o template WordPress 100, meta `dslc_code` 4075, para o Global `header` do Payload. Ele preserva a ordem e os rótulos dos cinco itens do menu principal, cadastra os logos MIR e SMUL em `MIR/Compartilhado/Identidade` e associa o logo MIR ao Header. O logo SMUL fica disponível na biblioteca de mídia. Não altera o schema nem a apresentação de `SiteHeader`.

## Comandos

```bash
npm run import:wordpress -- header --dry-run
npm run import:wordpress -- header --apply --actor-id 1 --target-label mir-local
```

Substitua `1` pelo ID de um Admin existente. A aplicação exige `DATABASE_URI` para um PostgreSQL com o schema preparado e as cinco páginas de destino existentes e ativas. O caminho padrão de uploads neste checkout é `old-wordpress/mir-web/wp-content/uploads`; `--source`, `--uploads`, `--state-dir` e `--report` continuam disponíveis. O dry-run lê apenas o dump e os arquivos de uploads, sem consultar o banco.

## Integridade e reexecução

- O snapshot, a estrutura Live Composer, o vínculo `dslc_mainmenu` ao termo 3, os cinco posts `nav_menu_item` e seus destinos são conferidos antes da escrita.
- Os arquivos físicos 356 e 1183 são validados por caminho, assinatura PNG, tamanho e SHA-256. Os logos são classificados como mídia de conteúdo, conforme a spec.
- A aplicação resolve as cinco Pages por slug e exige resultado único antes de gravar pastas, mídias ou Global. Ausência ou ambiguidade interrompe a carga.
- O manifesto registra pastas, mídias e `global:header`. Um Header configurado sem checkpoint não é adotado. Alterações manuais posteriores são detectadas por revisão e conteúdo antes de qualquer atualização.
- Uma reexecução idêntica verifica o estado, mas não grava novamente o Global nem gera revalidação redundante. Falhas deixam checkpoints por operação; a aplicação não é uma transação única entre banco, arquivos e manifesto.

O importador usa `payload.updateGlobal` com o Admin autenticado pela sessão Local API. O hook existente `revalidateSiteShellGlobal` é preservado. A simulação usa IDs negativos apenas no relatório, para mostrar os relacionamentos planejados.

## Decisões e desvios

- `Header.navigationMode` recebe `normal`, `enableSearch` recebe `false` e a aparência usa o preset `default`. HTML/CSS inline do template legado não é transferido.
- O caminho padrão de uploads do runner foi corrigido para a pasta presente neste checkout (`mir-web`). Comandos de páginas podem continuar passando `--uploads` explicitamente.
- A pasta `MIR/Compartilhado/Identidade` é compartilhável com a futura MIR-012; nenhum importador de Footer foi criado aqui.
- O banco da instância não foi alterado. A escrita real do Global e a revisão visual no Admin precisam de validação em PostgreSQL descartável ou ambiente de homologação.

## Validação executada

- `npm run import:wordpress -- header --dry-run --report .local/wordpress-import/header-dry-run.json`: passou com os dois hashes, os cinco itens ordenados e o mapeamento simbólico.
- `npm run typecheck`: passou.
- Testes de unidade em `src/imports/header.test.ts`: passaram para extração, integridade, ausência de página, primeira carga simulada, reexecução e conflito manual.
- ESLint dos arquivos do importador e `git diff --check`: passaram.
- `npm test`: 340 testes executados, 324 passaram, 14 falharam e 2 foram ignorados. Os 6 testes novos da MIR-011 passaram. As falhas restantes estão em testes anteriores: caminhos de uploads que ainda apontam para `old-wordpress/meuimovelregular/wp-content/uploads`, resolução relativa de `NODE_OPTIONS` em um processo filho e criação de symlink bloqueada no Windows (`EPERM`).

Docker não ficou acessível neste ambiente, por isso não foi executada uma aplicação em PostgreSQL descartável. A instância do portal não foi usada para validação.


## Execução no lote completo — 27/11/2026

O comando `npm run import:wordpress:all` agora chama Header e Footer depois de concluir as duas passadas das dez páginas. Na chamada administrativa do importador, o contexto servidor permite associar destinos ativos em rascunho, sem publicá-los. O seletor normal do Header continua restrito a destinos publicados/ativos e o portal não exibe links para rascunhos. A estrutura persistida e as relações não mudaram; não há migration necessária. Detalhes no [guia do lote](./importacao-completa.md).
