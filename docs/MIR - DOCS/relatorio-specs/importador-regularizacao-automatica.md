# Operação do importador de Regularização Automática — MIR-007

Implementado em 18/11/2026. Converte o post WordPress 193, slug `regularizacao-automatica`, meta `dslc_code` 4106, em nove blocos existentes: capa, introdução, três blocos Mídia e Texto, orientação sobre certificado, infográfico, grade compacta de quatro manuais e caixa de aviso.

## Comandos

Execute na raiz do projeto:

```bash
npm run import:wordpress -- regularizacao-automatica --dry-run
npm run import:wordpress -- regularizacao-automatica --dry-run --report .local/wordpress-import/automatica-preview.json
npm run import:wordpress -- regularizacao-automatica --apply --actor-id 1 --target-label mir-local
```

Substitua `1` pelo ID de um Admin existente. `DATABASE_URI` define o destino; `mir-local` identifica o ambiente no manifesto. O banco e o schema devem estar preparados. A aplicação mantém rascunho e auditoria com ator, sem publicação ou migrations. Ambiente, recuperação e conflitos seguem o [guia da Home](./importador-home.md).

## Fonte e composição

Fonte: `old-wordpress/db/meuimovelregular.sql`, snapshot SHA-256 `ea309012c96c456c8c0568959a1f1bce5ae5d077239e9605bc9bdd333986264b`. A composição tem três seções: capa em `$[0]`, 14 módulos em `$[1]` e `$[2]` vazia. O parser confere essa estrutura, a identidade da página e os anexos.

| Bloco | Origem |
| --- | --- |
| Capa panorâmica | `$[0]` módulo 0, imagem 727 |
| Introdução com H1 e lista externa PDF | `$[1]` módulo 0 |
| Tipos de uso, imagem à direita | `$[1]` módulos 1/2, imagem 1102; descrição orientativa R1/R2h da spec |
| Exigências, imagem à esquerda | `$[1]` módulos 3/4/5, imagem 1104 |
| Impedimentos, imagem à direita | `$[1]` módulos 6/7/8, imagem 1105; sete zonas em lista Lexical |
| Certificado e encaminhamento | `$[1]` módulos 9/10 e primeiro parágrafo do módulo 12, com orientação adicional para Situação |
| Infográfico ilustrativo | `$[1]` módulo 11, imagem 223 |
| Grade compacta de manuais | `$[1]` módulo 12; quatro PDFs por relações Documento |
| Informações Importantes | `$[1]` módulo 13, `alertBox.type=info` |

## Assets, pastas e reuso

São nove arquivos validados por caminho do anexo, SHA-256, tamanho e assinatura: cinco imagens (727, 1102, 1104, 1105, 223) e quatro PDFs (1196, 1191, 1188, 1187). Metadados completos ficam em `regularizacao-automatica-content.ts` e na spec.

Novas imagens ficam em `MIR/Modalidades/Automatica/Imagens`. Se os PDFs não estiverem gerenciados no manifesto, são cadastrados em `MIR/Modalidades/Automatica/Manuais`; a Home e as próximas modalidades poderão reutilizá-los. Com Home já importada, reutilizam seus quatro IDs, preservando pasta e metadados. A identidade da página é `page:193`.

O infográfico 223 pode ser compartilhado entre modalidades, mas não constava das cargas anteriores Home–Cartilha. Por isso, após essas seis páginas, a primeira carga de Automática adiciona cinco imagens. Se todos os assets já estiverem gerenciados e intactos, serão reutilizados; não há busca global por nome ou hash fora do manifesto.

A ordem da grade é requerimento (1196), peças gráficas (1191), aceite (1188) e DTCO/guia (1187). Os links quebrados do requerimento de junho/2021 e de peças gráficas de março/2020 são associados às versões físicas usadas na Home: requerimento de 2023 e peças gráficas de julho/2021. A ação da grade usa `type=document` e `document=Media.id`, sem URL antiga de PDF no layout. Os quatro endereços legados e o link do Portal são conferidos antes da conversão.

## Decisões e diferenças da spec

- O backup desta página contém apenas o link externo PDF da lista de imóveis. XLS não consta e não foi inventado. A lista permanece externa, sem download local.
- A seção de certificado menciona prazo histórico de um ano e Portal de Licenciamento, sem CEDI. O texto foi preservado em rascunho e recebeu orientação para a página Situação, deixando explícito que o portal não emite certificado nem declara oficialmente regularidade. Links editoriais para Situação e outras modalidades permanecem temporariamente nos endereços legados; não são relações internas Lexical nesta implementação.
- O alerta final real trata de taxas e encaminhamento de imóveis com impedimentos para Declaratória/Comum. Esse conteúdo foi preservado, sem substituir por uma explicação diferente sobre protocolo sugerida no resumo da spec. Usa `type=info`, conforme o campo atual, em vez de `variant=info`.
- O título principal passa de H2 para H1. Títulos dos tópicos usam o campo do bloco. Zonas de impedimento são preservadas em lista semântica; a conversão compartilhada dos demais parágrafos preserva texto/links, sem copiar estilos tipográficos do builder.
- Prazos, critérios, taxas, documentos e conteúdo das imagens precisam de revisão institucional antes de publicação. A importação não verifica elegibilidade, vigência legal, disponibilidade dos links nem regularidade de imóveis.
- Não houve alteração de schema, migration, componentes, Globals ou integração CEDI. Atomicidade por operação com checkpoints segue a infraestrutura compartilhada.

## Validação e pendências

Simulação real conferiu nove arquivos e nove blocos, sem conexão com o banco. Testes cobrem origem, hashes/MIME/tamanhos, alternância, lista de zonas, H1/H2, links externos, quatro relações de documentos, correções de origem e alerta, além de execução offline e recusa de destinos de manuais divergentes.

Pendentes: revisão institucional integral, créditos e alternativas textuais das imagens com conteúdo, legibilidade do infográfico, preview no Admin/desktop/mobile, funcionamento dos links e downloads. O banco da instância não recebeu carga durante a implementação.


Validações executadas:

- `npm run typecheck` e `npx eslint src/imports`: passaram.
- `DISABLE_PAYLOAD_HMR=true npm test`: 117 passaram, zero falhas e um teste opcional ignorado.
- Integração PostgreSQL 17 descartável: passou com as sete páginas, 39 mídias e 20 pastas. Comprovou rascunho de nove blocos, quatro relações Documento corretas, reuso dos PDFs sem alterar os registros compartilhados, `alertBox.type=info`, reexecução sem escrita, colisão de slug não gerenciado e conflito após edição manual.
- `git diff --check` e links locais do guia/README: conferidos.

Testes com subprocessos e banco foram executados fora do sandbox. O container temporário foi removido após a validação.
