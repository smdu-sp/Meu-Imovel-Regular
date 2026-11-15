# Levantamento da pasta `old-wordpress`

Data: 13/11/2026. Escopo: inspeção estática para planejamento da migração.

## 1. Conclusão

O material contém core WordPress, tema, plugins, mídias e um dump SQL. Não é uma exportação de páginas HTML pronta para navegação. O conteúdo das dez páginas publicadas está no banco, tanto em `wp_posts.post_content` como em JSON do Live Composer em `wp_postmeta.dslc_code`.

O banco é uma fonte relevante para a migração. Os arquivos complementam essa fonte com imagens, PDFs e código que explica a composição do conteúdo. A proposta é usar os três em conjunto: conteúdo e estrutura do dump, arquivos físicos para mídia e código legado como referência de interpretação.

Nenhum PHP foi executado, nenhum WordPress foi iniciado e nenhum banco foi importado, consultado ou alterado. Os dados analisados foram lidos diretamente do arquivo SQL; não representam necessariamente o estado de produção nem o da instância MySQL local.

## 2. Material recebido

| Área | Conteúdo verificado |
| --- | --- |
| `old-wordpress/` | 5.602 arquivos, totalizando 401.326.934 bytes. |
| `old-wordpress/db/meuimovelregular.sql` | Dump com 63.134.106 bytes e 40 tabelas. |
| `old-wordpress/meuimovelregular/` | 5.601 arquivos, com core, tema, plugins, uploads e configurações. |
| `wp-content/themes/lc-blank-master/` | Único diretório de tema recebido; LC Blank 1.0.2 declarado no CSS. |
| `wp-content/plugins/` | Diretórios de Live Composer e Wordfence. Live Composer declara versão 1.5.50. |
| `wp-content/uploads/` | 1.456 arquivos, totalizando 228.979.429 bytes. |
| `assets/` | 21 arquivos de identidade e apresentação: 19 PNGs, um SVG e um ICO. |
| `wp-content/cache/` | 206 arquivos; não foi encontrada cópia HTML preenchida das páginas. |

O core declara WordPress 6.7.2 em `wp-includes/version.php`; isso é uma identificação do arquivo recebido, não uma verificação de instalação em execução.

O SHA-256 do dump recebido é `ea309012c96c456c8c0568959a1f1bce5ae5d077239e9605bc9bdd333986264b`, igual ao registrado no [schema documentado](./banco-legado-schema.md). Isso confirma a identidade do arquivo, sem comprovar atualidade do backup ou sincronia com os arquivos web.

## 3. Onde estão as páginas

O [index.php](../../old-wordpress/meuimovelregular/index.php) apenas inicia o WordPress. O [template de página](../../old-wordpress/meuimovelregular/wp-content/themes/lc-blank-master/page.php) usa `the_content()`. Cabeçalho e rodapé chamam funções do Live Composer, e o tema declara dependência desse plugin.

No [código do plugin](../../old-wordpress/meuimovelregular/wp-content/plugins/live-composer-page-builder/includes/functions.php), `dslc_get_code()` lê `dslc_code` e considera também a versão de rascunho quando o editor está ativo. Portanto, é necessário interpretar os dados além dos templates PHP. O plugin pode ter mais de um valor da mesma chave e procura um valor não vazio; esse comportamento deve ser considerado em uma eventual extração.

Contagens do dump, obtidas sem importar o SQL:

| Tabela selecionada | Registros |
| --- | ---: |
| `wp_posts` | 936 |
| `wp_postmeta` | 1.577 |
| `wp_options` | 636 |
| `wp_term_relationships` | 35 |
| `wp_term_taxonomy` | 2 |
| `wp_terms` | 2 |

Entre os 936 registros de `wp_posts`, há dez páginas publicadas, uma página em rascunho, três posts publicados, 24 posts na lixeira, 386 revisões, 188 anexos, dois registros de cabeçalho/rodapé e um template do Live Composer. Existem ainda outros tipos de extensões, caches e alterações de personalização. Não tratar o total como quantidade de páginas a migrar.

### Páginas publicadas

Todas as dez páginas têm `post_parent = 0`, HTML não vazio em `post_content` e JSON não vazio em `dslc_code`.

| ID legado | Slug | Título |
| --- | --- | --- |
| 87 | `home` | Home |
| 172 | `entenda` | Entenda a Lei |
| 174 | `faq` | Dúvidas frequentes |
| 176 | `situacao` | Como saber a situação do meu imóvel? |
| 193 | `regularizacao-automatica` | Regularização Automática |
| 204 | `regularizacao-declaratoria` | Regularização Declaratória |
| 206 | `regularizacao-comum` | Regularização Comum |
| 210 | `beneficios-de-regularizar-o-imovel` | Benefícios de Regularizar o imóvel |
| 760 | `regularizacao-declaratoria-simplificada` | Regularização Declaratória Simplificada |
| 1145 | `cartilha` | Cartilha |

As opções selecionadas do dump apontam `page_on_front = 87`, `show_on_front = page`, permalink `/%postname%/`, timezone `America/Sao_Paulo` e tema `lc-blank-master`. A home corresponde a `/`; os demais caminhos são candidatos a preservação, sujeitos à conferência das regras de servidor e de eventuais redirecionamentos.

### Conteúdo do Live Composer

Foram encontrados 13 registros de `dslc_code`, todos JSON válidos: dez páginas publicadas, uma página em rascunho e dois registros globais, `Header` (100) e `Rodape` (178). Somam 779.842 caracteres. Há também 13 registros de `dslc_content_for_search`, somando 71.564 caracteres; são conteúdo auxiliar para busca, sem equivalência automática com a página completa.

A estrutura dos 13 documentos contém 49 elementos `row`, 67 `module_area` e 160 módulos. A contagem inclui o rascunho; não é uma medição apenas do conteúdo público.

| Tipo de módulo | Quantidade nos 13 documentos | Destino candidato a avaliar |
| --- | ---: | --- |
| `DSLC_Text_Simple` | 92 | `richText`, ou decomposição em blocos semânticos quando fizer sentido. |
| `DSLC_Image` | 59 | `imageBlock`, `imageText`, banners ou mídia de outro bloco, conforme o contexto. |
| `DSLC_Html` | 3 | Inspeção individual; não transportar HTML executável indiscriminadamente. |
| `DSLC_Separator` | 3 | Espaçamento/composição existente ou necessidade específica comprovada. |
| `DSLC_Social` | 1 | Links sociais no Footer. |
| `DSLC_Navigation` | 1 | Navegação no Header. |
| `DSLC_Accordion` | 1 | `faqAccordion`, após confirmar a estrutura e o conteúdo das perguntas. |

O JSON permite reconhecer a composição original, mas contém muitas opções de estilo específicas do builder. Essas opções devem orientar a leitura; não devem ser reproduzidas como CSS arbitrário no Payload. O mapeamento final ainda precisa comparar texto, ordem, imagens e comportamento entre HTML e JSON, identificando diferenças antes de escolher a representação de origem para cada parte.

Nas dez páginas publicadas, a inspeção de `post_content` encontrou HTML em todas, um iframe em `entenda` e nenhum elemento `<script>` ou `<form>`. Essa verificação não cobre scripts externos, HTML interno dos módulos, shortcodes de outros tipos de conteúdo nem comportamento gerado em runtime.

## 4. Mídia disponível

Em uploads há 902 JPGs, 537 PNGs, nove PDFs e oito arquivos de outros tipos. Entre as imagens, 1.004 nomes terminam com dimensões no padrão `-larguraxaltura`, compatível com variantes geradas. Não importar os 1.456 arquivos como se fossem mídias editoriais distintas.

O banco contém 188 anexos: 147 JPEGs, 31 PNGs, nove PDFs e um registro sem MIME. Há 187 anexos com status `inherit` e um `private`.

As 188 referências `_wp_attached_file` foram comparadas com os caminhos relativos dentro de uploads:

- 187 arquivos principais existem;
- um arquivo principal está ausente, associado ao anexo privado ID 1441;
- nenhum desses caminhos era absoluto ou continha segmento `..`.

Essa conferência cobre a existência dos arquivos principais. Não valida conteúdo, checksum contra a origem, todas as variantes de `srcset`, acessibilidade dos documentos ou imagens mencionadas diretamente em HTML/CSS. O anexo privado não deve entrar na biblioteca pública de Media.

Os nove PDFs disponíveis incluem cartilha da lei e manuais de requerimento, aceites, DTCO/pagamento, peças gráficas, acompanhamento de processo, recurso, atendimento de comunique-se e apostilamento. Sua vigência exige revisão institucional; a presença no backup não comprova que sejam as versões atuais.

Os assets externos a uploads incluem logos institucionais, fundos de home e páginas internas e logo da Prodam. Devem ser relacionados às ocorrências do conteúdo antes de decidir quais serão cadastrados no CMS.

## 5. Divergências e limites observados

- O dump lista sete plugins ativos, mas apenas o arquivo principal do Live Composer está presente entre esses sete. Os outros seis caminhos estão ausentes da cópia. Wordfence está no filesystem, mas não consta nessa lista de ativos do dump. Isso impede assumir reprodução fiel imediata ao iniciar o WordPress; não comprova sozinho a causa da divergência.
- Existem tipos de conteúdo de popup, tema de popup e countdown. A existência dos registros não confirma que estejam usados pelas páginas atuais nem que os plugins correspondentes estejam disponíveis. Verificar referências antes de incluir essas funções no escopo.
- Foram contados 288 registros de `wp_postmeta` sem `wp_posts.ID` correspondente no mesmo dump. Não atribuir esse total automaticamente a conteúdo perdido: há metadados de menus órfãos e histórico a classificar. Não carregar relações órfãs sem decisão.
- O único arquivo HTML com conteúdo encontrado na árvore é o `readme.html` da instalação; os demais `.html` estão vazios. A cópia não fornece snapshots renderizados das páginas para conferência visual direta.
- `teste.php` da raiz é um diagnóstico de conexão MySQL; `inirec.php` inspeciona configuração PHP. Não são páginas editoriais do portal. Não foram executados.
- Há configuração de banco no legado e dados de contas/configurações no SQL. Nenhum valor sensível foi reproduzido nesta documentação. A pasta está não rastreada pelo Git no momento da inspeção; não incluir o conjunto bruto em assets públicos ou em commit sem tratamento específico.

Não foi feita auditoria de segurança nem execução do legado. A inspeção estática não comprova integridade de toda a instalação, disponibilidade de serviços externos ou equivalência com o site em produção.

## 6. Efeito no planejamento

O acesso ao material deixou de ser uma dependência pendente. O diagnóstico inicial demonstrou dez páginas públicas e um conjunto de mídia com boa cobertura dos arquivos principais referenciados. Ainda faltam o recorte editorial definitivo, a análise dos três posts publicados e demais tipos, o mapa detalhado de composição e a conferência de comportamento/aparência.

Próxima unidade de trabalho proposta, ainda de planejamento: montar uma matriz **página → seções → conteúdo/mídia → bloco Payload candidato → pendências**, incluindo Header e Footer. Começar pela home, uma página de modalidade e a FAQ para identificar padrões reutilizáveis, e completar as demais. Registrar novos componentes apenas quando os existentes não atenderem à necessidade observada.

Uma instância local do WordPress pode ajudar mais tarde como referência visual, após avaliar as dependências ausentes e a configuração recebida. Ela não é pré-requisito para começar o mapeamento estático e não foi iniciada nesta análise.

O [plano de migração](./plano-migracao-wordpress.md) permanece como sequência geral. Nenhuma collection, bloco, importador, seed, integração ou alteração de schema foi implementada.

## 7. Método e validação

Inspeções executadas: `git status --short`, inventário de diretórios/arquivos via `python3`, leitura dos templates e funções selecionadas, busca com `rg` e cálculo SHA-256 via `hashlib`.

O SQL usa instruções `REPLACE INTO`, com colunas explícitas. A análise em Python fez leitura dos valores nas seis tabelas editoriais selecionadas, tratando aspas e escapes SQL, sem executar as instruções. Foi verificada a quantidade de colunas de cada linha. Uma segunda contagem independente por linhas de tuplas no formato deste dump confirmou os seis totais documentados. Os 13 valores de `dslc_code` foram interpretados com `json.loads` sem execução de código embutido.

Verificações adicionais: contagem física das extensões e dos arquivos; comparação de `_wp_attached_file` com caminhos dentro de uploads; correspondência dos caminhos de plugins ativos com arquivos presentes; identidade SHA-256 com o documento de schema. Resultados restritos a agregações e conteúdo editorial selecionado, sem listar contas, senhas ou tokens.

Validações documentais executadas: `git diff --check -- 'docs/MIR - DOCS'` sem erros e verificador via `python3` aprovado para os três documentos, com 18 links relativos existentes, espaços finais ausentes, newline final e cercas de código balanceadas. Os links ao schema foram ajustados ao local atual dentro da pasta MIR. Lint, typecheck, testes de aplicação e build não se aplicam à inspeção e documentação, e não foram executados.

Decisão: manter o dump e arquivos originais intactos; atualizar o planejamento com evidências verificadas. Pendências: sem visualização do WordPress, sem consultas à instância MySQL, sem validação de vigência editorial e sem contrato definitivo de conversão/importação.
