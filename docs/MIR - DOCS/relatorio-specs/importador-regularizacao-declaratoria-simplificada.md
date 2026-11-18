# Operação do importador de Declaratória Simplificada — MIR-008

Implementado em 18/11/2026. Converte o post WordPress 760, slug `regularizacao-declaratoria-simplificada`, meta `dslc_code` 4109, em nove blocos existentes: capa, introdução, três blocos Mídia e Texto, orientações de solicitação, infográfico, grade compacta de quatro manuais e alerta crítico sobre ausência de comunicado.

## Comandos

Execute na raiz do projeto:

```bash
npm run import:wordpress -- regularizacao-declaratoria-simplificada --dry-run
npm run import:wordpress -- regularizacao-declaratoria-simplificada --dry-run --report .local/wordpress-import/simplificada-preview.json
npm run import:wordpress -- regularizacao-declaratoria-simplificada --apply --actor-id 1 --target-label mir-local
```

Substitua `1` pelo ID de um Admin existente. A conexão usa `DATABASE_URI`; `mir-local` é um rótulo do ambiente. Banco e schema devem estar preparados. A aplicação salva como rascunho e mantém auditoria com ator, sem publicar ou executar migrations. Ambiente, manifesto, recuperação e conflitos seguem o [guia da Home](./importador-home.md).

## Fonte e composição

Fonte: `old-wordpress/db/meuimovelregular.sql`, snapshot SHA-256 `ea309012c96c456c8c0568959a1f1bce5ae5d077239e9605bc9bdd333986264b`. Duas seções: capa em `$[0]` e 14 módulos em `$[1]`. A extração confere identidade, estrutura e metadados dos anexos.

| Bloco | Origem |
| --- | --- |
| Banner | `$[0]` módulo 0, imagem 777 |
| Introdução com H1 e link do Portal | `$[1]` módulo 0 |
| Tipos de uso, imagem à direita | `$[1]` módulos 1/2, imagem 1106, descrição editorial R1/R2h coerente com a introdução e spec |
| Exigências, imagem à esquerda | `$[1]` módulos 3/4/5, imagem 1107 |
| Impedimentos, imagem à direita | `$[1]` módulos 6/7/8, imagem 1108 |
| Como solicitar | `$[1]` módulos 9/10 e primeiro parágrafo do módulo 12, com orientação sobre os limites do portal |
| Infográfico | `$[1]` módulo 11, imagem 223 |
| Grade compacta de documentos | `$[1]` módulo 12; quatro PDFs relacionados à Media |
| Ausência de comunicado | `$[1]` módulo 13, `alertBox.type=danger` |

## Assets e reuso

São nove arquivos conferidos por origem, SHA-256, tamanho e assinatura: cinco imagens (777, 1106, 1107, 1108 e 223) e quatro PDFs (1196, 1191, 1188 e 1187). Imagens exclusivas e metadados compartilhados ficam em `regularizacao-declaratoria-simplificada-content.ts`; o infográfico e os manuais reutilizam os metadados já conferidos na Automática.

Novas imagens ficam em `MIR/Modalidades/DeclaratoriaSimplificada/Imagens`. PDFs que ainda não estiverem gerenciados são cadastrados em `MIR/Modalidades/DeclaratoriaSimplificada/Manuais`. Se Automática e Home já foram importadas no mesmo manifesto, a carga reutiliza seus cinco IDs, pastas e metadados, acrescentando apenas quatro imagens. A identidade da página é `page:760`.

A grade usa a ordem requerimento (1196), peças gráficas (1191), aceite (1188) e DTCO/guia (1187), com `type=document` e `document=Media.id`. O requerimento de junho/2021 ausente no acervo é associado à versão de 2023 da Home; peças gráficas do caminho legado de março/2020 são associadas ao arquivo físico de julho/2021. Os quatro links de origem e o Portal são conferidos com a mesma validação utilizada na Automática. Não há URL de PDF legado no layout nem download externo de arquivo.

## Decisões e diferenças da spec

- H2 principal convertido para H1; títulos vazios removidos dos tópicos ao aproveitar os campos de título dos blocos.
- Texto de solicitação preserva os documentos I–IV e suas orientações, incluindo valores e datas históricos. Parágrafos são convertidos para Lexical sem copiar estilos tipográficos do builder.
- O alerta usa o campo atual `type=danger`, não `variant=danger`. Mantém a frase “No procedimento declaratório simplificado não se admite a emissão de comunicado”, a exigência de profissional habilitado e os oito casos de encaminhamento à modalidade comum.
- Os oito casos, originalmente separados por quebras de linha em um parágrafo, viram lista semântica com seus marcadores romanos preservados. O parser confere exatamente oito itens e sua sequência.
- “Indeferimento sumário” não consta do módulo final do backup. Essa interpretação do resumo da spec não foi acrescentada ao conteúdo institucional.
- Foi acrescentada orientação de que este portal não cria protocolo nem garante deferimento. Não há validação de ART/RRT, elegibilidade, regras de área ou consulta administrativa na apresentação.
- Nenhum schema, migration, componente, Global ou página adicional foi criado. A persistência usa Local API, locks e checkpoints compartilhados; atomicidade por operação, sem promessa de uma transação única entre arquivos, banco e manifesto.

## Validação e pendências

A simulação real conferiu nove assets e nove blocos, sem banco. Testes verificam estrutura, identidade, hashes/MIME/tamanhos, alternância, links do Portal, quatro relações Documento, aviso crítico e oito casos de encaminhamento. Recusam ausência de aviso ou alteração da lista de casos, e verificam execução offline.

Pendentes: revisão institucional dos critérios e documentos, área de 500 m², datas, taxas/ISS e regras de encaminhamento; conteúdo e alternativas das imagens, créditos, preview no Admin/desktop/mobile, downloads e links do serviço oficial. A importação não certifica a vigência do material. O banco da instância não recebeu carga durante a implementação.


Validações executadas:

- `npm run typecheck` e `npx eslint src/imports`: passaram.
- `DISABLE_PAYLOAD_HMR=true npm test`: 120 passaram, zero falhas e um teste opcional ignorado.
- Integração PostgreSQL 17 descartável: passou com as oito páginas, 43 mídias e 23 pastas. Confirmou nove blocos em rascunho, quatro relações Documento, reuso do infográfico/PDFs sem alteração do registro compartilhado, alerta crítico, reexecução sem escrita e proteções contra colisão de slug e edição manual.
- `git diff --check` e links locais do guia e índices: conferidos.

Testes de subprocessos e banco foram executados fora do sandbox. O container descartável foi removido após validação.
