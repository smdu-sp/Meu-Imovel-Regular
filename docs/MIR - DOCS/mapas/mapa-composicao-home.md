# Mapa de composição da Home

Data: 13/11/2026. Status: planejamento baseado na cópia recebida, sem implementação.

Este mapa descreve a Home efetivamente encontrada no dump. A ordem vem do array JSON do Live Composer; a apresentação visual completa ainda não foi conferida com o WordPress em execução. Os destinos Payload são propostas, não páginas já importadas.

## Como conferir as fontes

A origem editorial é `old-wordpress/db/meuimovelregular.sql`. Os links abaixo apontam à linha do registro no dump; como cada registro pode ser longo, o ID, a chave e o caminho JSON tornam a evidência localizável. `$[n]` significa a posição de uma seção no array, começando em zero. IDs de imagem são anexos WordPress, não IDs do Payload.

- Página: [wp_posts ID 87](../../../old-wordpress/db/meuimovelregular.sql#L2368), título `Home`, slug `home`, HTML em `post_content`.
- Composição: [wp_postmeta ID 4142](../../../old-wordpress/db/meuimovelregular.sql#L1755), `post_id=87`, `meta_key=dslc_code`.
- Cabeçalho: [wp_postmeta ID 4075](../../../old-wordpress/db/meuimovelregular.sql#L1720), `post_id=100`, `dslc_code`.
- Rodapé: [wp_postmeta ID 4067](../../../old-wordpress/db/meuimovelregular.sql#L1714), `post_id=178`, `dslc_code`.

Fontes de configuração: [wp_options ID 53](../../../old-wordpress/db/meuimovelregular.sql#L145) (`show_on_front`), [wp_options ID 84](../../../old-wordpress/db/meuimovelregular.sql#L176) (`page_on_front`), [wp_options ID 233](../../../old-wordpress/db/meuimovelregular.sql#L247) (`theme_mods_lc-blank-master`).

A configuração `page_on_front=87` e `show_on_front=page` confirma a Home como `/`. A página aponta `dslc_header=default` e `dslc_footer=default`; os registros 100 e 178 têm `dslc_hf_type=default`, respectivamente para header e footer. Não são blocos próprios da Home.

## 1. Sequência de composição

| Ordem | Conteúdo encontrado | Fonte precisa | Assets | Destino candidato / decisão |
| --- | --- | --- | --- | --- |
| 1 | Capa panorâmica da cidade com a marca Meu Imóvel Regular incorporada à imagem. | [JSON 87](../../../old-wordpress/db/meuimovelregular.sql#L1755) `$[0]` | I01 | `fullWidthImageBanner`; preservar proporção e evitar corte da marca. O legado não é um Hero com título textual separado. |
| 2 | Imagem de botão para o Portal de Licenciamento, com link externo e abertura em nova aba. | [JSON 87](../../../old-wordpress/db/meuimovelregular.sql#L1755) `$[0]` | I02 | `imageBlock` + `cta` textual acessível; avaliar banner com link caso a preservação gráfica seja necessária. Destino registrado: `https://portaldelicenciamento.prefeitura.sp.gov.br/pages/reg-ed.html`. |
| 3 | “Consulte os manuais de apoio para acesso ao Portal”: oito links de documentos. | [JSON 87](../../../old-wordpress/db/meuimovelregular.sql#L1755) `$[1]` | D01–D08 | `iconGrid` compacto com oito ações Documento PDF relacionadas a Media. Não usar Cartilha como substituta dos oito manuais. |
| 4 | Introdução à lei e às modalidades, com link para a legislação municipal. | [JSON 87](../../../old-wordpress/db/meuimovelregular.sql#L1755) `$[2]` | — | `richText`. Revisar terminologia, erro de digitação e afirmações históricas antes de publicar; não extrair regra de elegibilidade desse texto. |
| 5 | Regularização Automática: título, descrição, “SAIBA MAIS” e foto à direita no array de módulos. | [JSON 87](../../../old-wordpress/db/meuimovelregular.sql#L1755) `$[3]` | I03 | `imageText`, texto à esquerda, link interno para `/regularizacao-automatica/`. |
| 6 | Regularização Declaratória Simplificada: foto antes do texto, título, descrição e link. | [JSON 87](../../../old-wordpress/db/meuimovelregular.sql#L1755) `$[4]` | I04 | `imageText`, imagem à esquerda, link para `/regularizacao-declaratoria-simplificada/`. |
| 7 | Regularização Declaratória: texto, link e foto depois do texto. | [JSON 87](../../../old-wordpress/db/meuimovelregular.sql#L1755) `$[6]` | I05 | `imageText`, imagem à direita, link para `/regularizacao-declaratoria/`. |
| 8 | Regularização Comum: foto antes do texto, título, descrição e link. | [JSON 87](../../../old-wordpress/db/meuimovelregular.sql#L1755) `$[7]` | I06 | `imageText`, imagem à esquerda, link para `/regularizacao-comum/`. |
| 9 | Separador e linhas vazias de composição, sem conteúdo editorial. | [JSON 87](../../../old-wordpress/db/meuimovelregular.sql#L1755) `$[8]` | — | Usar espaçamento dos blocos; não criar conteúdo artificial para reproduzir wrappers vazios. |
| 10 | Três chamadas: benefícios, dúvidas e situação do imóvel. Cada coluna tem imagem, texto e link. | [JSON 87](../../../old-wordpress/db/meuimovelregular.sql#L1755) `$[10]` | I07–I09 | Um `cards` com três itens e mídia: `/beneficios-de-regularizar-o-imovel/`, `/faq/` e `/situacao/`. `actionBanners` não preserva essas imagens no schema atual. |

A seção `$[0]` tem os dois módulos de imagem em `content[0].content[0]` e `content[0].content[1]`. As seções `$[5]` e `$[9]` estão vazias e não devem virar blocos. A seção `$[8]` contém `DSLC_Separator`. A ordem esquerda/direita acima é inferida da ordem dos módulos e deve ser confirmada visualmente em telas diferentes.

Na seção `$[10]`, as colunas são `content[0]` (benefícios), `content[1]` (dúvidas) e `content[2]` (situação), cada uma com imagem em `content[0]` e texto em `content[1]`. Não foi encontrado contador ou formulário no conteúdo desta Home; não há motivo demonstrado para implementá-los neste piloto.

## 2. Imagens e logos efetivamente referenciados

Cada arquivo foi resolvido pela cadeia **módulo JSON → ID de anexo → `_wp_attached_file` → arquivo físico**. Todos os 12 arquivos abaixo existem. A identificação visual da capa foi conferida abrindo o próprio JPG; as demais funções decorrem dos módulos e contextos. Os caminhos físicos não são URLs futuras do Payload.

| Ref. | Uso | Anexo | Arquivo físico | Evidência do caminho |
| --- | --- | --- | --- | --- |
| I01 | Capa da Home | 737 | [2019/10/capa_home_1920px_70dpi.jpg](../../../old-wordpress/meuimovelregular/wp-content/uploads/2019/10/capa_home_1920px_70dpi.jpg) | [wp_postmeta ID 2512](../../../old-wordpress/db/meuimovelregular.sql#L1116) |
| I02 | Botão Portal de Licenciamento | 791 | [2020/01/botão-portal-de-licenciamento-01-1-scaled.jpg](../../../old-wordpress/meuimovelregular/wp-content/uploads/2020/01/bot%C3%A3o-portal-de-licenciamento-01-1-scaled.jpg) | [wp_postmeta ID 3178](../../../old-wordpress/db/meuimovelregular.sql#L1531) |
| I03 | Modalidade Automática | 712 | [2019/10/foto-alberto-simon-archdaily_1200px_70dpi.jpg](../../../old-wordpress/meuimovelregular/wp-content/uploads/2019/10/foto-alberto-simon-archdaily_1200px_70dpi.jpg) | [wp_postmeta ID 2424](../../../old-wordpress/db/meuimovelregular.sql#L1064) |
| I04 | Modalidade Declaratória Simplificada | 776 | [2019/12/declaratoria-simplificada.jpg](../../../old-wordpress/meuimovelregular/wp-content/uploads/2019/12/declaratoria-simplificada.jpg) | [wp_postmeta ID 3033](../../../old-wordpress/db/meuimovelregular.sql#L1481) |
| I05 | Modalidade Declaratória | 77 | [2019/10/jonathan-borba-gXHHHNdKDq4-unsplash-e1572461153169.jpg](../../../old-wordpress/meuimovelregular/wp-content/uploads/2019/10/jonathan-borba-gXHHHNdKDq4-unsplash-e1572461153169.jpg) | [wp_postmeta ID 379](../../../old-wordpress/db/meuimovelregular.sql#L768) |
| I06 | Modalidade Comum | 716 | [2019/10/sergio-souza-shopping_1200px_70dpi-e1572617761282.jpg](../../../old-wordpress/meuimovelregular/wp-content/uploads/2019/10/sergio-souza-shopping_1200px_70dpi-e1572617761282.jpg) | [wp_postmeta ID 2435](../../../old-wordpress/db/meuimovelregular.sql#L1072) |
| I07 | Chamada Benefícios | 724 | [2019/10/bt_beneficios_2-1.jpg](../../../old-wordpress/meuimovelregular/wp-content/uploads/2019/10/bt_beneficios_2-1.jpg) | [wp_postmeta ID 2464](../../../old-wordpress/db/meuimovelregular.sql#L1090) |
| I08 | Chamada Dúvidas | 725 | [2019/10/bt_duvidas-2.jpg](../../../old-wordpress/meuimovelregular/wp-content/uploads/2019/10/bt_duvidas-2.jpg) | [wp_postmeta ID 2466](../../../old-wordpress/db/meuimovelregular.sql#L1092) |
| I09 | Chamada Situação | 726 | [2019/10/bt_situacao-2.jpg](../../../old-wordpress/meuimovelregular/wp-content/uploads/2019/10/bt_situacao-2.jpg) | [wp_postmeta ID 2468](../../../old-wordpress/db/meuimovelregular.sql#L1094) |
| I10 | Logo MIR no Header | 356 | [2019/10/logo-cor.png](../../../old-wordpress/meuimovelregular/wp-content/uploads/2019/10/logo-cor.png) | [wp_postmeta ID 1570](../../../old-wordpress/db/meuimovelregular.sql#L963) |
| I11 | Logo SMUL no Header | 1183 | [2021/03/logo_smul_160.png](../../../old-wordpress/meuimovelregular/wp-content/uploads/2021/03/logo_smul_160.png) | [wp_postmeta ID 4070](../../../old-wordpress/db/meuimovelregular.sql#L1715) |
| I12 | Logo Prefeitura no Footer | 179 | [2019/10/PMSP_horizontal_mono_neg.png](../../../old-wordpress/meuimovelregular/wp-content/uploads/2019/10/PMSP_horizontal_mono_neg.png) | [wp_postmeta ID 801](../../../old-wordpress/db/meuimovelregular.sql#L807) |

I10 vem de `Header $[0].content[1].content[0].image`; I11 de `Header $[0].content[3].content[0].image`; I12 de `Footer $[0].content[2].content[0].image`. Os nove primeiros IDs estão nos módulos da Home descritos acima. Para cada referência física, conferir texto alternativo, créditos, qualidade e papel editorial antes do cadastro; não importar automaticamente todas as miniaturas.

## 3. PDFs acessados a partir da Home

Os oito links estão no HTML do módulo `Home $[1].content[0].content[0].content`, dentro do JSON ID 4142; também aparecem no HTML de `wp_posts.ID=87`. Os rótulos abaixo correspondem ao texto dos links, não a uma validação da vigência dos manuais. Todos os arquivos existem.

| Ref. | Rótulo no legado | Arquivo físico | Anexo / evidência do caminho |
| --- | --- | --- | --- |
| D01 | Passo a passo | [2023/04/MANUAL-01-COMO-PREENCHER-O-REQUERIMENTO-v032023.pdf](../../../old-wordpress/meuimovelregular/wp-content/uploads/2023/04/MANUAL-01-COMO-PREENCHER-O-REQUERIMENTO-v032023.pdf) | 1196; [wp_postmeta ID 4137](../../../old-wordpress/db/meuimovelregular.sql#L1753) |
| D02 | Peças Gráficas | [2021/07/MANUAL-DE-APRESENTAÇÃO-DE-PEÇAS-GRAFICAS-16-03-2020.pdf](../../../old-wordpress/meuimovelregular/wp-content/uploads/2021/07/MANUAL-DE-APRESENTA%C3%87%C3%83O-DE-PE%C3%87AS-GRAFICAS-16-03-2020.pdf) | 1191; [wp_postmeta ID 4116](../../../old-wordpress/db/meuimovelregular.sql#L1744) |
| D03 | Como realizar o aceite | [2021/06/MANUAL-COMO-REALIZAR-OS-ACEITES-Jun2021.pdf](../../../old-wordpress/meuimovelregular/wp-content/uploads/2021/06/MANUAL-COMO-REALIZAR-OS-ACEITES-Jun2021.pdf) | 1188; [wp_postmeta ID 4091](../../../old-wordpress/db/meuimovelregular.sql#L1727) |
| D04 | DTCO e Guia de Pagamento | [2021/06/MANUAL-COMO-EMITIR-DTCO-E-GUIA-DE-PAGAMENTO-Jun2021.pdf](../../../old-wordpress/meuimovelregular/wp-content/uploads/2021/06/MANUAL-COMO-EMITIR-DTCO-E-GUIA-DE-PAGAMENTO-Jun2021.pdf) | 1187; [wp_postmeta ID 4090](../../../old-wordpress/db/meuimovelregular.sql#L1726) |
| D05 | Acompanhar Processo | [2021/09/MANUAL-04-COMO-ACOMPANHAR-O-PROCESSO-v082021.pdf](../../../old-wordpress/meuimovelregular/wp-content/uploads/2021/09/MANUAL-04-COMO-ACOMPANHAR-O-PROCESSO-v082021.pdf) | 1193; [wp_postmeta ID 4121](../../../old-wordpress/db/meuimovelregular.sql#L1747) |
| D06 | Comunique-se | [2022/09/MANUAL-06-COMO-ATENDER-O-COMUNIQUE-SE-v092022.pdf](../../../old-wordpress/meuimovelregular/wp-content/uploads/2022/09/MANUAL-06-COMO-ATENDER-O-COMUNIQUE-SE-v092022.pdf) | 1195; [wp_postmeta ID 4134](../../../old-wordpress/db/meuimovelregular.sql#L1752) |
| D07 | Solicitar Apostilamento | [2023/04/MANUAL-07-COMO-SOLICITAR-APOSTILAMENTO-v271022.pdf](../../../old-wordpress/meuimovelregular/wp-content/uploads/2023/04/MANUAL-07-COMO-SOLICITAR-APOSTILAMENTO-v271022.pdf) | 1197; [wp_postmeta ID 4138](../../../old-wordpress/db/meuimovelregular.sql#L1754) |
| D08 | Solicitar Recurso | [2021/09/MANUAL-05-COMO-SOLICITAR-RECURSO-v082021.pdf](../../../old-wordpress/meuimovelregular/wp-content/uploads/2021/09/MANUAL-05-COMO-SOLICITAR-RECURSO-v082021.pdf) | 1194; [wp_postmeta ID 4122](../../../old-wordpress/db/meuimovelregular.sql#L1748) |

Alguns links originais têm duas barras antes de `wp-content`. Na implementação, resolver os documentos por identidade/arquivo e usar a URL gerada pelo storage, com redirecionamentos planejados para os endereços antigos. O PDF da Cartilha não é referenciado diretamente pelo corpo da Home; é acessado pela página Cartilha no menu.

## 4. Header e Footer compartilhados

| Elemento | Fonte | Destino / pendência |
| --- | --- | --- |
| Faixa de cores do cabeçalho | [JSON 100](../../../old-wordpress/db/meuimovelregular.sql#L1720) `$[0].content[0].content[0].content` | HTML/CSS inline; adaptar ao tema institucional, sem gravar CSS arbitrário no CMS. |
| Marca MIR com link para a raiz | [JSON 100](../../../old-wordpress/db/meuimovelregular.sql#L1720) `$[0].content[1].content[0]` | `Header.logo`, asset I10. |
| Menu horizontal, localização `dslc_mainmenu` | [JSON 100](../../../old-wordpress/db/meuimovelregular.sql#L1720) `$[0].content[2].content[0]` | `Header.navigation`; depende dos itens e da associação de menu no banco. |
| Segunda marca com link externo para SMUL | [JSON 100](../../../old-wordpress/db/meuimovelregular.sql#L1720) `$[0].content[3].content[0]` | Asset I11. O Header atual tem um único logo: decidir composição institucional ou ajuste específico para conservar a segunda marca e seu link. |
| Faixa de cores e separadores no rodapé | [JSON 178](../../../old-wordpress/db/meuimovelregular.sql#L1714) `$[0].content[0].content[0].content` | Tema e espaçamento; não criar blocos editoriais vazios. |
| Marca Prefeitura | [JSON 178](../../../old-wordpress/db/meuimovelregular.sql#L1714) `$[0].content[2].content[0]` | `Footer.logo`, asset I12. |
| Secretaria e endereço institucional | [JSON 178](../../../old-wordpress/db/meuimovelregular.sql#L1714) `$[0].content[3].content[0].content` | `Footer.address`; avaliar onde preservar o nome completo da Secretaria. |
| E-mail e telefone de contato | [JSON 178](../../../old-wordpress/db/meuimovelregular.sql#L1714) `$[0].content[4].content[0].content` | `Footer.email` e `Footer.phone`, sujeitos à confirmação institucional. |
| Twitter, Facebook e Instagram | [JSON 178](../../../old-wordpress/db/meuimovelregular.sql#L1714) `$[0].content[5].content[0]` | `Footer.socialLinks`; URLs preservadas como evidência no JSON e sujeitas à confirmação de perfis vigentes. |

Os cinco itens de menu publicados encontrados, em ordem `menu_order`, são Entenda a Lei (`/entenda/`), Benefícios (`/beneficios-de-regularizar-o-imovel/`), Estou regular? (`/situacao/`), Dúvidas frequentes (`/faq/`) e Cartilha (`/cartilha/`). São registros `nav_menu_item` IDs 182, 295, 180, 181 e 1147, com destino em `_menu_item_object_id` e sem pai. A opção `theme_mods_lc-blank-master` (option_id 233) associa `dslc_mainmenu` ao termo 3; a associação dos cinco itens foi confirmada em `wp_term_relationships.term_taxonomy_id=3` e `wp_term_taxonomy` (termo 3, `nav_menu`, contagem 5). Registros de origem: [wp_posts ID 182](../../../old-wordpress/db/meuimovelregular.sql#L2409), [wp_posts ID 295](../../../old-wordpress/db/meuimovelregular.sql#L2459), [wp_posts ID 180](../../../old-wordpress/db/meuimovelregular.sql#L2407), [wp_posts ID 181](../../../old-wordpress/db/meuimovelregular.sql#L2408), [wp_posts ID 1147](../../../old-wordpress/db/meuimovelregular.sql#L2909). Não inferir itens de menu a partir de todas as páginas publicadas.

## 5. Recursos de estilo e limites da cobertura

Os 21 arquivos da pasta `assets/` não devem ser classificados automaticamente como usados na Home. Não foram encontrados como referências diretas nos três JSONs e no HTML da Home; os assets comprovados estão nas tabelas anteriores.

O CSS adicional em [wp_posts ID 119](../../../old-wordpress/db/meuimovelregular.sql#L2372) e [wp_posts ID 1185](../../../old-wordpress/db/meuimovelregular.sql#L2923) contém referências que merecem distinção:

- `2019/10/check-icon-e1570821745770.png`: arquivo existente, referenciado pelo seletor `.card-regular li:before`. É uma dependência condicional de estilo, não uma imagem dos módulos da Home.
- Fonte Pacifico externa, em `fonts.gstatic.com`: referência em `@font-face`, sem download nesta análise. A existência da declaração não prova uso efetivo na Home; preferir as fontes controladas da base.
- `2019/10/calibri.ttf`: referência dentro de comentário CSS, arquivo ausente nesse nome; existe `calibri.ttf.bkp`. Não é dependência ativa demonstrada, nem deve ser renomeado/importado por suposição.

A opção `custom_css_post_id` recebida vale `-1`; não foi comprovado qual CSS adicional é aplicado em runtime. Há ainda estilos e fontes do tema/plugin: a análise não é uma captura da rede de uma página renderizada. Assim, a lista é completa para referências diretas identificadas nos módulos/HTML inspecionados, mas não comprova todos os recursos carregados pelo navegador.

## 6. Proposta de montagem no Payload

```text
Header (Global)
→ fullWidthImageBanner (capa)
→ imageBlock + cta, ou banner com link (Portal de Licenciamento)
→ iconGrid compacto (oito manuais, ações Documento PDF)
→ richText (introdução)
→ imageText (Automática)
→ imageText (Declaratória Simplificada)
→ imageText (Declaratória)
→ imageText (Comum)
→ cards (Benefícios, FAQ, Situação)
→ Footer (Global)
```

Os candidatos foram conferidos nos schemas atuais de [FullWidthImageBanner](../../../src/blocks/FullWidthImageBanner/config.ts), [ImageBlock](../../../src/blocks/ImageBlock/config.ts), [ImageText](../../../src/blocks/ImageText/config.ts), [RichText](../../../src/blocks/RichText/config.ts), [Cards](../../../src/blocks/Cards/config.ts), [CTA](../../../src/blocks/CTA/config.ts), [Header](../../../src/globals/Header.ts) e [Footer](../../../src/globals/Footer.ts).

A capa contém texto dentro da imagem: definir alternativa acessível e avaliar a leitura em celular. O botão gráfico pode ser substituído por chamada textual mantendo a intenção, após revisão da imagem e decisão editorial. Não há necessidade demonstrada de novo bloco para as quatro modalidades. A segunda marca do Header é uma lacuna concreta a resolver antes do piloto.

O texto introdutório usa terminologia vedada pelas regras atuais do projeto, e as descrições citam condições e parâmetros legais. Preservar a origem como evidência, mas revisar o conteúdo institucional antes da publicação; este mapa não valida regras jurídicas. Links externos aqui documentados são extraídos do backup, sem verificação de disponibilidade ou vigência.

## 7. Registro de execução

Decisão: mapear a ordem real do JSON e distinguir mídia referenciada, documentos vinculados e dependências condicionais de CSS. Nenhuma alteração de schema ou migration; nenhum conteúdo foi importado. As alterações preexistentes no workspace foram preservadas.

Validações executadas: leitura estática do SQL via Python, verificação de colunas/escapes, `json.loads` dos três documentos, resolução dos 20 arquivos de imagem/PDF, associação dos cinco itens ao menu e abertura visual da capa. Scripts auxiliares e extrações selecionadas ficaram em `/tmp`, sem execução de PHP ou acesso ao MySQL. O verificador documental via `python3` aprovou 87 links nos dois documentos alterados, incluindo existência dos arquivos e das linhas SQL citadas, espaços finais, newline final e cercas de código. `git diff --check -- 'docs/MIR - DOCS'` passou. Lint, typecheck, testes de aplicação e build não se aplicam a esta entrega documental.

Organização: mapa movido para `docs/MIR - DOCS/mapas/`; links relativos e índice atualizados. Nenhuma mudança de conteúdo ou schema. Validação da movimentação: verificador de links via `python3` e `git diff --check`.
