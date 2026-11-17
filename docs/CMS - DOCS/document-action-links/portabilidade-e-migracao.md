# Port para o CMS pai — roteiro e validação

## 1. Conferir o destino

Inspecionar a estrutura, instruções locais, versões instaladas e adapter no `SMUL-PayloadCMS`. O contexto anterior é SQLite, mas confirmar antes do patch. Ler a documentação da versão Next.js instalada antes de escrever código no pai.

Verificar se o [upgrade de mídia e PDF](../media-library-pdf/README.md) foi portado: MIME PDF, metadados e `Media.title`. Pastas não são criadas por este patch; seu funcionamento depende da biblioteca do pai. Se `title` ainda não existir no tipo Media, portar o upgrade correspondente ou definir explicitamente um fallback compatível antes de copiar o componente de Banner. Não editar tipos gerados para esconder a incompatibilidade.

Não há necessidade de nova dependência, novo bloco, nova collection ou componente Admin personalizado para este recurso. O campo de upload e o seletor de pastas são do Payload.

## 2. Arquivos a transportar

Os links apontam aos arquivos de referência no MIR. Integrar as diferenças à estrutura do pai, preservando customizações locais; não substituir arquivos completos às cegas.

| Referência MIR | Ação no pai |
| --- | --- |
| [src/fields/document-link.ts](../../../src/fields/document-link.ts) | Adicionar helper de upload PDF e validação no servidor. |
| [src/fields/link.ts](../../../src/fields/link.ts) | Adicionar destino/campo Documento e considerar esse destino na validação do texto. |
| [src/lib/navigation/resolve-link.ts](../../../src/lib/navigation/resolve-link.ts) | Ampliar tipos, resolver a relação PDF e indicar download; preservar fallbacks legados. |
| [src/blocks/shared/BlockLink.tsx](../../../src/blocks/shared/BlockLink.tsx) | Propagar download e renderizar âncora para arquivo. |
| [src/components/ui/Button.tsx](../../../src/components/ui/Button.tsx) | Acrescentar prop download à variante de link e manter estilos/acessibilidade. |
| [src/blocks/Carousel/Component.tsx](../../../src/blocks/Carousel/Component.tsx) | Reutilizar NavigationLink no tipo dos itens. |
| [src/blocks/FullWidthImageBanner/config.ts](../../../src/blocks/FullWidthImageBanner/config.ts) | Acrescentar opção e campo PDF respeitando `enabled`; preservar campos existentes. |
| [src/blocks/FullWidthImageBanner/Component.tsx](../../../src/blocks/FullWidthImageBanner/Component.tsx) | Suportar documento no tipo e âncora/nome acessível do banner. |
| [src/fields/document-link.test.ts](../../../src/fields/document-link.test.ts) | Transportar testes de servidor, resolvedor e renderização, adaptando imports. |
| [src/blocks/content-validation.test.ts](../../../src/blocks/content-validation.test.ts) | Atualizar a expectativa do grupo de links do Banner para incluir `document`. |
| [src/payload-types.ts](../../../src/payload-types.ts) | Referência somente: regenerar a partir do schema do pai; não copiar nem editar manualmente. |

Hero, CTA, Cards, ImageText, IconGrid, AlertBox, ActionBanners e Carousel recebem os novos campos pelo helper existente `createLinkFields`. Não duplicar a implementação em cada config. Banner tem configuração própria e precisa do ajuste explícito. Confirmar se o pai possui outros grupos de ação independentes antes de declarar cobertura adicional.

Não transportar alterações MIR de `.gitignore`, scripts npm, importadores WordPress, seeds, diretório de estado, mídia física ou dados institucionais. Elas pertencem à migração do portal e não a esta funcionalidade.

## 3. Plano de schema antes da implementação

| Mudança | Efeito persistido | Compatibilidade |
| --- | --- | --- |
| Novo valor `document` no destino | Novo valor permitido em enums/checks/contrato do adapter | Preservar `internal` e `external`; não reescrever documentos antigos. |
| Novo upload `document` | Colunas/relações nullable para Media nos grupos e arrays de links | Registros antigos continuam sem documento. |
| Pages/versões | Os campos novos precisam existir tanto no estado atual quanto nas estruturas de versões/rascunhos | Validar preview, edição e publicação de documentos antigos e novos. |
| Media/Users/Globals | Sem mudança por este patch | Preservar dados e permissões atuais. |

Listar os caminhos afetados: Hero.cta, CTA.action, Cards.items.link, Carousel.items.link, ImageText.cta, IconGrid.items.link, AlertBox.link, ActionBanners.banners.button e FullWidthImageBanner.link. Confirmar os nomes reais nas configs do pai, pois os nomes da interface podem variar. Todos recebem relação `document` no respectivo grupo; o tipo de ação mantém seu nome anterior.

### Sequência por ambiente

1. Inventariar Pages/versões e relações existentes; fazer backup e provar restauração em cópia.
2. Estabelecer baseline/snapshot do schema real do adapter. Não usar o backfill de roles como baseline integral nem gerar uma migration de criação completa sobre base populada.
3. Portar o contrato, regenerar os tipos e gerar migration **incremental no próprio pai**.
4. Inspecionar o diff: apenas novos valores permitidos e relações opcionais em todos os blocos/arrays e versões. Não aceitar remoção/rename de campos, perda de conteúdo ou alteração de relações antigas.
5. Aplicar primeiro em cópia com conteúdo antigo, validar todos os cenários abaixo e conferir IDs/URLs de Media.
6. Aplicar no ambiente alvo pelo fluxo operacional existente, antes de liberar gravação dos links novos no Admin.

No MIR/PostgreSQL, a alteração envolve enums e colunas/constraints próprias desse adapter. No pai/SQLite, a migration pode precisar reconstruir tabelas para ajustar constraints; revisar cópia de registros, relações, índices e foreign keys. Não copiar SQL PostgreSQL para SQLite e não presumir nomes físicos a partir dos nomes de campo.

Nenhum conteúdo precisa de backfill editorial: não converter URLs de PDFs antigos automaticamente. Se houver mudança de adapter desde o contexto original, gerar a migration correspondente ao adapter atual. O modo dev de schema push não substitui uma migration revisada em ambiente persistente compartilhado.

### Retorno

Manter campos, relações e valores novos no banco durante um recuo de código. Dados com `type=document` precisam de compatibilidade de leitura antes de disponibilizar código antigo. Remoção posterior exige inventário de uso, plano próprio e backup; não remover enums/relações automaticamente nem recriar a base.

## 4. Comandos e testes

Usar os scripts do pai, adaptando diferenças de plataforma. Exemplos da base MIR:

```bash
NODE_ENV=development npm run payload -- generate:types
npm run typecheck
node --import tsx --test src/fields/document-link.test.ts src/lib/navigation/resolve-link.test.ts src/blocks/content-validation.test.ts src/blocks/FullWidthImageBanner/custom-theme.test.ts
DISABLE_PAYLOAD_HMR=true npm test
npm run lint
npm run build
git diff --check
```

Regenerar import map somente se o port introduzir referências de componentes Admin não existentes; o recurso atual usa campos nativos. Não copiar os arquivos de tipos ou import map do MIR sobre o pai.

Os resultados de 92 testes aprovados, um ignorado e build aprovado estão no [registro MIR](./implementacao-mir.md). Executar novamente no pai: diferenças de adapter, schema e versões podem mudar o resultado. A falha de lint global do MIR ao varrer `old-wordpress` é específica do snapshot deste portal, não uma exceção automática aos checks do pai.

## 5. Aceite no repositório pai

- [ ] Link interno e externo antigos continuam editáveis e funcionais, inclusive após salvar novamente.
- [ ] Editor escolhe Documento PDF, navega por pastas quando disponíveis e salva a relação.
- [ ] Texto da ação obrigatório é validado também nas ações opcionais parcialmente preenchidas.
- [ ] Envio por API de ID de imagem com MIME PDF forjado é recusado; a validação consulta Media.
- [ ] Trocar o destino não reutiliza silenciosamente a página/URL oculta do destino anterior.
- [ ] Remover a relação, apagar a mídia ou ler sem população não gera link quebrado no frontend.
- [ ] Texto, botão, card, carrossel e banner permitem abrir/baixar o arquivo correto; teclado, foco, target e nome acessível funcionam.
- [ ] Banner desabilitado não exige PDF nem cria link; banner Documento usa título do arquivo no nome acessível.
- [ ] Alterar título/pasta ou a URL de entrega da Media não exige copiar um novo endereço para o bloco.
- [ ] Pages antigas e suas versões sobrevivem à migration; rascunho, preview, publicação e conteúdo novo persistem no adapter do pai.
- [ ] Media permanece com a política de leitura atual; pastas não criam isolamento de acesso.
- [ ] Download em storage externo foi observado no navegador sem prometer comportamento uniforme de `download`.

Encerrar o port com registro de arquivos, decisões locais, migration efetivamente aplicada, resultados dos comandos, teste manual e pendências. Este roteiro não declara o port concluído por apenas copiar o código.

## 6. Registro desta documentação

Foi criada uma pasta dedicada e organizado o registro existente. Nenhum arquivo de aplicação ou dado foi alterado para preparar este pacote, e o repositório pai não foi acessado/modificado. Validações executadas: verificador via `python3` aprovou os oito documentos novos/ajustados, com 30 links relativos existentes, newline final, ausência de espaços finais e cercas de código balanceadas; `git diff --check` passou. Lint, build e testes da aplicação não foram repetidos porque esta entrega é exclusivamente documental.
