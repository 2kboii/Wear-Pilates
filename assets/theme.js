/* Wear Pilates theme — vanilla JS, no dependencies. */
(() => {
  const theme = window.theme || { routes: {}, strings: {} };
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  /* ---------- Header height (mobile drawer offset) ---------- */
  const setHeaderBottom = () => {
    const header = $('[data-header]');
    if (!header) return;
    const bottom = Math.max(0, header.getBoundingClientRect().bottom);
    document.documentElement.style.setProperty('--header-bottom', `${bottom}px`);
  };
  window.addEventListener('resize', setHeaderBottom, { passive: true });
  window.addEventListener('scroll', setHeaderBottom, { passive: true });
  document.addEventListener('DOMContentLoaded', setHeaderBottom);

  const menuDrawer = $('[data-menu-drawer]');
  if (menuDrawer) {
    menuDrawer.addEventListener('toggle', () => {
      setHeaderBottom();
      document.body.classList.toggle('has-drawer', menuDrawer.open);
    });
  }

  /* ---------- Carousels ---------- */
  $$('[data-carousel]').forEach((root) => {
    const track = $('[data-carousel-track]', root);
    const prev = $('[data-carousel-prev]', root);
    const next = $('[data-carousel-next]', root);
    if (!track || !prev || !next) return;
    const step = () => {
      const item = track.firstElementChild;
      const gap = parseFloat(getComputedStyle(track).columnGap) || 0;
      return item ? item.getBoundingClientRect().width + gap : track.clientWidth;
    };
    const update = () => {
      prev.disabled = track.scrollLeft <= 2;
      next.disabled = track.scrollLeft + track.clientWidth >= track.scrollWidth - 2;
    };
    prev.addEventListener('click', () => track.scrollBy({ left: -step(), behavior: 'smooth' }));
    next.addEventListener('click', () => track.scrollBy({ left: step(), behavior: 'smooth' }));
    track.addEventListener('scroll', update, { passive: true });
    update();
  });

  /* ---------- Facets: submit on change ---------- */
  $$('[data-facets-form]').forEach((form) => {
    $$('[data-facets-autosubmit], input[type="checkbox"]', form).forEach((el) => {
      el.addEventListener('change', () => form.requestSubmit());
    });
    form.addEventListener('submit', () => {
      // Drop empty price inputs so URLs stay clean.
      $$('input[type="number"]', form).forEach((input) => { if (input.value === '') input.disabled = true; });
    });
  });

  /* ---------- Cart page: update quantity on change ---------- */
  $$('[data-cart-autosubmit]').forEach((input) => {
    input.addEventListener('change', () => input.form.requestSubmit());
  });

  /* ---------- Cart drawer ---------- */
  const drawer = $('[data-cart-drawer]');
  let lastFocus = null;

  const updateCount = (count) => {
    $$('[data-cart-count]').forEach((el) => {
      el.textContent = count;
      el.classList.toggle('is-empty', Number(count) === 0);
    });
  };

  const openDrawer = () => {
    if (!drawer) return;
    lastFocus = document.activeElement;
    drawer.hidden = false;
    requestAnimationFrame(() => drawer.classList.add('is-open'));
    document.body.classList.add('has-drawer');
    $('.drawer__panel', drawer).focus();
  };

  const closeDrawer = () => {
    if (!drawer) return;
    drawer.classList.remove('is-open');
    document.body.classList.remove('has-drawer');
    setTimeout(() => { drawer.hidden = true; }, 300);
    if (lastFocus) lastFocus.focus();
  };

  const renderDrawer = (html) => {
    if (!drawer || !html) return;
    const doc = new DOMParser().parseFromString(html, 'text/html');
    const fresh = $('[data-cart-drawer-content]', doc);
    const current = $('[data-cart-drawer-content]', drawer);
    if (fresh && current) {
      current.replaceWith(fresh);
      updateCount(fresh.dataset.cartCountValue);
    }
  };

  if (drawer && theme.cartType === 'drawer') {
    $$('[data-cart-open]').forEach((link) => {
      link.addEventListener('click', (event) => {
        if (document.body.classList.contains('template-cart')) return;
        event.preventDefault();
        openDrawer();
      });
    });

    drawer.addEventListener('click', async (event) => {
      if (event.target.closest('[data-cart-close]')) {
        closeDrawer();
        return;
      }
      const qtyButton = event.target.closest('[data-cart-qty]');
      if (!qtyButton) return;
      const line = qtyButton.closest('[data-line]');
      drawer.classList.add('is-loading');
      try {
        const res = await fetch(`${theme.routes.cartChange}.js`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify({
            line: Number(line.dataset.line),
            quantity: Number(qtyButton.dataset.cartQty),
            sections: ['cart-drawer'],
            sections_url: window.location.pathname
          })
        });
        const data = await res.json();
        if (data.sections) renderDrawer(data.sections['cart-drawer']);
      } catch (e) {
        window.location.href = theme.routes.cart;
      } finally {
        drawer.classList.remove('is-loading');
      }
    });

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && drawer.classList.contains('is-open')) closeDrawer();
    });
  }

  /* ---------- Product page ---------- */
  $$('[data-product]').forEach((root) => {
    const form = $('form.product-form', root);
    const idInput = $('[data-variant-id]', root);
    const button = $('[data-add-to-cart]', root);
    const buttonText = $('[data-add-to-cart-text]', root);
    const errorEl = $('[data-product-error]', root);
    const priceEl = $('[data-product-price]', root);
    const picker = $('[data-variant-picker]', root);
    const jsonEl = picker && $('[data-product-json]', picker);
    const product = jsonEl ? JSON.parse(jsonEl.textContent) : null;
    const gallery = $('[data-product-gallery]', root);

    const formatMoney = (cents) => {
      const fmt = window.Shopify && window.Shopify.currency ? window.Shopify.currency.active : 'USD';
      try {
        return new Intl.NumberFormat(document.documentElement.lang || 'en', { style: 'currency', currency: fmt }).format(cents / 100);
      } catch (e) {
        return `$${(cents / 100).toFixed(2)}`;
      }
    };

    const selectedOptions = () =>
      $$('.variant-picker__option', picker).map((fs) => {
        const checked = $('input:checked', fs);
        return checked ? checked.value : null;
      });

    const findVariant = (opts) =>
      product.variants.find((v) => v.options.every((value, i) => value === opts[i]));

    const markAvailability = (opts) => {
      $$('.variant-picker__option', picker).forEach((fs, index) => {
        $$('input[data-option-value]', fs).forEach((input) => {
          const candidate = opts.slice();
          candidate[index] = input.value;
          const match = product.variants.find(
            (v) => v.available && v.options.every((value, i) => value === candidate[i])
          );
          const label = input.nextElementSibling;
          if (label) label.classList.toggle('is-unavailable', !match);
        });
      });
    };

    const showMedia = (variant) => {
      if (!gallery || !variant || !variant.featured_media) return;
      const item = $(`[data-media-id="${variant.featured_media.id}"]`, gallery);
      if (!item) return;
      const list = item.parentElement;
      if (list.scrollWidth > list.clientWidth) {
        list.scrollTo({ left: item.offsetLeft, behavior: 'smooth' });
      } else if (item !== list.firstElementChild) {
        list.prepend(item);
      }
    };

    const updateVariant = () => {
      const opts = selectedOptions();
      const variant = findVariant(opts);

      $$('.variant-picker__option', picker).forEach((fs, i) => {
        const label = $('[data-option-selected]', fs);
        if (label) label.textContent = opts[i] || '';
      });
      markAvailability(opts);

      if (!variant) {
        button.disabled = true;
        buttonText.textContent = theme.strings.unavailable;
        return;
      }

      idInput.value = variant.id;
      button.disabled = !variant.available;
      buttonText.textContent = variant.available ? theme.strings.addToCart : theme.strings.soldOut;

      if (priceEl) {
        const onSale = variant.compare_at_price && variant.compare_at_price > variant.price;
        priceEl.innerHTML =
          `<span class="price${onSale ? ' price--sale' : ''}">` +
          `<span class="price__current">${formatMoney(variant.price)}</span>` +
          (onSale ? `<s class="price__compare">${formatMoney(variant.compare_at_price)}</s>` : '') +
          `</span>`;
      }

      const url = new URL(window.location.href);
      url.searchParams.set('variant', variant.id);
      window.history.replaceState({}, '', url.toString());
      showMedia(variant);
    };

    if (picker && product) {
      picker.addEventListener('change', updateVariant);
      markAvailability(selectedOptions());
    }

    // Mobile gallery counter
    if (gallery) {
      const list = $('.product__media-list', gallery);
      const counter = $('[data-media-index]', gallery);
      if (list && counter) {
        list.addEventListener('scroll', () => {
          const index = Math.round(list.scrollLeft / list.clientWidth) + 1;
          counter.textContent = index;
        }, { passive: true });
      }
    }

    // Ajax add to cart
    if (form && drawer && theme.cartType === 'drawer') {
      form.addEventListener('submit', async (event) => {
        event.preventDefault();
        if (button.disabled) return;
        errorEl.hidden = true;
        button.disabled = true;
        buttonText.textContent = theme.strings.adding;

        const body = new FormData(form);
        body.append('sections', 'cart-drawer');
        body.append('sections_url', window.location.pathname);

        try {
          const res = await fetch(`${theme.routes.cartAdd}.js`, {
            method: 'POST',
            headers: { Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
            body
          });
          const data = await res.json();
          if (!res.ok || data.status) {
            errorEl.textContent = data.description || data.message || theme.strings.cartError;
            errorEl.hidden = false;
          } else {
            renderDrawer(data.sections && data.sections['cart-drawer']);
            openDrawer();
          }
        } catch (e) {
          form.submit();
        } finally {
          button.disabled = false;
          buttonText.textContent = theme.strings.addToCart;
        }
      });
    }
  });

  /* ---------- Product recommendations ---------- */
  $$('[data-recommendations]').forEach(async (el) => {
    if (el.children.length) return;
    try {
      const res = await fetch(el.dataset.url);
      const html = await res.text();
      const doc = new DOMParser().parseFromString(html, 'text/html');
      const fresh = $('[data-recommendations]', doc);
      if (fresh && fresh.innerHTML.trim()) el.innerHTML = fresh.innerHTML;
    } catch (e) {
      /* recommendations are optional */
    }
  });
})();
