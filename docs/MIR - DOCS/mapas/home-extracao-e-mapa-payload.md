# Home do MIR — extração e mapa para Payload

> **Estado:** rascunho de migração, sem importação. Fonte: `old-wordpress/db/meuimovelregular.sql`, página `wp_posts.ID=87` e composição `wp_postmeta.meta_id=4142` (`dslc_code`). Header e Footer ficam fora deste recorte. Os textos abaixo são transcrição do legado para revisão, não conteúdo aprovado para publicação.

## 1. O que foi conferido

- O JSON da Home tem 11 seções (`$[0]` a `$[10]`). As seções `$[5]` e `$[9]` estão vazias; `$[8]` é apenas um separador.
- A ordem do texto extraído do JSON coincide com a de `wp_posts.post_content` depois de normalizar tags e espaços: 1.713 caracteres em cada representação, comparação textual igual nessa normalização.
- Os módulos da Home usam **9 imagens** (`I01`–`I09`) e **8 PDFs** (`D01`–`D08`). Os logos `I10`–`I12` pertencem a Header/Footer e ficam para depois.
- IDs, caminhos físicos e referências dos 17 arquivos estão no [mapa-composicao-home.md](./mapa-composicao-home.md). A existência dos arquivos foi registrada nesse mapa; a vigência dos documentos e o uso visual em execução ainda precisam de revisão.

### Posição das imagens na Home original

A posição abaixo vem da ordem dos módulos no JSON do Live Composer e das configurações `css_align`. A referência de esquerda/direita é a composição em colunas para desktop; o alinhamento central refere-se à imagem dentro da própria coluna.

| Seção no JSON | Imagem | Posição identificada | Evidência |
| --- | --- | --- | --- |
| `$[0]` | I01, capa (anexo 737) | Centralizada, ocupando a largura disponível | `css_align=center`; `css_force_width=100%` |
| `$[0]` | I02, acesso ao Portal (anexo 791) | Abaixo da capa, centralizada | Segundo módulo da seção; `css_align=center`; `css_force_width=100%` |
| `$[3]` | I03, Automática (anexo 712) | À direita do texto | Módulo de texto antes da imagem; `css_align=right` |
| `$[4]` | I04, Declaratória Simplificada (anexo 776) | À esquerda do texto; centralizada na coluna | Módulo de imagem antes do texto; `css_align=center` |
| `$[6]` | I05, Declaratória (anexo 77) | À direita do texto | Módulo de texto antes da imagem; `css_align=right` |
| `$[7]` | I06, Comum (anexo 716) | À esquerda do texto; centralizada na coluna | Módulo de imagem antes do texto; `css_align=center` |
| `$[10]` | I07–I09, chamadas finais (anexos 724, 725 e 726) | Acima dos respectivos textos, em três colunas; centralizadas | Cada coluna traz imagem antes do texto; `css_align=center` |

A disposição em telas pequenas ainda precisa de conferência visual no site original.

## 2. Textos em ordem de leitura

### 1 — Capa e acesso ao Portal (`$[0]`)

Não há texto editável nos dois módulos. A capa traz a marca dentro da imagem `I01` (anexo 737). O botão gráfico usa `I02` (anexo 791) e aponta para o Portal de Licenciamento. A marca e a ação precisam de alternativa textual acessível na versão nova.

### 2 — Manuais (`$[1]`)

**Título:** Consulte os manuais de apoio para acesso ao Portal:

| Ordem | Texto do link | Arquivo no mapa |
| ---: | --- | --- |
| 1 | Passo a passo | D01 |
| 2 | Peças Gráficas | D02 |
| 3 | Como realizar o aceite | D03 |
| 4 | DTCO e Guia de Pagamento | D04 |
| 5 | Acompanhar Processo | D05 |
| 6 | Comunique-se | D06 |
| 7 | Solicitar Apostilamento | D07 |
| 8 | Solicitar Recurso | D08 |

### 3 — Introdução (`$[2]`)

> A Prefeitura de São Paulo publicou em outubro de 2019 a Lei de Regularização de Edificações - Lei nº 17.202/2019, também conhecida como Lei de Anistia, e com isso dá oportunidade para os cidadãos se adequarem às normas de construção e de ocupação do solo da cidade.
>
> Isso significa que a partir de agora todos os imóveis que apresentam algum tipo de irregularidade, que foram construídos até 2014 e que se enquadram nas regras da lei, poderão sre regularizados e se adequar às normas da Prefeitura.
>
> Para facilitar e dar agilidade aos pedidos, foram estabelecidas modalidades de regularização, que levam em conta a complexidade da edificação.
>
> Entenda cada uma delas:

**Revisão obrigatória:** há terminologia vedada pelas regras atuais do projeto, erro de digitação e afirmações legais/históricas que exigem validação institucional. O link para a lei consta no HTML original.

### 4 — Regularização Automática (`$[3]`)

**Título:** Regularização Automática  
**Descrição:** Residências de baixo e médio porte com isenção total de IPTU em 2014 serão regularizadas automaticamente.  
**Ação:** SAIBA MAIS → `/regularizacao-automatica/`  
**Imagem:** I03 (anexo 712), à direita no desktop segundo a ordem dos módulos.

### 5 — Regularização Declaratória Simplificada (`$[4]`)

**Título:** Regularização Declaratória Simplificada  
**Descrição:** Para edificações residenciais não enquadradas na categoria automática e que tenham até 500 m² de área construída.  
**Ação:** SAIBA MAIS → `/regularizacao-declaratoria-simplificada/`  
**Imagem:** I04 (anexo 776), à esquerda no desktop segundo a ordem dos módulos.

### 6 — Regularização Declaratória (`$[6]`)

**Título:** Regularização Declaratória  
**Descrição:** Residências maiores, comércios, escolas, escritórios, pousadas, com área construída de até 1.500 m² deverão solicitar a regularização na Prefeitura.  
**Ação:** SAIBA MAIS → `/regularizacao-declaratoria/`  
**Imagem:** I05 (anexo 77), à direita no desktop segundo a ordem dos módulos.

### 7 — Regularização Comum (`$[7]`)

**Título:** Regularização Comum  
**Descrição:** São os casos não incluídos nas categorias acima e com área construída maior que 1.500 m². Também deverão solicitar a regularização na Prefeitura.  
**Ação:** SAIBA MAIS → `/regularizacao-comum/`  
**Imagem:** I06 (anexo 716), à esquerda no desktop segundo a ordem dos módulos.

### 8 — Chamadas finais (`$[10]`)

| Ordem | Texto | Ação | Imagem |
| ---: | --- | --- | --- |
| 1 | Veja os benefícios de tornar o seu imóvel regular! | CONFIRA AQUI → `/beneficios-de-regularizar-o-imovel/` | I07 (anexo 724) |
| 2 | Está com dúvidas? Vamos te ajudar! | CONFIRA AQUI → `/faq/` | I08 (anexo 725) |
| 3 | Saiba a situação do seu imóvel | CONSULTE AQUI → `/situacao/` | I09 (anexo 726) |

## 3. Tradução para o schema atual do Payload

| Ordem no `Pages.layout` | Origem | Bloco atual | Campos a preencher | Pendência |
| ---: | --- | --- | --- | --- |
| 1 | `$[0].content[0].content[0]` | `fullWidthImageBanner` | `desktopImage=I01`, `imageHeight=auto`, `overlay=none` | Marca dentro da imagem; conferir alternativa acessível e apresentação no celular |
| 2 | `$[0].content[0].content[1]` | `imageBlock` + `cta` | `media=I02`; `action.type=external`, destino Portal de Licenciamento | Decidir entre manter botão gráfico e usar chamada textual; `imageBlock` não tem link próprio |
| 3 | `$[1]` | `iconGrid`, variante `compact` | `title`; oito itens com ícone padrão `document`, nome em `description` e ação Documento PDF em `link` | Usar relações Media em `link.document`; sem URLs antigas de uploads |
| 4 | `$[2]` | `richText` | `content` com quatro parágrafos e link da lei | Revisão editorial e jurídica antes de publicar |
| 5 | `$[3]` | `imageText` | `title`, `content`, `image=I03`, `variant=image-right`, `cta` para página interna | A página de destino precisa existir para usar relationship |
| 6 | `$[4]` | `imageText` | `title`, `content`, `image=I04`, `variant=image-left`, `cta` para página interna | Conferir posição visual em desktop e celular |
| 7 | `$[6]` | `imageText` | `title`, `content`, `image=I05`, `variant=image-right`, `cta` para página interna | Conferir posição visual em desktop e celular |
| 8 | `$[7]` | `imageText` | `title`, `content`, `image=I06`, `variant=image-left`, `cta` para página interna | Conferir posição visual em desktop e celular |
| 9 | `$[10]` | `cards` com 3 `items` | `mediaSource=image`, `image=I07–I09`, `title`, `link` interno | Definir se frases ficam em `title` ou `description`; revisar rótulos das ações |

`$[5]`, `$[8]` e `$[9]` não viram blocos de conteúdo. O espaçamento do separador deve vir das opções de apresentação dos blocos. Header e Footer serão mapeados em etapa separada.

**Página de destino:** `Pages.title=Home`, `Pages.slug=home`, `Pages._status=draft` para o piloto. O campo `layout` deve usar os blocos acima, depois da importação dos assets. O conteúdo SEO e a data editorial ficam pendentes de mapeamento e revisão.

**Decisão de adaptação:** os quatro `imageText` e os `cards` cabem nos campos existentes. Para os manuais, reutilizar `iconGrid` na variante `compact`, com ícone padrão de documento e ações relacionadas a Media PDF. O suporte a documentos nos links elimina a necessidade de RichText com URLs fixas ou de bloco novo para esta seção. O `documentList` existente permanece disponível e não é removido. A decisão atual de capa/botão e a composição completa estão na MIR-001.

## 4. Organização do importador

Um arquivo específico da Home pode fornecer o conteúdo e as decisões de mapeamento; a leitura da origem, o cadastro de mídia, a busca de páginas e a gravação ficam em funções compartilhadas. Não usar `src/migrations/` para isso: essa pasta guarda migrações do banco e dos dados internos do Payload, uma finalidade diferente da importação editorial do WordPress.

```text
scripts/import-wordpress/
  run.ts                 # seleciona página e oferece simulação sem escrita
  source.ts              # lê snapshot SQL identificado
  assets.ts              # resolve origem, hash e ID no Payload
  page-upsert.ts         # cria rascunho ou detecta conflito
  pages/home.ts          # tradução específica da Home
  manifest.json          # IDs de origem/destino e estado da carga
```

**Identidade de asset:** usar ID legado + caminho original + hash no manifesto. Um nome de destino pode incluir o contexto, por exemplo `mir-home-capa-wp737.jpg`, mas o nome sozinho não serve para deduplicar. Se outra página usar o mesmo arquivo, ela deve referenciar o mesmo registro de mídia. O `alt` é texto editorial editável e não deve ser usado como chave de importação.

**Ordem do piloto:** simulação → importar os 17 assets aprovados → criar a Home como rascunho → resolver vínculos com páginas de destino → comparar conteúdo e visual → revisão editorial → publicação. Reexecutar o importador deve detectar alterações feitas manualmente no Admin e pedir resolução, sem sobrescrevê-las.

## 5. Limites deste levantamento

Esta extração confirma a ordem e os textos armazenados no dump recebido. Não confirma que o dump seja a última versão em produção, a posição visual em cada largura de tela, a vigência de documentos e parâmetros legais ou o funcionamento dos links externos. Nenhum registro foi importado ou alterado no Payload.

Atualização do piloto: os manuais usam agora a grade de ícones compacta existente, com oito ações “Baixar PDF”. A hipótese anterior de RichText/bloco dedicado foi substituída pelo suporte a documentos nos links de ação. Não há remoção do bloco `documentList` nem mudança de schema por esta adaptação.
