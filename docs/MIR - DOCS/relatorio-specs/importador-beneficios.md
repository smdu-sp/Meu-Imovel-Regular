# Operação do importador de Benefícios — MIR-003

Implementado em 18/11/2026. Converte a página WordPress 210, slug `beneficios-de-regularizar-o-imovel`, meta `dslc_code` 4081, em seis blocos: capa, introdução e quatro blocos Mídia e Texto com listas semânticas Lexical. Reutiliza os componentes existentes e o fluxo compartilhado de manifesto, transações, auditoria e rascunhos.

## Comandos

Execute na raiz do projeto:

```bash
npm run import:wordpress -- beneficios --dry-run
npm run import:wordpress -- beneficios --dry-run --report .local/wordpress-import/beneficios-preview.json
npm run import:wordpress -- beneficios --apply --actor-id 1 --target-label mir-local
```

Substitua `1` pelo ID de um Admin existente. `DATABASE_URI` define o destino; `mir-local` é um rótulo do ambiente. O banco e o schema devem estar preparados. A simulação é offline e usa IDs simbólicos negativos; a aplicação salva como rascunho. As opções de fonte, ambiente, estado e recuperação seguem o [guia da Home](./importador-home.md).

## Fonte, conteúdo e assets

A origem é `old-wordpress/db/meuimovelregular.sql`, snapshot SHA-256 `ea309012c96c456c8c0568959a1f1bce5ae5d077239e9605bc9bdd333986264b`, seções `$[0]` a `$[5]`. O código extrai textos e listas desse dump e valida caminhos, hashes, tamanhos e assinaturas das imagens no diretório de uploads.

| Anexo | Caminho em uploads | Destino |
| --- | --- | --- |
| 736 | `2019/10/capa_benefícios_1920px_70dpi.jpg` | Capa |
| 711 | `2019/10/sergio-souza-IpvSreCKPrc-unsplash_1200px_70dpi.jpg` | Cidade, imagem à direita |
| 712 | `2019/10/foto-alberto-simon-archdaily_1200px_70dpi.jpg` | Proprietário residencial, imagem à esquerda |
| 713 | `2019/10/2580807_1200px_70dpi.jpg` | Empreendedor e comerciante, imagem à direita |
| 325 | `2019/10/eduardo-dutra-UsAHeWZcrnA-unsplash-e1571000451555.jpg` | Imóveis institucionais, imagem à esquerda |

Imagens novas ficam em `MIR/Beneficios/Imagens`. O anexo 712 usa o registro já identificado no mesmo manifesto pela Home/Entenda, preservando pasta, título e alternativa textual existentes. São quatro mídias novas quando esse anexo já estiver importado, ou cinco se Benefícios for a primeira carga. A identidade da página no manifesto é `page:210`.

O link da Lei nº 17.202/2019 vem da introdução do backup. Não há CTA nas categorias nem download externo de assets. As listas preservam os 4/4/5/3 itens encontrados, incluindo negritos e espaços no lugar das quebras de linha. Os H1 das categorias viram títulos dos blocos; a introdução mantém um único H1.

## Decisões e desvios

Os exemplos de benefícios da spec diferem das listas reais. Foram preservados os itens do backup, sem acrescentar benefícios ausentes. A promessa de posse e garantia total da introdução foi substituída por orientação sobre solicitação sujeita aos requisitos e à análise competente. Cada categoria recebeu uma frase condicionando os benefícios ao enquadramento e aos requisitos aplicáveis; a menção à Outorga Onerosa passou a indicar a necessidade de verificar a possibilidade nas hipóteses legais.

Esses ajustes ficam no relatório, com pendências de revisão institucional. Nenhuma vigência de regra ou link foi verificada externamente. Não houve mudanças em schemas, migrations, componentes ou Globals. As fontes e os arquivos já existentes em `media/` foram preservados.

## Validação executada

- Simulação com dump e arquivos reais: cinco imagens e seis blocos, origem 210/meta 4081.
- Testes de listas: itens, negritos, quebras de linha e recusa de listas vazias/duplicadas; layout, alternância, link da lei, terminologia e execução offline.
- `npm run typecheck` e `npx eslint src/imports`: passaram.
- `DISABLE_PAYLOAD_HMR=true npm test`: 104 passaram, zero falhas e um teste opcional ignorado.
- Integração PostgreSQL 17 descartável: passou com a aplicação real de Home, Entenda e Benefícios, totalizando 24 mídias e oito pastas. Confirmou reuso do anexo 712 sem alteração do registro, rascunho com seis blocos, reexecução sem gravações, recusa de slug não gerenciado e conflito após edição manual.
- `git diff --check`: passou.

Os testes de subprocesso e banco foram executados fora do sandbox. O banco da instância não recebeu carga nesta implementação. A revisão no Admin/preview desktop e mobile, créditos, alternativas textuais e conteúdo institucional permanece pendente antes da publicação.
