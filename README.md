# Portfolio Website

Portfolio estatico com HTML, CSS e JavaScript modular, com i18n, analytics com consentimento e pipeline de build para `dist/`.

## Requisitos

- Node.js 18+
- npm 9+

## Estrutura de Arquivos

```text
.
|-- index.html
|-- build.js
|-- package.json
|-- README.md
|-- robots.txt
|-- sitemap.xml
|-- netlify.toml
|-- vercel.json
|-- css/
|   |-- themes.css
|   |-- animations.css
|   |-- style.css
|   |-- responsive-fixes.css
|   `-- performance-optimizations.css
|-- js/
|   |-- config.js
|   |-- polyfills.js
|   |-- i18n.js
|   |-- animation-controller.js
|   |-- lazy-loader.js
|   |-- performance-monitor.js
|   |-- analytics.js
|   |-- project-data.js
|   |-- project-modal.js
|   |-- form-handler.js
|   `-- app.js
|-- locales/
|   |-- pt-BR.json
|   |-- en-US.json
|   `-- es-ES.json
|-- img/
|   `-- *.svg
`-- scripts/
    |-- check-placeholders.js
    |-- check-locales.js
    |-- check-json.js
    |-- check-i18n-usage.js
    |-- check-internal-links.js
    |-- smoke-test.js
    |-- test-i18n-switch.js
    `-- test-form-validation.js
```

## Arquitetura dos Modulos JS

- `js/config.js`: configuracao central (GA4, i18n, features, formulario).
- `js/app.js`: orquestrador principal e lifecycle da aplicacao.
- `js/i18n.js`: carregamento e troca de idiomas.
- `js/animation-controller.js`: animacoes e reveal effects.
- `js/lazy-loader.js`: lazy loading de imagens.
- `js/performance-monitor.js`: metricas de performance no client.
- `js/analytics.js`: GA4 e banner de consentimento de cookies.
- `js/project-data.js`: dados dos projetos.
- `js/project-modal.js`: modal de detalhes de projeto.
- `js/form-handler.js`: validacao e envio do formulario.
- `js/polyfills.js`: compatibilidade cross-browser.

## Fluxo de Desenvolvimento

### 1. Instalar dependencias

```bash
npm install
```

### 2. Rodar localmente (codigo-fonte)

```bash
npm run serve
```

### 3. Build de producao

```bash
npm run build
```

### 4. Servir build final

```bash
npm run serve:dist
```

## Pipeline de Build

O `build.js` faz:

1. Minificacao de CSS e JS.
2. Gera arquivos com hash no nome para cache-busting real.
3. Reescreve `dist/index.html` para apontar para os assets hashados.
4. Copia assets estaticos (`img/`, `locales/`, `robots.txt`, `sitemap.xml`, `.htaccess`).
5. Gera `dist/build-manifest.json`.

## SEO Social e GA4

O build aceita variaveis de ambiente para producao:

- `SITE_URL` (ex.: `https://careca.is-a.dev`)
- `SOCIAL_IMAGE_URL` (URL absoluta da imagem de share)
- `GA4_MEASUREMENT_ID` (ex.: `G-ABC123DEF4`)

Exemplo:

```bash
SITE_URL=https://careca.is-a.dev SOCIAL_IMAGE_URL=https://careca.is-a.dev/img/profile.svg GA4_MEASUREMENT_ID=G-ABC123DEF4 npm run build
```

Essas variaveis atualizam no `dist/index.html`:

- `canonical`
- `og:url`
- `og:image`
- `twitter:image`
- `meta[name="ga4-measurement-id"]`

## Consentimento e Cookies

- O GA4 so inicializa apos consentimento explicito.
- A escolha do usuario e persistida em `localStorage` (`accepted`/`denied`).
- Existe secao visivel de "Privacidade e Cookies" no site e botao "Gerenciar cookies".

## Qualidade e Testes

### Lint

```bash
npm run lint
```

### Checks de qualidade

```bash
npm run check
```

Inclui:

- lint JS
- validacao de JSON
- placeholders de producao
- paridade de locales
- uso de chaves i18n no HTML
- links internos (`href="#id"`)
- build
- smoke test da build final
- sanity tests de i18n e formulario

### Testes de sanidade

```bash
npm run test
```

## Deploy

- Vercel: `vercel.json` configurado para output em `dist/`.
- Netlify: `netlify.toml` disponivel com headers e redirects.

Fluxo recomendado:

1. `npm install`
2. `npm run check`
3. `npm run build`
4. publicar `dist/`

## Decisao de UI pendente

- Instagram foi removido do layout ate existir URL final de perfil.
