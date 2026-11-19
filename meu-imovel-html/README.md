# Meu Imóvel Regular — reconstrução HTML

Reconstrução visual baseada no PDF fornecido, focada em estrutura e componentes reutilizáveis. Não há dependências externas nem assets obrigatórios.

## Estrutura

- `index.html` — página inicial
- `entenda-a-lei.html`
- `beneficios.html`
- `duvidas.html`
- `situacao-imovel.html`
- `regularizacao-automatica.html`
- `regularizacao-declaratoria.html`
- `regularizacao-comum.html`
- `assets/styles.css` — tokens, layout e componentes visuais
- `assets/components.js` — Web Components reutilizáveis

## Componentes nativos

- `<site-header>`
- `<site-footer>`
- `<image-placeholder>`
- `<section-pill>`
- `<faq-item>`

## Como visualizar

Abra `index.html` diretamente no navegador ou sirva a pasta com qualquer servidor estático.

Exemplo:

```bash
python -m http.server 8080
```

Depois acesse `http://localhost:8080`.

## Como trocar os placeholders por imagens reais

O componente `<image-placeholder>` foi usado para preservar a composição sem depender dos assets originais. Para migrar para imagens reais, substitua cada elemento por `<img>` mantendo a classe usada no layout, ou adapte o componente para receber um atributo `src`.
