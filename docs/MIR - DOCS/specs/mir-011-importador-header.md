---
spec: MIR-011
title: Importador editorial do Cabeçalho (Header Global) WordPress
status: proposed
date: 2026-11-18
---

# MIR-011 — Importador editorial do Cabeçalho (Header Global)

## 1. Resultado esperado

Definir a especificação para importação editorial do cabeçalho institucional (Header), transpondo a composição do template de cabeçalho do WordPress legado (`post_id = 100`, `post_type = "dslc_hf"`) e a estrutura de menus cadastrada (`dslc_mainmenu`, termo de taxonomia 3) para o Global `header` do Payload CMS.

O importador deve simular a migração offline (`--dry-run`), cadastrar os logos oficiais em pasta lógica de mídia (`MIR/Compartilhado/Identidade`), resolver os relacionamentos internos de navegação com as páginas migradas, configurar o modo de navegação (`navigationMode = "normal"`), preservar a integridade contra sobrescrita manual de configurações existentes e garantir idempotência.

## 2. Referências e precedência

- [MIR-001 — Importador editorial da Home](./mir-001-importador-home.md): arquitetura do runner, manifesto de migração e ciclo de vida de assets.
- [Mapeamento da Home e Globals](../mapas/mapa-composicao-home.md): mapeamento de seções, fontes JSON do cabeçalho legado e itens de menu.
- [Auditoria de links internos](../mapas/auditoria-links-internos.md): resolução de slugs e IDs das páginas institucionais.
- [Global Header](../../../src/globals/Header.ts): schema, modos de navegação (`normal` e `submenus`), campos de logo, busca e vínculos com a collection `pages`.
- [Componente SiteHeader](../../../src/components/layout/SiteHeader.tsx) e [HeaderNavigation](../../../src/components/layout/HeaderNavigation.tsx).
- [Guardrails do Projeto](../../../AGENTS.md):
  - Separação de responsabilidades: o CMS gerencia o conteúdo institucional configurável.
  - Não codificar em componentes valores sujeitos a alteração.
  - Avaliar impacto em schemas persistidos: novas adições ou alterações estruturais exigem justificativa e plano de evolução.

## 3. Escopo

- Extração e tradução do template de cabeçalho registrado em `wp_posts.ID = 100` (`Header`), `wp_postmeta.meta_id = 4075` (`dslc_code`).
- Resolução dos 5 itens de menu oficiais do menu principal legado (`nav_menu`, term_taxonomy_id 3):
  1. Entenda a Lei (`slug = "entenda"`, `menu_order = 1`, `nav_menu_item = 182`);
  2. Benefícios (`slug = "beneficios-de-regularizar-o-imovel"`, `menu_order = 2`, `nav_menu_item = 295`);
  3. Estou regular? (`slug = "situacao"`, `menu_order = 3`, `nav_menu_item = 180`);
  4. Dúvidas frequentes (`slug = "faq"`, `menu_order = 4`, `nav_menu_item = 181`);
  5. Cartilha (`slug = "cartilha"`, `menu_order = 5`, `nav_menu_item = 1147`).
- Importação e validação de 2 marcas institucionais presentes no cabeçalho legado:
  - Marca MIR colorida (anexo 356: `2019/10/logo-cor.png`, 12.075 B, hash `e805771995b731fcbac5b4eae17e3d248e9168689ab269d786ba83d7d3b43ccb`);
  - Marca SMUL (anexo 1183: `2021/03/logo_smul_160.png`, 6.094 B, hash `30f297cf583582eb4b01de5a05157b489c9673df9712679b77bef74e9cfea869`).
- Associação do logo MIR ao campo `Header.logo` do Global.
- Pasta lógica de destino: `MIR/Compartilhado/Identidade`.
- Descarte de código HTML/CSS inline (faixa colorida com gradiente CSS inline `DSLC_Html`) em prol do tema institucional controlado.

Fora do escopo: alteração de layout visual do componente React `SiteHeader`, criação forçada de páginas não migradas para satisfazer relacionamentos, alteração do schema de `Header.ts` sem spec prévia, e injeção de CSS arbitrário no CMS.

## 4. Estrutura proposta

```text
src/imports/wordpress/
  globals/
    header.ts                  # planejamento, extração dos itens de menu e layout do Global
    header-content.ts          # rótulos institucionais de navegação e metadados
```

O runner central `src/imports/wordpress/run.ts` passará a aceitar o comando `header`, reutilizando os módulos de extração (`source.ts`), manifesto (`migration-manifest.ts`) e escrita segura via Local API (`payload-store.ts`).

## 5. Entrada e extração

- **Fonte**: `old-wordpress/db/meuimovelregular.sql` e diretório de uploads.
- **Snapshot SHA-256**: `ea309012c96c456c8c0568959a1f1bce5ae5d077239e9605bc9bdd333986264b`.
- **Registro do Cabeçalho**: `wp_posts.ID = 100`, `post_type = "dslc_hf"`, `post_title = "Header"`.
- **Composição**: `wp_postmeta.meta_id = 4075`, `post_id = 100`, `meta_key = "dslc_code"`.
  - Área 0 (tamanho 12): faixa de cores com gradiente CSS inline (`DSLC_Html`) — descartada.
  - Área 1 (tamanho 2): logo MIR (`DSLC_Image`, anexo 356) apontando para a raiz `/`.
  - Área 2 (tamanho 8): menu de navegação (`DSLC_Navigation`), associado ao menu principal do tema.
  - Área 3 (tamanho 2): logo SMUL (`DSLC_Image`, anexo 1183) com link externo para o portal da SMUL.
- **Menu de Navegação**:
  - Opção `theme_mods_lc-blank-master` (`option_id = 233`): mapeia `dslc_mainmenu` para o termo ID `3`.
  - Tabela `wp_term_relationships`: filtra registros com `term_taxonomy_id = 3`.
  - Registros `wp_posts`: seleciona os posts com IDs `180`, `181`, `182`, `295`, `1147`, ordenados por `menu_order`.
  - Metadado `_menu_item_object_id`: indica a página de destino de cada item (`172`, `210`, `176`, `174`, `1145`).

## 6. Contrato dos comandos

```bash
npm run import:wordpress -- header --dry-run
npm run import:wordpress -- header --apply --actor-id 1 --target-label mir-local
```

### Simulação (`--dry-run`)
Execução estritamente offline sem tocar no banco de dados. Verifica os arquivos físicos dos logos, calcula seus hashes, valida a existência e integridade dos itens de menu no dump SQL, confere a resolução simbólica dos relacionamentos com as páginas de destino e emite relatório estruturado.

### Aplicação (`--apply`)
1. Verifica preflight do banco e manifesto de migração.
2. Cria/reutiliza a pasta `MIR/Compartilhado/Identidade` em `payload-folders`.
3. Faz upload/reuso das mídias `logo-cor.png` e `logo_smul_160.png` com metadados editoriais revisados.
4. Resolve os relacionamentos com os IDs reais das `pages` cadastradas no Payload (com base nos slugs garantidos pelas specs MIR-001 a MIR-010). Se alguma página não estiver presente no destino, interrompe ou registra pendência conforme a política de integridade.
5. Executa `payload.updateGlobal({ slug: "header", data: ... })` preservando hooks de auditoria e revalidação de shell (`revalidateSiteShellGlobal`).
6. Persiste o checkpoint no manifesto `.local/wordpress-import/`.

## 7. Tradução do Cabeçalho para o Global Payload

| Elemento no Legado | Origem no Dump | Destino no Payload (`Header`) | Configuração / Mapeamento |
| --- | --- | --- | --- |
| Faixa colorida com gradiente | JSON 100, Área 0 (`DSLC_Html`) | — (Descartado) | Elemento de apresentação. O cabeçalho MIR adota o tema institucional e tokens semânticos via `Header.appearance.scheme = "default"`. |
| Marca principal do MIR | JSON 100, Área 1 (anexo 356) | `Header.logo` | `media.id` do anexo 356 (`logo-cor.png`), com alt revisado: "Meu Imóvel Regular — Prefeitura de São Paulo". |
| Modo de navegação | JSON 100, Área 2 (`DSLC_Navigation`) | `Header.navigationMode` | Valor `"normal"` (lista direta de links principais sem dropdown). |
| Campo de busca no topo | Não presente no legado | `Header.enableSearch` | `defaultValue = false`. Preservado desligado para paridade visual com o legado. |
| Item de Menu: Entenda a Lei | `nav_menu_item` 182 (`menu_order = 1`) | `Header.navigation[0]` | `label = "Entenda a Lei"`, `page = <Pages.id de slug "entenda">`. |
| Item de Menu: Benefícios | `nav_menu_item` 295 (`menu_order = 2`) | `Header.navigation[1]` | `label = "Benefícios"`, `page = <Pages.id de slug "beneficios-de-regularizar-o-imovel">`. |
| Item de Menu: Estou regular? | `nav_menu_item` 180 (`menu_order = 3`) | `Header.navigation[2]` | `label = "Estou regular?"`, `page = <Pages.id de slug "situacao">`. |
| Item de Menu: Dúvidas frequentes | `nav_menu_item` 181 (`menu_order = 4`) | `Header.navigation[3]` | `label = "Dúvidas frequentes"`, `page = <Pages.id de slug "faq">`. |
| Item de Menu: Cartilha | `nav_menu_item` 1147 (`menu_order = 5`) | `Header.navigation[4]` | `label = "Cartilha"`, `page = <Pages.id de slug "cartilha">`. |
| Marca SMUL à direita | JSON 100, Área 3 (anexo 1183) | `Media` (Biblioteca) | Mídia cadastrada em `MIR/Compartilhado/Identidade` com link documentado (`https://www.prefeitura.sp.gov.br/cidade/secretarias/licenciamento/`). O schema de `Header.ts` possui um único campo `logo`; o logo SMUL permanece disponível no acervo para consumo pelo Design System / Footer / Globals. |

### Política de Rótulos de Menu
Quando o post `nav_menu_item` possui `post_title` preenchido (casos dos IDs 180: "Estou regular?" e 295: "Benefícios"), o rótulo do menu deve respeitar esse texto explicitamente atribuído pelo editor. Quando `post_title` estiver vazio (casos dos IDs 182, 181 e 1147), adota-se o título oficial da página associada ("Entenda a Lei", "Dúvidas frequentes", "Cartilha"), replicando o comportamento nativo do WordPress.

### Política de Resolução de Páginas
Os itens de menu exigem relacionamento `page` com a coleção `pages`. O importador deve resolver os IDs das páginas com base no manifesto ou consulta por slug garantida:
- Se alguma das 5 páginas não existir no banco de destino: a carga é interrompida com aviso de pré-requisito não atendido. O Header pressupõe que as páginas institucionais base já foram migradas pelo importador ou lote.

## 8. Mídias e pastas

- **Pasta destino**: `MIR/Compartilhado/Identidade` (pai: pasta raiz `MIR`).
- Classificação: `usage = "content"`, MIME `image/png`.

| Ref | Anexo WP | Arquivo físico em uploads | Hash SHA-256 | Tamanho | Título editorial / Alt | Papel |
| --- | --- | --- | --- | --- | --- | --- |
| I10 | 356 | `2019/10/logo-cor.png` | `e805771995b731fcbac5b4eae17e3d248e9168689ab269d786ba83d7d3b43ccb` | 12.075 B | Logo Meu Imóvel Regular | `Header.logo` |
| I11 | 1183 | `2021/03/logo_smul_160.png` | `30f297cf583582eb4b01de5a05157b489c9673df9712679b77bef74e9cfea869` | 6.094 B | Logo SMUL Licenciamento | Acervo compartilhado |

## 9. Manifesto, identidade e conflitos

- O manifesto operacional em `.local/wordpress-import/` armazena a chave especial `global:header` associada ao fingerprint do destino.
- **Detecção de alteração manual**:
  - Antes de aplicar, o importador consulta o estado atual do Global `header`.
  - Se o Header já contiver logo cadastrado ou itens de navegação divergentes da carga padrão e não rastreados no manifesto, interrompe a execução com conflito para proteger edições de operadores do CMS.
  - Se a origem e o destino forem idênticos à última carga, nenhuma gravação desnecessária é realizada.

## 10. Escrita, falhas e auditoria

- Atualização realizada exclusivamente via Local API: `payload.updateGlobal({ slug: "header", data: ... })`.
- O contexto da chamada recebe o usuário administrador (`context.user = actor`), assegurando registro adequado em trilhas de auditoria.
- O hook nativo `revalidateSiteShellGlobal` é disparado automaticamente para revalidar o cache de layout do Next.js.
- Em caso de falha de upload ou validação de links, a alteração do Global é abortada antes da persistência.

## 11. Arquivos previstos e impacto persistido

| Arquivo / Coleção / Global | Impacto | Migração de schema necessária? |
| --- | --- | --- |
| `src/imports/wordpress/globals/header.ts` | Extração, resolução de menus e montagem do Global | Não |
| `src/imports/wordpress/globals/header-content.ts` | Metadados e rótulos revisados | Não |
| `src/imports/wordpress/run.ts` | Adição do comando `header` | Não |
| Global `header` | Atualização dos campos `logo`, `navigationMode` e `navigation` | Não |
| Coleção `media` | Upload dos logos 356 e 1183 em `MIR/Compartilhado/Identidade` | Não |
| `payload-folders` | Criação/reuso da pasta `MIR/Compartilhado/Identidade` | Não |

## 12. Validação e critérios de aceite

- [ ] Simulação offline (`--dry-run`) valida os arquivos físicos dos logos (anexos 356 e 1183), hashes SHA-256 e parsing dos 5 itens de menu no SQL sem acessar o banco de dados.
- [ ] Os 5 itens de menu são mapeados na ordem exata de `menu_order` (1 a 5), com rótulos corretos e relações resolvidas.
- [ ] O logo principal é atribuído ao campo `Header.logo` e devidamente renderizado pelo componente `SiteHeader`.
- [ ] Recusa explícita de aplicação caso o Global `header` tenha sido editado manualmente por um administrador.
- [ ] Reexecução idêntica não produz gravações ou revalidações redundantes.
- [ ] Testes de unidade cobrindo a extração dos menus e a resolução de relacionamentos com `pages`.

## 13. Registro desta especificação

- Decisões: uso do modo `navigationMode = "normal"` para acomodar perfeitamente os 5 links sem submenus; respeito aos rótulos customizados do menu legado ("Estou regular?" e "Benefícios"); isolamento de CSS arbitrário em prol do design system institucional; armazenamento dos logos institucionais em pasta compartilhada padronizada.
