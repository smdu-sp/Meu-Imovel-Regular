# Contrato — documento nos links de ação

## Objetivo

Permitir que o editor vincule um manual ou cartilha PDF a qualquer grupo de ação já existente nos blocos cobertos, usando a biblioteca Media. Não exigir a cópia manual de URLs de arquivo para o conteúdo.

## Dados

Acrescentar `document` às opções do campo `type`, mantendo `internal` e `external`, e adicionar um upload opcional chamado `document`, com `relationTo=media`. Não transformar o campo `page` em relação polimórfica e não renomear campos antigos.

Exemplo ilustrativo de uma ação persistida:

```json
{
  "type": "document",
  "label": "Baixar cartilha",
  "document": 123,
  "newTab": false
}
```

O número é um ID de Media do destino, não um ID WordPress nem uma identidade fixa para seed. O tipo de ID deve acompanhar a configuração do adapter do pai.

| Campo | Regra |
| --- | --- |
| `type` | `internal`, `external` ou `document`; preservar o default existente. |
| `document` | Upload opcional no schema, exibido e validado quando o tipo selecionado é Documento. |
| `label` | Continua obrigatório quando a ação exige texto; selecionar Documento também torna uma ação opcional parcialmente preenchida e exige seu texto. |
| `page`, `url` | Preservados, com as validações existentes e sem conversão automática. |
| `newTab` | Mantém o comportamento existente de destino/rel da âncora. Não substitui o atributo de download. |

O Banner de imagem mantém seu próprio grupo: `enabled`, `type`, `page`, `url`, novo `document` e `newTab`. Não ganha `label` obrigatório. Seu seletor de documento só é ativo com `enabled=true` e `type=document`.

## Validação do servidor

O helper [createDocumentLinkField](../../../src/fields/document-link.ts) centraliza a seleção:

- filtro visual `mimeType=application/pdf` no seletor nativo;
- extrair ID escalar ou de relação populada;
- quando a ação Documento está ativa, exigir ID válido e consultar a Media pelo request atual;
- confirmar o MIME no registro consultado, sem confiar no MIME de um objeto enviado pelo cliente;
- recusar mídia ausente, falha de consulta ou arquivo de outro tipo;
- manter `overrideAccess=false`, respeitando a política de leitura da biblioteca;
- não validar como documento um campo oculto de outro destino ou um banner desabilitado.

Não usar `usage=document` como única prova do formato: PDFs legados podem ter classificação antiga. O novo upload/relação não altera a política de validação de assinatura no cadastro da própria Media.

## Resolução pública

O [resolvedor compartilhado](../../../src/lib/navigation/resolve-link.ts) recebe `document` como relação populada e confirma MIME PDF e URL. ID não populado, relação removida ou mídia inválida devolve `null`, sem gerar ação quebrada. Garantir depth/população suficiente no carregamento público do pai; não buscar documentos no cliente por uma URL construída a partir de ID.

O tipo escolhido tem prioridade sobre dados residuais de campos ocultos. Uma ação Documento não deve navegar para `page` ou `url` antigos. Uma ação explicitamente Externa usa sua URL, mesmo que ainda contenha uma relação de página anterior. Links legados sem `type` mantêm o fallback existente.

Para PDF válido, o resolvedor fornece `href` da Media e `download=true`. Não copiar filename/URL ao layout; a relação continua sendo a origem do destino. Aceitar URLs relativas locais e HTTP/HTTPS conforme o resolvedor; recusar protocolos executáveis e URLs relativas a protocolo.

## Renderização

- `BlockLink`: texto de ação renderizado como `<a download>` para documentos; demais destinos continuam usando Next Link.
- `Button`: variante de link recebe `download` e usa âncora HTML quando ativado, mantendo estilo, foco, rel e target.
- `FullWidthImageBanner`: imagem inteira vira âncora de download; nome acessível `Baixar PDF: ...` usa `Media.title`, depois filename e, como último recurso, o texto alternativo da imagem.
- `Carousel`: usar o tipo de link compartilhado para aceitar a nova relação; seu client já apresenta ações por BlockLink.

Não usar navegação/prefetch do Next.js para obter arquivos. O atributo `download` sugere o download ao navegador, mas pode ser ignorado para storage em outra origem. Não foi implementado download forçado por Content-Disposition nem novo endpoint, proxy ou visualizador.

## Limites

Apenas PDF; formatos Office não são adicionados. Pastas organizam a seleção e não restringem leitura. Não modificar Media, Users, Globals, regras de domínio ou o modelo de links inline do editor. Não converter conteúdos publicados ou URLs de documentos já digitadas pelos editores automaticamente.
