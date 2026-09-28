/* =========================================================
   BHIMEJUNG — client-side shopping demo
   No backend: all data is generated locally, cart persists
   only in memory / localStorage for this browser.
   ========================================================= */

/* ---------- Category catalogue ---------- */
const CATEGORY_META = {
  food: { label: "Food", color: "2E7D32" },
  gents: { label: "Fashion (Gents)", color: "1B3A57" },
  ladies: { label: "Fashion (Ladies)", color: "AD1457" },
  babies: { label: "Fashion (Babies)", color: "0288A8" },
  electronics: { label: "Electronics", color: "37474F" },
  household: { label: "Household", color: "6D4C22" },
  others: { label: "Others", color: "5E35B1" },
};

/* ---------- Products are defined in index.html ----------
   Every product lives in <div id="product-data"> inside index.html.
   Edit a product's data-img attribute to point at your own photo,
   e.g. data-img="Images/products/food-basmati-rice.jpg".
   If the file is missing, a coloured placeholder is drawn instead. */

function readProducts() {
  const nodes = document.querySelectorAll("#product-data .product");
  return Array.from(nodes).map((el) => {
    const d = el.dataset;
    return {
      id: parseInt(d.id, 10),
      category: d.category,
      name: d.name,
      desc: d.desc || "",
      price: parseFloat(d.price),
      original: parseFloat(d.original || d.price),
      discountPct: parseInt(d.discount || "0", 10),
      rating: parseFloat(d.rating || "4"),
      reviews: parseInt(d.reviews || "0", 10),
      img: d.img || "",
    };
  });
}

let PRODUCTS = [];

/* Placeholder drawn when a product has no photo file yet. */
function placeholderImg(name, category) {
  const color = "#" + ((CATEGORY_META[category] || {}).color || "888888");
  const words = String(name).split(/\s+/);
  const lines = [];
  let line = "";
  words.forEach((w) => {
    if ((line + " " + w).trim().length > 16) { lines.push(line.trim()); line = w; }
    else { line += " " + w; }
  });
  if (line.trim()) lines.push(line.trim());
  const text = lines.slice(0, 4).map((t, i) =>
    `<text x="200" y="${200 - (lines.length - 1) * 16 + i * 32}" font-family="sans-serif" ` +
    `font-size="24" fill="#ffffff" text-anchor="middle" dominant-baseline="middle">` +
    `${t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")}</text>`
  ).join("");
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400">` +
    `<rect width="400" height="400" fill="${color}"/>${text}</svg>`;
  return "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
}

/* Called from an image's onerror when the photo file is missing. */
function imgFallback(el) {
  el.onerror = null;
  el.src = placeholderImg(el.dataset.name || el.alt || "", el.dataset.cat || "");
  el.classList.add("is-placeholder");
}

/* ---------- Cart (in-memory, backed by localStorage) ---------- */
let cart = {};
try {
  const saved = localStorage.getItem("bhimejung_cart");
  if (saved) cart = JSON.parse(saved);
} catch (e) { cart = {}; }

function saveCart() {
  try { localStorage.setItem("bhimejung_cart", JSON.stringify(cart)); } catch (e) { /* ignore */ }
}

function cartCount() {
  return Object.values(cart).reduce((sum, q) => sum + q, 0);
}

function addToCart(id) {
  cart[id] = (cart[id] || 0) + 1;
  saveCart();
  renderCartBadge();
  flashAdded(id);
}

function changeQty(id, delta) {
  if (!cart[id]) return;
  cart[id] += delta;
  if (cart[id] <= 0) delete cart[id];
  saveCart();
  renderCartBadge();
  renderCartDrawer();
}

function removeFromCart(id) {
  delete cart[id];
  saveCart();
  renderCartBadge();
  renderCartDrawer();
}

function flashAdded(id) {
  const btn = document.querySelector(`.add-btn[data-id="${id}"]`);
  if (!btn) return;
  const original = btn.textContent;
  btn.textContent = "Added ✓";
  btn.classList.add("added");
  setTimeout(() => { btn.textContent = original; btn.classList.remove("added"); }, 900);
}

function renderCartBadge() {
  document.getElementById("cart-count").textContent = cartCount();
}

function money(n) {
  return "Rs. " + n.toLocaleString("en-IN");
}

/* ---------- Rendering ---------- */
function starString(rating) {
  const full = Math.round(rating);
  return "★".repeat(full) + "☆".repeat(5 - full);
}

function productCard(p) {
  const discountTag = p.discountPct > 0
    ? `<span class="discount-tag">-${p.discountPct}%</span>`
    : "";
  const originalPrice = p.discountPct > 0
    ? `<span class="original-price">${money(p.original)}</span>`
    : "";
  return `
    <article class="product-card" data-category="${p.category}">
      <div class="card-img-wrap">
        <img src="${escapeAttr(p.img)}" alt="${escapeAttr(p.name)}" loading="lazy"
             data-name="${escapeAttr(p.name)}" data-cat="${p.category}" onerror="imgFallback(this)">
      </div>
      <h3 class="card-title">${escapeAttr(p.name)}</h3>
      <p class="card-desc">${escapeAttr(p.desc)}</p>
      <div class="card-rating">
        <span class="stars">${starString(p.rating)}</span>
        <span class="rating-num">${p.rating}</span>
        <span class="review-count">(${p.reviews.toLocaleString("en-IN")})</span>
      </div>
      <div class="card-price-row">
        <span class="price">${money(p.price)}</span>
        ${originalPrice} ${discountTag}
      </div>
      <button class="add-btn" data-id="${p.id}" onclick="addToCart(${p.id})">Add to Cart</button>
    </article>`;
}

function renderHome() {
  const container = document.getElementById("home-sections");
  container.innerHTML = "";
  Object.keys(CATEGORY_META).forEach((catKey) => {
    const all = PRODUCTS.filter((p) => p.category === catKey);
    const total = all.length;
    const items = all.slice(0, 10);
    const section = document.createElement("section");
    section.className = "category-row";
    section.innerHTML = `
      <div class="category-row-head">
        <h2>${CATEGORY_META[catKey].label}</h2>
        <a href="#" class="see-more" data-cat="${catKey}">See all ${total} &rarr;</a>
      </div>
      <div class="scroll-row">
        ${items.map(productCard).join("")}
      </div>`;
    container.appendChild(section);
  });
  container.querySelectorAll(".see-more").forEach((a) => {
    a.addEventListener("click", (e) => {
      e.preventDefault();
      showCategoryPage(a.dataset.cat);
    });
  });
}

let currentSort = "relevance";
let currentCategory = null;

function showCategoryPage(catKey) {
  currentCategory = catKey;
  document.getElementById("home-view").classList.add("hidden");
  document.getElementById("category-view").classList.remove("hidden");
  document.getElementById("search-input").value = "";
  document.getElementById("category-title").textContent = CATEGORY_META[catKey].label;
  renderCategoryGrid();
  window.scrollTo(0, 0);
}

function showHome() {
  currentCategory = null;
  document.getElementById("category-view").classList.add("hidden");
  document.getElementById("search-results-view").classList.add("hidden");
  document.getElementById("home-view").classList.remove("hidden");
  window.scrollTo(0, 0);
}

function renderCategoryGrid() {
  let items = PRODUCTS.filter((p) => p.category === currentCategory);
  items = sortItems(items, currentSort);
  document.getElementById("category-grid").innerHTML = items.map(productCard).join("");
}

function sortItems(items, mode) {
  const arr = items.slice();
  if (mode === "price-asc") arr.sort((a, b) => a.price - b.price);
  else if (mode === "price-desc") arr.sort((a, b) => b.price - a.price);
  else if (mode === "rating") arr.sort((a, b) => b.rating - a.rating);
  return arr;
}

function runSearch(query) {
  const q = query.trim().toLowerCase();
  document.getElementById("home-view").classList.add("hidden");
  document.getElementById("category-view").classList.add("hidden");
  const resultsView = document.getElementById("search-results-view");
  resultsView.classList.remove("hidden");
  if (!q) {
    resultsView.innerHTML = `<p class="no-results">Type something to search BHIMEJUNG.</p>`;
    return;
  }
  const matches = PRODUCTS.filter((p) =>
    p.name.toLowerCase().includes(q) ||
    p.desc.toLowerCase().includes(q) ||
    CATEGORY_META[p.category].label.toLowerCase().includes(q)
  );
  resultsView.innerHTML = `
    <h2 class="results-heading">${matches.length} results for "${escapeHtml(query)}"</h2>
    <div class="grid-view">${matches.map(productCard).join("") || `<p class="no-results">No products matched your search.</p>`}</div>`;
}

function escapeAttr(str) {
  return String(str)
    .replace(/&/g, "&amp;").replace(/"/g, "&quot;")
    .replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

/* ---------- Cart drawer ---------- */
function renderCartDrawer() {
  const body = document.getElementById("cart-drawer-body");
  const ids = Object.keys(cart);
  if (ids.length === 0) {
    body.innerHTML = `<p class="cart-empty">Your cart is empty. Start adding some products!</p>`;
    document.getElementById("cart-total").textContent = money(0);
    return;
  }
  let total = 0;
  body.innerHTML = ids.map((id) => {
    const p = PRODUCTS.find((x) => x.id == id);
    const qty = cart[id];
    const lineTotal = p.price * qty;
    total += lineTotal;
    return `
      <div class="cart-item">
        <img src="${escapeAttr(p.img)}" alt="${escapeAttr(p.name)}"
             data-name="${escapeAttr(p.name)}" data-cat="${p.category}" onerror="imgFallback(this)">
        <div class="cart-item-info">
          <p class="cart-item-name">${escapeAttr(p.name)}</p>
          <p class="cart-item-price">${money(p.price)}</p>
          <div class="qty-control">
            <button onclick="changeQty(${id}, -1)">−</button>
            <span>${qty}</span>
            <button onclick="changeQty(${id}, 1)">+</button>
          </div>
        </div>
        <button class="remove-btn" onclick="removeFromCart(${id})" title="Remove">✕</button>
      </div>`;
  }).join("");
  document.getElementById("cart-total").textContent = money(total);
}

function toggleCart(forceOpen) {
  const drawer = document.getElementById("cart-drawer");
  const overlay = document.getElementById("cart-overlay");
  const shouldOpen = forceOpen !== undefined ? forceOpen : drawer.classList.contains("closed");
  if (shouldOpen) {
    renderCartDrawer();
    drawer.classList.remove("closed");
    overlay.classList.remove("hidden");
  } else {
    drawer.classList.add("closed");
    overlay.classList.add("hidden");
  }
}

function checkout() {
  if (cartCount() === 0) return;
  const total = document.getElementById("cart-total").textContent;
  alert(`This is a demo store — no real payment is taken.\n\nOrder placed! Total: ${total}\nThank you for shopping with BHIMEJUNG.`);
  cart = {};
  saveCart();
  renderCartBadge();
  renderCartDrawer();
  toggleCart(false);
}

/* ---------- Nav wiring ---------- */
function wireNav() {
  document.querySelectorAll("[data-nav-cat]").forEach((el) => {
    el.addEventListener("click", (e) => {
      e.preventDefault();
      showCategoryPage(el.dataset.navCat);
    });
  });
  document.getElementById("logo-link").addEventListener("click", (e) => {
    e.preventDefault();
    showHome();
  });
  document.getElementById("brand-home-link").addEventListener("click", (e) => {
    e.preventDefault();
    showHome();
  });

  document.getElementById("search-form").addEventListener("submit", (e) => {
    e.preventDefault();
    runSearch(document.getElementById("search-input").value);
  });

  document.getElementById("cart-btn").addEventListener("click", () => toggleCart(true));
  document.getElementById("cart-close").addEventListener("click", () => toggleCart(false));
  document.getElementById("cart-overlay").addEventListener("click", () => toggleCart(false));
  document.getElementById("checkout-btn").addEventListener("click", checkout);

  document.getElementById("sort-select").addEventListener("change", (e) => {
    currentSort = e.target.value;
    renderCategoryGrid();
  });

  document.getElementById("back-to-home").addEventListener("click", (e) => {
    e.preventDefault();
    showHome();
  });
}

document.addEventListener("DOMContentLoaded", () => {
  PRODUCTS = readProducts();
  // drop any saved cart entries for products that no longer exist
  Object.keys(cart).forEach((id) => {
    if (!PRODUCTS.some((p) => p.id == id)) delete cart[id];
  });
  saveCart();
  renderHome();
  wireNav();
  renderCartBadge();
});
