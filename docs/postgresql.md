# PostgreSQL no Payload

O runtime usa `@payloadcms/db-postgres` na mesma versao dos demais pacotes Payload.
`DATABASE_URI` continua sendo a variavel de conexao. Exemplo local:

```dotenv
DATABASE_URI=postgresql://postgres:postgres@localhost:5432/meu_imovel_regular
```

Configure um banco dedicado antes de iniciar o portal. Atualize o `.env` existente;
copiar o novo exemplo nao e necessario. Confira tambem se algum `.env.local` ou
`.env.development.local` sobrescreve `DATABASE_URI`. URLs `file:` sao exclusivas do
adapter antigo e precisam ser substituidas.

## Banco novo em desenvolvimento

1. Crie o banco PostgreSQL e configure a conexao em `.env`.
2. Execute `npm run dev`. Em desenvolvimento, o adapter sincroniza o schema pelo
   mecanismo `push` do Payload.
3. Execute os seeds necessarios, por exemplo
   `NODE_ENV=development npm run seed:dev-admin` no Linux. Para conteudo de exemplo,
   use `npm run seed:editorial`.
4. Valide acesso ao Admin, edicao, publicacao, relacionamentos e uploads.

O repositorio ainda nao possui uma baseline integral de migrations. O backfill
`20261005_000000_backfill_user_roles` usa a API do Payload e agora importa os tipos
do PostgreSQL, mas nao cria tabelas e nao inicializa um banco vazio. Nao execute
`payload migrate` como substituto da inicializacao acima.

## Dados existentes e ambientes compartilhados

A mudanca de adapter nao converte nem copia `payload.db`. Nenhum banco existente
ou arquivo de upload e removido por esta alteracao. Os schemas das collections,
Blocks e Globals permanecem iguais; a representacao fisica passa a ser PostgreSQL.

Antes de uma transicao com dados persistidos:

1. Interrompa escritas e faca backup do SQLite, dos uploads e da configuracao.
   Valide a restauracao em copia.
2. Estabeleca e revise uma baseline PostgreSQL do schema completo em ambiente
   isolado. Em producao, use migrations revisadas, sem depender de `push`.
3. Prepare e teste uma transferencia de dados especifica para a base: preserve
   IDs e relacionamentos, Globals, usuarios, roles, drafts, versoes e metadados
   de midia; copie os arquivos e ajuste as sequences de IDs no destino.
   O repositorio nao fornece esse conversor.
4. Compare contagens e referencias e valide autenticacao, permissoes, Admin,
   preview, publicacao e uploads em uma copia antes de trocar a conexao.
5. Troque `DATABASE_URI` e reinicie a aplicacao. Mantenha o backup para rollback;
   o retorno exige o codigo anterior com o adapter SQLite e a base preservada.
   Escritas realizadas apos a troca exigem reconciliacao antes de um rollback.

Nao misture `push` de desenvolvimento e migrations manuais na mesma base.
Referencia: [adapter PostgreSQL do Payload](https://payloadcms.com/docs/database/postgres).

## Testes

Os testes existentes de autorizacao continuam usando SQLite em memoria, com
`@payloadcms/db-sqlite` apenas em `devDependencies`. Eles verificam as politicas
de acesso; nao substituem a validacao do runtime com um servidor PostgreSQL.

## Decisoes e limites

- Mantidos `DATABASE_URI`, IDs numericos e a versao `3.88.0` do Payload.
- Nenhuma collection, Block, Global ou regra de negocio foi alterada.
- A transferencia de conteudo e a baseline de producao exigem trabalho especifico
  sobre o banco de destino e nao sao executadas pela troca do adapter.

## Validacao da troca

- `npm run typecheck`: passou.
- `npm run build`: passou com `DATABASE_URI` apontando para o banco temporario e
  `LDAP_AUTH_MODE=external`. A execucao restrita foi interrompida e repetida com
  acesso a rede para as fontes do Next.js.
- `npm test`: passaram os 22 arquivos executados pelo script existente.
- `npm run lint`: encontrou erros no codigo legado de `old-wordpress`.
- `npm run lint -- --ignore-pattern 'old-wordpress/**'`: passou, com dois avisos
  preexistentes de `no-img-element` em `src/components/admin/Logo.tsx`.
- Teste manual via Local API em PostgreSQL 17 temporario: inicializacao do schema
  completo e criacao, leitura, atualizacao e exclusao de `Users` passaram, usando
  LDAP mock. O primeiro teste sem mock foi interrompido por falta de `LDAP_API_URL`.
- `npm ls @payloadcms/db-postgres @payloadcms/db-sqlite --depth=0` e
  `git diff --check`: passaram.
- O container PostgreSQL temporario foi removido ao terminar a validacao.
