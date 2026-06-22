(function () {
  const contacts = window.TP_CONTACTS || {};
  const products = Array.isArray(window.TP_PRODUCTS) ? window.TP_PRODUCTS : [];
  const markItems = Array.isArray(window.TP_MARK_ITEMS) ? window.TP_MARK_ITEMS : [];
  const groups = Array.isArray(window.TP_GROUPS) ? window.TP_GROUPS : [];
  const categories = Array.isArray(window.TP_CATEGORIES) ? window.TP_CATEGORIES : [];
  const solutions = Array.isArray(window.TP_SOLUTIONS) ? window.TP_SOLUTIONS : [];
  const articles = Array.isArray(window.TP_ARTICLES) ? window.TP_ARTICLES : [];
  const TELEGRAM_WEBHOOK_URL = "";
  const TELEGRAM_BOT_URL = "";
  const CATEGORY_CHILDREN = {
    "silovoy-kabel": ["silovoy-kabel", "silovoy-mednyy", "silovoy-alyuminievyy", "silovoy-vysokovoltnyy", "termoindikatornye-silovye"],
    "informatsionnye-kabeli": ["informatsionnye-kabeli", "kontrolnyy-kabel", "svyaz-i-seti", "vityaya-para", "spetskabel", "termoelektrodnye"],
    "svyaz-i-seti": ["svyaz-i-seti", "vityaya-para"],
    "gibkiy-kabel": ["gibkiy-kabel", "svarochnye-kabeli"],
    "spetskabel": ["spetskabel", "gornorudnye-kabeli", "vzryvoopasnye-kabeli", "seismostoykie-kabeli", "vodopogruzhnye-kabeli"]
  };
  const CATEGORY_IMAGES = {
    "silovoy-kabel": "assets/catalog-power-cables.png",
    "silovoy-mednyy": "assets/catalog-power-cables.png",
    "silovoy-alyuminievyy": "assets/catalog-power-cables.png",
    "silovoy-vysokovoltnyy": "assets/catalog-power-cables.png",
    "pozharnyy-kabel": "assets/cable-macro.png",
    "kontrolnyy-kabel": "assets/catalog-data-cables.png",
    "montazhnyy-provod": "assets/catalog-cable-accessories.png",
    "gibkiy-kabel": "assets/catalog-flex-sip-cables.png",
    "sip-samonesushchiy": "assets/catalog-flex-sip-cables.png",
    "informatsionnye-kabeli": "assets/catalog-data-cables.png",
    "svyaz-i-seti": "assets/catalog-data-cables.png",
    "vityaya-para": "assets/catalog-data-cables.png",
    "svarochnye-kabeli": "assets/catalog-flex-sip-cables.png",
    "sudovye-kabeli": "assets/catalog-power-cables.png",
    "spetskabel": "assets/catalog-power-cables.png",
    "termoelektrodnye": "assets/catalog-data-cables.png",
    "greyushchie-kabeli": "assets/pipe-inside.svg",
    "gornorudnye-kabeli": "assets/catalog-flex-sip-cables.png",
    "vzryvoopasnye-kabeli": "assets/catalog-power-cables.png",
    "seismostoykie-kabeli": "assets/catalog-power-cables.png",
    "vodopogruzhnye-kabeli": "assets/catalog-flex-sip-cables.png",
    "termoindikatornye-silovye": "assets/catalog-power-cables.png",
    "zashchita-i-kommutatsiya": "assets/electrical-switchgear.png",
    "shchitovoe-oborudovanie": "assets/electrical-switchgear.png",
    "kabelenesushchie-sistemy": "assets/electrical-switchgear.png",
    "montazhnye-izdeliya": "assets/catalog-cable-accessories.png",
    "kabelnye-mufty": "assets/catalog-cable-accessories.png"
  };

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));

  function escapeHtml(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function getCategory(slug) {
    return categories.find((category) => category.slug === slug);
  }

  function getGroup(slug) {
    return groups.find((group) => group.slug === slug);
  }

  function productUrl(product) {
    return `product.html?slug=${encodeURIComponent(product.slug)}`;
  }

  function markUrl(item) {
    return `product.html?mark=${encodeURIComponent(item.slug)}`;
  }

  function markFamilyUrl(group) {
    const category = getCategory(group.category);
    const kind = category?.kind || group.representative.kind || "all";
    return `catalog.html?kind=${encodeURIComponent(kind)}&category=${encodeURIComponent(group.category)}&family=${encodeURIComponent(group.mark)}`;
  }

  function currentCatalogFamily() {
    return new URLSearchParams(window.location.search).get("family") || "";
  }

  function clearCatalogFamilyParam() {
    const params = new URLSearchParams(window.location.search);
    if (!params.has("family")) return;
    params.delete("family");
    const query = params.toString();
    window.history.replaceState({}, "", `catalog.html${query ? `?${query}` : ""}`);
  }

  function categorySlugs(slug) {
    return CATEGORY_CHILDREN[slug] || [slug];
  }

  function categoryCount(slug) {
    const slugs = categorySlugs(slug);
    return products.filter((product) => slugs.includes(product.category)).length + markItems.filter((item) => slugs.includes(item.category)).length;
  }

  function categorySamples(slug) {
    const seen = new Set();
    const slugs = categorySlugs(slug);
    return markItems
      .filter((item) => slugs.includes(item.category))
      .map((item) => item.mark || item.name)
      .filter((mark) => {
        const key = String(mark).toLowerCase();
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .slice(0, 4);
  }

  function categoryImage(slug) {
    return CATEGORY_IMAGES[slug] || "assets/cable-macro.png";
  }

  function formatAvailability(item) {
    if (!Number(item.availableM)) return "по запросу";
    const unit = item.availableUnit || (item.kind === "electrical" ? "шт." : "м");
    return `${Number(item.availableM).toLocaleString("ru-RU")} ${unit}`;
  }

  function priceUnit(item) {
    return item?.priceUnit || (item?.kind === "electrical" ? "шт." : "м");
  }

  function formatPrice(value, unit = "м") {
    if (!Number(value)) return "Запросить";
    const suffix = unit ? `/${unit}` : "";
    return `${Number(value).toLocaleString("ru-RU", { maximumFractionDigits: 2 })} ₽${suffix}`;
  }

  function priceCell(item) {
    if (Number(item.pricePerM)) return escapeHtml(formatPrice(item.pricePerM, priceUnit(item)));
    return `<button class="price-request-link" type="button" data-request-mark="${escapeHtml(item.slug)}">Запросить</button>`;
  }

  function renderDocumentList(documents = []) {
    if (!documents.length) return "<li>сертификаты, паспорта и декларации по запросу</li>";
    return documents.map((item) => {
      if (typeof item === "string") return `<li>${escapeHtml(item)}</li>`;
      const label = item.label || item.name || item.title || "Документ";
      if (item.url) return `<li><a href="${escapeHtml(item.url)}" target="_blank" rel="noopener nofollow">${escapeHtml(label)}</a></li>`;
      return `<li>${escapeHtml(label)}</li>`;
    }).join("");
  }

  function extraSpecRows(item) {
    return Object.entries(item.specs || {})
      .filter(([, value]) => value !== undefined && value !== null && value !== "")
      .map(([key, value]) => `<tr><th>${escapeHtml(key)}</th><td>${escapeHtml(value)}</td></tr>`)
      .join("");
  }

  function baseMarkName(item) {
    return String(item.mark || item.name || "")
      .replace(/\s*[-–]\s*(?:0[,.\d]|1кВ|6кВ|10кВ|20кВ|35кВ|220|380|450|660|750).*/i, "")
      .replace(/\s+/g, " ")
      .trim() || item.name;
  }

  function markFamilies(items) {
    const map = new Map();
    items.forEach((item) => {
      const mark = baseMarkName(item);
      const key = `${item.category}|${mark.toLowerCase()}`;
      if (!map.has(key)) {
        map.set(key, { mark, category: item.category, items: [], representative: item });
      }
      const group = map.get(key);
      group.items.push(item);
      if (item.section === "справочная серия" || (!group.representative.section && item.section)) {
        group.representative = item;
      }
    });
    map.forEach((group) => {
      group.items = concreteOrAll(group.items).sort(compareCatalogItems);
      group.representative = group.items[0] || group.representative;
    });
    return Array.from(map.values()).sort((a, b) => a.mark.localeCompare(b.mark, "ru"));
  }

  function sectionSortValues(section) {
    return String(section || "")
      .replace(/,/g, ".")
      .match(/\d+(?:\.\d+)?/g)
      ?.map(Number) || [];
  }

  function compareSections(a, b) {
    const left = sectionSortValues(a);
    const right = sectionSortValues(b);
    const length = Math.max(left.length, right.length);
    for (let index = 0; index < length; index += 1) {
      const diff = (left[index] || 0) - (right[index] || 0);
      if (diff) return diff;
    }
    return String(a || "").localeCompare(String(b || ""), "ru", { numeric: true });
  }

  function compareCatalogItems(a, b) {
    return baseMarkName(a).localeCompare(baseMarkName(b), "ru", { numeric: true })
      || compareSections(a.section, b.section)
      || String(a.name || "").localeCompare(String(b.name || ""), "ru", { numeric: true });
  }

  function isReferenceOnlyItem(item) {
    return item?.section === "справочная серия";
  }

  function concreteOrAll(items) {
    const concrete = items.filter((item) => !isReferenceOnlyItem(item));
    return concrete.length ? concrete : items;
  }

  function productCard(product, compact) {
    const category = getCategory(product.category);
    const badges = (product.badges || []).slice(0, compact ? 2 : 4);
    return `<article class="product-card reveal is-clickable" data-card-url="${productUrl(product)}">
      <a class="product-image-link" href="${productUrl(product)}" aria-label="${escapeHtml(product.name)}">
        <img src="${escapeHtml(product.image)}" alt="${escapeHtml(product.name)}" loading="lazy">
      </a>
      <div class="product-card-body">
        <div class="product-meta">
          <span>${escapeHtml(category?.name || "Каталог")}</span>
          <span>${escapeHtml(product.mark)}</span>
        </div>
        <h3><a href="${productUrl(product)}">${escapeHtml(product.name)}</a></h3>
        <p>${escapeHtml(product.description)}</p>
        <div class="tag-row">${badges.map((badge) => `<span>${escapeHtml(badge)}</span>`).join("")}</div>
      </div>
      <div class="product-card-actions">
        <button class="button primary" type="button" data-request-product="${escapeHtml(product.slug)}">Отправить запрос</button>
        <a class="button secondary" href="${productUrl(product)}">Характеристики</a>
      </div>
    </article>`;
  }

  function renderFeaturedProducts() {
    const root = $("#featuredProducts");
    if (!root) return;
    const featured = ["vvgng-ls", "vbshvng-ls", "kvvgng-ls", "sip-4", "automatic-breakers", "cable-trays"]
      .map((slug) => products.find((product) => product.slug === slug))
      .filter(Boolean);
    root.innerHTML = featured.map((product) => productCard(product, true)).join("");
  }

  function renderCategoryLinks() {
    const root = $("#categoryLinks");
    if (!root) return;
    root.innerHTML = categories
      .map((category) => {
        const count = categoryCount(category.slug);
        const group = getGroup(category.kind);
        return `<a class="category-tile reveal" href="catalog.html?kind=${encodeURIComponent(category.kind)}&category=${encodeURIComponent(category.slug)}">
          <span>${escapeHtml(group?.short || "Каталог")}</span>
          <strong>${escapeHtml(category.name)}</strong>
          <small>${count} ${plural(count, "позиция", "позиции", "позиций")}</small>
        </a>`;
      })
      .join("");
  }

  function renderSolutionCards() {
    const root = $("#solutionCards");
    if (!root) return;
    root.innerHTML = solutions
      .map((solution, index) => `<article class="solution-card reveal">
        <span>${String(index + 1).padStart(2, "0")}</span>
        <h3>${escapeHtml(solution.name)}</h3>
        <p>${escapeHtml(solution.text)}</p>
        <a href="solutions.html#${escapeHtml(solution.slug)}">Подробнее</a>
      </article>`)
      .join("");
  }

  function renderArticleCards() {
    const root = $("#articleCards");
    if (!root) return;
    const articleLinks = {
      "markirovka-kabelya": "catalog.html",
      "ng-ls-frls": "catalog.html?kind=cable&category=pozharnyy-kabel",
      "sechenie-kabelya": "guide.html#calculators",
      "analog-kabelya": "catalog.html#request"
    };
    root.innerHTML = articles
      .map((article) => {
        const href = articleLinks[article.slug] || "catalog.html";
        return `<article class="article-card reveal is-clickable" id="${escapeHtml(article.slug)}" data-card-url="${escapeHtml(href)}">
        <h3>${escapeHtml(article.title)}</h3>
        <p>${escapeHtml(article.text)}</p>
        <a href="${escapeHtml(href)}">Открыть</a>
      </article>`;
      })
      .join("");
  }

  function renderMarkDirectory() {
    const root = $("#markDirectory");
    if (!root) return;
    root.innerHTML = categories
      .filter((category) => categoryCount(category.slug) > 0)
      .map((category) => {
        const count = categoryCount(category.slug);
        const samples = categorySamples(category.slug);
        return `<a class="category-tile reveal" href="catalog.html?kind=${encodeURIComponent(category.kind)}&category=${encodeURIComponent(category.slug)}">
          <span>${escapeHtml(getGroup(category.kind)?.short || "Каталог")}</span>
          <strong>${escapeHtml(category.name)}</strong>
          <small>${count} ${plural(count, "позиция", "позиции", "позиций")}</small>
          <em>${samples.map(escapeHtml).join(", ")}</em>
        </a>`;
      })
      .join("");
  }

  function bindCalculators() {
    $$("[data-calc]").forEach((form) => {
      const update = () => calculateForm(form);
      form.addEventListener("input", update);
      form.addEventListener("submit", (event) => event.preventDefault());
      update();
    });
  }

  function numberField(form, name) {
    return Number(new FormData(form).get(name)) || 0;
  }

  function calculateForm(form) {
    const type = form.dataset.calc;
    const data = new FormData(form);
    const result = $("[data-calc-result]", form);
    if (!result) return;

    if (type === "voltage-drop") {
      const phase = Number(data.get("phase")) || 3;
      const voltage = numberField(form, "voltage") || 380;
      const power = numberField(form, "power");
      const length = numberField(form, "length");
      const section = numberField(form, "section") || 1;
      const rho = Number(data.get("material")) || 0.018;
      const current = phase === 3 ? (power * 1000) / (1.732 * voltage * 0.9) : (power * 1000) / (voltage * 0.9);
      const coefficient = phase === 3 ? 1.732 : 2;
      const drop = coefficient * current * rho * length / section;
      const percent = voltage ? drop / voltage * 100 : 0;
      result.textContent = `Ток: ${current.toFixed(1)} А. Падение: ${drop.toFixed(1)} В (${percent.toFixed(2)}%).`;
      return;
    }

    if (type === "mass") {
      const length = numberField(form, "length");
      const kgkm = numberField(form, "kgkm");
      const price = numberField(form, "price");
      const reserve = numberField(form, "reserve");
      const fullLength = length * (1 + reserve / 100);
      const weight = fullLength * kgkm / 1000;
      const amount = fullLength * price;
      result.textContent = `К поставке: ${fullLength.toFixed(0)} м. Вес: ${weight.toFixed(1)} кг. Бюджет: ${formatPrice(amount, "")}.`;
      return;
    }

    if (type === "metal") {
      const cores = numberField(form, "cores") || 1;
      const section = numberField(form, "section");
      const length = numberField(form, "length");
      const density = Number(data.get("density")) || 8.96;
      const kg = cores * section * length * density / 1000;
      result.textContent = `Ориентировочная масса металла: ${kg.toFixed(2)} кг.`;
      return;
    }

    if (type === "mufta") {
      const voltage = data.get("voltage");
      const calcType = data.get("type");
      const armor = data.get("armor") === "yes";
      const inside = calcType === "end-inside";
      const outside = calcType === "end-outside";
      const joint = calcType === "joint";
      const transition = calcType === "transition";
      const repair = calcType === "repair";
      let series = "";
      if (voltage === "1") {
        if (joint) series = armor ? "1ПСтпБ / 1ПСТ(б)-1" : "1СТп / 1ПСтп";
        else if (transition) series = "1ПСТ / 1ПОТп";
        else if (repair) series = "1ПСтпР";
        else series = outside ? "1КНТп / 1ПКНТп" : "1КВТп / 1ПКВТп";
      } else if (voltage === "10") {
        if (joint) series = "10СТп / 10ПСТп";
        else if (transition) series = "10ПСТп / (1П+3Б)СПТ-10";
        else if (repair) series = "10РСТп / 10РКВТп";
        else series = outside ? "10КНТп / 10ПКНТп" : "10КВТп / 10ПКВТп";
      } else if (voltage === "20") {
        series = joint ? "20ПСТ" : outside ? "20ПКНТ" : "20ПКВТ";
      } else {
        series = joint ? "35ПСТ" : outside ? "35ПКНТ / ПКНТнгLS-HF-35" : "35ПКВТ / ПКВТнгLS-HF-35";
      }
      result.textContent = `Рекомендуемая серия: ${series}. Типоразмер уточняется по числу жил, сечению и конструкции кабеля.`;
    }
  }

  function renderCatalogFilters() {
    const kindSelect = $("#kindFilter");
    const categorySelect = $("#categoryFilter");
    const voltageSelect = $("#voltageFilter");
    if (!kindSelect || !categorySelect || !voltageSelect) return;

    const params = new URLSearchParams(window.location.search);
    const selectedKind = params.get("kind") || "all";
    const selectedCategory = params.get("category") || "all";

    kindSelect.innerHTML = '<option value="all">Все направления</option>' + groups
      .map((group) => `<option value="${escapeHtml(group.slug)}">${escapeHtml(group.name)}</option>`)
      .join("");
    kindSelect.value = selectedKind;

    categorySelect.innerHTML = '<option value="all">Все категории</option>' + categories
      .filter((category) => selectedKind === "all" || category.kind === selectedKind)
      .map((category) => `<option value="${escapeHtml(category.slug)}">${escapeHtml(category.name)}</option>`)
      .join("");
    categorySelect.value = selectedCategory;

    const productVoltages = products.flatMap((product) => Object.values(product.specs || {}))
      .filter((value) => /кВ|660 В|750 В|380/.test(String(value)))
      .map((value) => String(value).split(",")[0].trim());
    const markVoltages = markItems.map((item) => item.voltage).filter(Boolean);
    const voltages = Array.from(new Set([...productVoltages, ...markVoltages]))
      .slice(0, 8);
    voltageSelect.innerHTML = '<option value="all">Любое напряжение</option>' + voltages
      .map((voltage) => `<option value="${escapeHtml(voltage)}">${escapeHtml(voltage)}</option>`)
      .join("");
  }

  function renderSideCategoryList() {
    const root = $("#sideCategoryList");
    if (!root) return;
    const params = new URLSearchParams(window.location.search);
    const selectedCategory = $("#categoryFilter")?.value || params.get("category") || "all";
    const selectedKind = $("#kindFilter")?.value || params.get("kind") || "all";
    const rows = categories.filter((category) => categoryCount(category.slug) > 0);
    const allActive = selectedCategory === "all" && selectedKind === "all";
    root.innerHTML = `<a class="side-category-link${allActive ? " active" : ""}" href="catalog.html">
        <span>Все разделы</span>
        <small>${markItems.length} позиций</small>
      </a>` + groups.map((group) => {
        const groupCategories = rows.filter((category) => category.kind === group.slug);
        if (!groupCategories.length) return "";
        return `<div class="side-category-group">
          <p>${escapeHtml(group.short || group.name)}</p>
          ${groupCategories.map((category) => {
            const isActive = selectedCategory === category.slug;
            return `<a class="side-category-link${isActive ? " active" : ""}" href="catalog.html?kind=${encodeURIComponent(category.kind)}&category=${encodeURIComponent(category.slug)}" data-side-category="${escapeHtml(category.slug)}" data-side-kind="${escapeHtml(category.kind)}">
              <span>${escapeHtml(category.name)}</span>
              <small>${categoryCount(category.slug)} ${plural(categoryCount(category.slug), "позиция", "позиции", "позиций")}</small>
            </a>`;
          }).join("")}
        </div>`;
      }).join("");
  }

  function selectedCatalogProducts() {
    const query = ($("#catalogSearch")?.value || "").trim().toLowerCase();
    const kind = $("#kindFilter")?.value || "all";
    const category = $("#categoryFilter")?.value || "all";
    const voltage = $("#voltageFilter")?.value || "all";
    const purpose = $("#purposeFilter")?.value || "all";
    const categoryFilter = category === "all" ? [] : categorySlugs(category);

    return products.filter((product) => {
      const cat = getCategory(product.category);
      const searchable = [
        product.name,
        product.mark,
        product.description,
        cat?.name,
        product.applications?.join(" "),
        Object.values(product.specs || {}).join(" ")
      ].join(" ").toLowerCase();
      const matchesKind = kind === "all" || product.kind === kind;
      const matchesCategory = category === "all" || categoryFilter.includes(product.category);
      const matchesVoltage = voltage === "all" || Object.values(product.specs || {}).some((value) => String(value).includes(voltage));
      const matchesPurpose = purpose === "all" || searchable.includes(purpose);
      return matchesKind && matchesCategory && matchesVoltage && matchesPurpose && (!query || searchable.includes(query));
    });
  }

  function selectedCatalogItems() {
    const query = ($("#catalogSearch")?.value || "").trim().toLowerCase();
    const kind = $("#kindFilter")?.value || "all";
    const category = $("#categoryFilter")?.value || "all";
    const voltage = $("#voltageFilter")?.value || "all";
    const purpose = $("#purposeFilter")?.value || "all";
    const categoryFilter = category === "all" ? [] : categorySlugs(category);

    return markItems.filter((item) => {
      const cat = getCategory(item.category);
      const searchable = [
        item.name,
        item.mark,
        item.section,
        item.voltage,
        item.conductor,
        item.fireClass,
        item.construction,
        item.usage,
        cat?.name
      ].join(" ").toLowerCase();
      const matchesKind = kind === "all" || item.kind === kind || cat?.kind === kind;
      const matchesCategory = category === "all" || categoryFilter.includes(item.category);
      const matchesVoltage = voltage === "all" || searchable.includes(voltage.toLowerCase());
      const matchesPurpose = purpose === "all" || searchable.includes(purpose);
      return matchesKind && matchesCategory && matchesVoltage && matchesPurpose && (!query || searchable.includes(query));
    }).sort(compareCatalogItems);
  }

  function catalogCategoryCard(category) {
    const group = getGroup(category.kind);
    const count = categoryCount(category.slug);
    const samples = categorySamples(category.slug);
    return `<article class="catalog-category-card reveal is-clickable" data-card-url="catalog.html?kind=${encodeURIComponent(category.kind)}&category=${encodeURIComponent(category.slug)}">
      <a class="product-image-link" href="catalog.html?kind=${encodeURIComponent(category.kind)}&category=${encodeURIComponent(category.slug)}" aria-label="${escapeHtml(category.name)}">
        <img src="${escapeHtml(categoryImage(category.slug))}" alt="${escapeHtml(category.name)}" loading="lazy">
      </a>
      <div class="product-card-body">
        <div class="product-meta">
          <span>${escapeHtml(group?.short || "Каталог")}</span>
          <span>${count} ${plural(count, "позиция", "позиции", "позиций")}</span>
        </div>
        <h3><a href="catalog.html?kind=${encodeURIComponent(category.kind)}&category=${encodeURIComponent(category.slug)}">${escapeHtml(category.name)}</a></h3>
        <p>${escapeHtml(category.description)}</p>
        <div class="tag-row">${samples.map((sample) => `<span>${escapeHtml(sample)}</span>`).join("")}</div>
      </div>
      <div class="product-card-actions">
        <a class="button secondary" href="catalog.html?kind=${encodeURIComponent(category.kind)}&category=${encodeURIComponent(category.slug)}">Открыть марки</a>
      </div>
    </article>`;
  }

  function markTable(items, title = "Полный список по выбранному разделу", kicker = "Марконаименования") {
    if (!items.length) return "";
    return `<div class="mark-table-wrap reveal">
      <div class="mark-table-head">
        <div>
          <p class="section-kicker">${escapeHtml(kicker)}</p>
          <h2>${escapeHtml(title)}</h2>
        </div>
        <span>${items.length} ${plural(items.length, "строка", "строки", "строк")}</span>
      </div>
      <div class="mark-table-scroll">
        <table class="mark-table">
          <thead>
            <tr>
              <th>Марконаименование</th>
              <th>Сечение / типоразмер</th>
              <th>Напряжение</th>
              <th>Жила</th>
              <th>Исполнение</th>
              <th>Наличие</th>
              <th>Цена</th>
              <th>Действие</th>
            </tr>
          </thead>
          <tbody>
            ${items.map((item) => `<tr class="mark-row is-clickable" data-row-url="${markUrl(item)}">
              <td><a class="mark-name-link" href="${markUrl(item)}">${escapeHtml(item.name)}</a><small>${escapeHtml(item.mark)}</small></td>
              <td>${escapeHtml(item.section || "по запросу")}</td>
              <td>${escapeHtml(item.voltage || "по запросу")}</td>
              <td>${escapeHtml(item.conductor || "по запросу")}</td>
              <td>${escapeHtml(item.fireClass || item.construction || "по запросу")}</td>
              <td>${escapeHtml(formatAvailability(item))}</td>
              <td>${priceCell(item)}</td>
              <td>
                <div class="table-actions">
                  <a class="button secondary small" href="${markUrl(item)}">Характеристики</a>
                  <button class="button secondary small" type="button" data-request-mark="${escapeHtml(item.slug)}">Отправить запрос</button>
                </div>
              </td>
            </tr>`).join("")}
          </tbody>
        </table>
      </div>
    </div>`;
  }

  function markSearchResults(items) {
    if (!items.length) return "";
    const shown = items.slice(0, 12);
    return `<section class="search-result-panel reveal">
      <div class="mark-table-head compact-head">
        <div>
          <p class="section-kicker">Найденные позиции</p>
          <h2>Кликните по позиции, чтобы открыть характеристики</h2>
        </div>
        <span>${items.length} ${plural(items.length, "совпадение", "совпадения", "совпадений")}</span>
      </div>
      <div class="mark-mini-grid">${shown.map(markMiniCard).join("")}</div>
    </section>`;
  }

  function markFamilyPanel(items, title) {
    const families = markFamilies(items);
    if (!families.length) return "";
    return `<section class="mark-family-panel reveal">
      <div class="mark-table-head compact-head">
        <div>
          <p class="section-kicker">Марки раздела</p>
          <h2>${escapeHtml(title || "Выберите марку, чтобы открыть характеристики")}</h2>
        </div>
        <span>${families.length} ${plural(families.length, "марка", "марки", "марок")}</span>
      </div>
      <div class="mark-family-grid">${families.map(markFamilyCard).join("")}</div>
    </section>`;
  }

  function markFamilyCard(group) {
    const item = group.representative;
    const category = getCategory(group.category);
    const voltages = Array.from(new Set(group.items.map((row) => row.voltage).filter(Boolean))).slice(0, 2);
    const sections = Array.from(new Set(group.items.map((row) => row.section).filter(Boolean))).filter((section) => section !== "справочная серия").slice(0, 3);
    const href = markFamilyUrl(group);
    return `<article class="mark-family-card is-clickable" data-card-url="${href}">
      <div class="product-meta">
        <span>${escapeHtml(category?.name || "Каталог")}</span>
        <span>${group.items.length} ${plural(group.items.length, "маркоразмер", "маркоразмера", "маркоразмеров")}</span>
      </div>
      <h3><a href="${href}">${escapeHtml(group.mark)}</a></h3>
      <p>${escapeHtml(item.usage || item.construction || "Подбор по проектной спецификации.")}</p>
      <div class="tag-row">
        ${voltages.map((voltage) => `<span>${escapeHtml(voltage)}</span>`).join("")}
        ${sections.map((section) => `<span>${escapeHtml(section)}</span>`).join("")}
      </div>
      <a class="mark-card-link" href="${href}">Открыть все маркоразмеры</a>
    </article>`;
  }

  function markFamilyDetailPanel(items, familyName) {
    const category = getCategory(items[0]?.category);
    const backHref = category
      ? `catalog.html?kind=${encodeURIComponent(category.kind)}&category=${encodeURIComponent(category.slug)}`
      : "catalog.html";
    const voltages = Array.from(new Set(items.map((item) => item.voltage).filter(Boolean))).slice(0, 4);
    const sections = Array.from(new Set(items.map((item) => item.section).filter(Boolean))).filter((section) => section !== "справочная серия").slice(0, 6);
    return `<section class="family-detail-panel reveal">
      <div>
        <p class="section-kicker">Марка</p>
        <h2>${escapeHtml(familyName)}</h2>
        <p>Ниже собраны все маркоразмеры этой позиции. Откройте нужную строку, чтобы посмотреть характеристики, или отправьте запрос менеджеру.</p>
        <div class="tag-row">
          ${category ? `<span>${escapeHtml(category.name)}</span>` : ""}
          ${voltages.map((voltage) => `<span>${escapeHtml(voltage)}</span>`).join("")}
          ${sections.map((section) => `<span>${escapeHtml(section)}</span>`).join("")}
        </div>
      </div>
      <a class="button secondary" href="${backHref}">Назад к маркам раздела</a>
    </section>`;
  }

  function markMiniCard(item) {
    const category = getCategory(item.category);
    return `<article class="mark-mini-card reveal is-clickable" data-card-url="${markUrl(item)}">
      <div class="product-meta">
        <span>${escapeHtml(category?.name || "Каталог")}</span>
        <span>${escapeHtml(item.voltage || "по запросу")}</span>
      </div>
      <h3><a href="${markUrl(item)}">${escapeHtml(item.name)}</a></h3>
      <p>${escapeHtml(item.usage || item.construction || "Подбор по проектной спецификации.")}</p>
      <div class="tag-row">
        <span>${escapeHtml(item.section || "типоразмер по ТЗ")}</span>
        <span>${escapeHtml(formatAvailability(item))}</span>
      </div>
    </article>`;
  }

  function renderCatalog() {
    const root = $("#catalogGrid");
    if (!root) return;
    const query = ($("#catalogSearch")?.value || "").trim();
    const kind = $("#kindFilter")?.value || "all";
    const category = $("#categoryFilter")?.value || "all";
    const voltage = $("#voltageFilter")?.value || "all";
    const purpose = $("#purposeFilter")?.value || "all";
    const familyName = currentCatalogFamily();
    const overviewMode = !familyName && !query && category === "all" && voltage === "all" && purpose === "all";
    const count = $("#catalogCount");
    if (overviewMode) {
      const categoryRows = categories
        .filter((item) => (kind === "all" || item.kind === kind) && categoryCount(item.slug) > 0);
      root.className = "product-grid catalog-grid";
      if (count) count.textContent = `${categoryRows.length} ${plural(categoryRows.length, "раздел", "раздела", "разделов")}`;
      root.innerHTML = categoryRows.map(catalogCategoryCard).join("") || '<p class="empty-state">По выбранным условиям ничего не найдено. Отправьте спецификацию - подберем аналог вручную.</p>';
      renderSideCategoryList();
      bindCardLinks(root);
      observeReveals();
      return;
    }

    const productRows = selectedCatalogProducts();
    const markRows = selectedCatalogItems();
    if (familyName) {
      const familyRows = concreteOrAll(markRows.filter((item) => baseMarkName(item).toLowerCase() === familyName.toLowerCase())).sort(compareCatalogItems);
      root.className = "product-grid catalog-grid mark-results";
      if (count) count.textContent = `${familyRows.length} ${plural(familyRows.length, "маркоразмер", "маркоразмера", "маркоразмеров")}`;
      root.innerHTML = familyRows.length
        ? [
            markFamilyDetailPanel(familyRows, familyName),
            markTable(familyRows, `Все маркоразмеры: ${familyName}`, "Позиции марки")
          ].join("")
        : '<p class="empty-state">По выбранной марке ничего не найдено. Вернитесь в раздел каталога или отправьте спецификацию.</p>';
      bindRequestButtons(root);
      bindRowLinks(root);
      renderSideCategoryList();
      observeReveals();
      return;
    }
    const total = productRows.length + markRows.length;
    root.className = "product-grid catalog-grid mark-results";
    if (count) count.textContent = `${total} ${plural(total, "позиция", "позиции", "позиций")}`;
    const selectedCategory = category !== "all" ? getCategory(category) : null;
    root.innerHTML = [
      productRows.map((product) => productCard(product)).join(""),
      markFamilyPanel(markRows, query
        ? "Марки, найденные по запросу"
        : selectedCategory
          ? `Все марки: ${selectedCategory.name}`
          : "Все найденные марки"),
      query ? markSearchResults(markRows) : "",
      markTable(markRows)
    ].join("") || '<p class="empty-state">По выбранным условиям ничего не найдено. Отправьте спецификацию - подберем аналог вручную.</p>';
    bindRequestButtons(root);
    bindCardLinks(root);
    bindRowLinks(root);
    renderSideCategoryList();
    observeReveals();
  }

  function refreshCategoryFilter() {
    const kind = $("#kindFilter")?.value || "all";
    const categorySelect = $("#categoryFilter");
    if (!categorySelect) return;
    const current = categorySelect.value;
    const filtered = categories.filter((category) => kind === "all" || category.kind === kind);
    categorySelect.innerHTML = '<option value="all">Все категории</option>' + filtered
      .map((category) => `<option value="${escapeHtml(category.slug)}">${escapeHtml(category.name)}</option>`)
      .join("");
    categorySelect.value = filtered.some((category) => category.slug === current) ? current : "all";
    renderSideCategoryList();
  }

  function renderProductDetail() {
    const root = $("#productDetail");
    if (!root) return;
    const params = new URLSearchParams(window.location.search);
    const markSlug = params.get("mark");
    if (markSlug) {
      const item = markItems.find((row) => row.slug === markSlug);
      if (item) {
        renderMarkDetail(root, item);
        return;
      }
    }
    const slug = params.get("slug") || "vvgng-ls";
    const product = products.find((item) => item.slug === slug) || products[0];
    if (!product) return;

    document.title = `${product.h1} - ТЕХНОПРОГРЕСС`;
    const meta = $('meta[name="description"]');
    if (meta) meta.setAttribute("content", `${product.description} Запрос на поставку, подбор аналогов и коммерческое предложение.`);

    const specs = Object.entries(product.specs || {})
      .map(([key, value]) => `<tr><th>${escapeHtml(key)}</th><td>${escapeHtml(value)}</td></tr>`)
      .join("");
    const category = getCategory(product.category);
    const related = products
      .filter((item) => item.slug !== product.slug && (item.category === product.category || item.kind === product.kind))
      .slice(0, 3);

    root.innerHTML = `<section class="product-hero section">
      <div class="section-inner product-layout">
        <div class="product-visual reveal">
          <img src="${escapeHtml(product.image)}" alt="${escapeHtml(product.name)}">
        </div>
        <div class="product-main reveal">
          <p class="section-kicker">${escapeHtml(category?.name || "Каталог")}</p>
          <h1>${escapeHtml(product.h1)}</h1>
          <p class="lead">${escapeHtml(product.description)}</p>
          <div class="tag-row strong">${(product.badges || []).map((badge) => `<span>${escapeHtml(badge)}</span>`).join("")}</div>
          <div class="hero-actions">
            <button class="button primary" type="button" data-request-product="${escapeHtml(product.slug)}">Отправить запрос</button>
            <a class="button secondary" href="#productRequest">Загрузить спецификацию</a>
          </div>
        </div>
      </div>
    </section>
    <section class="section">
      <div class="section-inner detail-grid">
        <article class="detail-panel reveal">
          <p class="section-kicker">Характеристики</p>
          <h2>Технические параметры</h2>
          <table class="spec-table"><tbody>${specs}</tbody></table>
        </article>
        <article class="detail-panel reveal">
          <p class="section-kicker">Применение</p>
          <h2>Где используется</h2>
          <ul class="check-list">${(product.applications || []).map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>
          <h3>Популярные маркоразмеры</h3>
          <div class="tag-row">${(product.variants || []).map((item) => `<span>${escapeHtml(item)}</span>`).join("")}</div>
        </article>
        <article class="detail-panel reveal">
          <p class="section-kicker">Документы и аналоги</p>
          <h2>Что запросить вместе с КП</h2>
          <ul class="check-list document-links">${renderDocumentList(product.documents || [])}</ul>
          <h3>Возможные аналоги</h3>
          <p>${escapeHtml((product.analogs || []).join(", "))}</p>
        </article>
      </div>
    </section>
    <section class="section request-section" id="productRequest">
      <div class="section-inner request-grid">
        ${requestIntro("Запрос по товару", "Укажите количество, город и прикрепите спецификацию. Ответим по наличию, срокам и возможным аналогам.")}
        ${requestForm(product)}
      </div>
    </section>
    <section class="section">
      <div class="section-inner">
        <div class="section-head">
          <div>
            <p class="section-kicker">Похожие позиции</p>
            <h2>Похожие позиции для запроса</h2>
          </div>
          <a class="button secondary" href="catalog.html">Весь каталог</a>
        </div>
        <div class="product-grid">${related.map((item) => productCard(item, true)).join("")}</div>
      </div>
    </section>`;
    bindRequestButtons(root);
  }

  function renderMarkDetail(root, item) {
    const category = getCategory(item.category);
    const group = getGroup(category?.kind || item.kind);
    const image = categoryImage(item.category);
    const h1 = item.kind === "electrical" ? item.name : `${item.name}`;
    document.title = `${h1} - ТЕХНОПРОГРЕСС`;
    const meta = $('meta[name="description"]');
    if (meta) meta.setAttribute("content", `${item.name}: характеристики, наличие, цена по запросу и запрос на поставку в ООО ТЕХНОПРОГРЕСС.`);

    const specs = [
      ["Марка", item.mark],
      ["Категория", category?.name || group?.name || "Каталог"],
      ["Сечение / типоразмер", item.section || "по запросу"],
      ["Напряжение", item.voltage || "по запросу"],
      ["Материал жил / тип", item.conductor || "по запросу"],
      ["Пожарное исполнение", item.fireClass || "по запросу"],
      ["Конструкция", item.construction || "по запросу"],
      ["Применение", item.usage || "подбор по проектной спецификации"],
      ["Наличие", formatAvailability(item)],
      ["Цена", formatPrice(item.pricePerM, priceUnit(item))],
      ["Источник данных", item.source || "справочник ТЕХНОПРОГРЕСС"]
    ].map(([key, value]) => `<tr><th>${escapeHtml(key)}</th><td>${escapeHtml(value)}</td></tr>`).join("") + extraSpecRows(item);

    const documents = renderDocumentList(item.documents || []);
    const familyName = baseMarkName(item);
    const familyRows = concreteOrAll(markItems
      .filter((row) => row.category === item.category && baseMarkName(row).toLowerCase() === familyName.toLowerCase())
    ).sort(compareCatalogItems);

    const related = familyRows
      .filter((row) => row.slug !== item.slug)
      .slice(0, 6);

    root.innerHTML = `<section class="product-hero section">
      <div class="section-inner product-layout">
        <div class="product-visual reveal">
          <img src="${escapeHtml(image)}" alt="${escapeHtml(item.name)}">
        </div>
        <div class="product-main reveal">
          <p class="section-kicker">${escapeHtml(category?.name || group?.name || "Каталог")}</p>
          <h1>${escapeHtml(h1)}</h1>
          <p class="lead">${escapeHtml(item.usage || item.construction || "Подберем точный типоразмер, производителя, аналоги и срок поставки по спецификации.")}</p>
          <div class="tag-row strong">
            <span>${escapeHtml(item.mark || "марка")}</span>
            <span>${escapeHtml(item.section || "типоразмер по ТЗ")}</span>
            <span>${escapeHtml(item.voltage || "напряжение по запросу")}</span>
          </div>
          <div class="hero-actions">
            <button class="button primary" type="button" data-request-mark="${escapeHtml(item.slug)}">Отправить запрос</button>
            <a class="button secondary" href="catalog.html?kind=${encodeURIComponent(category?.kind || item.kind)}&category=${encodeURIComponent(item.category)}">Назад к разделу</a>
          </div>
        </div>
      </div>
    </section>
    <section class="section">
      <div class="section-inner detail-grid">
        <article class="detail-panel reveal">
          <p class="section-kicker">Характеристики</p>
          <h2>Параметры позиции</h2>
          <table class="spec-table"><tbody>${specs}</tbody></table>
        </article>
        <article class="detail-panel reveal">
          <p class="section-kicker">Запрос</p>
          <h2>Что уточнить при подборе</h2>
          <ul class="check-list">
            <li>нужное количество и единицу поставки</li>
            <li>производителя или допустимые аналоги</li>
            <li>условия прокладки и требования к пожарному исполнению</li>
            <li>город доставки и желаемый срок</li>
          </ul>
        </article>
        <article class="detail-panel reveal">
          <p class="section-kicker">Комплектация</p>
          <h2>Документы и комплектация</h2>
          <ul class="check-list document-links">${documents}</ul>
          <p>Можно запросить кабельные муфты, наконечники, лотки, крепеж и щитовое оборудование под тот же проект.</p>
        </article>
      </div>
    </section>
    <section class="section">
      <div class="section-inner">
        ${markTable(familyRows, `Все маркоразмеры: ${familyName}`, "Размерная линейка")}
      </div>
    </section>
    <section class="section request-section" id="productRequest">
      <div class="section-inner request-grid">
        ${requestIntro("Запрос по марке", "Укажите количество и объект - подготовим КП")}
        ${requestForm(item)}
      </div>
    </section>
    <section class="section">
      <div class="section-inner">
        <div class="section-head">
          <div>
            <p class="section-kicker">Похожие позиции</p>
            <h2>Другие марконаименования раздела</h2>
          </div>
          <a class="button secondary" href="catalog.html?kind=${encodeURIComponent(category?.kind || item.kind)}&category=${encodeURIComponent(item.category)}">Весь раздел</a>
        </div>
        <div class="mark-mini-grid">${related.map(markMiniCard).join("")}</div>
      </div>
    </section>`;
    bindRequestButtons(root);
    bindCardLinks(root);
    bindRowLinks(root);
  }

  function requestIntro(kicker, title) {
    return `<div class="request-copy reveal">
      <p class="section-kicker">${escapeHtml(kicker)}</p>
      <h2>${escapeHtml(title)}</h2>
      <p>Запрос откроется в почтовом клиенте. Когда будет готов Telegram-бот, этот же сценарий можно переключить на webhook без изменения формы.</p>
      <div class="request-contact">
        <a href="tel:${escapeHtml(contacts.phoneHref)}">${escapeHtml(contacts.phone)}</a>
        <a href="mailto:${escapeHtml(contacts.email)}">${escapeHtml(contacts.email)}</a>
      </div>
    </div>`;
  }

  function requestForm(product) {
    return `<form class="request-form reveal" data-request-form>
      <input type="hidden" name="product" value="${escapeHtml(product?.name || "")}">
      <div class="field-grid">
        <label>Имя<input name="name" autocomplete="name" required></label>
        <label>Телефон<input name="phone" autocomplete="tel" required></label>
        <label>Email<input name="email" type="email" autocomplete="email"></label>
        <label>Компания<input name="company" autocomplete="organization"></label>
        <label>ИНН<input name="inn" inputmode="numeric"></label>
        <label>Город доставки<input name="city" value="${escapeHtml(contacts.city || "")}"></label>
      </div>
      <label>Что нужно поставить<textarea name="items" rows="4" required>${escapeHtml(product ? product.name : "")}</textarea></label>
      <div class="field-grid">
        <label>Количество<input name="qty" placeholder="например: 500 м, 12 шт."></label>
        <label>Срок поставки<input name="deadline" placeholder="например: до конца недели"></label>
      </div>
      <label class="file-field">Спецификация XLS/PDF/DOC/JPG/PNG<input name="file" type="file" multiple></label>
      <label class="checkbox-field"><input name="analog" type="checkbox"> Нужен подбор аналога</label>
      <label>Комментарий<textarea name="comment" rows="3" placeholder="Укажите ГОСТ/ТУ, производителя, условия прокладки или особые требования"></textarea></label>
      <div class="channel-choice" role="group" aria-label="Канал отправки запроса">
        <p>Куда отправить запрос</p>
        <label class="channel-option"><input name="channel" type="radio" value="email" checked><span><strong>Email</strong><small>${escapeHtml(contacts.email || "почта компании")}</small></span></label>
        <label class="channel-option"><input name="channel" type="radio" value="telegram"><span><strong>Telegram-бот</strong><small>подключим после передачи бота</small></span></label>
      </div>
      <label class="checkbox-field"><input name="policy" type="checkbox" required> Согласен на обработку персональных данных</label>
      <button class="button primary full" type="submit">Отправить запрос</button>
      <p class="form-note" data-form-note></p>
    </form>`;
  }

  function renderInlineForms() {
    $$("[data-request-slot]").forEach((slot) => {
      const productSlug = slot.dataset.product || "";
      const product = products.find((item) => item.slug === productSlug);
      slot.innerHTML = requestForm(product);
    });
  }

  function bindForms() {
    $$("[data-request-form]").forEach((form) => {
      form.addEventListener("submit", submitRequest);
    });
  }

  async function submitRequest(event) {
    event.preventDefault();
    const form = event.currentTarget;
    if (!form.reportValidity()) return;
    const data = new FormData(form);
    const payload = {
      product: data.get("product") || "",
      name: data.get("name") || "",
      phone: data.get("phone") || "",
      email: data.get("email") || "",
      company: data.get("company") || "",
      inn: data.get("inn") || "",
      city: data.get("city") || "",
      items: data.get("items") || "",
      qty: data.get("qty") || "",
      deadline: data.get("deadline") || "",
      channel: data.get("channel") || "email",
      analog: data.get("analog") ? "да" : "нет",
      comment: data.get("comment") || "",
      files: Array.from(form.querySelector('input[type="file"]')?.files || []).map((file) => file.name)
    };

    const note = $("[data-form-note]", form);
    if (payload.channel === "telegram") {
      const sentToTelegram = await sendToTelegram(payload);
      if (sentToTelegram) {
        if (note) note.textContent = "Запрос отправлен в Telegram. Специалист свяжется с вами.";
        return;
      }
      if (TELEGRAM_BOT_URL) {
        window.open(TELEGRAM_BOT_URL, "_blank", "noopener");
        if (note) note.textContent = "Открылся Telegram-бот. Отправьте туда файл спецификации и сообщение из формы.";
        return;
      }
      if (note) note.textContent = "Telegram-бот пока не подключен. Выберите Email или передайте ссылку/webhook бота для подключения.";
      return;
    }

    const subject = encodeURIComponent(`Запрос с сайта ТЕХНОПРОГРЕСС${payload.product ? `: ${payload.product}` : ""}`);
    const body = encodeURIComponent(buildMailBody(payload));
    window.location.href = `mailto:${contacts.email}?subject=${subject}&body=${body}`;
    if (note) note.textContent = "Письмо подготовлено. Если вы выбрали файл, приложите его к письму перед отправкой.";
  }

  async function sendToTelegram(payload) {
    if (!TELEGRAM_WEBHOOK_URL) return false;
    try {
      const response = await fetch(TELEGRAM_WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      return response.ok;
    } catch (error) {
      return false;
    }
  }

  function buildMailBody(payload) {
    return [
      "Запрос с сайта ТЕХНОПРОГРЕСС",
      "",
      `Товар/раздел: ${payload.product || "-"}`,
      `Что нужно: ${payload.items || "-"}`,
      `Количество: ${payload.qty || "-"}`,
      `Город доставки: ${payload.city || "-"}`,
      `Срок: ${payload.deadline || "-"}`,
      `Канал отправки: ${payload.channel === "telegram" ? "Telegram-бот" : "Email"}`,
      `Нужен аналог: ${payload.analog}`,
      "",
      `Компания: ${payload.company || "-"}`,
      `ИНН: ${payload.inn || "-"}`,
      `Имя: ${payload.name || "-"}`,
      `Телефон: ${payload.phone || "-"}`,
      `Email: ${payload.email || "-"}`,
      "",
      "Комментарий:",
      payload.comment || "-",
      "",
      `Файлы для приложения к письму: ${payload.files.length ? payload.files.join(", ") : "-"}`
    ].join("\n");
  }

  function bindRequestButtons(root = document) {
    $$("[data-request-product]", root).forEach((button) => {
      button.addEventListener("click", () => {
        const product = products.find((item) => item.slug === button.dataset.requestProduct);
        const form = $("[data-request-form]");
        if (!form) {
          window.location.href = `${productUrl(product)}#productRequest`;
          return;
        }
        const items = form.querySelector('[name="items"]');
        const hidden = form.querySelector('[name="product"]');
        if (items && product) items.value = product.name;
        if (hidden && product) hidden.value = product.name;
        form.scrollIntoView({ behavior: "smooth", block: "start" });
        setTimeout(() => form.querySelector('[name="qty"]')?.focus(), 450);
      });
    });
    $$("[data-request-mark]", root).forEach((button) => {
      button.addEventListener("click", () => {
        const item = markItems.find((row) => row.slug === button.dataset.requestMark);
        if (!item) return;
        const form = $("[data-request-form]");
        if (!form) {
          window.location.href = `${markUrl(item)}#productRequest`;
          return;
        }
        const items = form.querySelector('[name="items"]');
        const hidden = form.querySelector('[name="product"]');
        if (items && item) items.value = item.name;
        if (hidden && item) hidden.value = item.name;
        form.scrollIntoView({ behavior: "smooth", block: "start" });
        setTimeout(() => form.querySelector('[name="qty"]')?.focus(), 450);
      });
    });
  }

  function bindCardLinks(root = document) {
    $$("[data-card-url]", root).forEach((card) => {
      if (card.dataset.cardBound) return;
      card.dataset.cardBound = "true";
      card.addEventListener("click", (event) => {
        if (event.target.closest("a, button, input, select, textarea, label")) return;
        window.location.href = card.dataset.cardUrl;
      });
      card.addEventListener("keydown", (event) => {
        if (event.key !== "Enter") return;
        window.location.href = card.dataset.cardUrl;
      });
      if (!card.hasAttribute("tabindex")) card.setAttribute("tabindex", "0");
    });
  }

  function bindRowLinks(root = document) {
    $$("[data-row-url]", root).forEach((row) => {
      if (row.dataset.rowBound) return;
      row.dataset.rowBound = "true";
      row.addEventListener("click", (event) => {
        if (event.target.closest("a, button, input, select, textarea, label")) return;
        window.location.href = row.dataset.rowUrl;
      });
      row.addEventListener("keydown", (event) => {
        if (event.key !== "Enter") return;
        window.location.href = row.dataset.rowUrl;
      });
      if (!row.hasAttribute("tabindex")) row.setAttribute("tabindex", "0");
    });
  }

  function bindCatalogEvents() {
    if (!$("#catalogGrid")) return;
    $("#catalogSearch")?.addEventListener("input", () => {
      clearCatalogFamilyParam();
      renderCatalog();
    });
    $("#kindFilter")?.addEventListener("input", () => {
      clearCatalogFamilyParam();
      refreshCategoryFilter();
      renderCatalog();
    });
    $("#categoryFilter")?.addEventListener("input", () => {
      clearCatalogFamilyParam();
      renderCatalog();
      renderSideCategoryList();
    });
    $("#voltageFilter")?.addEventListener("input", () => {
      clearCatalogFamilyParam();
      renderCatalog();
    });
    $("#purposeFilter")?.addEventListener("input", () => {
      clearCatalogFamilyParam();
      renderCatalog();
    });
    $("#sideCategoryList")?.addEventListener("click", (event) => {
      const link = event.target.closest("a");
      if (!link) return;
      event.preventDefault();
      const kind = link.dataset.sideKind || "all";
      const category = link.dataset.sideCategory || "all";
      const kindSelect = $("#kindFilter");
      const categorySelect = $("#categoryFilter");
      if (kindSelect) kindSelect.value = kind;
      refreshCategoryFilter();
      if (categorySelect) categorySelect.value = category;
      const url = category === "all" ? "catalog.html" : `catalog.html?kind=${encodeURIComponent(kind)}&category=${encodeURIComponent(category)}`;
      window.history.pushState({}, "", url);
      renderCatalog();
      document.querySelector(".catalog-content")?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  function bindNav() {
    const toggle = $(".nav-toggle");
    const nav = $(".nav-links");
    if (!toggle || !nav) return;
    $$(".nav-links a").forEach((link) => {
      if (link.dataset.navBound) return;
      link.dataset.navBound = "true";
      link.addEventListener("click", () => {
        document.body.classList.remove("nav-open");
        toggle.setAttribute("aria-expanded", "false");
      });
    });
    toggle.addEventListener("click", () => {
      const open = document.body.classList.toggle("nav-open");
      toggle.setAttribute("aria-expanded", String(open));
    });
    nav.addEventListener("click", (event) => {
      if (event.target instanceof HTMLAnchorElement) {
        document.body.classList.remove("nav-open");
        toggle.setAttribute("aria-expanded", "false");
      }
    });
  }

  function observeReveals() {
    const nodes = $$(".reveal:not(.is-visible)");
    if (!("IntersectionObserver" in window)) {
      nodes.forEach((node) => node.classList.add("is-visible"));
      return;
    }
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });
    nodes.forEach((node) => observer.observe(node));
  }

  function bindImageFallbacks() {
    document.addEventListener("error", (event) => {
      const img = event.target;
      if (!(img instanceof HTMLImageElement) || img.dataset.fallbackApplied) return;
      img.dataset.fallbackApplied = "true";
      const fallback = img.closest(".product-visual, .product-card, .category-tile")
        ? "assets/catalog-power-cables.png"
        : "assets/cable-macro.png";
      img.src = fallback;
    }, true);
  }

  function plural(count, one, few, many) {
    const mod10 = count % 10;
    const mod100 = count % 100;
    if (mod10 === 1 && mod100 !== 11) return one;
    if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return few;
    return many;
  }

  function init() {
    renderFeaturedProducts();
    renderCategoryLinks();
    renderSolutionCards();
    renderArticleCards();
    renderMarkDirectory();
    renderCatalogFilters();
    renderSideCategoryList();
    renderCatalog();
    renderProductDetail();
    renderInlineForms();
    bindForms();
    bindCalculators();
    bindCatalogEvents();
    bindRequestButtons();
    bindCardLinks();
    bindNav();
    bindImageFallbacks();
    observeReveals();
  }

  document.addEventListener("DOMContentLoaded", init);
})();
