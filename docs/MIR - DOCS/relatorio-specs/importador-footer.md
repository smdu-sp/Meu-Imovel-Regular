# Operação do importador do Rodapé — MIR-012

Implementado no código em 19/11/2026. O comando converte o template WordPress 178, meta `dslc_code` 4067, para o Global `footer` do Payload. Ele importa o logo PMSP para `MIR/Compartilhado/Identidade`, preenche endereço, e-mail, telefone, atendimento presencial, três redes sociais e quatro links institucionais. O schema de `Footer` e o componente `SiteFooter` não foram alterados.

## Comandos

```bash
npm run import:wordpress -- footer --dry-run
npm run import:wordpress -- footer --apply --actor-id 1 --target-label mir-local
```

Substitua `1` pelo ID de um Admin existente. A aplicação exige `DATABASE_URI` para um PostgreSQL com o schema preparado. O caminho padrão de uploads é `old-wordpress/mir-web/wp-content/uploads`; `--source`, `--uploads`, `--state-dir` e `--report` continuam disponíveis. O dry-run lê apenas o dump SQL e o arquivo do logo, sem consultar o banco.

## Integridade e reexecução

- O snapshot, o registro 178, o meta 4067 e as sete áreas Live Composer são conferidos. Endereço, e-mail, telefone e perfis sociais são extraídos do template e comparados com o mapeamento editorial da MIR-012.
- O arquivo 179 é validado por caminho, assinatura PNG, tamanho e SHA-256. URLs sociais e institucionais passam por `validateOfficialHttpsUrl`; o ícone `x-social` e os demais são conferidos no catálogo.
- A pasta de identidade é reutilizada quando já existe no manifesto da MIR-011; os checkpoints de pasta, mídia e `global:footer` detectam alterações posteriores por revisão e conteúdo. Um Footer configurado sem checkpoint é preservado.
- Uma reexecução idêntica não atualiza o Global nem aciona revalidação redundante. Falhas deixam checkpoints por operação; banco, arquivo de mídia e manifesto não formam uma única transação.

O importador usa `payload.updateGlobal` na Local API com o Admin da sessão. O hook existente `revalidateSiteShellGlobal` permanece ativo. No relatório offline, o logo recebe um ID negativo simbólico.

## Decisões e desvios

- A aparência usa `scheme = "muted"`. CSS inline, faixa colorida e separadores do template legado são descartados.
- `inPersonService` e os quatro links institucionais são dados complementares prescritos na MIR-012, não extraídos do template WordPress. Sua vigência deve ser confirmada pela equipe editorial antes da aplicação em produção.
- A escrita do Global e a revisão visual no Admin não foram executadas neste ambiente. Nenhum banco da instância foi alterado.

## Validação executada

- `npm run import:wordpress -- footer --dry-run --report .local/wordpress-import/footer-dry-run.json`: passou com o hash do logo, contatos, redes e links esperados.
- `node --import tsx --test src/imports/footer.test.ts src/imports/header.test.ts` com o patch de `NODE_OPTIONS`: 11 testes passaram, incluindo os 5 da MIR-012 e os 6 da MIR-011.
- `npm run typecheck`, ESLint dos arquivos alterados e `git diff --check`: passaram.

A aplicação real em PostgreSQL e a renderização do logo e dos links no portal ainda precisam ser conferidas em ambiente de homologação. A suíte geral já apresentava falhas de caminhos antigos de uploads e restrições do Windows antes desta spec; ela não foi repetida nesta implementação.
