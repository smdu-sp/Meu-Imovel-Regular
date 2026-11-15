# Planejamento da migração WordPress → Next.js e Payload CMS

Data inicial: 12/11/2026. Atualização: 13/11/2026. Status: planejamento, sem implementação.

Este documento organiza a descoberta, as decisões e a execução futura da migração do Meu Imóvel Regular. O planejamento inicial considerou o schema documentado, os guias da base e o código atual. Em 13/11, a [inspeção estática de old-wordpress](./analise-old-wordpress.md) acrescentou leitura do dump recebido, templates, plugin e inventário físico de mídia. Não foram consultados registros da instância MySQL, executados imports ou alterados schemas e dados.

## 1. Objetivo e limites

Migrar o conteúdo e as capacidades necessárias do portal para a base existente, com rastreabilidade entre origem e destino, revisão editorial e continuidade dos endereços públicos.

Direção confirmada pelo usuário: preservar o conteúdo existente, adaptando sua apresentação e estrutura aos blocos atuais. Componentes novos e ajustes específicos do MIR são admitidos quando necessários; a necessidade deve ser demonstrada no levantamento e detalhada em spec antes da implementação. Preservar URLs é a recomendação inicial para continuidade de acesso, a validar no mapeamento.

O planejamento não autoriza implementar collections, blocos, importadores, páginas ou integrações. Cada mudança futura deve ter escopo próprio e avaliar os documentos já persistidos. Triagem, elegibilidade, cálculos e integração CEDI dependem de specs específicas e de fontes oficiais; não podem ser reconstruídos como regras válidas a partir do WordPress.

## 2. Evidências e situação atual

| Assunto | Evidência disponível | Consequência para o planejamento |
| --- | --- | --- |
| Legado | [Schema documentado](./banco-legado-schema.md) e dump recebido, com 40 tabelas; 936 registros em `wp_posts`, dez páginas publicadas e 188 anexos | Os volumes do dump foram medidos. Classificar outros tipos e definir o recorte; não confundir registros totais com páginas a migrar. |
| Fonte | O dump recebido tem SHA-256 igual ao documento de schema; o usuário informa uma instância local em execução | A identidade do arquivo está confirmada. A correspondência com a instância MySQL e a atualidade do backup ainda não foram verificadas. |
| Integridade | O dump não declara foreign keys | Conferir referências órfãs, pais ausentes e ciclos; não confiar apenas nos IDs. |
| Conteúdo | As dez páginas publicadas têm HTML em `post_content` e JSON do Live Composer em `dslc_code`; Header e Footer também usam esse JSON | Usar o banco como fonte de conteúdo/estrutura e conferir equivalência das representações antes de definir a conversão. |
| Assets e comportamento | `old-wordpress/` contém core, tema LC Blank, Live Composer, Wordfence, 1.456 arquivos em uploads e 21 assets adicionais; 187 arquivos principais de anexos foram encontrados | O material está acessível. A cópia não contém snapshots HTML das páginas; plugins ativos no dump estão parcialmente ausentes. Ainda falta conferir apresentação e comportamento. |
| Destino | [Configuração atual](../../src/payload.config.ts): Next.js 16.3.3 e Payload 3.88.0 declarados em `package.json`, com adapter SQLite | O MySQL legado é uma fonte separada. Banco e storage de produção são decisões pendentes. |
| Modelo editorial | Collections `pages`, `media`, `users`, `themes`, `audit-logs`; Globals `header`, `footer`, `site-settings` | Reusar a base e justificar eventuais lacunas; não criar uma collection para cada tabela WordPress. |
| Rotas | [Slugs](../../src/domain/slug.ts) aceitam segmentos; rota pública `[...slug]`; `home` corresponde a `/` | É possível representar caminhos hierárquicos, mas `Pages` não possui relacionamento de pai. Não confundir caminho com árvore editorial. |
| Conteúdo público | O frontend seleciona páginas publicadas e ativas | Importar inicialmente como rascunho e validar também o acesso pelas APIs. `noIndex` não é controle de acesso. |
| Migrations do destino | [Guia da base](../CMS%20-%20DOCS/cms/schema-evolution-migrations.md) registra ausência de baseline integral; `src/migrations/` contém um backfill de roles | Estabelecer a baseline e o processo do ambiente antes de mudanças persistidas e da carga definitiva. O backfill isolado não cria o schema completo. |
| Documentação | A base foi movida para `docs/CMS - DOCS/`; há referências antigas a `docs/cms/` e `docs/specs/` | Usar os caminhos existentes. A correção geral dos links fica em tarefa separada. |

As tabelas `wp_wf*`, `wp_wpfm_backup` e `wp_yoast_seo_*` sugerem extensões por nomes e colunas. Não comprovam versões ou uso atual por si. O código e os dados recebidos confirmam o uso de estruturas Live Composer, mas há divergência entre plugins no filesystem e na lista de ativos do dump. O relatório estático detalha esses limites; a análise por página ainda precisa dimensionar o esforço de adaptação.

## 3. Decisões em aberto

| Decisão | Informação necessária | Momento de definição |
| --- | --- | --- |
| Adaptações específicas do MIR | Conteúdo será preservado e adaptado aos blocos existentes, conforme definição do usuário; identificar lacunas reais | No mapeamento de layouts, antes de propor novos componentes ou ajustes. |
| Cobertura da cópia recebida | Material acessível e inventariado; faltam plugins listados como ativos, referência renderizada e verificação de todas as dependências | Antes de assumir equivalência com a produção ou tentar executar o WordPress. |
| Recorte editorial | Manter, revisar, consolidar ou arquivar cada família de conteúdo; responsáveis pela revisão | Antes de selecionar os lotes. |
| Atualidade da fonte | Data efetiva do backup, alterações posteriores e possibilidade de obter uma extração final | No diagnóstico e novamente antes da virada. |
| Destino operacional | Hospedagem, domínio, banco, armazenamento persistente de mídia, backup e restore | Antes do piloto em ambiente semelhante ao destino. |
| Funcionalidades necessárias | Formulários, buscas, listagens, widgets, simuladores, serviços e integrações realmente usados | Antes de definir specs de implementação. |
| Contas e autoria | Necessidade de preservar autoria editorial e usuários que deverão acessar o CMS via LDAP | Antes de qualquer provisionamento de contas. |
| Publicação e virada | Responsável editorial, responsável técnico, janela, congelamento e critério de retorno | Antes da carga definitiva. |

Não estimar prazo total com base apenas no DDL. A estimativa deverá considerar páginas por família, quantidade de arquivos, formatos de conteúdo e esforço de revisão manual.

## 4. Sequência proposta

As etapas de implementação e carga abaixo são futuras. A inspeção estática de 13/11 realizou parte do diagnóstico da etapa 1: volumes, páginas, formato Live Composer e existência dos arquivos principais. O mapeamento detalhado e a conferência visual/comportamental continuam pendentes.

| Etapa | Trabalho | Entrega e condição para avançar |
| --- | --- | --- |
| 1 — Diagnóstico | Inventariar banco local somente para leitura, arquivos e dependências disponíveis | Relatório com volumes, formatos, famílias, URLs e lacunas. Dados desconhecidos ficam explícitos. |
| 2 — Mapeamento | Definir destino de cada família, política editorial, tratamento de mídia e URLs | Matriz origem/destino e catálogo das exceções revisados. |
| 3 — Specs técnicas | Detalhar apenas as lacunas comprovadas e o processo de importação | Specs com critérios de aceite, impacto em dados e plano de migration quando necessário. |
| 4 — Piloto | Executar simulação e carga de uma amostra representativa em destino isolado | Conversão, edição no Admin, preview, links, mídia e repetição da carga validados. |
| 5 — Migração por lotes | Processar famílias aprovadas, reconciliar resultados e revisar conteúdo | Todo registro no recorte tem resultado rastreável; exceções resolvidas ou aceitas explicitamente. |
| 6 — Homologação e virada | Atualizar fonte, validar carga final, publicar e ativar domínio/redirecionamentos | Plano operacional ensaiado, aceite editorial/técnico e retorno viável. |
| 7 — Acompanhamento | Monitorar rotas, arquivos, erros, busca e publicação após a virada | Pendências com responsável; legado desativado conforme retenção definida. |

### Etapa 1 — Diagnóstico sem escrita

Usar acesso limitado à leitura na cópia local. Separar a configuração da fonte da `DATABASE_URI` do Payload, sem registrar credenciais em documentos. Verificar versão/schema reais e relacionar o inventário a um snapshot identificado.

Levantar inicialmente agregações e nomes de chaves, evitando exportar valores sensíveis:

- contagens reais de `wp_posts` por `post_type`, `post_status` e MIME type;
- páginas com pai, slugs vazios ou repetidos, pais ausentes e ciclos;
- revisões, rascunhos, conteúdo privado, protegido por senha, agendado e descartado, sem presumir que todos devam migrar;
- frequência de chaves de `wp_postmeta` por tipo de conteúdo e nomes de taxonomias com uso efetivo;
- padrões de HTML, comentários de blocos, shortcodes, JSON e serialização PHP, com amostras editoriais selecionadas;
- opções necessárias à reconstrução: origem pública, permalinks, página inicial, página de posts, timezone, menus e referências a tema/plugins, por lista permitida;
- anexos, referências a arquivos, thumbnails, imagens destacadas, imagens inline, documentos e recursos externos;
- metadados SEO efetivamente presentes, sem assumir que títulos e descrições estejam nas tabelas `wp_yoast_seo_*`;
- quantidades de comentários e necessidade editorial, sem copiar dados de visitantes para o relatório;
- funcionalidades fornecidas por tema/plugins, serviços externos ou JavaScript que não apareçam no DDL.

A pasta recebida foi identificada como código WordPress com mídia, sem páginas HTML exportadas. A comparação inicial encontrou 187 dos 188 arquivos principais de anexos; o ausente pertence ao registro privado. Complementar a cobertura com variantes, arquivos usados diretamente em HTML/CSS e assets externos a uploads. Quando houver referência navegável, conferir a apresentação e o comportamento; essa verificação ainda está pendente.

Entregas previstas: inventário agregado, famílias de páginas, dependências, cobertura dos arquivos e mapa inicial de URLs. Conteúdo bruto e dumps permanecem fora dos documentos versionados; amostras compartilhadas devem ser revisadas.

Critério de saída: distinguir o que existe, o que é necessário preservar e o que ainda depende de material ausente. Nenhuma conclusão de viabilidade integral apenas pela leitura das tabelas.

### Etapa 2 — Mapeamento editorial e de dados

O quadro abaixo é uma hipótese de trabalho, não um contrato de importação já aprovado.

| Origem | Destino candidato na base | Decisão ou validação necessária |
| --- | --- | --- |
| `wp_posts` de páginas aprovadas | `pages.title`, `pages.slug`, `pages.layout` e `pages.seo` | Reconstruir o caminho público e a composição; não assumir um bloco único para todas as páginas. |
| Posts e tipos customizados | Destino a decidir após inventário | A base não tem collection editorial específica de notícias nem taxonomias. Justificar necessidade antes de propor schema. |
| `post_title` | `pages.title` | Preservar significado e resolver títulos vazios ou markup. |
| `post_name` e `post_parent` | `pages.slug` com caminho confirmado | Não concatenar sem validar ancestrais, permalink e colisões. |
| `post_content` e metadados de apresentação | Blocos existentes e conteúdo Lexical | Usar conversores por família/formato; registrar elementos sem equivalência. |
| `post_excerpt` | Introdução editorial ou outro destino justificado | Não existe campo de resumo genérico em `Pages`; não copiar automaticamente para a descrição SEO. |
| `post_status` e proteção por senha | Política de seleção e publicação | A carga inicial fica em rascunho. Conteúdo privado/protegido não vira público nem é considerado protegido só por estar em rascunho. |
| Datas e `post_author` | Proveniência no manifesto; campos futuros apenas se necessários | `Pages` não tem autoria nem data editorial histórica dedicada. Não equiparar datas de importação às do conteúdo original. |
| `attachment`, metadados e arquivos | `media` e referências dos blocos/SEO | Disponibilidade física, MIME, acessibilidade, deduplicação e URLs antigas. |
| Termos e relacionamentos | Classificação no inventário; destino editorial a decidir | A associação usa `term_taxonomy_id`; não presumir que todo objeto seja uma página. |
| Menus e `nav_menu_item` | Global `header`, eventualmente links de `footer` | Conferir níveis, ordem, rótulos e destinos externos ou com âncoras. |
| Opções editoriais selecionadas | `header`, `footer` e `site-settings` | Não copiar `wp_options` integralmente; revisar contatos, links, tema e configurações obrigatórias. |
| Metadados SEO confirmados | `seo.metaTitle`, `metaDescription`, `socialImage`, `canonical`, `noIndex`, `noFollow` | Interpretar templates/valores da extensão e validar o resultado renderizado. |
| `wp_users` e `wp_usermeta` | Referência de autoria, se necessária | Acesso do CMS segue LDAP e roles explícitas. Não importar hashes, sessões ou permissões WordPress. |
| Comentários, revisões e `wp_links` | Avaliação de necessidade; arquivo separado ou conteúdo selecionado | Não pressupor suporte equivalente no Payload nem converter revisões em versões automaticamente. |
| Logs, caches, backups e configuração de segurança de extensões | Fora da carga editorial | Manter a preservação da origem conforme política própria; não inserir esses registros no CMS. |

Cada item do recorte deve receber uma decisão: migrar, revisar, consolidar, arquivar ou excluir da carga, com motivo e responsável. Uma consolidação deve mapear todos os itens e URLs de origem para o destino escolhido.

### Conversão de conteúdo

Usar o [catálogo atual](../../src/blocks/catalog.ts): `hero`, `richText`, `imageBlock`, `gallery`, `carousel`, `videoBlock`, `imageText`, `cards`, `cta`, `iconGrid`, `faqAccordion`, `alertBox`, `actionBanners` e `fullWidthImageBanner`.

Textos, listas e tabelas são candidatos a Lexical; galerias, FAQs, imagens e chamadas podem usar seus blocos correspondentes. Isso depende da equivalência de conteúdo e comportamento, verificada em amostras. Preservar ordem de leitura, títulos, listas, tabelas, legendas, links e âncoras relevantes.

HTML legado deve ser interpretado e convertido com regras explícitas. Não executar scripts, PHP ou shortcodes, nem transferir CSS arbitrário do tema para o conteúdo. Serialização PHP exige parser apropriado, sem instanciar objetos ou executar código. Evitar substituição textual sobre valores serializados.

Quando não houver conversão confiável, preservar a referência ao original e abrir uma exceção para composição manual ou spec específica. Nenhuma perda silenciosa de conteúdo, link ou comportamento. A revisão manual deve ocorrer no documento de destino, com proteção contra sobrescrita em reexecuções.

### Mídia e documentos

O plano da mídia deve relacionar ID legado, caminho/URL original, arquivo físico, checksum, MIME real, tamanho, metadados e ID no Payload. Preservar os originais e resolver referências de variantes, URLs relativas, `srcset`, fundos e arquivos externos usados no site.

O [schema atual de Media](../../src/collections/Media.ts) permite JPEG, PNG, WebP, AVIF, GIF, SVG e PDF e exige `alt` e `usage`. Formatos diferentes exigem decisão específica; vídeos incorporados no bloco atual aceitam YouTube/Vimeo. Verificar equivalência antes de converter arquivos ou trocar providers.

Ponto de atenção confirmado no código: a leitura de `Media` é pública. Não carregar anexos privados, protegidos ou sem classificação na biblioteca pública, mesmo quando a página estiver em rascunho. Materiais com esse requisito permanecem em área isolada até existir uma solução autorizada.

Textos alternativos ausentes, documentos sem arquivo, links quebrados e formatos incompatíveis são exceções identificáveis. Não inventar descrições factuais nem substituir documentos oficiais por versões não confirmadas. Definir armazenamento persistente e backup conjunto de arquivos e banco antes da carga definitiva.

### URLs, navegação e SEO

Construir uma matriz com URL antiga, ID de origem quando houver, destino, decisão e evidência. Combinar regras de permalink, pais, opções e referências do site. `guid` serve como pista, não como fonte única da URL pública.

Cobrir caminhos hierárquicos, domínios anteriores, versões HTTP/HTTPS, barras finais, maiúsculas, acentos, parâmetros WordPress (`?p=`, `?page_id=`, `?attachment_id=`), arquivos em uploads, listagens e paginações usadas. Preservar âncoras ou registrar a alteração, pois o fragmento não chega ao servidor.

O normalizador atual remove acentos e normaliza caracteres. Detectar colisões antes da gravação, incluindo caminhos reservados da aplicação como `/admin`, `/api`, `/graphql`, `/graphql-playground`, `/busca`, `/icones` e `/sitemap.xml`. A home usa `/`; não planejar `/home` como uma página independente.

Preservar os endereços que couberem no modelo. Para alterações, especificar redirecionamentos permanentes para o destino equivalente, sem ciclos ou cadeias e sem encaminhar indiscriminadamente tudo para a home. Conteúdo removido sem substituto precisa de decisão explícita sobre resposta HTTP. A implementação dos redirecionamentos será escolhida conforme o volume e a hospedagem; não foi encontrada uma camada de migração de URLs no código inspecionado.

O `header` atual tem navegação interna normal ou menu com até seis itens e oito links por categoria, sem árvore arbitrária ou destino externo nesses campos. Menus mais profundos, extensos, externos ou com âncoras exigem decisão editorial ou evolução por spec; não truncar automaticamente.

Revisar canonicals e imagens sociais para que apontem à origem correta após a virada. Validar sitemap, indexabilidade e cobertura com o volume real. A consulta atual do sitemap declara `limit: 1000` e `pagination: false`; verificar o comportamento efetivo na versão instalada, sem presumir truncamento ou cobertura integral. A busca atual pesquisa título, slug e metadados SEO, sem consulta ao corpo dos blocos; confirmar se atende ao portal.

## 5. Requisitos para o futuro importador

Fluxo proposto:

```text
Snapshot da fonte + arquivos disponíveis
→ extração para área isolada
→ normalização e decisões de mapeamento
→ simulação com relatório de diferenças e exceções
→ carga em Payload de homologação como rascunho
→ reconciliação técnica e revisão editorial
→ publicação do recorte aprovado
```

O leitor da fonte deve ter client/adapter próprio em `src/lib/`, sem dependência do MySQL legado no atendimento público do Next.js. As transformações devem ser funções testáveis, separadas da gravação e dos componentes React. Caminhos concretos e dependências serão definidos na spec correspondente.

Requisitos do contrato de execução:

1. Identificar snapshot, ambiente, versão do conversor e execução; permitir simulação sem escrita no destino.
2. Preservar IDs WordPress como strings na extração e no mapa de correspondência, evitando perda de precisão e reutilização indevida como IDs Payload.
3. Manter manifesto externo com origem/tipo/ID → collection/ID de destino, hash do conteúdo e resultado. Isso não exige adicionar campos às collections nesta fase.
4. Carregar por dependências: mídias públicas aprovadas e páginas-base em rascunho, resolver referências cruzadas, completar layouts/SEO e, por último, Globals. Definir como tratar placeholders no schema efetivo do piloto.
5. Garantir reexecução sem duplicação, checkpoints por lote e proteção para conteúdo editado após a carga. Conflitos seguem para revisão, sem sobrescrita automática.
6. Registrar falhas e exceções sem payloads sensíveis; manter motivo para itens ignorados e vínculos de consolidação.
7. Usar os mecanismos de criação/atualização do Payload, sem copiar linhas para suas tabelas internas. Verificar comportamento dos hooks de auditoria, revalidação, permissões e versões; não desativá-los indiscriminadamente.
8. Tratar `0000-00-00`, timezone da origem, datas locais/GMT e codificações divergentes com regras explícitas. Não criar datas históricas fictícias nem substituir silenciosamente por hoje.
9. Prever cancelamento e retorno: restauração validada em destino isolado ou compensação restrita aos registros da execução, sem apagar edições posteriores ou conteúdo preexistente.

Evolução do schema Payload e migração de conteúdo são atividades distintas. Renames, remoções, mudanças de tipo/relationship e requisitos novos devem ter análise de compatibilidade e plano de migration antes do patch. Decidir o banco de produção e estabelecer sua baseline antes da importação definitiva; não acoplar a conversão WordPress ao arquivo SQLite de desenvolvimento.

## 6. Piloto, validação e aceite

Escolher uma amostra por família e por risco, após o inventário: página textual simples, página longa com tabela, mídia/documento, página composta por shortcodes ou builder se houver, FAQ/galeria se presentes, página hierárquica e caso com links cruzados/SEO. Incluir um caso incompatível para validar o relatório de exceções.

Validar no piloto:

- correspondência de texto, estrutura, links, mídia e comportamento essencial com o original;
- edição posterior no Admin, preview, rascunho, publicação e despublicação;
- ausência de publicação involuntária de conteúdo privado pelas páginas, arquivos ou APIs;
- repetição e retomada da carga, falha parcial e conflito com edição manual;
- restauração de backup e integridade das referências após restore;
- leitura em celular/desktop, teclado, hierarquia de headings, tabelas e textos alternativos;
- cobertura das URLs, redirecionamentos, canonicals, imagens sociais e sitemap.

Aceite da migração por lote: todo item do recorte possui resultado no manifesto; nenhum arquivo ou vínculo obrigatório fica sem resolução; diferenças e exclusões têm decisão registrada. As contagens devem considerar mídias deduplicadas e páginas consolidadas, sem exigir igualdade artificial entre totais da origem e do destino.

Aceite para virada: nenhuma exceção bloqueadora pendente, publicação revisada pela equipe responsável, URLs críticas verificadas e plano operacional ensaiado. Prazos, taxas, contatos, documentos e parâmetros legais precisam de revisão institucional antes da publicação; a transposição do WordPress não comprova vigência.

Durante a implementação futura, executar os checks apropriados (`npm run lint`, `npm run typecheck`, `npm test`, `npm run build`) e testes relevantes de conversão, integridade e reexecução. Medir desempenho com volume representativo, incluindo arquivos e custo dos hooks, sem escolher infraestrutura apenas pelo tamanho do dump.

## 7. Virada e retorno

Planejar o congelamento editorial do WordPress ou um processo de captura das alterações finais, conforme a operação disponível. Identificar exclusões e mudanças de arquivos também; `post_modified` sozinho não cobre opções, termos, anexos ou toda alteração de extensão.

Ensaiar a carga final em homologação, obter aceite, guardar backups restauráveis de banco e mídia e definir o responsável pela liberação. Na virada, aplicar a carga aprovada, publicar o recorte, ativar domínio/redirecionamentos e conferir rotas e arquivos críticos. Homologação não deve ficar indexável nem expor conteúdo restrito.

Definir antes da virada quando retornar ao WordPress e como preservar eventuais edições feitas no novo CMS. Manter a origem e os arquivos disponíveis pelo período acordado. Desativar o legado somente após a estabilização e a definição de retenção.

## 8. Próxima unidade de trabalho

Propor uma tarefa restrita ao **mapeamento estático das páginas do legado para a base CMS**, usando o [levantamento realizado](./analise-old-wordpress.md). Entregar uma matriz página → seções → conteúdo/mídia → bloco candidato → pendências, incluindo Header e Footer, sem criar importador nem alterar a aplicação.

Usar a direção já confirmada: preservar conteúdo e adaptá-lo aos blocos atuais, propondo componentes específicos quando necessário. Começar pela home, uma modalidade e a FAQ para identificar padrões, completar as demais e avaliar os outros tipos de conteúdo. Registrar as verificações que dependem de execução ou referência visual. A estimativa de esforço vem depois desse mapeamento.

## 9. Registro das entregas de planejamento

Decisões: separar a documentação MIR da base CMS; usar o código atual para conferir capacidades; preservar conteúdo adaptando-o aos blocos atuais; admitir ajustes específicos mediante necessidade e spec; manter o mapeamento preliminar; preservar as alterações preexistentes do workspace. A inspeção de 13/11 confirmou o banco como fonte útil em conjunto com arquivos e código, e propôs o mapeamento por página como próxima unidade.

Impacto em dados: nenhum. Nenhum schema, seed, configuração de ambiente ou arquivo de aplicação foi modificado. Não há migration nesta entrega.

Desvios e pendências: nenhuma execução da migração foi antecipada. O acesso aos arquivos foi resolvido e o dump foi analisado estaticamente, sem consulta ao MySQL. Apresentação, comportamento em execução, dependências ausentes e vigência editorial permanecem pendentes. Os links antigos da documentação geral foram identificados, sem correção fora do escopo.

Inspeções executadas: `git status --short`, `rg --files docs`, leitura de `docs/banco-legado-schema.md` com `cat`/`sed`, e leitura dos schemas, rotas, guias de evolução de schema e documentação local de rotas/redirecionamentos do Next.js em `node_modules/next/dist/docs/`.

Validações da entrega inicial de 12/11: `git diff --check -- 'docs/MIR - DOCS'` sem erros; verificador documental via `python3` aprovado para os dois documentos MIR, com dez links relativos existentes, ausência de espaços finais, newline final e cercas de código balanceadas. A verificação Python cobre também os arquivos ainda não rastreados pelo Git. A atualização de 13/11 acrescenta o relatório de inspeção e nova verificação documental dos três arquivos. Lint, typecheck, testes de aplicação e build não se aplicam às entregas exclusivamente documentais e não foram executados.
