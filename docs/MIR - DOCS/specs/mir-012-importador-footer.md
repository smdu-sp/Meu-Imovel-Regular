---
spec: MIR-012
title: Importador editorial do Rodapé (Footer Global) WordPress
status: proposed
date: 2026-11-18
---

# MIR-012 — Importador editorial do Rodapé (Footer Global)

## 1. Resultado esperado

Definir a especificação técnica para importação editorial do rodapé institucional (Footer), convertendo os dados estruturados do template de rodapé do WordPress legado (`post_id = 178`, `post_type = "dslc_hf"`, título `Rodape`) para o Global `footer` do Payload CMS.

O importador deve simular a migração offline (`--dry-run`), cadastrar o logo institucional da Prefeitura de São Paulo em `MIR/Compartilhado/Identidade`, preencher os dados oficiais de endereço, contatos (e-mail institucional e telefone 156), mapear os links de redes sociais com os ícones controlados do sistema (`x-social`, `facebook`, `instagram`), adicionar os links institucionais relevantes, proteger contra sobrescrita de alterações manuais de administradores e garantir execução idempotente.

## 2. Referências e precedência

- [MIR-001 — Importador editorial da Home](./mir-001-importador-home.md): arquitetura do runner e manifesto.
- [MIR-011 — Importador do Cabeçalho](./mir-011-importador-header.md): convenções para Globals e pastas compartilhadas de identidade.
- [Mapeamento da Home e Globals](../mapas/mapa-composicao-home.md): fontes JSON do rodapé legado (`$[0]`), contatos e redes sociais.
- [Global Footer](../../../src/globals/Footer.ts): schema, campos de contato, endereço, redes sociais (`socialLinks`), links institucionais (`institutionalLinks`) e aparência.
- [Componente SiteFooter](../../../src/components/layout/SiteFooter.tsx) e [Ícones de Redes Sociais](../../../src/domain/icons.ts).
- [Guardrails do Projeto](../../../AGENTS.md):
  - Separação entre dados editoriais configuráveis no CMS e componentes visuais.
  - Endereços, contatos e canais devem refletir informações institucionais oficiais válidas.

## 3. Escopo

- Extração e tradução do template de rodapé registrado em `wp_posts.ID = 178` (`Rodape`), `wp_postmeta.meta_id = 4067` (`dslc_code`).
- Importação da marca oficial da Prefeitura de São Paulo:
  - Anexo WP 179: `2019/10/PMSP_horizontal_mono_neg.png` (9.005 B, hash SHA-256 `8430e47853120b7bf869ddb5edf189a78f1a15391372b19d2b286086f1adfa9c`).
- Associação ao campo `Footer.logo`.
- Dados de endereço físico da Secretaria: "Secretaria Municipal de Urbanismo e Licenciamento\nRua São Bento, 405, Centro - CEP: 01011-100 São Paulo - SP".
- Canais de atendimento oficial:
  - `email`: `meuimovelregular@prefeitura.sp.gov.br`;
  - `phone`: `156`.
- Redes sociais institucionais mapeadas para o schema `socialLinks` com ícones oficiais:
  - Twitter / X: `https://twitter.com/urbanismopref` (ícone `x-social`);
  - Facebook: `https://www.facebook.com/secretariadelicenciamento/` (ícone `facebook`);
  - Instagram: `https://www.instagram.com/licenciamentosp/` (ícone `instagram`).
- Links institucionais complementares em `institutionalLinks` (Prefeitura de SP, SMUL, Portal de Licenciamento e SP156).
- Descarte de faixas decorativas em CSS inline (`DSLC_Html`) e separadores estruturais (`DSLC_Separator`) do Live Composer.

Fora do escopo: alteração de layout visual do componente React `SiteFooter`, gravação de CSS arbitrário nas configurações do banco ou alteração no schema de `Footer.ts`.

## 4. Estrutura proposta

```text
src/imports/wordpress/
  globals/
    footer.ts                  # extração, resolução de redes e montagem do Global
    footer-content.ts          # dados institucionais, links e textos saneados
```

O runner central `src/imports/wordpress/run.ts` passará a suportar o comando `footer`, com comportamento consistente aos importadores de páginas e do cabeçalho.

## 5. Entrada e extração

- **Fonte**: `old-wordpress/db/meuimovelregular.sql` e diretório de uploads.
- **Snapshot SHA-256**: `ea309012c96c456c8c0568959a1f1bce5ae5d077239e9605bc9bdd333986264b`.
- **Registro do Rodapé**: `wp_posts.ID = 178`, `post_type = "dslc_hf"`, `post_title = "Rodape"`.
- **Composição**: `wp_postmeta.meta_id = 4067`, `post_id = 178`, `meta_key = "dslc_code"`.
  - Área 0 (tamanho 12): faixa com gradiente CSS inline (`DSLC_Html`) — descartada.
  - Área 1 (tamanho 12): espaçador invisível (`DSLC_Separator`) — descartado.
  - Área 2 (tamanho 3): logo monocromático da Prefeitura (`DSLC_Image`, anexo 179).
  - Área 3 (tamanho 4): nome da Secretaria e endereço físico (`DSLC_Text_Simple`).
  - Área 4 (tamanho 3): contatos de e-mail e telefone (`DSLC_Text_Simple`).
  - Área 5 (tamanho 2): links sociais para Twitter, Facebook e Instagram (`DSLC_Social`).
  - Área 6 (tamanho 10): espaçador (`DSLC_Separator`) — descartado.

## 6. Contrato dos comandos

```bash
npm run import:wordpress -- footer --dry-run
npm run import:wordpress -- footer --apply --actor-id 1 --target-label mir-local
```

### Simulação (`--dry-run`)
Validação offline sem conexão com o banco de dados. Verifica a integridade do arquivo do logo PMSP (anexo 179), confere o hash SHA-256, extrai e formata os campos de endereço, contatos e redes sociais, e valida as URLs perante as regras de segurança HTTPS.

### Aplicação (`--apply`)
1. Executa preflight de banco e manifesto.
2. Faz upload do logo da Prefeitura em `MIR/Compartilhado/Identidade` com metadados institucionais.
3. Executa `payload.updateGlobal({ slug: "footer", data: ... })` atribuindo contatos, endereço, redes e links.
4. O hook `revalidateSiteShellGlobal` revalida o cache de layout do Next.js.
5. Grava o checkpoint `global:footer` no manifesto local `.local/wordpress-import/`.

## 7. Tradução do Rodapé para o Global Payload

| Elemento no Legado | Origem no Dump | Destino no Payload (`Footer`) | Configuração / Mapeamento |
| --- | --- | --- | --- |
| Faixa com gradiente e separadores | Áreas 0, 1 e 6 | — (Descartado) | Espaçamento e cores são controlados pelo Design System via tokens semânticos (`Footer.appearance.scheme = "muted"`). |
| Marca da Prefeitura de SP | Área 2 (`DSLC_Image`, anexo 179) | `Footer.logo` | `media.id` do anexo 179 (`PMSP_horizontal_mono_neg.png`), alt: "Prefeitura da Cidade de São Paulo". |
| Endereço da Secretaria | Área 3 (`DSLC_Text_Simple`) | `Footer.address` | Formatação em texto simples:<br>`Secretaria Municipal de Urbanismo e Licenciamento`<br>`Rua São Bento, 405, Centro - CEP: 01011-100 São Paulo - SP` |
| Atendimento presencial | Complementar (Sala Arthur Saboya) | `Footer.inPersonService` | "Atendimento presencial na Sala Arthur Saboya: R. São Bento, 405 - Seg a sex, das 13h às 16h30." |
| E-mail de suporte | Área 4 (`DSLC_Text_Simple`) | `Footer.email` | `meuimovelregular@prefeitura.sp.gov.br` |
| Telefone institucional | Área 4 (`DSLC_Text_Simple`) | `Footer.phone` | `156` |
| Perfil Twitter / X | Área 5 (`DSLC_Social.twitter`) | `Footer.socialLinks[0]` | `label = "X"`, `icon = "x-social"`, `url = "https://twitter.com/urbanismopref"` |
| Perfil Facebook | Área 5 (`DSLC_Social.facebook`) | `Footer.socialLinks[1]` | `label = "Facebook"`, `icon = "facebook"`, `url = "https://www.facebook.com/secretariadelicenciamento/"` |
| Perfil Instagram | Área 5 (`DSLC_Social.instagram`) | `Footer.socialLinks[2]` | `label = "Instagram"`, `icon = "instagram"`, `url = "https://www.instagram.com/licenciamentosp/"` |
| Links institucionais oficiais | Derivado de referências da SMUL | `Footer.institutionalLinks` | Seleção de links oficiais essenciais:<br>1. *Prefeitura de São Paulo*: `https://www.prefeitura.sp.gov.br`<br>2. *Secretaria Municipal de Urbanismo e Licenciamento*: `https://www.prefeitura.sp.gov.br/cidade/secretarias/licenciamento/`<br>3. *Portal de Licenciamento*: `https://portaldelicenciamento.prefeitura.sp.gov.br/`<br>4. *Central SP156*: `https://sp156.prefeitura.sp.gov.br/` |

### Saneamento e Validação de Links
- Todas as URLs de redes sociais e links institucionais devem ser HTTPS válidas, atendendo à validação de `validateOfficialHttpsUrl`.
- O ícone social do Twitter utiliza o token semântico `"x-social"` padronizado no catálogo de ícones (`src/domain/icons.ts`).

## 8. Mídias e pastas

- **Pasta destino**: `MIR/Compartilhado/Identidade`.
- Classificação: `usage = "content"`, MIME `image/png`.

| Ref | Anexo WP | Arquivo físico em uploads | Hash SHA-256 | Tamanho | Título editorial / Alt | Papel |
| --- | --- | --- | --- | --- | --- | --- |
| I12 | 179 | `2019/10/PMSP_horizontal_mono_neg.png` | `8430e47853120b7bf869ddb5edf189a78f1a15391372b19d2b286086f1adfa9c` | 9.005 B | Logo Prefeitura de São Paulo | `Footer.logo` |

## 9. Manifesto, identidade e conflitos

- O manifesto operacional em `.local/wordpress-import/` armazena a chave especial `global:footer`.
- **Proteção contra sobrescrita**:
  - Se o Global `footer` já tiver sido alterado manualmente por um administrador (ex.: novo telefone, endereço atualizado ou novas redes), a carga automática é bloqueada por conflito.
  - Reexecuções com estado idêntico não geram escritas nem revalidações supérfluas.

## 10. Escrita, falhas e auditoria

- Carga atômica via Local API: `payload.updateGlobal({ slug: "footer", data: ... })`.
- O usuário Admin executor é propagado no contexto da requisição (`context.user = actor`).
- Revalidação automática de layout via hook nativo `revalidateSiteShellGlobal`.

## 11. Arquivos previstos e impacto persistido

| Arquivo / Coleção / Global | Impacto | Migração de schema necessária? |
| --- | --- | --- |
| `src/imports/wordpress/globals/footer.ts` | Extração e montagem do Global Footer | Não |
| `src/imports/wordpress/globals/footer-content.ts` | Dados de contato e links institucionais | Não |
| `src/imports/wordpress/run.ts` | Adição do comando `footer` | Não |
| Global `footer` | Atualização dos campos de logo, contatos, redes e links | Não |
| Coleção `media` | Upload do logo 179 em `MIR/Compartilhado/Identidade` | Não |
| `payload-folders` | Compartilhamento da pasta `MIR/Compartilhado/Identidade` | Não |

## 12. Validação e critérios de aceite

- [ ] Simulação offline (`--dry-run`) valida o arquivo físico do logo PMSP (anexo 179), hash SHA-256 e extração dos textos de endereço e redes sociais sem acesso ao banco de dados.
- [ ] O logo PMSP é atribuído a `Footer.logo` e exibido com fidelidade pelo componente `SiteFooter`.
- [ ] Os campos de e-mail (`meuimovelregular@prefeitura.sp.gov.br`) e telefone (`156`) são configurados e geram links acessíveis (`mailto:` e `tel:`).
- [ ] As três redes sociais (Twitter/X, Facebook, Instagram) são cadastradas com os ícones correspondentes do catálogo (`x-social`, `facebook`, `instagram`).
- [ ] Reexecução idêntica é reconhecida como limpa e não executa gravações adicionais.
- [ ] Testes de unidade cobrindo a extração de contatos e validação de URLs do rodapé.

## 13. Registro desta especificação

- Decisões: mapeamento integral dos dados cívicos de contato e endereço; conversão dos ícones do builder para o sistema de ícones padronizado (`x-social`); inclusão de links institucionais seguros para a administração municipal; preservação do isolamento de apresentação gráfica em relação aos dados do CMS.
