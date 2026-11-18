# Importação do WordPress

Execute os comandos abaixo na raiz do projeto.

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

## Parâmetros e resultado

- `--dry-run`: valida os arquivos e mostra a composição, sem conectar ao banco. Os IDs negativos das mídias são referências temporárias da simulação.
- `--apply`: cria ou atualiza a página como **rascunho**. Confira o resultado no Admin antes de publicar.
- `--actor-id 1`: substitua `1` pelo ID de um administrador existente no CMS.
- `--target-label mir-local`: identifica o ambiente no manifesto. A conexão efetiva é definida por `DATABASE_URI`, carregada do ambiente do projeto.

A aplicação exige o PostgreSQL disponível e o schema preparado. O importador não cria o banco nem executa migrations.

As fontes padrão precisam estar disponíveis localmente:

- Dump: `old-wordpress/db/meuimovelregular.sql`.
- Assets: `old-wordpress/meuimovelregular/wp-content/uploads`.

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
