# Importação do WordPress

Execute os comandos abaixo na raiz do projeto.

## Executar todas as importações

Validar as dez páginas sem conectar ao banco:

```bash
npm run import:wordpress:all -- --dry-run
```

Importar as dez páginas como rascunhos e resolver os links entre elas:

```bash
npm run import:wordpress:all -- --apply --actor-id 1 --target-label mir-local
```

O lote valida todas as fontes antes de gravar, reutiliza o manifesto e faz duas passadas: carga e resolução final das referências. Para ao encontrar conflito, sem sobrescrever conteúdo editado/publicado. Não executa migrations de schema. [Guia do lote e atualização de links](../../docs/MIR%20-%20DOCS/relatorio-specs/importacao-completa.md).

O lote inclui apenas as dez páginas. Execute os Globals Header e Footer separadamente.

## Home

Simular a importação:

```bash
npm run import:wordpress -- home --dry-run
```

Gravar a página e importar suas mídias no banco configurado:

```bash
npm run import:wordpress -- home --apply --actor-id 1 --target-label mir-local
```

## Entenda

Simular a importação:

```bash
npm run import:wordpress -- entenda --dry-run
```

Gravar a página e importar suas mídias no banco configurado:

```bash
npm run import:wordpress -- entenda --apply --actor-id 1 --target-label mir-local
```

## Benefícios de Regularizar o Imóvel

Simular a importação:

```bash
npm run import:wordpress -- beneficios --dry-run
```

Gravar a página e importar suas mídias no banco configurado:

```bash
npm run import:wordpress -- beneficios --apply --actor-id 1 --target-label mir-local
```

## Como saber a situação do meu imóvel?

Simular a importação:

```bash
npm run import:wordpress -- situacao --dry-run
```

Gravar a página e importar suas mídias no banco configurado:

```bash
npm run import:wordpress -- situacao --apply --actor-id 1 --target-label mir-local
```

## Dúvidas Frequentes

Simular a importação:

```bash
npm run import:wordpress -- faq --dry-run
```

Gravar a página e importar suas mídias no banco configurado:

```bash
npm run import:wordpress -- faq --apply --actor-id 1 --target-label mir-local
```

A FAQ reutiliza os três manuais da Home nas respostas 19 e 23. Ao reaplicar uma FAQ intacta, atualiza os links para as URLs da mídia local. [Detalhes e limites da atualização](../../docs/MIR%20-%20DOCS/relatorio-specs/importador-faq.md).

## Cartilha

Simular a importação:

```bash
npm run import:wordpress -- cartilha --dry-run
```

Gravar a página, a capa e o PDF no banco configurado:

```bash
npm run import:wordpress -- cartilha --apply --actor-id 1 --target-label mir-local
```

## Regularização Automática

Simular a importação:

```bash
npm run import:wordpress -- regularizacao-automatica --dry-run
```

Gravar a página e importar/reutilizar suas mídias:

```bash
npm run import:wordpress -- regularizacao-automatica --apply --actor-id 1 --target-label mir-local
```

## Regularização Declaratória Simplificada

Simular a importação:

```bash
npm run import:wordpress -- regularizacao-declaratoria-simplificada --dry-run
```

Gravar a página e importar/reutilizar suas mídias:

```bash
npm run import:wordpress -- regularizacao-declaratoria-simplificada --apply --actor-id 1 --target-label mir-local
```

## Regularização Declaratória e Comum

```bash
npm run import:wordpress -- regularizacao-declaratoria --dry-run
npm run import:wordpress -- regularizacao-declaratoria --apply --actor-id 1 --target-label mir-local
npm run import:wordpress -- regularizacao-comum --dry-run
npm run import:wordpress -- regularizacao-comum --apply --actor-id 1 --target-label mir-local
```

## Cabeçalho (Header Global)

```bash
npm run import:wordpress -- header --dry-run
npm run import:wordpress -- header --apply --actor-id 1 --target-label mir-local
```

A aplicação exige as cinco páginas de destino já cadastradas e ativas. Importa os logos MIR e SMUL e configura o menu principal. [Guia operacional do Header](../../docs/MIR%20-%20DOCS/relatorio-specs/importador-header.md).

## Rodapé (Footer Global)

```bash
npm run import:wordpress -- footer --dry-run
npm run import:wordpress -- footer --apply --actor-id 1 --target-label mir-local
```

Importa o logo da Prefeitura, contatos, endereço, redes sociais e links institucionais. Reutiliza a pasta de identidade do Header quando ela já consta no manifesto. Confira a vigência dos dados institucionais antes de aplicar em produção. [Guia operacional do Footer](../../docs/MIR%20-%20DOCS/relatorio-specs/importador-footer.md).

## Parâmetros e resultado

- `--dry-run`: valida os arquivos e mostra a composição, sem conectar ao banco. Os IDs negativos das mídias são referências temporárias da simulação.
- `--apply`: cria ou atualiza páginas como **rascunho**; para `header` e `footer`, atualiza o Global correspondente. Confira o resultado no Admin.
- `--actor-id 1`: substitua `1` pelo ID de um administrador existente no CMS.
- `--target-label mir-local`: identifica o ambiente no manifesto. A conexão efetiva é definida por `DATABASE_URI`, carregada do ambiente do projeto.

A aplicação exige o PostgreSQL disponível e o schema preparado. O importador não cria o banco nem executa migrations.

As fontes padrão precisam estar disponíveis localmente:

- Dump: `old-wordpress/db/meuimovelregular.sql`.
- Assets: `old-wordpress/mir-web/wp-content/uploads`.

Para salvar a simulação em um arquivo, acrescente `--report`:

```bash
npm run import:wordpress -- entenda --dry-run --report .local/wordpress-import/entenda-preview.json
```

O estado das importações fica em `.local/wordpress-import/`. Mantenha esse diretório para que as reexecuções reconheçam os registros já importados. Alterações manuais nos registros gerenciados podem gerar conflito em vez de serem sobrescritas. Arquivos presentes em `media/` não substituem os registros no banco nem o manifesto.

## Guias detalhados

- [Operação do importador da Home](../../docs/MIR%20-%20DOCS/relatorio-specs/importador-home.md).
- [Operação do importador Entenda](../../docs/MIR%20-%20DOCS/relatorio-specs/importador-entenda.md).

- [Operação do importador de Benefícios](../../docs/MIR%20-%20DOCS/relatorio-specs/importador-beneficios.md).
- [Operação do importador de Situação do Imóvel](../../docs/MIR%20-%20DOCS/relatorio-specs/importador-situacao.md).
- [Operação do importador de FAQ](../../docs/MIR%20-%20DOCS/relatorio-specs/importador-faq.md).
- [Operação do importador da Cartilha](../../docs/MIR%20-%20DOCS/relatorio-specs/importador-cartilha.md).
- [Operação do importador de Regularização Automática](../../docs/MIR%20-%20DOCS/relatorio-specs/importador-regularizacao-automatica.md).
- [Operação do importador de Declaratória Simplificada](../../docs/MIR%20-%20DOCS/relatorio-specs/importador-regularizacao-declaratoria-simplificada.md).
- [Operação de Declaratória e Comum](../../docs/MIR%20-%20DOCS/relatorio-specs/importadores-declaratoria-comum.md).
- [Operação do importador do Header](../../docs/MIR%20-%20DOCS/relatorio-specs/importador-header.md).
- [Operação do importador do Footer](../../docs/MIR%20-%20DOCS/relatorio-specs/importador-footer.md).
