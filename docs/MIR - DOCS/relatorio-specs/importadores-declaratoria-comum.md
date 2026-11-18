# Importadores de Declaratória e Comum — MIR-009 e MIR-010

Implementados em 18/11/2026, usando blocos existentes. Declaratória: WordPress 204/meta 4112, 12 arquivos (oito imagens e quatro PDFs), 12 blocos. Comum: WordPress 206/meta 4115, 11 arquivos (sete imagens e quatro PDFs), 12 blocos. Ambas permanecem em rascunho.

## Comandos

```bash
npm run import:wordpress -- regularizacao-declaratoria --dry-run
npm run import:wordpress -- regularizacao-declaratoria --apply --actor-id 1 --target-label mir-local
npm run import:wordpress -- regularizacao-comum --dry-run
npm run import:wordpress -- regularizacao-comum --apply --actor-id 1 --target-label mir-local
```

Substitua `1` pelo ID de um Admin existente. `DATABASE_URI` define a conexão. As fontes, o snapshot validado, opções e proteções seguem o [guia da Home](./importador-home.md). Não há publicação ou migration automática de schema.

## Composição e fonte

Fonte: `old-wordpress/db/meuimovelregular.sql`, SHA-256 `ea309012c96c456c8c0568959a1f1bce5ae5d077239e9605bc9bdd333986264b`. As duas páginas têm duas seções. A capa está em `$[0]`; Declaratória tem 23 módulos em `$[1]` e Comum, 21. Todos os anexos são conferidos contra metadados, hashes, tamanhos e assinaturas JPEG/PDF.

Declaratória: introdução dos módulos 0/1; tipos de uso e imagem 1113 nos módulos 2/3; exigências 4/5/6 (1111); anuências 7/8/9 (1117); impedimentos 10/11/12 (1119); Outorga 13/14/15 (1116); cálculo 16/17 (1120); solicitação 18/19; infográfico 20 (223); manuais 21; alerta 22. A capa usa o anexo 728. As seis seções temáticas usam Mídia e Texto com imagem alternada.

Comum: introdução 0; tipos de uso 1/2 (1125); exigências 3/4 em Texto Editorial; anuências 5/6/7 (1126); impedimentos 8/9/10 (1127); Outorga 11/12/13 (1116); cálculo 14/15 (1120); solicitação 16/17; infográfico 18 (223); manuais 19; alerta 20. Capa 721. O título de solicitação é extraído do HTML, sem copiar wrappers administrativos do builder.

O helper `shared/complex-modality.ts` atende às duas specs solicitadas. Configuração e metadados específicos permanecem nos arquivos de cada página. Fórmulas e explicações gráficas continuam como imagens, sem simulador de cálculo.

## Mídias e pastas

Arquivos novos ficam em `MIR/Modalidades/Declaratoria/Imagens` ou `MIR/Modalidades/Comum/Imagens`. Os PDFs, caso ainda não gerenciados, usam a subpasta `Manuais` da modalidade. O manifesto preserva IDs, pastas e metadados de assets compartilhados.

A Declaratória introduz sete imagens, não seis como diz o resumo da spec: 728, 1113, 1111, 1117, 1119, 1116 e 1120. A Comum introduz quatro: 721, 1125, 1126 e 1127. Compartilham Outorga 1116/1120 e infográfico 223; as duas reutilizam os PDFs 1196/1191/1188/1187. Na sequência das dez páginas, o total é 54 mídias e 29 pastas.

## Correções e diferenças das specs

- Manuais quebrados de requerimento e peças gráficas são relacionados aos arquivos locais da Home (versões de 2023 e julho/2021). A grade usa relações Documento, sem URL de PDF legado.
- Na Comum, a âncora da Lei que apontava para `/wp-admin/` passou a apontar para a Lei nº 17.202/2019. O link rotulado Decreto na lista de documentos, que apontava para a Lei, foi corrigido para o Decreto nº 59.164/2019. A referência truncada “Lei 17./2019” foi corrigida. Os destinos são os indicados nas specs; não houve certificação externa de vigência.
- Os alertas reais permitem um comunicado, prazo de 30 dias com uma prorrogação por igual período a pedido do interessado e recurso de 60 dias. Isso diverge do resumo “improrrogável” das specs: preservou-se o backup sem inventar restrição. Os alertas usam o campo atual `type=warning`, não `variant=warning`.
- Texto contido somente em imagens permanece nas imagens, com revisão editorial/alternativas pendente. As descrições dos tipos de uso foram adaptadas a partir da introdução e da spec.
- Conteúdo legal, valores, anuências e prazos são históricos em rascunho e exigem revisão institucional. Não há emissão de protocolo, validação de elegibilidade nem interpretação jurídica executada pelos componentes.
- Nenhum schema, migration, componente, menu ou Global foi alterado. Persistência por Local API com ator e checkpoints compartilhados.

Os links de página são tratados pela [conversão centralizada](./importacao-completa.md), aplicada também às oito páginas anteriores. As rotas locais nos textos não são relationships Lexical; alterações futuras de slug exigem revisão desses links. Ações de blocos usam relações com Pages quando o destino está disponível e ativo.

Pendentes: preview no Admin/desktop/mobile, leitura das imagens e fórmulas, revisão institucional integral, funcionamento dos serviços oficiais e downloads manuais. Nenhum conteúdo foi aplicado ao banco da instância durante a implementação.


## Validação final executada

- `npm run typecheck` e `npx eslint src/imports`: passaram.
- `DISABLE_PAYLOAD_HMR=true npm test`: 123 passaram, zero falhas e dois testes de banco opcionais ignorados nesta execução geral.
- Integração PostgreSQL das dez páginas: passou, incluindo reuso das mídias compartilhadas, rascunhos, reexecução sem gravações, colisão de slug sem manifesto e conflito após edição manual.
- Integração do lote completo em outro PostgreSQL vazio: passou. Executou as duas passadas, comprovou dez rascunhos, 54 mídias, 29 pastas, auditoria com ator e ausência de URLs do domínio legado em todos os layouts persistidos. Reexecutou o lote inteiro e confirmou as mesmas revisões e contagem de mídias.
- `npm run import:wordpress:all -- --dry-run --state-dir /tmp/mir-all-dry-009-010`: passou, com as dez páginas offline e relatórios. A auditoria da composição original encontrou 19 ocorrências de links de páginas mapeados, seis referências de manuais da FAQ resolvidas pela Media na aplicação e zero destinos de página desconhecidos.
- `git diff --check` e links locais dos documentos alterados: conferidos.

Os testes com subprocessos e PostgreSQL foram executados fora do sandbox, em bancos e diretórios temporários, sem usar o banco ou uploads da instância. Os containers temporários foram removidos ao encerrar a validação. Permanecem pendentes preview/navegação manual, revisão institucional e disponibilidade dos serviços externos.
