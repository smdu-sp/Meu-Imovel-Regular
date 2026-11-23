const navItems = [
  ['Entenda a Lei', 'entenda-a-lei.html'],
  ['Benefícios', 'beneficios.html'],
  ['Conheça as modalidades', 'regularizacao-automatica.html'],
  ['Estou regular?', 'situacao-imovel.html'],
];

class SiteHeader extends HTMLElement {
  connectedCallback() {
    const current = location.pathname.split('/').pop() || 'index.html';
    this.innerHTML = `
      <div class="top-gradient"></div>
      <header class="site-header">
        <a class="brand-mark" href="index.html" aria-label="Meu Imóvel Regular">
          <span class="brand-frame"><strong>Meu<br>Imóvel</strong><span>Regular</span></span>
        </a>
        <nav class="main-nav" aria-label="Navegação principal">
          ${navItems.map(([label, href]) => `<a ${current === href ? 'aria-current="page"' : ''} href="${href}">${label}</a>`).join('')}
        </nav>
        <a class="city-logo" href="index.html" aria-label="Cidade de São Paulo">
          <span class="crest">✦</span>
          <strong>CIDADE DE<br>SÃO PAULO</strong>
          <small>LICENCIAMENTO</small>
        </a>
      </header>`;
  }
}

class SiteFooter extends HTMLElement {
  connectedCallback() {
    this.innerHTML = `
      <div class="footer-gradient"></div>
      <footer class="site-footer">
        <div class="footer-brand"><span class="crest">✦</span><strong>CIDADE DE<br>SÃO PAULO</strong></div>
        <div><strong>Secretaria Municipal de Licenciamento</strong><br>Rua São Bento, 405, Centro - 22º andar<br>CEP 01011-100 - São Paulo - SP</div>
        <div><strong>Contatos</strong><br>imprensasel@prefeitura.sp.gov.br<br>(11) 3243-1000 | 3243-1270</div>
        <div class="socials" aria-label="Redes sociais">f&nbsp;&nbsp;◎&nbsp;&nbsp;♥</div>
      </footer>`;
  }
}

class ImagePlaceholder extends HTMLElement {
  connectedCallback() {
    const hasLabel = this.hasAttribute('label');
    const label = hasLabel ? this.getAttribute('label') : 'Imagem de exemplo';
    const tone = this.getAttribute('tone') || 'city';
    this.classList.add('image-placeholder', `tone-${tone}`);
    this.setAttribute('role', 'img');
    this.setAttribute('aria-label', label || 'Imagem decorativa');
    this.innerHTML = label ? `<span>${label}</span>` : '';
  }
}

class SectionPill extends HTMLElement {
  connectedCallback() {
    const tone = this.getAttribute('tone') || 'green';
    const title = this.getAttribute('title') || '';
    this.innerHTML = `<div class="section-pill tone-${tone}">${title}</div>`;
  }
}

class InfoCard extends HTMLElement {
  connectedCallback() {
    const title = this.getAttribute('title') || '';
    const align = this.getAttribute('align') || 'right';
    const content = this.innerHTML;
    this.innerHTML = `
      <article class="info-card info-card-${align}">
        <div class="info-card-body"><h3>${title}</h3>${content}</div>
      </article>`;
  }
}

class FaqItem extends HTMLElement {
  connectedCallback() {
    const q = this.getAttribute('question') || '';
    const a = this.innerHTML.trim() || 'Conteúdo de resposta de exemplo. Substitua pelo conteúdo real.';
    this.innerHTML = `<details class="faq-item"><summary>${q}<span>Ver resposta</span></summary><div>${a}</div></details>`;
  }
}

customElements.define('site-header', SiteHeader);
customElements.define('site-footer', SiteFooter);
customElements.define('image-placeholder', ImagePlaceholder);
customElements.define('section-pill', SectionPill);
customElements.define('info-card', InfoCard);
customElements.define('faq-item', FaqItem);
