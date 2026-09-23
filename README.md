# storefront-ayuna

The `ayuna` storefront template: a soft pink health & beauty look with
Indonesian copy, built for any shop that picks it. Everything that is not a
design — API client, tenant config, cart, checkout state, the helpers that
decide what a page may say — comes from
[`@sepetakhq/storefront-kit`](https://www.npmjs.com/package/@sepetakhq/storefront-kit).

Nothing about a merchant is in here. Name, nav, hero, promises, categories,
campaign, story, contact, payment methods and couriers all arrive from
`/storefront/config` and `/storefront/home`; a product or category without a
picture renders as a two-letter tile on a blush wash.

## Develop

Run the platform API first (`make up && make seed && make api` in the
`lilyalora` checkout; the seed installs the *Ayuna Beauty* demo tenant on this
template), then:

```
npm install
npm run dev          # http://ayuna.localhost:5179, /api proxied to the API on :8090
```

Open it on `ayuna.localhost`, not `localhost`: the API resolves the shop from
the Host header. `API_TARGET` and `DEV_PORT` override the proxy target and
port. The document head is filled from the API by the kit's `seoDevPlugin`.

## Ship

`public/manifest.json` (title, description in `id` and `en`, preview file
name) and `public/preview.jpg` are this template's catalogue entry: the
backoffice picker and the landing read them from the registry beside
`index.html`. `src/manifest.test.js` refuses a push without them.

Every push to `main` builds and uploads to the template registry
(`.github/workflows/release.yml`); the API serves the new build within a
minute. To see the registry path locally, publish to the dev MinIO:

```
npm run publish:local
open http://ayuna.localhost:8090/
```

## Rules

- Serve exactly the kit's `ROUTE_CONTRACT` (`src/routes.test.js` pins it).
  Categories and promo are `/katalog?cat=` and `/katalog?sale=1`, never
  routes of their own.
- Keep the `<!--seo:start-->` / `<!--seo:end-->` markers in `index.html`.
- Copy is Indonesian, the kit's default; the merchant's own words come from
  config and are never hardcoded. Branch on `payment.kind`, render
  `order.timeline`.
- Needs kit ≥ 0.1.3: the promo list asks the API for `on_sale`.
- Responsive by CSS, not width listeners: the full header only at ≥1180px,
  the compact product card below 480px.
- The template's own decisions live in `src/lib/copy.js` as pure functions
  with tests: discount, card note and veil, campaign headline, hero stats,
  the features lift, the WhatsApp question link, catalogue chips.
