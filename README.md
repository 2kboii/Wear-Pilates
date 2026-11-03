# Wear Pilates — tema de Shopify

Tema propio de [wearpilates.com](https://wearpilates.com), construido sobre el
[Skeleton theme](https://github.com/Shopify/skeleton-theme) de Shopify, con
secciones editables desde el editor de temas.

Los productos, variantes, precios y disponibilidad vienen de Shopify, y
Printify los sincroniza ahí. El tema no necesita ninguna integración propia
con Printify.

## Estructura

```
layout/      theme.liquid (barra de anuncio, header, footer, carrito lateral)
sections/    secciones editables (hero, carrusel, paneles, grilla, producto, etc.)
snippets/    piezas compartidas (tarjeta de producto, precio, swatches, filtros)
templates/   templates JSON: qué secciones lleva cada página
assets/      theme.css y theme.js (sin dependencias)
config/      ajustes globales: logo, colores, tipografías, swatches, redes
locales/     textos de la interfaz (inglés)
```

## Vista previa local

1. Instalar [Node.js LTS](https://nodejs.org) y [Git](https://git-scm.com/download/win).
2. Instalar Shopify CLI:
   ```
   npm install -g @shopify/cli@latest
   ```
3. Desde esta carpeta:
   ```
   shopify theme dev --store TU-TIENDA.myshopify.com
   ```
   Abre una vista previa en `http://127.0.0.1:9292` con tus productos reales.
   Lo que cambies en los archivos se ve al instante. No afecta la tienda en vivo.

## Publicar con GitHub

1. Crear un repositorio **privado** en GitHub (por ejemplo `wear-pilates-theme`), vacío.
2. Desde esta carpeta:
   ```
   git remote add origin https://github.com/TU-USUARIO/wear-pilates-theme.git
   git push -u origin main
   ```
3. En Shopify: **Tienda online → Temas → Agregar tema → Conectar desde GitHub**.
   Elegí el repositorio y la rama `main`. El tema aparece como **no publicado**.
4. Revisalo con **Personalizar**. Cuando esté listo, **Publicar**.

Shopify y GitHub quedan sincronizados en las dos direcciones. Cada push actualiza
el tema, y los cambios que hagas en el editor de Shopify se guardan como commits
en `main`. Antes de editar archivos en tu PC, hacé `git pull`.

## Pendientes de configurar en el editor

- **Redes sociales:** Configuración del tema → Social media.
- **Guía de talles:** crear una página con el handle `size-guide`. El bloque
  "Size guide" de la página de producto la muestra sola.
- **Reseñas en producto:** en la plantilla de producto, sección "Apps",
  agregar el bloque de reseñas de Judge.me.
- **Barra de anuncio:** los textos actuales son genéricos. Si hay envío gratis
  desde cierto monto, agregarlo ahí.
- **Colores de swatches:** si aparece un color con rayas grises, agregarlo en
  Configuración del tema → Color swatches (`Nombre: #hex`).

## Calidad

Cada push corre [Theme Check](https://shopify.dev/docs/storefronts/themes/tools/theme-check)
en GitHub Actions (`.github/workflows/ci.yml`).
