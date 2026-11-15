# Documentação do Meu Imóvel Regular

Documentos específicos do portal e da migração do legado WordPress para a base Next.js e Payload CMS.

- [Planejamento da migração](./plano-migracao-wordpress.md): evidências, decisões pendentes, etapas, mapeamento preliminar e critérios de validação. Status: proposta, sem implementação.
- [Levantamento de old-wordpress](./analise-old-wordpress.md): inspeção estática do código, dump e mídias recebidos, com páginas encontradas, estrutura Live Composer e limites da cópia.
- [Mapa de composição da Home](./mapas/mapa-composicao-home.md): ordem real das seções, fontes por registro/caminho JSON, imagens, documentos e blocos Payload candidatos.
- [Schema do banco legado](./banco-legado-schema.md): contexto e DDL do dump; não representa os dados atuais do MySQL nem o schema do Payload.
- [Contexto da base CMS](../CMS%20-%20DOCS/README.MD) e [specs da base](../CMS%20-%20DOCS/specs/README.md).

Próxima etapa proposta: detalhar o mapeamento das páginas e dos Globals do legado para os blocos atuais, usando o diagnóstico estático e registrando as pendências antes de criar specs de implementação.

Os mapas de composição ficam em `mapas/`, com um documento por página.
