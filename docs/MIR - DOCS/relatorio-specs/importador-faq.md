# Operação do importador de FAQ — MIR-005

Implementado em 18/11/2026. Converte o post WordPress 174, slug `faq`, meta `dslc_code` 4161, em seis blocos existentes: capa, introdução, dois acordeões (15 + 14 perguntas), imagem ilustrativa e cards dos quatro canais de atendimento.

## Comandos

Execute na raiz do projeto:

```bash
npm run import:wordpress -- faq --dry-run
npm run import:wordpress -- faq --dry-run --report .local/wordpress-import/faq-preview.json
npm run import:wordpress -- faq --apply --actor-id 1 --target-label mir-local
```

Substitua `1` pelo ID de um Admin existente. A conexão usa `DATABASE_URI`, e `mir-local` é o rótulo do ambiente. O banco e o schema devem estar preparados. A aplicação salva como rascunho, preservando auditoria com ator. Ambiente, estado, reexecução e recuperação seguem o [guia da Home](./importador-home.md).

## Fonte e extração

Dump: `old-wordpress/db/meuimovelregular.sql`, snapshot SHA-256 `ea309012c96c456c8c0568959a1f1bce5ae5d077239e9605bc9bdd333986264b`. A composição tem seis seções; as duas últimas são vazias e descartadas após conferência.

O parser extrai `accordion_nav` e `accordion_content` do único `DSLC_Accordion` em `$[1]`, separa pelo marcador `(dslc_sep)` e exige exatamente 29 títulos e respostas correspondentes. Normaliza espaços e escapes, recusa perguntas vazias ou acima de 140 caracteres, respostas sem parágrafos úteis e protocolos de link inesperados. Os itens mantêm a ordem original em dois blocos de 15 e 14, respeitando `maxRows: 20`.

As respostas são convertidas em parágrafos Lexical e links personalizados. A conversão compartilhada não transporta estilos e destaques tipográficos do HTML; os textos e destinos são preservados, com os ajustes explícitos abaixo. Links de modalidades e outros documentos externos permanecem externos. Os três manuais das respostas 19 e 23 usam as URLs reais da Media após a aplicação, conforme o registro abaixo. Esta carga não baixa arquivos da internet nem reconcilia relações Lexical com outras páginas.

## Assets e canais

Todos os arquivos são verificados por caminho de anexo, hash, tamanho e assinatura. Imagens novas ficam em `MIR/FAQ/Imagens`; reexecuções reutilizam os anexos gerenciados pelo manifesto. Identidade da página: `page:174`.

| Anexo | Arquivo em uploads | Uso |
| --- | --- | --- |
| 731 | `2019/10/capa_dúvidas_1920px_70dpi-e1572617398633.jpg` | Capa, `$[0]` módulo 0 |
| 1096 | `2020/01/Proposta__Página-Dúvidas-Frequentes-01.png` | Ilustração antes dos canais, `$[2]` módulo 0 |
| 733 | `2019/10/bt-1.png` | Sala Arthur Saboya, `$[2]` módulo 2 |
| 800 | `2020/01/faq-suporte-tecnico.png` | Suporte Técnico do Portal, `$[2]` módulo 4 |
| 732 | `2019/10/bt_arthur-saboya-1.png` | Pedidos em andamento, `$[2]` módulo 6 |
| 734 | `2019/10/bt_SP156-1.png` | Central SP156, `$[3]` módulo 0 |

Os textos e links dos canais vêm dos módulos de texto seguintes a cada imagem (3, 5 e 7 de `$[2]`, e 1 de `$[3]`). Títulos e descrições são conferidos contra os limites de 80 e 300 caracteres dos cards.

## Decisões e desvios

- Saneamento institucional aplicado a todas as perguntas e respostas, incluindo as perguntas 1, 14 e 17, a resposta 13 e o parágrafo didático da resposta 1. A explicação de que a Prefeitura não está perdoando irregularidades foi mantida sem repetir a denominação vedada. A sugestão da spec de preservar essa denominação na explicação conflita com o guardrail e não foi seguida.
- Link corrompido da Lei nº 15.889/2013 reconstruído a partir do endereço legível na fonte, sem pesquisa ou validação de vigência externa.
- Dois canais usam `mailto:` no legado, incompatível com o campo de ação HTTP/HTTPS existente. Os e-mails ficam visíveis nas descrições, sem ação nesses cards; a resposta 21 mantém seu link Lexical de e-mail. Não foi alterado o schema para acomodar esse caso.
- Um `imageBlock` adicional apresenta a ilustração 1096, prevista nos seis assets mas sem posição no quadro de layout da spec. Não há componente novo.
- Introdução ganhou orientação sobre os limites do portal. Prazos históricos, valores, regras, contatos e links do backup ficam em rascunho com pendências editoriais explícitas. Não representam validação jurídica ou de vigência.
- Nenhuma mudança de schema, migration, Globals, busca, chat ou sistema de tickets. Atomicidade e rollback são por operação com checkpoints, conforme o importador compartilhado.

## Validação

A simulação com os arquivos reais conferiu seis imagens, seis blocos e 29 pares. Os testes verificam ordem, partição, limites, links legais/manuais, saneamento, e-mails e execução offline, além de rejeitar contagens divergentes, perguntas longas, respostas vazias e URLs inválidas.

Pendente: conferência no Admin/preview desktop e mobile, navegação por teclado nos acordeões, créditos, alternativas de imagem, funcionamento de contatos/links e revisão institucional integral antes de publicar. O prazo de 30 de agosto de 2026 e valores do backup exigem atenção editorial. O banco da instância não recebeu carga durante a implementação.


Comandos de validação executados:

- `npm run typecheck` e `npx eslint src/imports`: passaram.
- `DISABLE_PAYLOAD_HMR=true npm test`: 110 passaram, zero falhas e um teste opcional ignorado.
- Integração PostgreSQL 17 descartável: passou com as cinco páginas, 32 mídias e 12 pastas. Conferidos rascunho, itens 15/14, imagens dos canais, reexecução sem novas gravações, colisão de slug sem manifesto e proteção após edição manual.
- `git diff --check` e links locais do guia/README: conferidos.

Testes com subprocessos e banco foram executados fora do sandbox. O container descartável foi removido ao encerrar a validação. Não foi necessário alterar a implementação compartilhada de persistência.


## Correção dos links de manuais nas respostas 19 e 23

O plano agora valida nove arquivos: seis imagens e três PDFs. Os links repetidos de Inicial, Aceite e Pagamento são trocados pelas URLs retornadas pela Local API da Media, sem presumir nomes físicos, prefixo de rota ou domínio. O texto e os outros links das respostas são preservados.

| Link legado | Anexo reutilizado | Documento local |
| --- | --- | --- |
| Inicial, junho/2021 | 1196 | `2023/04/MANUAL-01-COMO-PREENCHER-O-REQUERIMENTO-v032023.pdf` |
| Aceite | 1188 | `2021/06/MANUAL-COMO-REALIZAR-OS-ACEITES-Jun2021.pdf` |
| Pagamento | 1187 | `2021/06/MANUAL-COMO-EMITIR-DTCO-E-GUIA-DE-PAGAMENTO-Jun2021.pdf` |

O manual Inicial de 2021 não está disponível no acervo; a associação editorial usa a versão de 2023 já adotada pela Home. Os PDFs são conferidos por origem, hash, tamanho e assinatura. Se já registrados no mesmo manifesto, seus IDs, pastas e metadados são reutilizados. Se FAQ for a primeira carga, os três PDFs serão cadastrados em `MIR/FAQ/Manuais`, permitindo reuso posterior pela Home.

Os links continuam como links personalizados Lexical, apontando para os arquivos da mídia local; não são relationships selecionáveis no editor. Não houve alteração do schema do rich text. O dry-run continua offline: informa os PDFs no plano, mas mantém os URLs legados no preview até a aplicação resolver as URLs do destino.

O helper compartilhado aceita montagem assíncrona e uma assinatura de origem específica. A FAQ inclui URLs nessa assinatura para que uma carga anterior com links antigos seja atualizada, mesmo que o restante do texto não mude. Os demais importadores preservam a assinatura anterior; o formato do manifesto não mudou.

Para atualizar uma FAQ já importada e intacta, execute novamente:

```bash
npm run import:wordpress -- faq --apply --actor-id 1 --target-label mir-local
```

A página será atualizada no mesmo ID, mantendo rascunho e IDs dos blocos. Se foi editada ou publicada desde a carga, as proteções existentes interrompem a execução. Nesse caso, os links podem ser ajustados pelo editor usando as URLs dos PDFs em mídia; não remova o manifesto para forçar a atualização. O banco da instância não foi alterado durante esta correção.


Validação desta correção: `npm run typecheck`, `npx eslint src/imports`, simulação real com nove arquivos e `DISABLE_PAYLOAD_HMR=true npm test` (111 passaram, um ignorado). A integração PostgreSQL descartável passou: criou uma FAQ no formato anterior, atualizou o mesmo documento com as seis ocorrências de links locais, reutilizou os três IDs da Home sem mudar seus metadados nem aumentar a contagem de 32 mídias, e confirmou reexecução sem escrita e conflitos editoriais. A pasta adicional de manuais elevou o total das cinco páginas para 13 pastas. `git diff --check` passou. O container temporário foi removido ao encerrar a validação.
