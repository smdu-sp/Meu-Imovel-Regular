# Operação do importador de Situação do Imóvel — MIR-004

Implementado em 18/11/2026. Converte o post WordPress 176, slug `situacao`, título “Como saber a situação do meu imóvel?”, meta `dslc_code` 4149, em cinco blocos existentes: `fullWidthImageBanner`, `richText`, `imageBlock`, `richText` e `cta`.

## Comandos

Execute na raiz do projeto:

```bash
npm run import:wordpress -- situacao --dry-run
npm run import:wordpress -- situacao --dry-run --report .local/wordpress-import/situacao-preview.json
npm run import:wordpress -- situacao --apply --actor-id 1 --target-label mir-local
```

Substitua `1` pelo ID de um Admin existente. A conexão usa `DATABASE_URI`; `mir-local` identifica o ambiente no manifesto. Banco e schema precisam estar preparados. A aplicação salva como rascunho, com ator na auditoria. Ambiente, opções de fonte, checkpoints, conflitos e recuperação seguem o [guia da Home](./importador-home.md).

## Fonte e mídias

A origem é `old-wordpress/db/meuimovelregular.sql`, snapshot SHA-256 `ea309012c96c456c8c0568959a1f1bce5ae5d077239e9605bc9bdd333986264b`. A simulação é offline, confere as duas seções e valida caminhos, hashes, tamanhos e assinaturas dos arquivos em uploads.

| Anexo | Arquivo em uploads | Uso |
| --- | --- | --- |
| 739 | `2019/10/capa_situação_1920px_70dpi-1.jpg` | Capa JPEG, `$[0]`, módulo 0 |
| 718 | `2019/10/mockup-CEDI.png` | Ilustração PNG, `$[1]`, módulo 2 |

Novas mídias ficam em `MIR/Situacao/Imagens`. O manifesto registra `page:176` e os anexos legados com seus hashes; reaplicar reutiliza os registros gerenciados intactos. A deduplicação segue a identidade do anexo no manifesto, sem busca global por arquivos de mesmo nome ou hash. Arquivos presentes em `media/` não substituem os registros no banco.

## Conteúdo e decisões

Título e introdução vêm dos módulos 0 e 1 de `$[1]`. A afirmação de que o histórico comprova diretamente se a edificação está regular ou irregular foi substituída por uma descrição dos registros disponíveis no cadastro municipal. Foi acrescentado texto editorial sobre os limites do portal: orientação e encaminhamento, sem declaração oficial de regularidade, substituição de vistoria ou protocolo formal.

O módulo 3 contém três itens, preservados em lista numerada Lexical sob H2 “Como consultar?”. Permanecem o link para o CEDI, a orientação para informar SQL sem pontos, vírgulas ou traços e a observação sobre o carnê do IPTU. O backup não menciona CAPTCHA, Auto de Regularização ou Habite-se nesses módulos; essas referências da spec não foram inventadas. Eventuais mudanças do fluxo oficial exigem revisão editorial.

O endereço `http://cediconshistorico.prefeitura.sp.gov.br/forms/consultarhistorico.aspx` é extraído e conferido contra a referência do conteúdo. Foi preservado em HTTP, sem presumir suporte a HTTPS. O CTA usa `action.type=external` e `action.newTab=true`. A imagem possui legenda explícita de ilustração que pode estar desatualizada.

Não há formulário, iframe, consulta ao serviço, adapter CEDI, mudança de schema, migration ou componente novo. O conteúdo é editável no CMS. A disponibilidade do endereço e a vigência das instruções não foram verificadas externamente; constam nas pendências do relatório antes da publicação.

## Validação

- Simulação real: origem 176/meta 4149, duas imagens e cinco blocos, sem banco.
- Testes de layout, MIME/hash/tamanho, lista numerada, orientação SQL/IPTU, link externo/nova aba, limites do portal e execução offline.
- Testes recusam quantidade de passos divergente e destino CEDI diferente do esperado.

A revisão no Admin/preview desktop e mobile, créditos, alternativas textuais, funcionamento do endereço e conteúdo institucional permanece pendente. A implementação não aplica conteúdo ao banco da instância.


Validações de implementação concluídas:

- `npm run typecheck` e `npx eslint src/imports`: passaram.
- `DISABLE_PAYLOAD_HMR=true npm test`: 107 passaram, zero falhas e um teste opcional ignorado.
- Integração PostgreSQL 17 descartável: passou com as quatro páginas, total de 26 mídias e dez pastas. Situação foi persistida como rascunho com cinco blocos e CTA externo em nova aba. Reexecução sem gravações, colisão de slug sem manifesto e conflito após edição manual confirmados.
- `git diff --check` e links deste guia e do README de imports: conferidos.

Testes com subprocessos e banco foram executados fora do sandbox. O container temporário foi removido ao encerrar a validação.
