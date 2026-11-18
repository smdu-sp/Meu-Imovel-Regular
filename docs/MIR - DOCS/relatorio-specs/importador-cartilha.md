# Operação do importador da Cartilha — MIR-006

Implementado em 18/11/2026. Converte a página WordPress 1145, slug `cartilha`, meta `dslc_code` 4133, em três blocos existentes: capa panorâmica, texto editorial e CTA com link Documento PDF.

## Comandos

Execute na raiz do projeto:

```bash
npm run import:wordpress -- cartilha --dry-run
npm run import:wordpress -- cartilha --dry-run --report .local/wordpress-import/cartilha-preview.json
npm run import:wordpress -- cartilha --apply --actor-id 1 --target-label mir-local
```

Substitua `1` pelo ID de um Admin existente. A conexão usa `DATABASE_URI`; `mir-local` é um rótulo do ambiente. Banco e schema precisam estar preparados. O importador salva em rascunho, preserva auditoria com o ator e não executa migrations. Ambiente, diretórios de origem, manifesto, checkpoints e conflitos seguem o [guia da Home](./importador-home.md).

## Fonte e assets

Fonte: `old-wordpress/db/meuimovelregular.sql`, snapshot SHA-256 `ea309012c96c456c8c0568959a1f1bce5ae5d077239e9605bc9bdd333986264b`. São duas seções: `$[0]` com a imagem 1150 e `$[1]` com título, apresentação e link do PDF.

| Anexo | Arquivo em uploads | Destino / uso |
| --- | --- | --- |
| 1150 | `2020/01/capa-cartilha-meuimovelregular-2-scaled.jpg` | `MIR/Cartilha/Imagens`, `content` |
| 1129 | `2020/01/Cartilha_Lei_de_Regularização.pdf` | `MIR/Cartilha/Documentos`, `document` |

A simulação valida caminhos de anexo, hashes, tamanhos e assinaturas JPEG/PDF, sem conectar ao banco. A capa tem 187.461 bytes; o PDF, 4.676.839 bytes. O relatório mostra referências simbólicas negativas. Não são feitos downloads externos.

A aplicação registra `page:1145` e os anexos no mesmo manifesto das demais páginas. Reexecuções com documentos intactos reutilizam IDs; documentos editados/publicados ou slug sem vínculo de manifesto geram conflito. Não há adoção automática nem exclusão para contornar conflitos. Atomicidade por operação com checkpoints, conforme a infraestrutura compartilhada.

## Composição e decisões

O texto é extraído do módulo legado e convertido para Lexical com um H1. O parser confere o destino do único link pelo domínio e caminho decodificado, normalizando as barras duplicadas do legado. O parágrafo “Clique aqui e veja a Cartilha” é removido da introdução e convertido em CTA, evitando deixar uma segunda chamada com URL antiga.

O CTA usa `action.type=document`, `action.document=Media.id`, `newTab=false` e rótulo “Baixar Cartilha Completa (PDF)”. O componente existente resolve a URL da mídia populada e aplica `download`. Nenhuma URL de PDF é codificada no layout; não há viewer, iframe ou PDF.js.

Título, narrativa da SMUL, datas e referências legais da apresentação são preservados como conteúdo histórico em rascunho. O relatório registra revisão institucional pendente para verificar vigência do texto e do PDF, inclusive a expressão “nova Lei”. Não houve consulta jurídica externa ou certificação da atualidade do material.

Sem desvios de estrutura: os três blocos, pastas e relação de documento previstos na spec foram utilizados. Nenhum schema, migration, componente, menu ou Global foi alterado. O banco da instância não recebeu carga durante a implementação.

## Validação e pendências

Os testes cobrem extração real, hashes/tamanhos/MIME, classificação do PDF, título, conteúdo, CTA relacionado ao documento, resolução do link com download e execução offline. O parser recusa link ausente, duplicado, em outro domínio/caminho e HTML de script.

Pendente: revisão institucional da apresentação e do PDF, créditos, alternativa textual da capa, preview no Admin/desktop/mobile e download manual antes de publicar.


Comandos de validação executados:

- Simulação real: dois arquivos e três blocos, origem 1145/meta 4133.
- `npm run typecheck` e `npx eslint src/imports`: passaram.
- `DISABLE_PAYLOAD_HMR=true npm test`: 114 passaram, zero falhas e um teste opcional ignorado.
- Integração PostgreSQL 17 descartável: passou com as seis páginas, 34 mídias e 16 pastas. Confirmou PDF persistido com tipo, tamanho, uso e pasta corretos; capa em pasta distinta; relação do CTA; rascunho; reexecução sem novas gravações e proteção contra colisão de slug/edição manual.
- `git diff --check` e links locais deste guia e do README: conferidos.

Testes com subprocessos e banco foram executados fora do sandbox. O container temporário foi removido ao encerrar a validação.
