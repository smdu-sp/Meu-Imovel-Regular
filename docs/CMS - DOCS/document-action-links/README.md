# Links de ação para documentos PDF

Pacote de documentação para replicar no `SMUL-PayloadCMS` a opção **Documento PDF** nos links de ação dos blocos. Referência: implementação MIR de 17/11/2026, Payload 3.88.0 e Next.js 16.3.3. O repositório pai não foi alterado nesta entrega.

## Documentos

1. [Especificação](./especificacao.md): contrato, campos, validação, resolução e renderização.
2. [Portabilidade, migração e validação](./portabilidade-e-migracao.md): arquivos a portar, dependências, diferenças PostgreSQL/SQLite, ordem e critérios de aceite.
3. [Registro da implementação MIR](./implementacao-mir.md): plano anterior ao patch, decisões e resultados efetivamente executados.

O editor escolhe o destino Documento PDF, seleciona uma Media na biblioteca e informa o texto da ação. A página guarda a relação com o arquivo, preservando o vínculo quando ele muda de pasta. O link usa a URL atual da Media e sugere download pelo atributo HTML `download`.

Blocos cobertos: Hero, CTA, Cards, Carousel, ImageText, IconGrid, AlertBox, ActionBanners e FullWidthImageBanner. O bloco `documentList` continua sendo a alternativa para listas de documentos. Esta mudança não acrescenta links ao ImageBlock, não amplia links inline do RichText nem menus globais e não cria um visualizador de PDF.

## Dependência da biblioteca de mídia

O [upgrade de Media/pastas/PDF](../media-library-pdf/README.md) é documentado separadamente. Confirmar o estado real do pai antes do port: suporte a PDF, tipos Media e metadados como `title`. O helper de seleção não cria pastas ou modifica permissões; a navegação por pastas depende desse upgrade já estar disponível.

O contexto anterior registra PostgreSQL no MIR e SQLite no pai. Confirmar o adapter atual antes de gerar migrations; transportar o contrato, não SQL específico de outro banco.

## Estado

Código e validações automatizadas concluídos no MIR. Migração do schema do ambiente alvo, teste de persistência no adapter do pai e aceite manual do Admin/download permanecem parte do port. Os resultados MIR não comprovam que o repositório pai já esteja atualizado.

Para implementar, seguir a ordem do roteiro de portabilidade e executar apenas este escopo, preservando os campos e conteúdos existentes. Não transportar importadores WordPress, dados MIR, seeds de pastas ou mídias institucionais junto com esta funcionalidade.
