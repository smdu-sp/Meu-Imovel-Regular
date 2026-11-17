# Links de ação para PDFs — contrato e plano de evolução

Data: 17/11/2026. Escopo autorizado: permitir selecionar um PDF nos links de ação existentes dos blocos.

## Plano anterior ao patch

Adicionar o destino `document` aos selects dos links de ação e um campo opcional `document`, upload relacionado à coleção `media`, filtrado e validado pelo MIME PDF. Preservar `page`, `url`, `label`, `newTab` e seus valores antigos. No banner, preservar também `enabled` e a ausência de rótulo de ação. Não renomear, remover ou mudar tipos/relações de campos existentes.

Impacto: links de Hero, CTA, Cards, Carousel, ImageText, IconGrid, AlertBox, ActionBanners e FullWidthImageBanner, tanto em Pages atuais como em versões/rascunhos persistidos. Media, Users e Globals não ganham campos. A coleção Media e suas pastas são reutilizadas.

Evolução no PostgreSQL: criar colunas/relações nullable para `document` em todos os grupos/arrays afetados e suas versões; acrescentar `document` aos enums de destino. Dados antigos permanecem sem documento; não converter URLs antigas nem preencher relações automaticamente. Relacionamentos novos exigem atualização física do banco mesmo sendo opcionais.

Antes de implantação compartilhada: backup/restore em cópia → conferir baseline e snapshot reais → gerar migration incremental com o adapter PostgreSQL → revisar se há apenas adições esperadas → aplicar em cópia → validar leitura/edição dos documentos antigos e novos → aplicar no ambiente. A documentação de mídia registra ausência de baseline integral; não gerar/aplicar uma migration integral presumindo banco vazio. O desenvolvimento local pode usar o fluxo habitual de atualização do schema do Payload, sem recriar/apagar dados. Nenhuma migration deve ser aplicada automaticamente por esta tarefa ou pelo importador.

Retorno: remover a opção da interface se necessário, preservando enums, colunas e relações persistidas até um plano próprio de remoção. Código antigo não deve ser publicado sobre conteúdo com links novos sem teste de compatibilidade. Não fazer rollback destrutivo automático.

## Comportamento

O editor escolhe Documento PDF e seleciona uma Media pelo seletor nativo, inclusive navegação por pastas. O texto da ação continua explícito nos blocos que já o exigiam. O banner usa o título do documento como nome acessível, com fallback para o nome de arquivo. Títulos e URLs não são copiados ao conteúdo.

A validação do servidor consulta a Media e recusa documentos ausentes ou MIME diferente de `application/pdf`, inclusive via API. Campos ocultos de destinos anteriores não devem desviar a ação: o tipo escolhido tem prioridade. Uma relação não populada, removida ou inválida não gera link público.

Links PDF são âncoras HTML com atributo `download`, sem navegação/prefetch de página Next.js. A URL vem da Media atual; somente URLs relativas locais ou HTTP/HTTPS são aceitas. O navegador pode ignorar `download` em storage de outra origem; não há novo endpoint nem garantia de download forçado por Content-Disposition. Não ampliar formatos para Office nem alterar a política pública de Media.

## Validação e registro

Cobrir validação por MIME/ID, ações opcionais incompletas, relação com campos antigos residuais, mídia ausente/não populada, links internos/externos legados e renderização de texto, botão e banner. Regenerar tipos com o comando Payload; não editá-los à mão. Registrar abaixo os checks e limitações após a implementação.

## Uso no Admin

No grupo da ação do bloco, escolher **Destino do link → Documento PDF**, selecionar o arquivo pela biblioteca/pastas e preencher o texto da ação. No Banner de imagem, ativar **Associar banner a um link**; o nome acessível usa o título do PDF. A seleção permanece ligada ao registro Media quando o arquivo muda de pasta.

Blocos cobertos: Hero, CTA, Cards, Carousel, ImageText, IconGrid, AlertBox, ActionBanners e FullWidthImageBanner. O `documentList` continua disponível para listas; links inline do editor RichText e menus globais não foram ampliados por esta mudança. Não foi criado visualizador ou endpoint novo de download.

## Registro de implementação

Arquivos: novo helper `src/fields/document-link.ts`, expansão de `src/fields/link.ts`, configuração/componente de FullWidthImageBanner, tipo compartilhado de Carousel, resolvedor `src/lib/navigation/resolve-link.ts`, renderers BlockLink/Button e tipos gerados `src/payload-types.ts`. O helper consulta o registro no servidor sem confiar no MIME enviado pelo cliente. Campos antigos de página/URL não se sobrepõem ao destino Documento selecionado.

Compatibilidade: campos existentes preservados, relação nova opcional e sem escrita/backfill dos conteúdos atuais. Não foram modificados o importador, as mídias importadas ou os Globals. O plano acima foi registrado antes de alterar os schemas. A migration física depende da baseline do ambiente e não foi gerada a partir de um banco presumido vazio nem aplicada automaticamente.

Comandos e resultados:

- `NODE_ENV=development npm run payload -- generate:types`: passou, sem edição manual dos tipos.
- `npm run typecheck`: passou.
- `npx eslint` nos arquivos de implementação alterados: passou.
- Testes focados de documentos, resolvedor, validação editorial e Banner: passaram.
- `DISABLE_PAYLOAD_HMR=true npm test`: 92 passaram, zero falhas, um teste de integração PostgreSQL sem configuração foi ignorado. A suíte foi executada fora do sandbox por causa do subprocesso do teste do importador; HMR foi desabilitado apenas no comando de teste.
- `LDAP_AUTH_MODE=external npm run build`: passou com Turbopack fora do sandbox.
- `git diff --check`: passou.

Os testes verificam MIME consultado no servidor, ausência de mídia, dados residuais de outro destino, relação não populada, URL inválida, ação opcional incompleta e âncoras de download em texto, botão e banner. O teste do banner inspeciona a âncora sem depender da renderização de `next/image` fora do Next.js.

Pendências de implantação: atualizar o schema do banco pelo fluxo adequado do ambiente e conferir manualmente o seletor por pastas, edição de uma página antiga e download de um PDF real no Admin/site. Em desenvolvimento, reiniciar o servidor para carregar o novo schema; em ambiente com migrations, seguir o plano incremental antes de disponibilizar os campos. Não foi feita validação manual no navegador nem aplicação de migrations no banco da instância.
