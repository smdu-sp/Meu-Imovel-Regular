# Operação do importador da Home — MIR-001

Implementado em 17/11/2026. O importador gera nove blocos, nove imagens e oito PDFs. Não publica páginas, não aplica migrations e não altera Header/Footer. O banco da instância MIR não recebeu carga durante a implementação; a aplicação foi exercitada em PostgreSQL descartável.

## Simular primeiro

Da raiz do projeto:

```bash
npm run import:wordpress -- home --dry-run
npm run import:wordpress -- home --dry-run --report .local/wordpress-import/home-preview.json
```

Sem `--apply`, a execução sempre é offline. Não carrega a configuração Payload nem conecta ao banco. Verifica o snapshot, os 17 arquivos e seus hashes/assinaturas e mostra o layout, ajustes editoriais e pendências. Os IDs negativos no relatório são referências simbólicas; reuso e conflitos do destino permanecem não verificados.

Fonte padrão: `old-wordpress/db/meuimovelregular.sql`; uploads: `old-wordpress/meuimovelregular/wp-content/uploads`. É possível informar `--source` e `--uploads`. A fonte precisa coincidir com o SHA-256 validado na [MIR-001](./specs/mir-001-importador-home.md). O comando não usa extrações temporárias de sessões anteriores.

## Aplicar em destino preparado

Verifique previamente a baseline, o upgrade de Media/pastas e ações Documento PDF, backup e restore do ambiente. O importador exige `DATABASE_URI` explícita e um Admin existente; não cria o banco nem o usuário.

```bash
npm run import:wordpress -- home --apply --actor-id 1 --target-label mir-local
```

Substitua `1` pelo ID correto do Admin. Escolher o destino na configuração de ambiente é uma ação operacional: confira o ambiente antes de executar. Nenhum modo de publicação automática é oferecido.

Somente na aplicação, o runner carrega ambiente com `@next/env`. Se `NODE_ENV` estiver ausente, assume `development`; se já estiver definido, preserva seu valor. Em desenvolvimento, variáveis já exportadas têm precedência sobre `.env.development.local`, `.env.local`, `.env.development` e `.env`, nessa ordem. Em produção, não carrega `.env.development.local`. O bootstrap desabilita schema push, criação automática de banco, extensões e HMR; não executa migrations.

O carregamento de `@next/env` usa `createRequire`, pois o pacote é CommonJS e a forma do export dinâmico varia entre Node ESM e o runner tsx. Isso corrige a falha `Cannot read properties of undefined (reading 'loadEnvConfig')`, que ocorria antes da conexão e da criação do manifesto. Após essa falha específica, é possível repetir o comando; os relatórios de erro não representam uma carga executada.

As pastas criadas/reutilizadas são `MIR/Home/Imagens` e `MIR/Home/Manuais`. Mídias permanecem públicas mesmo quando a página está em rascunho. Os logos compartilhados não integram esta carga. Os oito PDFs usam uma `iconGrid` na variante `compact`, com ícone padrão de documento, título do manual e ação “Baixar PDF” relacionada à Media. Em telas grandes, são quatro colunas; em telas menores, a grade ajusta para duas ou uma. As URLs não são copiadas ao layout.

Links para os sete destinos internos usam relações apenas quando a página correspondente está publicada e ativa. Caso contrário, permanecem como URLs absolutas temporárias do legado. O relatório identifica as pendências de revisão; o funcionamento e a vigência desses endereços não foram certificados.

## Reexecução e recuperação

O estado padrão é `.local/wordpress-import/`, ignorado pelo Git. `--state-dir` permite outro diretório, que deverá ficar fora do versionamento. O manifesto associa snapshot, fingerprint do servidor/banco/schema, assets, pastas e página. Nunca reutilize o mesmo manifesto para outro banco ou apague o estado para contornar um conflito.

- Home encontrada pelo slug, mas ausente no manifesto: a carga para antes de criar mídias. O script não adota a Home do seed automaticamente.
- Reexecução com origem e destino intactos: reutiliza IDs e não grava novamente a página.
- Edição manual, movimentação de mídia, alteração de revisão ou publicação: conflito, sem sobrescrita automática.
- Falha com rollback confirmado: mantém os checkpoints anteriores e permite retomar. Arquivos físicos eventualmente deixados por um upload revertido precisam de inspeção; não há limpeza destrutiva automática.
- Operação `pending` após interrupção ou resultado indeterminado: exige reconciliação dos IDs e do estado no banco antes de repetir. Não remova esse marcador às cegas.
- `execution.lock` existente: confira se há outra execução ativa. O script não remove locks de outras execuções automaticamente.

Cada operação registra intenção e checkpoint por escrita atômica do manifesto. Transações PostgreSQL com locks de tabelas impedem uma escrita concorrente do Admin durante a verificação/gravação. Esses locks são curtos por operação, mas podem fazer edições no Admin aguardarem; planeje a carga em momento apropriado.

Relatórios da aplicação são gravados no diretório de estado com timestamp, inclusive quando a aplicação falha; `--report` define outro caminho. O código de saída é não zero em falha. Não há `--force`, exclusão automática, rollback destrutivo ou promessa de transação única entre banco, arquivos e manifesto.

## Arquivos e decisões

- `src/imports/wordpress/run.ts`: CLI, simulação e bootstrap tardio do destino.
- `pages/home.ts` e `home-content.ts`: montagem específica, conteúdo, alternativas de imagem e ajustes revisáveis.
- `shared/source.ts`: lexer do SQL e validação de snapshot/arquivos.
- `shared/migration-manifest.ts`: projeções, identidade, lock e checkpoints.
- `shared/apply.ts`: preflight, pastas, assets, relações e gravação do rascunho.
- `shared/payload-store.ts`: Local API, ator e transações; nenhuma escrita de dados por SQL direto. SQL é usado somente para locks; o teste de concorrência usa uma atualização controlada no banco descartável para simular outro escritor.

Foram mantidos os hooks de validação, auditoria, versões e revalidação. O adaptador de CLI acompanha os clientes do pool para fechar também o checkout inicial retido pelo adapter instalado. A desativação de HMR evita uma conexão WebSocket de desenvolvimento no processo de importação.

Desvios de organização: helpers de pastas, mídia e página foram agrupados em `shared/apply.ts` e `payload-store.ts`, reduzindo a dispersão sem criar uma abstração de importação genérica. O conteúdo vem do snapshot validado com correções editoriais explícitas; não é uma cópia fixa de todo o HTML no código.

## Validações executadas

| Validação | Resultado |
| --- | --- |
| `npm run import:wordpress -- home --dry-run` | Passou com os arquivos reais, offline. |
| `npm run typecheck` | Passou. |
| `npx eslint src/imports` | Passou sem avisos. |
| `npm test` | Passou: 24 arquivos de testes no resumo do runner. A integração PostgreSQL requer a variável específica e não acessa o banco normal. |
| Testes específicos do importador | Lexer/escapes/Unicode/IDs, paths e symlinks, assinaturas, argumentos, identidade/lock/pending, projeções e tradução real da Home passaram. |
| Integração PostgreSQL 17 descartável | Passou: falha no quarto upload, retomada com 17 mídias finais, quatro pastas, rascunho, auditoria com ator, segunda carga sem escrita, recusa de Home não gerenciada, conflito com edição e lock contra escritor concorrente. |
| `LDAP_AUTH_MODE=external npm run build` | Passou com Turbopack fora do sandbox. Dentro do sandbox ficou sem progresso e foi interrompido. |
| Build alternativo `--webpack` | Falhou no CSS preexistente de `RichTextFullScreen.module.css`, seletor global não puro. Não foi alterado fora do escopo. |
| `npm run lint` global | Falhou com milhares de erros/avisos ao incluir o snapshot WordPress; o lint dos arquivos novos passou. |

O teste de integração usa `MIR_IMPORT_TEST_URI`, recusa nomes diferentes de `/mir_import_test`, grava uploads em diretório temporário e usa uma configuração de usuário de teste sem acesso LDAP. A criação do schema é exclusiva da fixture de teste; o caminho de aplicação real sempre usa `push=false`.

Comando para um PostgreSQL **vazio e descartável**, preparado separadamente:

```bash
MIR_IMPORT_TEST_URI=postgresql://usuario:senha@127.0.0.1:porta/mir_import_test \
  node --import ./src/seeds/patch-os-userinfo.mjs --import tsx --test src/imports/wordpress.integration.test.ts
```

Não apontar esse teste para o banco normal. O container temporário usado na implementação foi removido após os testes.

Pendências: aplicação no banco preparado da instância, conferência do preview no Admin/desktop/mobile, alternativas de imagem e créditos, clique/download com os oito PDFs, revisão institucional e posterior decisão sobre publicação. Nenhuma dessas validações manuais foi apresentada como concluída.

### Registro da correção de ambiente

Foram alterados apenas o carregamento de ambiente do runner, o teste de regressão e este guia. O teste inicia o CLI em subprocesso, com `.env` e `.env.development.local` temporários, e verifica que o override chega à validação do protocolo do destino. O destino fictício é recusado antes de importar o runtime Payload ou conectar ao PostgreSQL. Não houve aplicação no banco da instância nem alteração de schema.

Validação: os sete testes do importador passaram, incluindo o novo cenário de bootstrap. O teste com subprocesso foi executado fora do sandbox porque `spawnSync` é bloqueado nele. `npm run typecheck`, o lint dos dois arquivos TypeScript alterados e `git diff --check` também passaram; não requer nova migração ou validação de layout no navegador.

### Adaptação dos manuais para grade de ícones

A seção de manuais do importador foi alterada de `documentList` para `iconGrid` com `variant=compact` e espaçamento compacto, reutilizando os links Documento PDF. Os oito arquivos e a ordem D01–D08 permanecem iguais, sem novo ícone físico ou mudança de schema. `documentList` não foi removido dos schemas ou dos conteúdos já gravados. A Home no banco só muda ao aplicar explicitamente a importação; as proteções contra sobrescrita continuam ativas. A nova grade não apresenta automaticamente o tamanho dos PDFs.

Validações da adaptação: `npm run typecheck` e lint dos dois arquivos TypeScript passaram; oito testes do importador passaram, incluindo a conferência de oito âncoras de download e da grade de quatro colunas no desktop; o dry-run confirmou nove blocos, oito manuais e os mesmos 17 assets. Não foi aplicada carga no banco nem alterado schema; não há nova validação manual de preview nesta entrega.
