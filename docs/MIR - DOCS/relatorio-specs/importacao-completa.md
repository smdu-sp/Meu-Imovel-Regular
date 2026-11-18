# Importação completa e links locais

Implementado em 18/11/2026. O comando executa as dez importações editoriais WordPress → Payload, em rascunho. Não executa migrations de schema, não limpa banco/manifesto e não publica páginas.

```bash
npm run import:wordpress:all -- --dry-run
npm run import:wordpress:all -- --apply --actor-id 1 --target-label mir-local
```

Substitua `1` pelo ID de um Admin existente. O PostgreSQL/schema devem estar preparados e `DATABASE_URI` configurada. Precisa do dump e dos uploads locais, como nos comandos individuais. Opções `--source`, `--uploads`, `--state-dir`, `--actor-id`, `--target-label` e `--report` são aceitas. `--report` define o sumário do lote; relatórios por página ficam no diretório do lote.

## Ordem e segurança

O comando verifica as dez fontes e todos os arquivos antes da primeira gravação. A aplicação mantém uma sessão do Payload e um lock de manifesto durante todo o lote. Ordem: Home, Cartilha, Situação, Benefícios, Automática, Declaratória Simplificada, Declaratória, Comum, Entenda e FAQ.

São duas passadas: a primeira cria/reutiliza mídias e rascunhos; a segunda resolve referências que dependiam de páginas ainda não existentes. Com conteúdo e destino intactos, reexecutar não duplica mídias nem cria novas revisões. Um conflito interrompe o lote; checkpoints anteriores permanecem para recuperação. Não é uma transação única entre dez páginas, banco e arquivos.

Edições manuais, versões publicadas, slug sem manifesto e operações indeterminadas mantêm as proteções anteriores. Não há `--force`. Se alguma página já foi editada/publicada, o lote não é um mecanismo para sobrescrevê-la. Nenhum comando foi executado no banco da instância durante esta implementação.

O runner foi organizado em fábricas por página (`preparePage`), sem modificar os contratos individuais. A sessão pode ser compartilhada pelo lote; comandos isolados continuam abrindo/fechando sua própria sessão. Conexões novas no mesmo processo recebem uma chave própria no cache do Payload, evitando recuperar instância encerrada.

## Conversão e auditoria de links

`shared/site-links.ts` mapeia apenas o domínio `meuimovelregular.prefeitura.sp.gov.br` (e variante `www`) para os dez slugs conhecidos. Domínios de legislação, CEDI, SP156 e Portal de Licenciamento permanecem externos.

- Textos ricos: links personalizados Lexical passam a usar rotas relativas locais, preservando query e fragmento. Não foi alterado o schema nem o renderer. Eles são URLs locais, não relações Lexical com Pages.
- Ações, banners e cards: o importador usa relações com Pages ativas presentes no destino, inclusive rascunhos. O componente continua respeitando a publicação/ativação do destino; a associação não publica nem libera a página automaticamente.
- Arquivos em `/wp-content/uploads/` não são convertidos em rotas de páginas. Os manuais da FAQ têm associação explícita com Media; grades e Cartilha já usam relações Documento. Arquivos sem correspondência ficam no relatório, sem URL fabricada.
- Páginas desconhecidas e rotas administrativas não são redirecionadas silenciosamente. A Comum corrige explicitamente o link administrativo identificado na fonte.

Os relatórios incluem `linkAudit`: `local-route`, `page-relationship`, `pending-page`, `legacy-file` ou `unmapped`. A simulação usa IDs simbólicos para representar as páginas; os PDFs inline da FAQ só obtêm URLs reais ao aplicar. Após as duas passadas no teste de banco vazio, nenhum link do domínio legado permaneceu nos layouts persistidos.

A assinatura de origem agora inclui URLs para detectar a conversão de links, mantendo o formato e as projeções anteriores do manifesto. Uma página intacta de importação anterior pode receber uma atualização na primeira reaplicação; edições manuais continuam protegidas pela revisão registrada. Não apague o manifesto para contornar conflitos.

## Relatórios

O padrão é `.local/wordpress-import/batches/<data-hora>/`, com relatórios por página/passada e `summary.json`. O sumário informa conclusão, páginas e auditorias. Em falha de aplicação, o processo retorna código não zero e registra o erro; confira o relatório e os checkpoints antes de retomar. Falhas na validação inicial ocorrem antes da gravação e podem impedir a criação de relatório.

O [inventário de links](../mapas/auditoria-links-internos.md) registra as correspondências. A validação comprova extração, associação aos dez documentos e ausência de links antigos no banco descartável; não certifica disponibilidade HTTP dos serviços externos ou vigência jurídica dos textos.


## Validação final executada

- `npm run typecheck` e `npx eslint src/imports`: passaram.
- `DISABLE_PAYLOAD_HMR=true npm test`: 123 passaram, zero falhas e dois testes de banco opcionais ignorados nesta execução geral.
- Integração PostgreSQL das dez páginas: passou, incluindo reuso das mídias compartilhadas, rascunhos, reexecução sem gravações, colisão de slug sem manifesto e conflito após edição manual.
- Integração do lote completo em outro PostgreSQL vazio: passou. Executou as duas passadas, comprovou dez rascunhos, 54 mídias, 29 pastas, auditoria com ator e ausência de URLs do domínio legado em todos os layouts persistidos. Reexecutou o lote inteiro e confirmou as mesmas revisões e contagem de mídias.
- `npm run import:wordpress:all -- --dry-run --state-dir /tmp/mir-all-dry-009-010`: passou, com as dez páginas offline e relatórios. A auditoria da composição original encontrou 19 ocorrências de links de páginas mapeados, seis referências de manuais da FAQ resolvidas pela Media na aplicação e zero destinos de página desconhecidos.
- `git diff --check` e links locais dos documentos alterados: conferidos.

Os testes com subprocessos e PostgreSQL foram executados fora do sandbox, em bancos e diretórios temporários, sem usar o banco ou uploads da instância. Os containers temporários foram removidos ao encerrar a validação. Permanecem pendentes preview/navegação manual, revisão institucional e disponibilidade dos serviços externos.
