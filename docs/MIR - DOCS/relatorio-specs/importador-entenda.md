# Operação do importador Entenda a Lei — MIR-002

Implementado em 17/11/2026. A página WordPress 172 (`entenda`), composição `dslc_code` meta 4160, é traduzida em oito blocos e cinco imagens. Sem mudanças de schema, novos componentes, publicação automática ou escrita em Globals.

## Comandos

```bash
npm run import:wordpress -- entenda --dry-run
npm run import:wordpress -- entenda --dry-run --report .local/wordpress-import/entenda-preview.json
npm run import:wordpress -- entenda --apply --actor-id 1 --target-label mir-local
```

O ID 1 é ilustrativo: informar um Admin existente no destino. Ambiente, schema preparado, segurança de reexecução e recuperação seguem o [guia do importador da Home](./importador-home.md). A simulação é offline, valida o snapshot e os cinco arquivos com seus hashes/tamanhos/MIME, e não carrega Payload nem conecta ao banco. A aplicação usa `DATABASE_URI` explícita e os mesmos parâmetros opcionais `--source`, `--uploads`, `--state-dir` e `--report`.

## Conteúdo e assets

Composição: capa → introdução com H1 e links legais/listas externas → vídeo YouTube → explicação com H2 → quatro modalidades alternando imagem à direita/esquerda. Os textos são conteúdo do backup em rascunho, sujeito a revisão institucional; não representam validação da vigência de prazos, parâmetros ou regularizações.

| Anexo | Arquivo em uploads | Política |
| --- | --- | --- |
| 735 | `2019/10/capa_Entenda-a-lei_1920px_70dpi.jpg` | Novo quando não estiver no manifesto. |
| 712 | `2019/10/foto-alberto-simon-archdaily_1200px_70dpi.jpg` | Reutiliza o registro da Home pelo ID legado/hash e preserva sua pasta/metadados. |
| 776 | `2019/12/declaratoria-simplificada.jpg` | Reutiliza o registro da Home pelo ID legado/hash e preserva sua pasta/metadados. |
| 717 | `2019/10/jonathan-borba-gXHHHNdKDq4-unsplash_1200px_70dpi.jpg` | Arquivo distinto do anexo 77 da Home; não deduplicar por semelhança visual. |
| 752 | `2019/11/segio-souza-shopping_800x800.jpg` | Arquivo distinto do anexo 716 da Home; não deduplicar por semelhança visual. |

Imagens novas ficam em `MIR/Entenda/Imagens`. Se Entenda for importada primeiro, serão cinco registros novos; se Home já estiver no mesmo manifesto com seus assets intactos, serão três novos e dois reutilizados. Reaplicar Home reutiliza os assets compartilhados também nesse sentido; nenhum script deve movê-los automaticamente para sua própria pasta.

O vídeo é representado por `videoBlock` com URL `https://www.youtube.com/watch?v=ECumpvJ-Yb8`, validada pelo parser do bloco e comparada ao ID do iframe legado. Não há iframe ou script cru gravado no conteúdo. As listas externas PDF/XLS permanecem como links nos parágrafos Lexical, sem download/cadastro local desses arquivos.

Os CTAs usam relações com páginas publicadas/ativas quando disponíveis; os demais usam os endereços legados temporários. O CTA da Declaratória Simplificada aponta para sua própria página; o link incorreto da imagem do builder foi descartado ao adaptar para ImageText.

## Decisões de compatibilidade

- Mantido `.local/wordpress-import/manifest.json`, que já identifica o destino por fingerprint, para não perder os vínculos da Home. A sugestão `manifest-<target>.json` da spec não foi aplicada como rename. Destinos distintos continuam exigindo diretórios de estado separados.
- Chaves `page:87` e `page:172` são independentes. Cada execução verifica a página selecionada e suas pastas/mídias; conteúdo manual de outra página não é regravado nem impede a execução. Mudanças em mídia compartilhada ainda geram conflito.
- O manifesto registra revisões editoriais e links temporários em `reviews`, por ID de origem, mantendo as entradas antigas compatíveis. O ator continua sendo propagado por `req.user` nas operações da Local API, não por SQL de escrita.
- O termo vedado foi eliminado também do parágrafo didático. A explicação de que o processo não representa perdão foi mantida sem citar a denominação informal, respeitando a proibição estrita dos guardrails.
- Os módulos conferidos citam Decreto 65.148/2026 e prazo histórico em agosto/2026. O link encontrado foi preservado em rascunho e sua vigência ficou pendente; não se inventou link para Decreto 59.164/2019, citado na spec, mas ausente desses textos.

Os arquivos `pages/entenda.ts` e `entenda-content.ts` contêm a adaptação específica. `loadSource` aceita ID/quantidade esperada de seções sem alterar os defaults da Home. `applyPage` compartilha preflight, locks, pastas, upload, checkpoints e rascunho; `applyHome` mantém sua assinatura anterior. O runner seleciona a página e usa sua identidade/layout, preservando a simulação offline e o bootstrap corrigido de ambiente.

## Validação executada

- Dry-run real: cinco imagens, hashes/tamanhos conferidos e oito blocos, sem banco.
- Unidade Home + Entenda: 11 testes passaram; cobrem Lexical, títulos, PDF/XLS/lei, vídeo, CTA corrigido, variantes de imagem, terminologia e ambiente offline.
- `npm run typecheck` e `npx eslint src/imports`: passaram.
- `DISABLE_PAYLOAD_HMR=true npm test`: 101 passaram, zero falhas e um teste PostgreSQL opcional ignorado nesta execução geral.
- Integração separada em PostgreSQL 17 descartável: passou com a aplicação real da Home e de Entenda, 20 mídias no total, seis pastas, reuso dos anexos 712/776, ambas as chaves no manifesto e Entenda em rascunho. Confirmou reexecução sem gravações, recusa de página preexistente, registro das pendências e ausência de sobrescrita da Home editada manualmente. Os testes anteriores de falha parcial e locks também passaram.
- `LDAP_AUTH_MODE=external npm run build`: passou.

Os testes de subprocesso, integração e build foram executados fora do sandbox; o banco da instância não foi utilizado. O container temporário foi removido ao encerrar os testes. Nenhum schema da instância foi migrado e nenhum conteúdo foi aplicado nela.

Pendências: conferência manual no Admin/preview desktop e mobile; vídeo e links externos em funcionamento; créditos/alternativas de imagem; revisão de conteúdo institucional antes de publicação. Não houve navegação no site público nem verificação legal externa. A página no banco da instância só será criada/atualizada ao executar explicitamente `--apply`, com as proteções de conflito existentes.
