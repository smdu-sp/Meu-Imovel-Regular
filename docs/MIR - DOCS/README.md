# Documentação do Meu Imóvel Regular

Documentos específicos do portal e da migração do legado WordPress para a base Next.js e Payload CMS.

- [Planejamento da migração](./plano-migracao-wordpress.md): evidências, decisões pendentes, etapas, mapeamento preliminar e critérios de validação. Status: proposta, sem implementação.
- [Levantamento de old-wordpress](./analise-old-wordpress.md): inspeção estática do código, dump e mídias recebidos, com páginas encontradas, estrutura Live Composer e limites da cópia.
- [Mapa de composição da Home](./mapas/mapa-composicao-home.md): ordem real das seções, fontes por registro/caminho JSON, imagens, documentos e blocos Payload candidatos.
- [Schema do banco legado](./banco-legado-schema.md): contexto e DDL do dump; não representa os dados atuais do MySQL nem o schema do Payload.
- [MIR-001 — Importador da Home](./specs/mir-001-importador-home.md): contrato de scripts por página, simulação, pastas de mídia, rascunho e reexecução segura. Código implementado; aplicação na instância e validação manual pendentes.
- [MIR-002 — Importador de Entenda a Lei](./specs/mir-002-importador-entenda.md): tradução da página Entenda a Lei, incorporação de vídeo do YouTube via `videoBlock`, blocos de modalidades e saneamento de links.
- [MIR-003 — Importador de Benefícios](./specs/mir-003-importador-beneficios.md) e [guia operacional](./relatorio-specs/importador-beneficios.md): seis blocos, listas por público-alvo e reuso de mídias. Código implementado; revisão no Admin pendente.
- [MIR-004 — Importador de Situação do Imóvel](./specs/mir-004-importador-situacao.md) e [guia operacional](./relatorio-specs/importador-situacao.md): cinco blocos, orientações de consulta ao CEDI (SQL), mockup ilustrativo e CTA externo. Código implementado; revisão no Admin pendente.
- [MIR-005 — Importador de Dúvidas Frequentes (FAQ)](./specs/mir-005-importador-faq.md) e [guia operacional](./relatorio-specs/importador-faq.md): 29 perguntas em dois acordeões, seis imagens e quatro canais de atendimento. Código implementado; revisão no Admin pendente.
- [MIR-006 — Importador da Cartilha](./specs/mir-006-importador-cartilha.md) e [guia operacional](./relatorio-specs/importador-cartilha.md): três blocos, capa e CTA com relação ao PDF na biblioteca de mídia. Código implementado; revisão no Admin pendente.
- [MIR-007 — Importador de Regularização Automática](./specs/mir-007-importador-regularizacao-automatica.md) e [guia operacional](./relatorio-specs/importador-regularizacao-automatica.md): nove blocos, cinco imagens, quatro manuais reutilizados e alerta institucional. Código implementado; revisão no Admin pendente.
- [MIR-008 — Importador de Regularização Declaratória Simplificada](./specs/mir-008-importador-regularizacao-declaratoria-simplificada.md) e [guia operacional](./relatorio-specs/importador-regularizacao-declaratoria-simplificada.md): nove blocos, quatro imagens exclusivas, reuso de cinco assets e alerta crítico de ausência de comunicado. Código implementado; revisão no Admin pendente.
- [MIR-009 — Importador de Regularização Declaratória](./specs/mir-009-importador-regularizacao-declaratoria.md) e [guia operacional](./relatorio-specs/importadores-declaratoria-comum.md): 12 blocos, Outorga/Anuências e comunicado único. Implementado; revisão institucional pendente.
- [MIR-010 — Importador de Regularização Comum](./specs/mir-010-importador-regularizacao-comum.md) e [guia operacional](./relatorio-specs/importadores-declaratoria-comum.md): 12 blocos, correção de legislação e reuso das mídias de Outorga. Implementado; revisão institucional pendente.
- [MIR-011 — Importador do Cabeçalho](./specs/mir-011-importador-header.md): template de cabeçalho, logo MIR, menu principal com cinco links ordenados e pasta compartilhada de identidade.
- [MIR-012 — Importador do Rodapé](./specs/mir-012-importador-footer.md): template de rodapé, logo PMSP, dados de contato institucional, endereço e links de redes sociais com ícones oficiais.
- [Operação do importador da Home](./relatorio-specs/importador-home.md): comandos, ambiente, checkpoints, conflitos e resultados dos testes.
- [MIR-002 — Importador de Entenda a Lei](./specs/mir-002-importador-entenda.md) e [guia operacional](./relatorio-specs/importador-entenda.md): oito blocos, cinco imagens, reuso de mídias e vídeo nativo. Código implementado; aplicação na instância e revisão manual pendentes.
- [Contexto da base CMS](../CMS%20-%20DOCS/README.MD) e [specs da base](../CMS%20-%20DOCS/specs/README.md).

Próxima etapa proposta: simular a Home e preparar o destino para aplicação/revisão do rascunho conforme o guia operacional. Os demais mapas e a importação de Globals continuam em etapas separadas.

Os mapas de composição ficam em `mapas/`, com um documento por página.

- [Importação completa das dez páginas](./relatorio-specs/importacao-completa.md): comando único, relatório e atualização de links locais.
- [Auditoria dos links do domínio legado](./mapas/auditoria-links-internos.md): rotas correspondentes e tratamento de documentos.
