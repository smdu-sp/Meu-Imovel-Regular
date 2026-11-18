# Auditoria dos links para o domínio legado

Inventário em 18/11/2026 das composições geradas pelas dez importações. Fonte: dump validado e os builders em `src/imports/wordpress/pages/`. A inspeção percorre URLs em ações, banners, cards e campos Lexical; não executa requisições HTTP ao site antigo.

## Correspondências locais

| Slug WordPress | Rota no Next.js |
| --- | --- |
| `home` | `/` |
| `entenda` | `/entenda` |
| `beneficios-de-regularizar-o-imovel` | `/beneficios-de-regularizar-o-imovel` |
| `situacao` | `/situacao` |
| `faq` | `/faq` |
| `cartilha` | `/cartilha` |
| `regularizacao-automatica` | `/regularizacao-automatica` |
| `regularizacao-declaratoria-simplificada` | `/regularizacao-declaratoria-simplificada` |
| `regularizacao-declaratoria` | `/regularizacao-declaratoria` |
| `regularizacao-comum` | `/regularizacao-comum` |

As ações usam relações com Pages quando a página correspondente existe e está ativa. Os textos ricos usam URLs relativas locais. Query e fragmento são preservados nos textos; o componente de ação continua respeitando a publicação/ativação dos destinos. Nenhuma página é publicada pela importação.

## Inventário por composição

| Página / comando | Links de página convertidos | Referências a arquivos legados no preview offline | Páginas sem correspondência |
| --- | --- | --- | --- |
| `home` | 7 | 0 | 0 |
| `cartilha` | 0 | 0 | 0 |
| `situacao` | 0 | 0 | 0 |
| `beneficios` | 0 | 0 | 0 |
| `regularizacao-automatica` | 3 | 0 | 0 |
| `regularizacao-declaratoria-simplificada` | 0 | 0 | 0 |
| `regularizacao-declaratoria` | 0 | 0 | 0 |
| `regularizacao-comum` | 0 | 0 | 0 |
| `entenda` | 4 | 0 | 0 |
| `faq` | 5 | 6 | 0 |

A contagem é por ocorrência no layout original gerado, antes da conversão e sem presumir páginas já resolvidas pelo builder. A FAQ possui seis referências de arquivo nas respostas 19 e 23: três manuais repetidos. Na aplicação são resolvidas para URLs reais da Media (1196/1188/1187), usando a versão de 2023 do requerimento que já está na Home. Os previews offline mantêm essas URLs de arquivo até resolver a Media do destino.

## Destinos identificados

| Origem | Endereço legado | Destino |
| --- | --- | --- |
| `home` | https://meuimovelregular.prefeitura.sp.gov.br/regularizacao-automatica/ | `/regularizacao-automatica` |
| `home` | https://meuimovelregular.prefeitura.sp.gov.br/regularizacao-declaratoria-simplificada/ | `/regularizacao-declaratoria-simplificada` |
| `home` | https://meuimovelregular.prefeitura.sp.gov.br/regularizacao-declaratoria/ | `/regularizacao-declaratoria` |
| `home` | https://meuimovelregular.prefeitura.sp.gov.br/regularizacao-comum/ | `/regularizacao-comum` |
| `home` | https://meuimovelregular.prefeitura.sp.gov.br/beneficios-de-regularizar-o-imovel/ | `/beneficios-de-regularizar-o-imovel` |
| `home` | https://meuimovelregular.prefeitura.sp.gov.br/faq/ | `/faq` |
| `home` | https://meuimovelregular.prefeitura.sp.gov.br/situacao/ | `/situacao` |
| `regularizacao-automatica` | https://meuimovelregular.prefeitura.sp.gov.br/situacao/ | `/situacao` |
| `regularizacao-automatica` | https://meuimovelregular.prefeitura.sp.gov.br/regularizacao-declaratoria/ | `/regularizacao-declaratoria` |
| `regularizacao-automatica` | https://meuimovelregular.prefeitura.sp.gov.br/regularizacao-comum/ | `/regularizacao-comum` |
| `entenda` | https://meuimovelregular.prefeitura.sp.gov.br/regularizacao-automatica/ | `/regularizacao-automatica` |
| `entenda` | https://meuimovelregular.prefeitura.sp.gov.br/regularizacao-declaratoria-simplificada/ | `/regularizacao-declaratoria-simplificada` |
| `entenda` | https://meuimovelregular.prefeitura.sp.gov.br/regularizacao-declaratoria/ | `/regularizacao-declaratoria` |
| `entenda` | https://meuimovelregular.prefeitura.sp.gov.br/regularizacao-comum/ | `/regularizacao-comum` |
| `faq` | https://meuimovelregular.prefeitura.sp.gov.br/regularizacao-automatica/ | `/regularizacao-automatica` |
| `faq` | https://meuimovelregular.prefeitura.sp.gov.br/regularizacao-declaratoria-simplificada/ | `/regularizacao-declaratoria-simplificada` |
| `faq` | https://meuimovelregular.prefeitura.sp.gov.br/regularizacao-declaratoria/ | `/regularizacao-declaratoria` |
| `faq` | https://meuimovelregular.prefeitura.sp.gov.br/regularizacao-comum/ | `/regularizacao-comum` |

## Correções e limites

Na Comum, o link administrativo da Lei 17.202 passou ao endereço municipal da legislação e a âncora Decreto 59.164 deixou de apontar para a Lei. Esses ajustes ocorrem antes da auditoria; não são substituições genéricas de `/wp-admin/`.

Manuais nas grades e PDF da Cartilha usam relações Documento. Não se converte `/wp-content/uploads/` em rota de página nem se fabrica uma URL para arquivo ausente. Domínios de legislação, Prefeitura, Portal de Licenciamento, CEDI e SP156 permanecem externos.

O lote faz uma segunda passada após criar as dez páginas, resolvendo relações futuras. URLs externas antigas são explicitamente limpas dos grupos de ações ao mudar para relação, pois o Payload mescla grupos nas atualizações. O relatório `linkAudit` registra conversões e pendências por página/passada. O sumário fica no diretório local de relatórios do lote.

A validação de banco descartável é descrita no [guia do lote](../relatorio-specs/importacao-completa.md). Revisão editorial, teste manual de navegação/publicação e disponibilidade de serviços externos continuam pendentes. As mudanças de importador só chegam ao banco da instância quando o comando de aplicação é executado, sujeito às proteções de conflito.
