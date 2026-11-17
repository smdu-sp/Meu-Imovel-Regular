---
spec: MIR-001
title: Importador editorial da Home WordPress
status: implemented
date: 2026-11-17
---

# MIR-001 — Importador editorial da Home

## 1. Resultado esperado

Fornecer um comando semelhante aos seeds, com tradução explícita da Home para os blocos atuais do Payload. O comando deve simular a carga, importar os arquivos selecionados em pastas e criar uma Home em rascunho, com rastreabilidade e reexecução sem duplicação ou sobrescrita de edições manuais.

O contrato abaixo orientou a implementação. O código está disponível; a carga na instância MIR e a validação manual continuam pendentes. Veja [operação e registro de implementação](../importador-home.md) para comandos, resultados e limitações. O registro final desta spec preserva o histórico da entrega inicial de planejamento.

## 2. Referências e precedência

- [Mapa de composição da Home](../mapas/mapa-composicao-home.md): IDs, caminhos físicos, referências de origem e ordem das seções.
- [Extração editorial da Home](../mapas/home-extracao-e-mapa-payload.md): textos e correspondência entre HTML e JSON.
- [Especificação de mídia e PDF](../../CMS%20-%20DOCS/media-library-pdf/especificacao.md), [implementação MIR](../../CMS%20-%20DOCS/media-library-pdf/implementacao-mir.md) e [migração/validação](../../CMS%20-%20DOCS/media-library-pdf/migracao-validacao.md).
- [Media](../../../src/collections/Media.ts), [DocumentList](../../../src/blocks/DocumentList/config.ts), [Pages](../../../src/collections/Pages.ts), [links](../../../src/fields/link.ts), [configuração Payload](../../../src/payload.config.ts) e [hooks de auditoria](../../../src/lib/audit/page-audit.ts).

Esta spec fecha as alternativas do piloto: usar `src/imports/wordpress/`, não `src/migrations/` ou `scripts/import-wordpress/`; usar `iconGrid` na variante `compact` para os manuais, com ações Documento PDF; esta adaptação substitui a opção inicial `documentList`. Os mapas permanecem registros do levantamento. Em divergências com o schema vigente, revisar o contrato e registrar o desvio antes de escrever dados.

O MIR usa PostgreSQL. Os documentos de mídia registram pendência de baseline/migration e de validação manual; a existência do código não comprova que um banco específico esteja pronto. O importador não deve resolver isso executando migrations ou sincronização automática de schema.

## 3. Escopo

- Um runner e uma tradução específica da página WordPress ID `87`, slug `home`, para `pages`.
- Nove imagens I01–I09 e oito PDFs D01–D08 do mapa, totalizando 17 arquivos de origem; reutilização de mídia já vinculada ao manifesto pode reduzir as criações.
- Organização lógica em `MIR/Home/Imagens` e `MIR/Home/Manuais`, usando `payload-folders` e o campo `Media.folder` existentes.
- Extração restrita ao conteúdo necessário, dados editoriais revisáveis, simulação offline, aplicação explícita, relatório e manifesto local persistente.
- Compatibilidade com futuras traduções por página, sem implementar páginas adicionais nem criar um framework genérico de conversão.

Fora do escopo: publicação, despublicação de conteúdo existente, Header/Footer/SiteSettings/Themes/Users, importação dos logos I10–I12, alterações de schema, novos blocos, CEDI, cálculos, regras de elegibilidade, redirecionamentos, implementação de outras páginas ou port ao CMS pai. O script não chama o seed editorial nem cria páginas fictícias para satisfazer relações.

## 4. Estrutura proposta

```text
src/imports/wordpress/
  run.ts                       # argumentos, modos, execução e encerramento
  shared/
    source.ts                  # leitura restrita do snapshot legado
    import-media.ts            # resolução, assinatura/hash e upload/reuso
    ensure-folder.ts           # busca por nome + pai + coleção permitida
    migration-manifest.ts      # identidade do destino, journal e checkpoints
    upsert-page.ts             # rascunho, identificação e conflitos
  pages/
    home.ts                    # monta o plano e layout; sem I/O direto
    home-content.ts            # conteúdo/mapeamentos revisáveis e proveniência
  *.test.ts                    # testes apropriados ao contrato
```

Nomes de helpers são uma proposta; reduzir arquivos se isso simplificar a implementação sem misturar responsabilidades. `pages/home.ts` recebe dados de origem e IDs resolvidos; não lê credenciais nem cria conexão. Integração de escrita fica nos helpers, sem regras em componentes React.

O conteúdo institucional pertence ao arquivo editorial revisável e ao CMS, nunca a componentes visuais. Manter a rastreabilidade para ID legado, seção JSON e arquivo de origem. Não duplicar dumps, metadados de usuários, opções arbitrárias ou segredos no repositório.

## 5. Entrada e extração

Fonte padrão: `old-wordpress/db/meuimovelregular.sql` e uploads em `old-wordpress/meuimovelregular/wp-content/uploads/`. Permitir caminhos explícitos para outra cópia. Não carregar `wp-config.php`, executar PHP, importar SQL ou consultar o WordPress remoto.

Identificar o snapshot por SHA-256. O snapshot conferido no levantamento tem hash `ea309012c96c456c8c0568959a1f1bce5ae5d077239e9605bc9bdd333986264b`. Uma divergência deve ser informada e interromper a aplicação deste mapeamento até nova validação explícita da fonte, sem atualização automática da referência.

A extração deve entender o formato real `REPLACE INTO`, colunas explícitas, aspas e escapes; não usar `eval`, substituições cegas ou regex isolada para dividir os valores SQL. Ler somente registros necessários de posts, postmeta e referências editoriais. IDs legados permanecem strings. Erro de parsing, registro ausente, chave duplicada ambígua ou JSON inválido interrompe o plano com mensagem localizável, sem despejar conteúdo sensível.

É aceitável produzir uma extração intermediária normalizada e mínima, contendo somente a Home e seus assets, desde que tenha comando reproduzível, hash da fonte e verificação antes da aplicação. Ela não deve depender dos arquivos temporários de análises anteriores em `/tmp`.

Resolver caminhos sob o diretório de uploads por caminho real, inclusive symlinks, rejeitando escapes da raiz. Calcular hash SHA-256 dos 17 arquivos e verificar formato real antes de qualquer upload. Preservar o acervo de origem; não renomear, mover ou apagar seus arquivos.

## 6. Contrato dos comandos

Na implementação, adicionar ao `package.json` um script `import:wordpress` que execute o runner TypeScript com o carregamento de ambiente definido para o projeto. Não reaproveitar o wrapper de seed que fixa `NODE_ENV=development` sem avaliar os efeitos. Documentar a precedência de `.env` e `.env.development.local` e evitar que a inicialização do Payload ocorra antes do carregamento correto.

Comandos pretendidos, executados da raiz do repositório:

```bash
npm run import:wordpress -- home --dry-run
npm run import:wordpress -- home --apply --actor-id 1 --target-label mir-local
```

O ID `1` é apenas ilustrativo; usar um Admin real do destino. Sem `--apply`, o runner sempre simula. Rejeitar modos incompatíveis, páginas desconhecidas e argumentos não reconhecidos. Caminhos opcionais: `--source`, `--uploads`, `--state-dir` e `--report`.

### Simulação

`--dry-run` é offline: não inicializa Payload, não conecta ao banco, não cria pastas nem arquivos de upload. Pode produzir relatório local no caminho indicado, sem alterar o manifesto de aplicação. Isso evita escrita indireta por sincronização automática ao abrir o adapter em desenvolvimento.

Exibir página, blocos, pastas previstas, 17 assets com hashes, origem dos textos e links, revisões editoriais e pendências. IDs de destino são referências simbólicas. Reuso e conflitos no banco aparecem como **não verificados**; não prometer uma simulação fiel do estado de um destino que não foi consultado.

### Aplicação

`--apply` usa a `DATABASE_URI` explícita, nunca o fallback da configuração. Exigir manifesto associado a esse destino e um `target-label`; a identidade técnica deve incluir banco/schema/servidor de forma não secreta ou como fingerprint. O rótulo sozinho não identifica o banco. Não imprimir a URI com credenciais nem armazená-la no manifesto.

Antes de gravar: verificar schema necessário, pasta/Media/iconGrid com ações Documento PDF disponíveis, fonte e arquivos, identidade do Admin, estado das páginas relacionadas e conflitos de identidade/conteúdo. O runtime do importador deve desabilitar schema push e não executar migrations; se o adapter não puder ser inicializado sem esse efeito, interromper e corrigir o bootstrap antes de aplicar.

Banco persistente deve ter backup e restauração validados conforme o processo do ambiente. Isso é preparação operacional, não uma confirmação interativa a cada asset. Falha de preflight não deixa uploads nem registros criados. Encerrar conexões mesmo em erro; retornar código de saída não zero para erro/conflito.

## 7. Tradução da Home

Criar `title=Home`, `slug=home`, `_status=draft`, `lifecycleStatus=active`. A importação não contém opção `--publish`.

| Ordem | Origem no JSON de `dslc_code` | Destino neste piloto |
| --- | --- | --- |
| 1 | `$[0]`, primeira imagem, I01 | `fullWidthImageBanner`, `desktopImage`, altura automática, overlay desligado e sem recorte intencional da marca. |
| 2 | `$[0]`, segunda imagem, I02 | `fullWidthImageBanner` com link externo do módulo, nova aba, altura automática e alternativa textual significativa. Preserva a ação do botão gráfico sem novo schema. |
| 3 | `$[1]`, D01–D08 | `iconGrid`, variante `compact`, título da seção e oito itens na ordem do mapa; ícone padrão `document`, `description` com nome do manual e `link={type:document, document:Media.id, label:Baixar PDF}`. |
| 4 | `$[2]` | `richText` Lexical, com parágrafos e link da lei; conteúdo editorial revisável. |
| 5 | `$[3]`, I03 | `imageText`, imagem à direita, modalidade Automática e CTA. |
| 6 | `$[4]`, I04 | `imageText`, imagem à esquerda, modalidade Declaratória Simplificada e CTA. |
| 7 | `$[6]`, I05 | `imageText`, imagem à direita, modalidade Declaratória e CTA. |
| 8 | `$[7]`, I06 | `imageText`, imagem à esquerda, modalidade Comum e CTA. |
| 9 | `$[10]`, I07–I09 | `cards` com três itens, imagens, títulos e links de Benefícios, FAQ e Situação. |

As seções vazias e o separador não viram blocos. Não transplantar HTML/CSS do builder: gerar JSON Lexical válido e usar as variantes existentes. Não preencher prazo institucional nem SEO oficial por suposição. Não alterar Globals para completar a visualização do piloto.

O conteúdo a gravar deve respeitar a terminologia institucional do projeto mesmo em rascunho. No arquivo editorial, remover a expressão vedada da introdução, corrigir o erro de digitação documentado e registrar cada ajuste em relação à transcrição. Não reescrever parâmetros legais ou declarar vigência. Pendências de revisão jurídica/editorial vão no relatório externo, nunca misturadas ao texto público da página. Não publicar até sua resolução.

Os limites dos campos devem ser validados na simulação; nunca truncar texto silenciosamente. Não inventar descrições factuais de imagens sem referência; usar textos alternativos revisáveis baseados na inspeção dos arquivos. A capa com texto incorporado e o botão devem ter sua apresentação mobile e acessibilidade verificadas no preview.

### Links para páginas ainda não migradas

Para os sete destinos internos previstos (quatro modalidades, Benefícios, FAQ e Situação), usar relação `pages` somente quando o destino estiver identificado de maneira inequívoca e publicado/ativo, pois o resolver atual omite links para rascunhos/inativos. Não encontrar página apenas por título.

Enquanto o destino não estiver disponível, preservar explicitamente o endereço absoluto do portal legado como link externo temporário, com origem e pendência no relatório. Não criar páginas-placeholder, relations inexistentes ou links locais quebrados. Essa política permite revisar a Home isoladamente; não comprova disponibilidade do portal legado. A troca futura para relações é uma atualização editorial rastreada, sujeita à mesma detecção de conflito.

## 8. Mídias e pastas

- I01–I09: pasta `MIR/Home/Imagens`, `title` explícito, `alt` revisável e `usage=content` no piloto. Reavaliar o papel apenas se a imagem passar a ser fundo; não deduzir `usage` da extensão.
- D01–D08: pasta `MIR/Home/Manuais`, `title` explícito, MIME PDF e `usage=document`; `alt` não é obrigatório. Preservar a validação de assinatura do hook de Media.
- Não importar I10–I12: pertencem a Globals e não integram este recorte. Não criar pasta compartilhada vazia neste piloto.
- Criar/reusar pastas por nome e pai, com Media entre as coleções permitidas. Se houver candidatos duplicados ou incompatíveis, reportar conflito; não escolher arbitrariamente. Tags são opcionais e não controlam acesso.
- Mover mídia existente não muda URL ou arquivo; não reproduzir a hierarquia de uploads como storage de destino. Não transformar nome de pasta em caminho físico.
- Não usar nome, `alt` ou slug como identidade única de asset. Guardar ID legado, caminho e hash. Reuso entre páginas deve conservar uma única Media quando a identidade já estiver estabelecida.
- Se mídia já registrada no manifesto foi movida ou editada no Admin, respeitar isso e detectar o desvio; não recolocá-la automaticamente na pasta original.
- Media é pública, mesmo ligada a uma Page em rascunho. Apenas os 17 assets deste recorte público são elegíveis; arquivo privado ou sem classificação não entra na carga.

PDFs devem ser relacionados por ID em `iconGrid.items[].link.document`, sem copiar suas URLs para o layout. O título de cada manual fica em `description`; a ação usa “Baixar PDF” e o atributo de download já disponível nos links. A grade não exibe tamanho automaticamente e não incorpora visualizador.

## 9. Manifesto, identidade e conflitos

Estado operacional padrão em `.local/wordpress-import/`, fora do versionamento. O patch futuro deve adicionar somente esse caminho ao `.gitignore`. Usar um manifesto por destino, compartilhado entre importações de páginas, e um relatório por execução. Não criar collection de controle.

Persistir versão do contrato/conversor, fingerprint do destino, snapshot/hash, execução e operações; mapa de pastas; IDs legados e hashes de assets → IDs Media; página WordPress 87 → ID Pages; última projeção/hash importada; pendências e falhas. Não guardar credenciais, conteúdo de contas ou o dump bruto.

Regras mínimas:

1. Manifesto novo + `slug=home` já existente: conflito. Não adotar ou sobrescrever uma página do seed pelo slug. Reportar ID/estado; a resolução de adoção fica fora do comando automático do piloto.
2. Página identificada no manifesto: ler o rascunho mais recente e estado publicado, não apenas a versão publicada. Se houve publicação, alteração manual ou mudança de slug/lifecycle desde a última carga, interromper antes de atualizar. Não despublicar a Home atual para criar o piloto.
3. Origem e destino iguais à última carga: nenhuma gravação, nova versão ou log de alteração desnecessário. Fonte alterada e destino intacto: planejar atualização do rascunho, após validar o snapshot e o mapeamento.
4. Comparar uma projeção canônica dos campos controlados, preservando IDs de blocos/itens quando reusados. Não usar somente `updatedAt` nem incluir campos transitórios/depth/URLs geradas no hash. Complementar o hash com verificação de estado e versão para detectar mudanças concorrentes.
5. Asset com hash alterado, arquivo sumido ou Media editada/substituída: conflito explícito. Não substituir arquivos silenciosamente. Mídia equivalente fora do manifesto exige vínculo explícito previamente revisado; não deduzir identidade só por filename.
6. Bloquear execuções simultâneas sobre o mesmo estado; gravar journal e manifesto atomicamente. Registrar intenção e resultado por operação para retomar após falha. Se houver interrupção entre criação no Payload e gravação do ID no manifesto, reconciliar por evidência inequívoca ou parar com operação indeterminada; nunca repetir a criação às cegas.
7. Revalidar o estado imediatamente antes da atualização e impedir escrita concorrente com mecanismo compatível com o adapter, comprovado em teste. Somente verificar no início do processo não basta para proteger uma edição feita durante a carga.

Não disponibilizar `--force`, exclusão automática ou adoção automática nesta spec. O objetivo é tornar o resultado revisável, inclusive quando houver conflito.

## 10. Escrita, falhas e auditoria

Usar a Local API do Payload e uploads por arquivo, nunca SQL nas tabelas internas. Propagar o Admin executor no request usado pelas operações para que os hooks registrem ator. Não desativar validações, versões, auditoria ou revalidação indiscriminadamente. Tratar revalidação fora de requisição Next.js conforme o mecanismo já suportado pelo projeto, registrando qualquer ajuste necessário antes de implementá-lo.

Executar em fases: preflight completo → pastas → mídias com checkpoints → resolução dos IDs → uma gravação consistente da Page em rascunho → relatório final. Page só é gravada quando todos os arquivos obrigatórios e links estiverem resolvidos segundo a política desta spec.

Uma falha após upload pode deixar Media pública e pastas já criadas; isso deve constar no journal e permitir reuso/retomada. Não prometer transação única envolvendo banco, filesystem e manifesto. Nunca apagar automaticamente mídia, pastas, versões ou conteúdo preexistente para simular rollback.

Retorno: registrar os IDs criados pela execução e usar backup/restauração ou limpeza separada e revisada, após verificar referências. A retomada com as mesmas entradas não duplica os registros já confirmados.

## 11. Arquivos previstos e impacto persistido

Na implementação futura, tocar `src/imports/wordpress/`, scripts de `package.json`, a regra operacional específica em `.gitignore` e documentação MIR. Novas dependências só com necessidade demonstrada. Tipos Payload não precisam ser regenerados se o schema não mudar.

| Área | Efeito esperado | Migration de schema |
| --- | --- | --- |
| Pages | Criar um rascunho, ou atualizar somente o rascunho gerenciado e intacto | Nenhuma nova mudança de schema. |
| Media | Criar/reusar nove imagens e oito PDFs com metadados | Requer que o upgrade de mídia já esteja aplicado no destino; não aplicá-lo pelo importador. |
| payload-folders | Criar/reusar a hierarquia editorial prevista | Mesmo requisito do upgrade existente. |
| Versions/AuditLogs | Efeitos normais de escrita pelos hooks existentes | Sem alteração de contrato. |
| Globals e demais páginas | Nenhuma escrita | Não se aplica. |

Se a implementação encontrar necessidade de novos campos, blocos ou mudanças de relacionamento, parar a ampliação de escopo e registrar uma spec/plano de migration antes do patch. Não alterar Media ou Pages para facilitar a identificação da importação.

## 12. Validação e critérios de aceite

Testes necessários, focados nos riscos do importador:

- Extração de `REPLACE INTO`, escapes, Unicode e IDs preservados; erro/ambiguidade não produz plano aplicável.
- Tradução com nove blocos, quatro modalidades em ordem e oito PDFs D01–D08; comparação do conteúdo selecionado com a origem e registro dos ajustes editoriais.
- Arquivo ausente, path traversal/symlink, PDF inválido e snapshot divergente falham antes de escrita.
- Simulação não inicializa Payload nem modifica banco, uploads ou manifesto; relatório distingue estado não consultado.
- Integração em PostgreSQL descartável com schema pronto: primeira carga, segunda carga sem escrita, retomada de falha parcial e conflito de Home preexistente.
- Manifesto de outro destino, edições manuais no rascunho/Media, publicação, alteração concorrente e operação indeterminada são recusados sem sobrescrita/duplicação.
- Relações de documentos, pastas e ator de auditoria corretos; nenhuma escrita em Globals ou páginas de destino.

Comandos da implementação: `npm run typecheck`, `npm test`, lint dos arquivos alterados e `npm run build`; tentar o lint global e registrar eventual falha causada pelo snapshot WordPress conforme os guias de mídia. Executar o apply de validação somente em banco descartável/de teste explicitamente identificado.

Aceite manual: abrir a Home pelo preview, conferir desktop/mobile, capa e botão sem corte de conteúdo, teclado/alternativas de imagem, nove imagens corretas, oito links PDF funcionais e ausência de publicação involuntária. Registrar que os links temporários ao legado ainda dependem de revisão e que Header/Footer exibidos são os Globals já configurados, não importados por este script.

- [ ] Runner e Home específicos, sem importação genérica de todo o WordPress.
- [ ] Simulação offline e aplicação explícita com destino/ator identificados.
- [ ] 17 arquivos resolvidos, mídias em pastas e PDFs pela grade de ícones compacta.
- [ ] Home em rascunho; Home existente/publicada protegida.
- [ ] Reexecução, recuperação e edição concorrente cobertas por testes.
- [ ] Schema e dados preexistentes preservados; nenhuma publicação ou alteração de Globals.
- [ ] Relatório com proveniência, IDs, reutilizações, ajustes editoriais e pendências.
- [ ] Validações automatizadas e manuais registradas, com limitações explícitas.

## 13. Registro desta entrega de especificação

Decisões: separar importação editorial de migrations do banco; tradução explícita por página; Media em pastas nativas; documentos em `iconGrid` compacto; piloto restrito ao corpo da Home; simulação offline; conflito por identidade/projeção; links legados temporários para destinos ainda indisponíveis.

Desvios em relação às propostas anteriores: usar dois banners de imagem no piloto para preservar o botão gráfico com link já suportado; não importar logos/pastas compartilhadas de Globals; usar `src/imports/wordpress/` em vez da sugestão histórica de `scripts/import-wordpress/`.

Nenhum script, comando npm, alteração de schema, migration ou importação foi implementado nesta entrega. Não foi consultado o banco. A inspeção usou `git status --short`, `rg --files`, `cat`, `sed` e leitura dos schemas/hooks/guias existentes. Validações executadas: verificador via `python3` aprovado para os dois documentos alterados, com 18 links relativos existentes, newline final, ausência de espaços finais e cercas de código balanceadas; `git diff --check -- 'docs/MIR - DOCS'` sem erros. Testes de aplicação/build não se aplicam à escrita desta spec.

Revisão da composição: por orientação do usuário, os oito manuais passaram à grade de ícones compacta já existente. O bloco `documentList` permanece registrado para compatibilidade com conteúdo persistido. Não há alteração de schema nesta adaptação; atualizar uma Home existente continua sujeito ao manifesto e à proteção de edições manuais.
