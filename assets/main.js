/* ================================
   STATE
================================ */

let productData = {};
let productIndex = {};
let fileHandle = null;

let fsMonitorInterval = null;
let fallbackReminderInterval = null;

const SEARCH_PAGE_SIZE = 5;

const searchState = {
  query: '',
  page: 0,
  matchedNames: []
};

/* ================================
   DOM HELPERS
================================ */

const $ = id => document.getElementById(id);

const DOM = {
  openCsvBtn: $("openCsvBtn"),
  csvInput: $("csvFile"),
  csvStatus: $("csvStatus"),
  csvStatusText: $("csvStatusText"),
  csvStatusTime: $("csvStatusTime"),
  csvFileName: $("csvFileName"),
  skuInput: $("skuInput"),
  seasonInput: $("seasonInput"),

  productSearchInput: $("productSearchInput"),
  searchResults: $("searchResults"),
  searchCount: $("searchCount"),
  prevSearchBtn: $("prevSearchBtn"),
  nextSearchBtn: $("nextSearchBtn"),

  labelDisplay: $("labelDisplay"),
  productName: $("productName"),
  skuDisplay: $("skuDisplay"),
  seasonDisplay: $("seasonDisplay"),
  sizeDisplay: $("sizeDisplay"),
  colorDisplay: $("colorDisplay")
};

/* ================================
   INPUT SANITIZATION
================================ */

function sanitizeSeasonInput() {
  const el = DOM.seasonInput;
  if (!el) return;

  let v = (el.value || "").replace(/\D+/g, "").slice(0, 3);

  const start = el.selectionStart;
  const end = el.selectionEnd;

  el.value = v;

  try {
    el.setSelectionRange(start, end);
  } catch {}
}

function getEffectiveSeason(dataSeason) {
  const input = DOM.seasonInput?.value.trim();
  return input || dataSeason || "";
}

/* ================================
   CSV UI
================================ */

function showCsvReloadedIndicator(message = "CSV reloaded") {
  const { csvStatus, csvStatusText, csvStatusTime } = DOM;
  if (!csvStatus) return;

  csvStatusText.textContent = message;
  csvStatusTime.textContent = new Date().toLocaleString();
  csvStatus.style.display = "block";

  clearTimeout(csvStatus._hideTimeout);

  csvStatus._hideTimeout = setTimeout(() => {
    csvStatus.style.display = "none";
  }, 6000);
}

function setCsvFileNameDisplay(name) {
  if (DOM.csvFileName)
    DOM.csvFileName.textContent = name || "No file loaded";
}

/* ================================
   CSV PARSER
================================ */

function parseCsvText(text) {

  productData = {};
  productIndex = {};

  const lines = text.split(/\r?\n/);

  lines.slice(1).forEach(line => {

    if (!line?.trim()) return;

    const [SKU, Prefix, ProductName, Color, Size, Season] =
      line.split(",").map(v => v?.trim() || "");

    if (!SKU || !Prefix) return;

    const colorVal = Color || "NOCLR";
    const sizeVal = Size || "NOSIZE";

    productData[SKU] = {
      prefix: Prefix,
      name: ProductName,
      color: colorVal,
      size: sizeVal,
      season: Season
    };

    if (!ProductName) return;

    if (!productIndex[ProductName])
      productIndex[ProductName] = [];

    productIndex[ProductName].push({
      sku: SKU,
      color: colorVal,
      size: sizeVal
    });

  });

  Object.keys(productIndex).forEach(name => {
    productIndex[name].sort((a, b) =>
      (a.sku || "").localeCompare(b.sku || "")
    );
  });

  refreshSearch(true);
}

/* ================================
   CSV FILE READER
================================ */

function readCsvFile(file, message = "CSV reloaded") {

  const reader = new FileReader();

  reader.onload = e => {
    parseCsvText(e.target.result);
    setCsvFileNameDisplay(file.name || "Unnamed file");
    showCsvReloadedIndicator(message);
  };

  reader.onerror = () =>
    console.error("Error reading CSV file");

  reader.readAsText(file);
}

/* ================================
   FILE SYSTEM ACCESS
================================ */

function supportsFileSystemAccess() {
  return "showOpenFilePicker" in window;
}

async function openCsvWithHandle() {

  try {

    const [handle] = await window.showOpenFilePicker({
      types: [{ description: "CSV", accept: { "text/csv": [".csv"] } }],
      multiple: false
    });

    if (!handle) return;

    fileHandle = handle;

    await readFromHandle("CSV opened and watching (auto)");

    startFsMonitor();

  } catch (err) {

    console.warn("File open cancelled", err);
    fileHandle = null;
    stopFsMonitor();

  }
}

async function readFromHandle(message = "CSV reloaded") {

  if (!fileHandle) return;

  try {

    const file = await fileHandle.getFile();
    if (file) readCsvFile(file, message);

  } catch (err) {

    console.warn("Error reading from handle", err);

  }
}

/* ================================
   FILE MONITOR
================================ */

function startFsMonitor(interval = 3000) {

  stopFsMonitor();
  if (!fileHandle) return;

  let lastMeta = { lastModified: null, size: null };

  fsMonitorInterval = setInterval(async () => {

    try {

      const file = await fileHandle.getFile();

      if (!file) return;

      if (
        file.lastModified !== lastMeta.lastModified ||
        file.size !== lastMeta.size
      ) {

        lastMeta.lastModified = file.lastModified;
        lastMeta.size = file.size;

        await readFromHandle("CSV changed on disk, reloaded");

      }

    } catch (err) {

      console.warn("File polling error", err);
      stopFsMonitor();

    }

  }, interval);
}

function stopFsMonitor() {

  clearInterval(fsMonitorInterval);
  fsMonitorInterval = null;

}

/* ================================
   FALLBACK CSV INPUT
================================ */

function openCsvWithInput() {

  if (DOM.csvInput) DOM.csvInput.value = "";
  DOM.csvInput?.click();

}

function startFallbackReminders(interval = 15000) {

  stopFallbackReminders();

  fallbackReminderInterval = setInterval(() => {

    if (!fileHandle && DOM.csvInput?.files?.[0]) {

      showCsvReloadedIndicator(
        "If you edited the CSV, click Open CSV."
      );

      try {
        DOM.csvInput.click();
      } catch {}

    }

  }, interval);
}

function stopFallbackReminders() {

  clearInterval(fallbackReminderInterval);
  fallbackReminderInterval = null;

}

/* ================================
   LABEL GENERATOR
================================ */

function updateLabel() {

  const sku = DOM.skuInput?.value.trim() || "";

  if (sku.length !== 8 || !productData[sku]) {
    DOM.labelDisplay.style.display = "none";
    return;
  }

  const data = productData[sku];

  const fullEAN = data.prefix + sku;

  const digits = fullEAN.split("").map(Number);

  if (digits.some(Number.isNaN)) {
    console.error("Invalid EAN digits", fullEAN);
    DOM.labelDisplay.style.display = "none";
    return;
  }

  let sum = 0;

  digits.forEach((d, i) => {
    sum += d * (i % 2 === 0 ? 1 : 3);
  });

  const checksum = (10 - (sum % 10)) % 10;
  const ean13 = fullEAN + checksum;

  DOM.productName.textContent = data.name || "";
  DOM.skuDisplay.textContent = sku;
  DOM.seasonDisplay.textContent = getEffectiveSeason(data.season);
  DOM.sizeDisplay.textContent = data.size;
  DOM.colorDisplay.textContent = data.color;

  DOM.labelDisplay.style.display = "block";

  try {

    JsBarcode("#barcode", ean13, {
      format: "EAN13",
      lineColor: "#000",
      width: 2,
      height: 55,
      displayValue: true
    });

  } catch (err) {

    console.error("JsBarcode error", err);

  }
}

/* ================================
   SEARCH
================================ */

function normalizeQuery(q) {
  return (q || "").trim().toLowerCase();
}

function computeMatchedNames(query) {

  if (!query) return [];

  return Object.keys(productIndex)
    .filter(n => n.toLowerCase().includes(query))
    .sort((a, b) => a.localeCompare(b));

}

function setSearchButtons(total) {

  const maxPage = Math.max(
    0,
    Math.ceil(total / SEARCH_PAGE_SIZE) - 1
  );

  if (searchState.page > maxPage)
    searchState.page = maxPage;

  if (DOM.prevSearchBtn)
    DOM.prevSearchBtn.disabled = searchState.page <= 0;

  if (DOM.nextSearchBtn)
    DOM.nextSearchBtn.disabled = searchState.page >= maxPage;

}

function renderSearchResults() {

  const { searchResults, searchCount } = DOM;

  const query = normalizeQuery(
    DOM.productSearchInput?.value
  );

  if (!Object.keys(productIndex).length) {

    searchCount.textContent =
      "Load a CSV to enable search.";

    searchResults.innerHTML = "";
    setSearchButtons(0);
    return;

  }

  if (!query) {

    searchCount.textContent = "Type to search...";
    searchResults.innerHTML = "";
    setSearchButtons(0);
    return;

  }

  searchState.matchedNames =
    computeMatchedNames(query);

  const total = searchState.matchedNames.length;

  const start = searchState.page * SEARCH_PAGE_SIZE;
  const end = start + SEARCH_PAGE_SIZE;

  const pageNames =
    searchState.matchedNames.slice(start, end);

  searchCount.textContent = total
    ? `${total} product(s) • showing ${start + 1}-${Math.min(end, total)}`
    : "No matches.";

  setSearchButtons(total);

  searchResults.innerHTML = "";

  pageNames.forEach(name => {

    const group = document.createElement("div");
    group.className = "search-group";

    const title = document.createElement("div");
    title.className = "search-group-title";
    title.textContent = name;

    group.appendChild(title);

    productIndex[name].forEach(item => {

      const row = document.createElement("div");
      row.className = "search-sku-row";

      const btn = document.createElement("button");
      btn.className = "search-sku-btn";
      btn.textContent = item.sku;

      btn.onclick = () => {
        DOM.skuInput.value = item.sku;
        DOM.skuInput.dispatchEvent(
          new Event("input", { bubbles: true })
        );
        DOM.skuInput.focus();
      };

      const meta = document.createElement("span");
      meta.className = "search-sku-meta";
      meta.textContent =
        `${item.color} * ${item.size}`;

      row.append(btn, meta);
      group.appendChild(row);

    });

    searchResults.appendChild(group);

  });
}

function refreshSearch(reset = false) {

  if (reset) searchState.page = 0;
  renderSearchResults();

}

/* ================================
   EXPORT / PRINT
================================ */

function printLabel() {

  const content =
    DOM.labelDisplay.innerHTML;

  const win = window.open("", "", "width=600,height=400");

  win.document.write(`
  <html>
  <head>
  <title>Print Label</title>
  <link rel="stylesheet" href="assets/label.css">
  </head>
  <body onload="window.print();window.close();">
  <div id="label">${content}</div>
  </body>
  </html>
  `);

  win.document.close();

}

function downloadImage() {

  const label = $("label");
  if (!label) return;

  html2canvas(label)
    .then(canvas => {

      const link = document.createElement("a");

      link.download = "label.png";
      link.href = canvas.toDataURL("image/png");
      link.click();

    })
    .catch(err =>
      console.error("html2canvas error", err)
    );
}

/* ================================
   EVENT LISTENERS
================================ */

DOM.skuInput?.addEventListener("input", updateLabel);

DOM.seasonInput?.addEventListener("input", () => {
  sanitizeSeasonInput();
  updateLabel();
});

DOM.productSearchInput?.addEventListener("input", () => {
  searchState.page = 0;
  renderSearchResults();
});

DOM.prevSearchBtn?.addEventListener("click", () => {
  if (searchState.page > 0) {
    searchState.page--;
    renderSearchResults();
  }
});

DOM.nextSearchBtn?.addEventListener("click", () => {
  searchState.page++;
  renderSearchResults();
});

DOM.csvInput?.addEventListener("change", e => {

  const file = e.target.files?.[0];
  if (!file) return;

  stopFsMonitor();
  fileHandle = null;

  readCsvFile(file, "CSV loaded (fallback)");
  startFallbackReminders();

});

DOM.openCsvBtn?.addEventListener("click", async () => {

  stopFsMonitor();
  stopFallbackReminders();

  fileHandle = null;

  setCsvFileNameDisplay("No file loaded");

  if (supportsFileSystemAccess())
    await openCsvWithHandle();
  else
    openCsvWithInput();

});

/* ================================
   WINDOW EVENTS
================================ */

window.printLabel = printLabel;
window.downloadImage = downloadImage;
window.openCsvWithHandle = openCsvWithHandle;

window.addEventListener("beforeunload", () => {

  stopFsMonitor();
  stopFallbackReminders();

});

document.addEventListener("visibilitychange", () => {

  if (document.hidden) {

    stopFsMonitor();
    stopFallbackReminders();

  } else {

    if (!fileHandle && DOM.csvInput?.files?.[0])
      startFallbackReminders();

    if (fileHandle)
      startFsMonitor();

  }

});

/* ================================
   INIT
================================ */

setCsvFileNameDisplay("No file loaded");
renderSearchResults();