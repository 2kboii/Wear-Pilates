# Wear Pilates theme — agent guide

Custom Shopify theme for wearpilates.com. Started from Shopify's Skeleton theme,
but deliberately diverges from Skeleton's "no sections" rule: the store owner
edits copy, images and order in the theme editor, so pages are JSON templates
composed of sections.

## Conventions

- **Sections + JSON templates.** Every page is `templates/*.json` pointing at
  `sections/main-*.liquid`. Homepage sections have `presets` so they can be
  added from the editor. Header, footer, announcement bar and cart drawer are
  static sections rendered in `layout/theme.liquid`.
- **Assets in `assets/`.** All CSS is in `theme.css`, all JS in `theme.js`
  (vanilla, no build step). No `{% stylesheet %}` / `{% javascript %}`.
- **Tokens.** Colors, fonts, widths come from `config/settings_schema.json`
  and are exposed as CSS variables in `snippets/css-variables.liquid`.
  Use the variables; don't hardcode colors in CSS.
- **Translated UI strings** use `{{ 'key' | t }}` with keys in
  `locales/en.default.json`. Schema labels are plain English.
- **Routes:** use `routes.*`, never hardcode `/cart`, `/search`, `/collections`.
- **Product data comes from Printify via Shopify.** Never hardcode product
  facts (shipping times, materials, prices). Copy that states facts must be
  editable settings.
- **Swatches:** `snippets/swatch-color.liquid` uses the Shopify swatch color,
  then falls back to the `swatch_map` theme setting.
- **Cart:** `sections/cart-drawer.liquid` is re-rendered through the Section
  Rendering API (`sections: 'cart-drawer'`) after add/change.
- Keep Theme Check clean (`extends: theme-check:recommended`, no overrides).

## Brand

Minimalist, vintage athletic, intentional. No fitness jargon or
body-transformation language. Monochrome UI, uppercase tracked labels,
maroon accent only for sale/badges.
