const STORAGE_KEY = "dailyLedgerRecords";
const CATEGORY_KEY = "dailyLedgerCategories";
const FINMIND_TOKEN_KEY = "dailyLedgerFinMindToken";
const ALPHA_VANTAGE_KEY = "dailyLedgerAlphaVantageKey";
const MARKET_DAILY_REFRESH_KEY = "dailyLedgerMarketDailyRefreshDate";
const MARKET_REFRESH_CHECK_INTERVAL = 60 * 60 * 1000;

const defaultCategories = {
  餐飲: ["早餐", "午餐", "晚餐", "飲料", "聚餐"],
  交通: ["捷運", "公車", "計程車", "加油", "停車"],
  生活: ["日用品", "房租", "水電瓦斯", "電話網路", "維修"],
  娛樂: ["電影", "遊戲", "旅遊", "訂閱", "活動"],
  醫療: ["看診", "藥品", "保健", "保險"],
  收入: ["薪資", "獎金", "兼職", "投資收益", "其他收入"],
  投資: ["股票", "ETF", "基金", "債券", "加密貨幣", "定期定額"]
};

const records = loadJSON(STORAGE_KEY, []);
let categories = loadJSON(CATEGORY_KEY, defaultCategories);

const currentDate = document.querySelector("#currentDate");
const currentTime = document.querySelector("#currentTime");
const entryForm = document.querySelector("#entryForm");
const categoryForm = document.querySelector("#categoryForm");
const categoryList = document.querySelector("#categoryList");
const categoryPanel = document.querySelector("#categoryPanel");
const categoryContent = document.querySelector("#categoryContent");
const categoryToggle = document.querySelector("#categoryToggle");
const entryDate = document.querySelector("#entryDate");
const entryAmount = document.querySelector("#entryAmount");
const entryNote = document.querySelector("#entryNote");
const mainCategory = document.querySelector("#mainCategory");
const subCategory = document.querySelector("#subCategory");
const newMainCategory = document.querySelector("#newMainCategory");
const newSubCategory = document.querySelector("#newSubCategory");
const filterType = document.querySelector("#filterType");
const filterMain = document.querySelector("#filterMain");
const recordsBody = document.querySelector("#recordsBody");
const recordsPanel = document.querySelector("#recordsPanel");
const recordsContent = document.querySelector("#recordsContent");
const recordsToggle = document.querySelector("#recordsToggle");
const emptyState = document.querySelector("#emptyState");
const resetCategories = document.querySelector("#resetCategories");
const exportCsv = document.querySelector("#exportCsv");
const exportBackup = document.querySelector("#exportBackup");
const importBackupFile = document.querySelector("#importBackupFile");
const backupStatus = document.querySelector("#backupStatus");
const investmentForm = document.querySelector("#investmentForm");
const investmentMarket = document.querySelector("#investmentMarket");
const investmentDate = document.querySelector("#investmentDate");
const investmentAmount = document.querySelector("#investmentAmount");
const investmentMarketPrice = document.querySelector("#investmentMarketPrice");
const investmentCategory = document.querySelector("#investmentCategory");
const investmentSymbol = document.querySelector("#investmentSymbol");
const investmentQuantity = document.querySelector("#investmentQuantity");
const investmentNote = document.querySelector("#investmentNote");
const portfolioBody = document.querySelector("#portfolioBody");
const portfolioEmptyState = document.querySelector("#portfolioEmptyState");
const investmentCount = document.querySelector("#investmentCount");
const currentMarketValue = document.querySelector("#currentMarketValue");
const unrealizedGain = document.querySelector("#unrealizedGain");
const finmindToken = document.querySelector("#finmindToken");
const alphaVantageKey = document.querySelector("#alphaVantageKey");
const saveMarketApiKey = document.querySelector("#saveMarketApiKey");
const refreshMarketPrices = document.querySelector("#refreshMarketPrices");
const marketStatus = document.querySelector("#marketStatus");
const analysisStatus = document.querySelector("#analysisStatus");
const forecastIncome = document.querySelector("#forecastIncome");
const forecastExpense = document.querySelector("#forecastExpense");
const forecastBalance = document.querySelector("#forecastBalance");
const forecastIncomeNote = document.querySelector("#forecastIncomeNote");
const forecastExpenseNote = document.querySelector("#forecastExpenseNote");
const forecastBalanceNote = document.querySelector("#forecastBalanceNote");
const anomalyList = document.querySelector("#anomalyList");
const budgetList = document.querySelector("#budgetList");
const trendChart = document.querySelector("#trendChart");
const paretoChart = document.querySelector("#paretoChart");
const trendChartNote = document.querySelector("#trendChartNote");
const paretoChartNote = document.querySelector("#paretoChartNote");
const trendRangeToggle = document.querySelector("#trendRangeToggle");
const analyticsPanel = document.querySelector("#analyticsPanel");
const analyticsContent = document.querySelector("#analyticsContent");
const analyticsToggle = document.querySelector("#analyticsToggle");
const investmentPanel = document.querySelector(".investment-panel");
const investmentContent = document.querySelector("#investmentContent");
const investmentToggle = document.querySelector("#investmentToggle");

const ANALYTICS_PANEL_KEY = "dailyLedgerAnalyticsCollapsed";
const INVESTMENT_PANEL_KEY = "dailyLedgerInvestmentCollapsed";
const CATEGORY_PANEL_KEY = "dailyLedgerCategoryCollapsed";
const RECORDS_PANEL_KEY = "dailyLedgerRecordsCollapsed";

let trendRangeDays = 30;
let activePressTarget = null;
let marketRefreshTimer = null;

const formatCurrency = new Intl.NumberFormat("zh-TW", {
  style: "currency",
  currency: "TWD",
  maximumFractionDigits: 0
});

const compactCurrency = new Intl.NumberFormat("zh-TW", {
  maximumFractionDigits: 1
});

const marketCurrency = new Intl.NumberFormat("zh-TW", {
  maximumFractionDigits: 2
});

const quantityFormatter = new Intl.NumberFormat("zh-TW", {
  maximumFractionDigits: 6
});

migrateCategories();
init();

function init() {
  entryDate.value = toDateInputValue(new Date());
  investmentDate.value = toDateInputValue(new Date());
  updateClock();
  setInterval(updateClock, 1000);

  renderCategoryOptions();
  finmindToken.value = getFinMindToken();
  alphaVantageKey.value = getAlphaVantageKey();
  syncMarketPlaceholders();
  renderInvestmentOptions();
  renderCategoryList();
  renderRecords();
  renderPortfolio();
  updateSummary();
  updateAnalytics();
  restoreAnalyticsPanelState();
  restoreInvestmentPanelState();
  restoreCategoryPanelState();
  restoreRecordsPanelState();
  updateMarketStatus();
  scheduleAutomaticMarketRefresh();

  mainCategory.addEventListener("change", () => renderSubCategoryOptions());
  entryForm.querySelectorAll('input[name="type"]').forEach((input) => {
    input.addEventListener("change", syncCategoryWithType);
  });
  entryForm.addEventListener("submit", addRecord);
  investmentForm.addEventListener("submit", addInvestmentRecord);
  categoryForm.addEventListener("submit", addCategory);
  bindTap(recordsToggle, toggleRecordsPanel);
  filterType.addEventListener("change", renderRecords);
  filterMain.addEventListener("change", renderRecords);
  bindTap(resetCategories, restoreDefaultCategories);
  bindTap(categoryToggle, toggleCategoryPanel);
  bindTap(exportCsv, downloadCsv);
  bindTap(exportBackup, downloadBackup);
  importBackupFile.addEventListener("change", importBackup);
  investmentMarket.addEventListener("change", syncMarketPlaceholders);
  bindTap(saveMarketApiKey, saveMarketApiKeyValue);
  bindTap(refreshMarketPrices, () => refreshMarketPricesFromApi());
  bindTap(trendRangeToggle, toggleTrendRange);
  bindTap(analyticsToggle, toggleAnalyticsPanel);
  bindTap(investmentToggle, toggleInvestmentPanel);
  setupPressFeedback();
  window.addEventListener("resize", debounce(updateAnalytics, 160));
  window.addEventListener("orientationchange", debounce(updateAnalytics, 220));
}

function bindTap(element, handler) {
  let lastTouchAt = 0;

  element.addEventListener("touchend", (event) => {
    if (element.disabled) return;

    lastTouchAt = Date.now();
    event.preventDefault();
    handler(event);
  }, { passive: false });

  element.addEventListener("click", (event) => {
    if (element.disabled || Date.now() - lastTouchAt < 450) return;
    handler(event);
  });
}

function setupPressFeedback() {
  document.addEventListener("pointerdown", (event) => {
    const target = getClosestActionTarget(event.target);
    if (!target) return;

    activePressTarget = target;
    activePressTarget.classList.add("is-pressing");
  });

  document.addEventListener("touchstart", (event) => {
    const target = getClosestActionTarget(event.target);
    if (!target) return;

    activePressTarget = target;
    activePressTarget.classList.add("is-pressing");
  }, { passive: true });

  ["pointerup", "pointercancel", "pointerleave", "touchend", "touchcancel"].forEach((eventName) => {
    document.addEventListener(eventName, releasePressFeedback);
  });
}

function getClosestActionTarget(target) {
  let element = target && target.nodeType === 1 ? target : target && target.parentElement;

  while (element && element !== document) {
    if (element.matches && element.matches("button, .file-button")) return element;
    element = element.parentElement;
  }

  return null;
}

function releasePressFeedback() {
  if (!activePressTarget) return;

  activePressTarget.classList.remove("is-pressing");
  activePressTarget = null;
}

function migrateCategories() {
  let changed = false;

  if (!categories["投資"]) {
    categories["投資"] = cloneData(defaultCategories["投資"]);
    changed = true;
  }

  if (Array.isArray(categories["收入"]) && categories["收入"].includes("投資")) {
    categories["收入"] = categories["收入"].filter((sub) => sub !== "投資");

    if (!categories["收入"].includes("投資收益")) {
      categories["收入"].push("投資收益");
    }

    changed = true;
  }

  if (changed) {
    saveCategories();
  }
}

function ensureCategoryFallbacks() {
  if (!categories["投資"] || categories["投資"].length === 0) {
    categories["投資"] = ["其他投資"];
  }

  const entryMains = Object.keys(categories).filter((category) => category !== "投資");
  if (entryMains.length === 0) {
    categories["其他"] = ["其他"];
  }
}

function syncCategoryWithType() {
  const type = getSelectedEntryType();

  if (type === "income" && categories["收入"]) {
    renderCategoryOptions("收入");
    return;
  }

  if (type === "expense" && ["投資", "收入"].includes(mainCategory.value)) {
    renderCategoryOptions(categories["餐飲"] ? "餐飲" : Object.keys(categories)[0]);
  }
}

function getSelectedEntryType() {
  const checkedType = entryForm.querySelector('input[name="type"]:checked');
  return checkedType ? checkedType.value : "expense";
}

function updateClock() {
  const now = new Date();
  currentDate.textContent = now.toLocaleDateString("zh-TW", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "long"
  });
  currentTime.textContent = now.toLocaleTimeString("zh-TW", {
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit"
  });
}

function addRecord(event) {
  event.preventDefault();

  const type = getSelectedEntryType();
  const amount = Number(entryAmount.value);

  if (!Number.isFinite(amount) || amount <= 0) {
    entryAmount.focus();
    return;
  }

  records.unshift({
    id: createId(),
    type,
    date: entryDate.value,
    amount,
    main: mainCategory.value,
    sub: subCategory.value,
    note: entryNote.value.trim()
  });

  saveRecords();
  entryAmount.value = "";
  entryNote.value = "";
  renderRecords();
  updateSummary();
  updateAnalytics();
}

function addInvestmentRecord(event) {
  event.preventDefault();

  const amount = Number(investmentAmount.value);
  const market = normalizeInvestmentMarket(investmentMarket.value, investmentSymbol.value);
  const symbol = getCanonicalMarketSymbol(investmentSymbol.value, market);
  const quantity = Number(investmentQuantity.value);
  const marketPrice = normalizeOptionalPositiveNumber(investmentMarketPrice.value);

  if (!symbol) {
    investmentSymbol.focus();
    return;
  }

  if (!Number.isFinite(quantity) || quantity <= 0) {
    investmentQuantity.focus();
    return;
  }

  if (!Number.isFinite(amount) || amount <= 0) {
    investmentAmount.focus();
    return;
  }

  records.unshift({
    id: createId(),
    type: "investment",
    date: investmentDate.value,
    amount,
    main: "投資",
    sub: investmentCategory.value,
    market,
    symbol,
    quantity,
    marketPrice,
    marketUpdatedAt: marketPrice === null ? "" : new Date().toISOString(),
    marketDate: "",
    note: investmentNote.value.trim()
  });

  saveRecords();
  investmentAmount.value = "";
  investmentMarketPrice.value = "";
  investmentSymbol.value = "";
  investmentQuantity.value = "";
  investmentNote.value = "";
  renderRecords();
  renderPortfolio();
  updateSummary();
  updateAnalytics();

  if (marketPrice === null) {
    refreshMarketPricesFromApi({ targets: [{ market, symbol }], silent: true });
  }
}

function addCategory(event) {
  event.preventDefault();

  const main = newMainCategory.value.trim();
  const sub = newSubCategory.value.trim();

  if (!main || !sub) return;

  if (!categories[main]) {
    categories[main] = [];
  }

  if (!categories[main].includes(sub)) {
    categories[main].push(sub);
  }

  saveCategories();
  categoryForm.reset();
  renderCategoryOptions(main, sub);
  renderInvestmentOptions(main === "投資" ? sub : undefined);
  renderCategoryList();
}

function restoreDefaultCategories() {
  categories = cloneData(defaultCategories);
  saveCategories();
  renderCategoryOptions();
  renderInvestmentOptions();
  renderCategoryList();
}

function renderCategoryOptions(selectedMain = mainCategory.value, selectedSub = subCategory.value) {
  ensureCategoryFallbacks();
  const entryMains = Object.keys(categories).filter((category) => category !== "投資");
  const filterMains = Object.keys(categories);

  mainCategory.innerHTML = entryMains
    .map((category) => `<option value="${escapeHTML(category)}">${escapeHTML(category)}</option>`)
    .join("");

  filterMain.innerHTML = [
    '<option value="all">所有大項目</option>',
    ...filterMains.map((category) => `<option value="${escapeHTML(category)}">${escapeHTML(category)}</option>`)
  ].join("");

  mainCategory.value = entryMains.includes(selectedMain) ? selectedMain : entryMains[0];
  renderSubCategoryOptions(selectedSub);
}

function renderInvestmentOptions(selectedSub = investmentCategory.value) {
  ensureCategoryFallbacks();
  const subs = categories["投資"] || defaultCategories["投資"];
  investmentCategory.innerHTML = subs
    .map((category) => `<option value="${escapeHTML(category)}">${escapeHTML(category)}</option>`)
    .join("");
  investmentCategory.value = subs.includes(selectedSub) ? selectedSub : subs[0];
}

function renderSubCategoryOptions(selectedSub = subCategory.value) {
  const subs = categories[mainCategory.value] || [];
  subCategory.innerHTML = subs
    .map((category) => `<option value="${escapeHTML(category)}">${escapeHTML(category)}</option>`)
    .join("");
  subCategory.value = subs.includes(selectedSub) ? selectedSub : subs[0];
}

function renderCategoryList() {
  ensureCategoryFallbacks();
  categoryList.innerHTML = Object.entries(categories)
    .map(([main, subs]) => {
      const tags = subs
        .map(
          (sub) => `
            <span class="tag category-tag">
              <span>${escapeHTML(sub)}</span>
              <button
                class="category-delete"
                type="button"
                data-main="${escapeHTML(main)}"
                data-sub="${escapeHTML(sub)}"
                aria-label="刪除 ${escapeHTML(main)} 的 ${escapeHTML(sub)}"
              >×</button>
            </span>
          `
        )
        .join("");
      return `
        <section class="category-group">
          <strong>
            ${escapeHTML(main)}
            <span>${subs.length} 項</span>
          </strong>
          <div class="tag-row">${tags}</div>
        </section>
      `;
    })
    .join("");

  categoryList.querySelectorAll(".category-delete").forEach((button) => {
    button.addEventListener("click", () => deleteCategory(button.dataset.main, button.dataset.sub));
  });
}

function deleteCategory(main, sub) {
  if (!categories[main]) return;

  categories[main] = categories[main].filter((item) => item !== sub);

  if (categories[main].length === 0) {
    if (main === "投資") {
      categories[main] = ["其他投資"];
    } else {
      delete categories[main];
    }
  }

  ensureCategoryFallbacks();
  saveCategories();
  renderCategoryOptions();
  renderInvestmentOptions();
  renderCategoryList();
}

function renderRecords() {
  const filteredRecords = records.filter((record) => {
    const typeMatched = filterType.value === "all" || record.type === filterType.value;
    const mainMatched = filterMain.value === "all" || record.main === filterMain.value;
    return typeMatched && mainMatched;
  });

  recordsBody.innerHTML = filteredRecords
    .map((record) => {
      const amountClass = getAmountClass(record.type);
      const typeLabel = getTypeLabel(record.type);
      const sign = getAmountSign(record.type);
      return `
        <tr>
          <td>${escapeHTML(record.date)}</td>
          <td><span class="type-pill ${record.type}">${typeLabel}</span></td>
          <td>${escapeHTML(record.main)}</td>
          <td>${escapeHTML(record.sub)}</td>
          <td>${escapeHTML(getRecordNote(record))}</td>
          <td class="amount-cell ${amountClass}">${sign}${formatCurrency.format(record.amount)}</td>
          <td><button class="delete-button" type="button" data-id="${record.id}">刪除</button></td>
        </tr>
      `;
    })
    .join("");

  emptyState.classList.toggle("show", filteredRecords.length === 0);

  recordsBody.querySelectorAll(".delete-button").forEach((button) => {
    button.addEventListener("click", () => deleteRecord(button.dataset.id));
  });
}

function renderPortfolio() {
  const investmentRecords = getInvestmentRecords();

  portfolioBody.innerHTML = investmentRecords
    .map((record) => {
      const market = getRecordMarket(record);
      const symbol = getRecordSymbol(record);
      const quantity = normalizeOptionalPositiveNumber(record.quantity);
      const averageCost = getAverageCost(record);
      const marketValue = getMarketValue(record);
      const gain = marketValue === null ? null : marketValue - Number(record.amount);
      const gainClass = gain === null ? "" : gain >= 0 ? "gain-positive" : "gain-negative";

      return `
        <tr>
          <td><span class="type-pill ${market === "us" ? "us-market" : "tw-market"}">${escapeHTML(getMarketLabel(market))}</span></td>
          <td><strong class="portfolio-symbol">${escapeHTML(symbol)}</strong></td>
          <td>${quantity === null ? "-" : formatQuantity(quantity)}</td>
          <td class="amount-cell investment-text">${formatCurrency.format(record.amount)}</td>
          <td class="amount-cell">${averageCost === null ? "-" : formatMarketCurrency(averageCost)}</td>
          <td class="amount-cell">${record.marketPrice === null ? "-" : formatMarketCurrency(record.marketPrice)}</td>
          <td class="amount-cell">${marketValue === null ? "-" : formatMarketCurrency(marketValue)}</td>
          <td class="amount-cell ${gainClass}">${gain === null ? "-" : formatSignedCurrency(gain)}</td>
          <td>${escapeHTML(formatMarketTimestamp(record.marketUpdatedAt, record.marketDate))}</td>
          <td><button class="delete-button" type="button" data-id="${record.id}">刪除</button></td>
        </tr>
      `;
    })
    .join("");

  portfolioEmptyState.classList.toggle("show", investmentRecords.length === 0);

  portfolioBody.querySelectorAll(".delete-button").forEach((button) => {
    button.addEventListener("click", () => deleteRecord(button.dataset.id));
  });
}

function getInvestmentRecords() {
  return records.filter((record) => record.type === "investment");
}

function getPortfolioItems() {
  const grouped = new Map();

  getInvestmentRecords().forEach((record) => {
    const market = getRecordMarket(record);
    const symbol = getRecordSymbol(record);
    const quantity = normalizeOptionalPositiveNumber(record.quantity);

    if (!symbol || quantity === null) return;

    const key = getMarketSymbolKey(market, symbol);
    const current = grouped.get(key) || {
      market,
      symbol,
      quantity: 0,
      cost: 0,
      marketPrice: null,
      marketUpdatedAt: "",
      marketDate: ""
    };

    current.quantity += quantity;
    current.cost += Number(record.amount) || 0;

    const marketPrice = normalizeOptionalPositiveNumber(record.marketPrice);
    if (marketPrice !== null && isNewerTimestamp(record.marketUpdatedAt, current.marketUpdatedAt)) {
      current.marketPrice = marketPrice;
      current.marketUpdatedAt = String(record.marketUpdatedAt || "");
      current.marketDate = String(record.marketDate || "");
    }

    grouped.set(key, current);
  });

  return [...grouped.values()].sort((a, b) => getMarketSymbolKey(a.market, a.symbol).localeCompare(getMarketSymbolKey(b.market, b.symbol)));
}

function getInvestmentStats() {
  const portfolioItems = getPortfolioItems();
  const marketValue = portfolioItems.reduce((total, item) => total + (getMarketValue(item) || 0), 0);
  const pricedCost = portfolioItems.reduce((total, item) => {
    return item.marketPrice === null ? total : total + item.cost;
  }, 0);

  return {
    marketValue,
    unrealizedGain: marketValue - pricedCost
  };
}

function getMarketValue(item) {
  const quantity = normalizeOptionalPositiveNumber(item.quantity);
  const marketPrice = normalizeOptionalPositiveNumber(item.marketPrice);

  if (quantity === null || marketPrice === null) return null;

  return quantity * marketPrice;
}

function getAverageCost(record) {
  const amount = Number(record.amount);
  const quantity = normalizeOptionalPositiveNumber(record.quantity);

  if (!Number.isFinite(amount) || amount <= 0 || quantity === null) return null;

  return amount / quantity;
}

function getRecordMarket(record) {
  return normalizeInvestmentMarket(record.market, record.symbol);
}

function getRecordSymbol(record) {
  return getCanonicalMarketSymbol(record.symbol, getRecordMarket(record));
}

function getRecordNote(record) {
  if (record.type !== "investment") return record.note || "-";

  const details = [];
  const market = getRecordMarket(record);
  const symbol = getRecordSymbol(record);
  const quantity = normalizeOptionalPositiveNumber(record.quantity);

  details.push(getMarketLabel(market));
  if (symbol) details.push(symbol);
  if (quantity !== null) details.push(`${formatQuantity(quantity)} 單位`);
  if (record.note) details.push(record.note);

  return details.join(" / ") || "-";
}

function isNewerTimestamp(candidate, current) {
  if (!current) return true;
  if (!candidate) return false;

  const candidateTime = new Date(candidate).getTime();
  const currentTime = new Date(current).getTime();

  if (!Number.isFinite(candidateTime)) return false;
  if (!Number.isFinite(currentTime)) return true;

  return candidateTime >= currentTime;
}

function saveMarketApiKeyValue() {
  const twToken = finmindToken.value.trim();
  const usKey = alphaVantageKey.value.trim();

  if (twToken) {
    localStorage.setItem(FINMIND_TOKEN_KEY, twToken);
  } else {
    localStorage.removeItem(FINMIND_TOKEN_KEY);
  }

  if (usKey) {
    localStorage.setItem(ALPHA_VANTAGE_KEY, usKey);
  } else {
    localStorage.removeItem(ALPHA_VANTAGE_KEY);
  }

  localStorage.removeItem(MARKET_DAILY_REFRESH_KEY);
  updateMarketStatus("市場設定已儲存；今天會重新檢查可更新的投資代號。", "success");
  scheduleAutomaticMarketRefresh();
}

function getFinMindToken() {
  return localStorage.getItem(FINMIND_TOKEN_KEY) || "";
}

function getAlphaVantageKey() {
  return localStorage.getItem(ALPHA_VANTAGE_KEY) || "";
}

function updateMarketStatus(message = "", type = "") {
  if (!message) {
    message = getAlphaVantageKey()
      ? "每天開啟網站會自動批次更新投資市價；也可以按「立即更新全部」。"
      : "每天會自動更新台股；美股若不填 Alpha Vantage Key，仍可手動填市價。";
  }

  marketStatus.textContent = message;
  marketStatus.className = `market-status ${type}`.trim();
}

function scheduleAutomaticMarketRefresh() {
  if (marketRefreshTimer) {
    window.clearInterval(marketRefreshTimer);
    marketRefreshTimer = null;
  }

  marketRefreshTimer = window.setInterval(refreshDailyMarketPrices, MARKET_REFRESH_CHECK_INTERVAL);
  refreshDailyMarketPrices();
}

function refreshDailyMarketPrices() {
  const todayKey = getDateKey(new Date());

  if (localStorage.getItem(MARKET_DAILY_REFRESH_KEY) === todayKey) return;
  if (getRefreshableSymbols({ staleOnly: true }).length === 0) return;

  refreshMarketPricesFromApi({ silent: true, staleOnly: true, markDaily: true });
}

async function refreshMarketPricesFromApi({ silent = false, staleOnly = false, targets = null, markDaily = false } = {}) {
  const tokens = getMarketTokens();
  const refreshTargets = getRefreshableSymbols({ staleOnly, targets });

  if (refreshTargets.length === 0) {
    if (!silent) updateMarketStatus("目前沒有可自動更新的代號；美股請先填 Alpha Vantage Key，或在新增投資時手動填市價。");
    return;
  }

  refreshMarketPrices.disabled = true;
  saveMarketApiKey.disabled = true;
  if (!silent) updateMarketStatus(`正在更新 ${refreshTargets.length} 個投資代號...`);

  let updatedCount = 0;
  const failures = [];

  try {
    for (const symbol of refreshTargets) {
      try {
        const quote = await fetchMarketQuote(symbol, tokens);
        updateRecordsForQuote(quote);
        updatedCount += 1;
      } catch (error) {
        failures.push(`${getMarketLabel(symbol.market)} ${symbol.symbol}: ${error.message}`);
      }
    }

    if (updatedCount > 0) {
      saveRecords();
      renderRecords();
      renderPortfolio();
      updateSummary();
    }

    if (failures.length === 0) {
      updateMarketStatus(`已更新 ${updatedCount} 個代號，${formatMarketTimestamp(new Date().toISOString())}`, "success");
    } else if (updatedCount > 0) {
      updateMarketStatus(`已更新 ${updatedCount} 個，${failures.length} 個失敗：${failures[0]}`, "error");
    } else {
      updateMarketStatus(failures[0] || "市價更新失敗，請稍後再試。", "error");
    }
  } finally {
    if (markDaily) {
      localStorage.setItem(MARKET_DAILY_REFRESH_KEY, getDateKey(new Date()));
    }

    refreshMarketPrices.disabled = false;
    saveMarketApiKey.disabled = false;
  }
}

function getRefreshableSymbols({ staleOnly = false, targets = null } = {}) {
  const requestedTargets = targets ? new Set(targets.map((target) => getMarketSymbolKey(target.market, target.symbol))) : null;
  const result = new Map();

  getInvestmentRecords().forEach((record) => {
    const market = getRecordMarket(record);
    const symbol = getRecordSymbol(record);
    const quantity = normalizeOptionalPositiveNumber(record.quantity);
    const key = getMarketSymbolKey(market, symbol);

    if (!symbol || quantity === null) return;
    if (market === "us" && !getAlphaVantageKey()) return;
    if (market === "tw" && !normalizeTaiwanSymbol(symbol)) return;
    if (requestedTargets && !requestedTargets.has(key)) return;
    if (staleOnly && !shouldRefreshRecord(record)) return;

    result.set(key, { market, symbol });
  });

  return [...result.values()];
}

function shouldRefreshRecord(record) {
  if (!getRecordSymbol(record)) return false;
  if (!record.marketUpdatedAt) return true;

  const updatedAt = new Date(record.marketUpdatedAt);
  if (!Number.isFinite(updatedAt.getTime())) return true;

  return getDateKey(updatedAt) !== getDateKey(new Date());
}

async function fetchMarketQuote(target, tokens) {
  if (target.market === "us") {
    return fetchAlphaVantageQuote(target.symbol, tokens.alphaVantageKey);
  }

  return fetchFinMindQuote(target.symbol, tokens.finMindToken);
}

async function fetchFinMindQuote(symbol, token) {
  const twSymbol = normalizeTaiwanSymbol(symbol);

  if (!twSymbol) {
    throw new Error("FinMind 台股模式請使用 0050、2330 這類台股代號。");
  }

  const today = new Date();
  const params = new URLSearchParams({
    dataset: "TaiwanStockPrice",
    data_id: twSymbol,
    start_date: toDateInputValue(addDays(today, -14)),
    end_date: toDateInputValue(today)
  });

  if (token) {
    params.set("token", token);
  }

  const response = await fetch(`https://api.finmindtrade.com/api/v4/data?${params.toString()}`);

  if (!response.ok) {
    throw new Error("FinMind 暫時無法連線。");
  }

  const data = await response.json();
  const rows = Array.isArray(data.data) ? data.data : [];
  const sortedRows = rows
    .filter((item) => Number(item.close) > 0)
    .sort((a, b) => String(a.date).localeCompare(String(b.date)));
  const latest = sortedRows[sortedRows.length - 1];

  if (!latest) {
    throw new Error(data.msg || "FinMind 沒有取得有效市價。");
  }

  return {
    market: "tw",
    symbol: twSymbol,
    price: Number(latest.close),
    marketDate: latest.date || "",
    updatedAt: new Date().toISOString()
  };
}

async function fetchAlphaVantageQuote(symbol, key) {
  if (!key) {
    throw new Error("美股自動更新需要 Alpha Vantage Key，也可以在新增投資時手動填市價。");
  }

  const params = new URLSearchParams({
    function: "GLOBAL_QUOTE",
    symbol,
    apikey: key
  });
  const response = await fetch(`https://www.alphavantage.co/query?${params.toString()}`);

  if (!response.ok) {
    throw new Error("Alpha Vantage 暫時無法連線。");
  }

  const data = await response.json();

  if (data.Note) {
    throw new Error("Alpha Vantage 呼叫太頻繁，請稍後再試。");
  }

  if (data["Error Message"]) {
    throw new Error("找不到這個美股代號。");
  }

  const quote = data["Global Quote"];
  const price = quote ? Number(quote["05. price"]) : NaN;

  if (!quote || !Number.isFinite(price) || price <= 0) {
    throw new Error(data.Information || "Alpha Vantage 沒有取得有效市價。");
  }

  return {
    market: "us",
    symbol,
    price,
    marketDate: quote["07. latest trading day"] || "",
    updatedAt: new Date().toISOString()
  };
}

function updateRecordsForQuote(quote) {
  records.forEach((record) => {
    if (record.type !== "investment" || getRecordMarket(record) !== quote.market || !isSameMarketSymbol(getRecordSymbol(record), quote.symbol, quote.market)) return;

    record.market = quote.market;
    record.symbol = quote.symbol;
    record.marketPrice = quote.price;
    record.marketDate = quote.marketDate;
    record.marketUpdatedAt = quote.updatedAt;
  });
}

function updateSummary() {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();

  const monthly = records.filter((record) => {
    const recordDate = new Date(`${record.date}T00:00:00`);
    return recordDate.getFullYear() === currentYear && recordDate.getMonth() === currentMonth;
  });

  const monthlyIncome = sumByType(monthly, "income");
  const monthlyExpense = sumByType(monthly, "expense");
  const monthlyInvestment = sumByType(monthly, "investment");
  const totalIncome = sumByType(records, "income");
  const totalExpense = sumByType(records, "expense");
  const totalInvestment = sumByType(records, "investment");
  const investmentStats = getInvestmentStats();
  const totalAssets = totalIncome - totalExpense - totalInvestment + investmentStats.marketValue;

  document.querySelector("#monthlyIncome").textContent = formatCurrency.format(monthlyIncome);
  document.querySelector("#monthlyExpense").textContent = formatCurrency.format(monthlyExpense);
  document.querySelector("#monthlyInvestment").textContent = formatCurrency.format(monthlyInvestment);
  document.querySelector("#monthlyBalance").textContent = formatCurrency.format(totalInvestment);
  document.querySelector("#totalInvestment").textContent = formatCurrency.format(totalInvestment);
  document.querySelector("#totalBalance").textContent = formatCurrency.format(totalAssets);
  currentMarketValue.textContent = formatMarketCurrency(investmentStats.marketValue);
  unrealizedGain.textContent = formatSignedCurrency(investmentStats.unrealizedGain);
  unrealizedGain.className = investmentStats.unrealizedGain >= 0 ? "gain-positive" : "gain-negative";
  investmentCount.textContent = getInvestmentRecords().length;
}

function updateAnalytics() {
  const today = new Date();
  const monthKeys = getRecentMonthKeys(6, today);
  const dayKeys = getRecentDayKeys(trendRangeDays, today);
  const currentMonthKey = getMonthKey(today);
  const currentMonthRecords = getRecordsForMonth(currentMonthKey);
  const monthlySeries = monthKeys.map((monthKey) => {
    const monthRecords = getRecordsForMonth(monthKey);

    return {
      key: monthKey,
      label: formatMonthLabel(monthKey),
      income: sumByType(monthRecords, "income"),
      expense: sumByType(monthRecords, "expense")
    };
  });
  const dailySeries = dayKeys.map((dayKey) => {
    const dayRecords = getRecordsForDate(dayKey);

    return {
      key: dayKey,
      label: formatDayLabel(dayKey),
      income: sumByType(dayRecords, "income"),
      expense: sumByType(dayRecords, "expense")
    };
  });

  const forecast = calculateForecast(monthlySeries, currentMonthRecords, today);
  const ledgerRecords = records.filter((record) => record.type !== "investment");
  const uniqueMonths = new Set(ledgerRecords.map((record) => String(record.date).slice(0, 7))).size;

  forecastIncome.textContent = formatCurrency.format(forecast.income);
  forecastExpense.textContent = formatCurrency.format(forecast.expense);
  forecastBalance.textContent = formatCurrency.format(forecast.balance);
  forecastIncomeNote.textContent = forecast.incomeNote;
  forecastExpenseNote.textContent = forecast.expenseNote;
  forecastBalanceNote.textContent = forecast.balanceNote;
  analysisStatus.textContent =
    ledgerRecords.length === 0 ? "尚無資料" : `依 ${ledgerRecords.length} 筆、${uniqueMonths} 個月份計算`;

  renderAnomalyAlerts(today);
  renderBudgetSuggestions(today);
  drawTrendChart(dailySeries);
  drawParetoChart(getExpenseTotalsByCategory(currentMonthRecords));
}

function toggleTrendRange() {
  trendRangeDays = trendRangeDays === 30 ? 365 : 30;
  updateTrendToggle();
  updateAnalytics();
}

function updateTrendToggle() {
  const isExpanded = trendRangeDays === 365;

  trendRangeToggle.classList.toggle("active", isExpanded);
  trendRangeToggle.setAttribute("aria-expanded", String(isExpanded));
  trendRangeToggle.setAttribute(
    "aria-label",
    isExpanded ? "收回為近一個月的每日收支趨勢" : "展開為近一年的每日收支趨勢"
  );
  trendRangeToggle.innerHTML = `
    <span aria-hidden="true">${isExpanded ? "-" : "+"}</span>
    ${isExpanded ? "收回 1 個月" : "放大 1 年"}
  `;
}

function restoreAnalyticsPanelState() {
  setAnalyticsPanelCollapsed(true);
}

function toggleAnalyticsPanel() {
  const shouldCollapse = analyticsToggle.getAttribute("aria-expanded") === "true";
  setAnalyticsPanelCollapsed(shouldCollapse);

  if (!shouldCollapse) {
    requestAnimationFrame(updateAnalytics);
  }
}

function setAnalyticsPanelCollapsed(collapsed) {
  analyticsContent.hidden = collapsed;
  analyticsPanel.classList.toggle("is-collapsed", collapsed);
  analyticsToggle.setAttribute("aria-expanded", String(!collapsed));
  analyticsToggle.textContent = collapsed ? "展開分析" : "收合分析";
  localStorage.setItem(ANALYTICS_PANEL_KEY, String(collapsed));
}

function restoreInvestmentPanelState() {
  setInvestmentPanelCollapsed(true);
}

function toggleInvestmentPanel() {
  const shouldCollapse = investmentToggle.getAttribute("aria-expanded") === "true";
  setInvestmentPanelCollapsed(shouldCollapse);
}

function setInvestmentPanelCollapsed(collapsed) {
  investmentContent.hidden = collapsed;
  investmentPanel.classList.toggle("is-collapsed", collapsed);
  investmentToggle.setAttribute("aria-expanded", String(!collapsed));
  investmentToggle.textContent = collapsed ? "展開投資" : "收合投資";
  localStorage.setItem(INVESTMENT_PANEL_KEY, String(collapsed));
}

function restoreCategoryPanelState() {
  setCategoryPanelCollapsed(true);
}

function toggleCategoryPanel() {
  const shouldCollapse = categoryToggle.getAttribute("aria-expanded") === "true";
  setCategoryPanelCollapsed(shouldCollapse);
}

function setCategoryPanelCollapsed(collapsed) {
  categoryContent.hidden = collapsed;
  categoryPanel.classList.toggle("is-collapsed", collapsed);
  categoryToggle.setAttribute("aria-expanded", String(!collapsed));
  categoryToggle.textContent = collapsed ? "展開分類清單" : "收合分類清單";
  localStorage.setItem(CATEGORY_PANEL_KEY, String(collapsed));
}

function restoreRecordsPanelState() {
  setRecordsPanelCollapsed(true);
}

function toggleRecordsPanel() {
  const shouldCollapse = recordsToggle.getAttribute("aria-expanded") === "true";
  setRecordsPanelCollapsed(shouldCollapse);
}

function setRecordsPanelCollapsed(collapsed) {
  recordsContent.hidden = collapsed;
  recordsPanel.classList.toggle("is-collapsed", collapsed);
  recordsToggle.setAttribute("aria-expanded", String(!collapsed));
  recordsToggle.textContent = collapsed ? "展開明細" : "收合明細";
  localStorage.setItem(RECORDS_PANEL_KEY, String(collapsed));
}

function calculateForecast(monthlySeries, currentMonthRecords, today) {
  const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
  const elapsedDays = Math.max(1, Math.min(today.getDate(), daysInMonth));
  const currentIncome = sumByType(currentMonthRecords, "income");
  const currentExpense = sumByType(currentMonthRecords, "expense");
  const previousMonths = monthlySeries.slice(0, -1);
  const averageIncome = averagePositive(previousMonths.map((month) => month.income));
  const averageExpense = averagePositive(previousMonths.map((month) => month.expense));
  const projectedIncome = projectIncome(currentIncome, averageIncome);
  const projectedExpense = projectExpense(currentExpense, averageExpense, elapsedDays, daysInMonth);

  return {
    income: Math.round(projectedIncome),
    expense: Math.round(projectedExpense),
    balance: Math.round(projectedIncome - projectedExpense),
    incomeNote: describeForecast("income", currentIncome, averageIncome),
    expenseNote: describeForecast("expense", currentExpense, averageExpense),
    balanceNote:
      projectedIncome - projectedExpense >= 0
        ? "月底預估仍有結餘。"
        : "照目前趨勢，月底可能會透支。"
  };
}

function projectIncome(currentIncome, averageIncome) {
  if (currentIncome > 0 && averageIncome > 0) {
    return Math.max(currentIncome, currentIncome * 0.45 + averageIncome * 0.55);
  }

  return currentIncome > 0 ? currentIncome : averageIncome;
}

function projectExpense(currentExpense, averageExpense, elapsedDays, daysInMonth) {
  const runRateExpense = currentExpense > 0 ? (currentExpense / elapsedDays) * daysInMonth : 0;

  if (currentExpense > 0 && averageExpense > 0) {
    return runRateExpense * 0.65 + averageExpense * 0.35;
  }

  return currentExpense > 0 ? runRateExpense : averageExpense;
}

function describeForecast(type, currentAmount, averageAmount) {
  if (records.length === 0) {
    return "新增紀錄後會開始估算。";
  }

  if (currentAmount > 0 && averageAmount > 0) {
    return type === "income" ? "依本月收入與過去月均估算。" : "依本月日均支出與過去月均估算。";
  }

  if (currentAmount > 0) {
    return type === "income" ? "目前先以本月已記收入估算。" : "目前先以本月支出速度估算。";
  }

  if (averageAmount > 0) {
    return "本月尚無紀錄，先用過去月份平均。";
  }

  return "需要更多資料才會更準。";
}

function renderAnomalyAlerts(today) {
  const currentMonthKey = getMonthKey(today);
  const historyKeys = getPreviousMonthKeys(5, today);
  const currentExpenses = getExpenseTotalsByCategory(getRecordsForMonth(currentMonthKey));
  const alerts = Object.entries(currentExpenses)
    .map(([category, amount]) => {
      const pastAmounts = historyKeys.map((monthKey) => {
        const monthlyExpenses = getExpenseTotalsByCategory(getRecordsForMonth(monthKey));
        return monthlyExpenses[category] || 0;
      });
      const averageAmount = averagePositive(pastAmounts);
      const overAmount = amount - averageAmount;
      const overRate = averageAmount > 0 ? overAmount / averageAmount : 0;

      return {
        category,
        amount,
        averageAmount,
        overAmount,
        overRate,
        historyCount: pastAmounts.filter((value) => value > 0).length
      };
    })
    .filter((item) => item.historyCount >= 2 && item.overAmount >= 500 && item.overRate >= 0.35)
    .sort((a, b) => b.overRate - a.overRate)
    .slice(0, 4);

  if (Object.keys(currentExpenses).length === 0) {
    anomalyList.innerHTML = renderEmptyInsight("本月還沒有支出紀錄，暫時沒有異常可比較。");
    return;
  }

  if (alerts.length === 0) {
    anomalyList.innerHTML = renderEmptyInsight("目前沒有明顯異常支出；累積更多月份後會更準。");
    return;
  }

  anomalyList.innerHTML = alerts
    .map(
      (item) => `
        <article class="insight-item warning">
          <div>
            <strong>${escapeHTML(item.category)}</strong>
            <span>比過去月均 ${formatCurrency.format(item.averageAmount)} 高 ${Math.round(item.overRate * 100)}%。</span>
          </div>
          <em>${formatCurrency.format(item.amount)}</em>
        </article>
      `
    )
    .join("");
}

function renderBudgetSuggestions(today) {
  const historyKeys = getPreviousMonthKeys(5, today);
  const currentExpenses = getExpenseTotalsByCategory(getRecordsForMonth(getMonthKey(today)));
  const categoryNames = new Set(Object.keys(currentExpenses));

  historyKeys.forEach((monthKey) => {
    Object.keys(getExpenseTotalsByCategory(getRecordsForMonth(monthKey))).forEach((category) => {
      categoryNames.add(category);
    });
  });

  const suggestions = [...categoryNames]
    .map((category) => {
      const pastAmounts = historyKeys.map((monthKey) => {
        const monthlyExpenses = getExpenseTotalsByCategory(getRecordsForMonth(monthKey));
        return monthlyExpenses[category] || 0;
      });
      const averageAmount = averagePositive(pastAmounts);
      const currentAmount = currentExpenses[category] || 0;
      const baseline = averageAmount > 0 ? averageAmount : currentAmount;
      const suggestedBudget = roundBudget(baseline * 1.08);
      const usedRate = suggestedBudget > 0 ? currentAmount / suggestedBudget : 0;

      return {
        category,
        currentAmount,
        suggestedBudget,
        usedRate
      };
    })
    .filter((item) => item.suggestedBudget > 0)
    .sort((a, b) => b.suggestedBudget - a.suggestedBudget)
    .slice(0, 6);

  if (suggestions.length === 0) {
    budgetList.innerHTML = renderEmptyInsight("有支出紀錄後，這裡會依分類產生預算建議。");
    return;
  }

  budgetList.innerHTML = suggestions
    .map((item) => {
      const percent = Math.round(item.usedRate * 100);
      const width = Math.min(100, percent);
      const statusClass = percent >= 100 ? "danger" : percent >= 80 ? "warning" : "";

      return `
        <article class="insight-item budget ${statusClass}">
          <div>
            <strong>${escapeHTML(item.category)}</strong>
            <span>建議預算 ${formatCurrency.format(item.suggestedBudget)}，本月已用 ${percent}%。</span>
          </div>
          <em>${formatCurrency.format(item.currentAmount)}</em>
          <div class="budget-bar" aria-hidden="true">
            <span style="width: ${width}%"></span>
          </div>
        </article>
      `;
    })
    .join("");
}

function drawTrendChart(dailySeries) {
  const canvasState = prepareCanvas(trendChart);
  const { ctx, width, height } = canvasState;
  const values = dailySeries.reduce((all, day) => {
    all.push(day.income, day.expense);
    return all;
  }, []);
  const maxValue = Math.max(...values);

  drawChartFrame(ctx, width, height);

  if (maxValue <= 0) {
    trendChartNote.textContent = `新增記帳資料後會顯示${getTrendRangeLabel()}每日收入與支出。`;
    drawEmptyChart(ctx, width, height, "還沒有足夠資料可繪製趨勢圖");
    return;
  }

  trendChartNote.textContent = `${getTrendRangeLabel()}每日收入與支出的折線圖。`;

  const bounds = getChartBounds(width, height);
  const chartMax = maxValue * 1.15;
  const pointsFor = (key) =>
    dailySeries.map((day, index) => {
      const x = getXPosition(index, dailySeries.length, bounds);
      const y = bounds.bottom - (day[key] / chartMax) * bounds.height;
      return { x, y, value: day[key], label: day.label };
    });

  drawYAxis(ctx, bounds, chartMax);
  drawXAxis(ctx, bounds, dailySeries.map((day) => day.label));
  drawLine(ctx, pointsFor("expense"), getThemeColor("--expense"));
  drawLine(ctx, pointsFor("income"), getThemeColor("--income"));
}

function drawParetoChart(expensesByCategory) {
  const canvasState = prepareCanvas(paretoChart);
  const { ctx, width, height } = canvasState;
  const items = Object.entries(expensesByCategory)
    .map(([category, amount]) => ({ category, amount }))
    .filter((item) => item.amount > 0)
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 7);
  const total = items.reduce((sum, item) => sum + item.amount, 0);

  drawChartFrame(ctx, width, height);

  if (items.length === 0 || total <= 0) {
    paretoChartNote.textContent = "本月有支出後，會顯示分類金額與累積占比。";
    drawEmptyChart(ctx, width, height, "本月還沒有支出可繪製柏拉圖");
    return;
  }

  const countToEighty = Math.max(
    1,
    items.findIndex((item, index) => getCumulativeAmount(items, index) / total >= 0.8) + 1
  );
  paretoChartNote.textContent = `前 ${countToEighty} 個分類約佔本月支出 80%。`;

  const bounds = getChartBounds(width, height, true);
  const chartMax = Math.max(...items.map((item) => item.amount)) * 1.15;
  const step = bounds.width / items.length;
  const barWidth = Math.min(54, step * 0.56);
  const cumulativePoints = [];

  drawYAxis(ctx, bounds, chartMax);

  items.forEach((item, index) => {
    const xCenter = bounds.left + step * index + step / 2;
    const barHeight = (item.amount / chartMax) * bounds.height;
    const x = xCenter - barWidth / 2;
    const y = bounds.bottom - barHeight;
    const cumulativeRate = getCumulativeAmount(items, index) / total;

    ctx.fillStyle = getThemeColor("--chart-bar");
    ctx.fillRect(x, y, barWidth, barHeight);
    ctx.fillStyle = getThemeColor("--chart-muted");
    ctx.font = "11px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(truncateLabel(item.category, 5), xCenter, bounds.bottom + 22);

    cumulativePoints.push({
      x: xCenter,
      y: bounds.bottom - cumulativeRate * bounds.height,
      value: cumulativeRate
    });
  });

  drawPercentAxis(ctx, bounds);
  drawLine(ctx, cumulativePoints, getThemeColor("--gold"), true);
}

function getExpenseTotalsByCategory(items) {
  return items
    .filter((record) => record.type === "expense")
    .reduce((totals, record) => {
      totals[record.main] = (totals[record.main] || 0) + Number(record.amount);
      return totals;
    }, {});
}

function getRecordsForMonth(monthKey) {
  return records.filter((record) => String(record.date).startsWith(`${monthKey}-`));
}

function getRecordsForDate(dateKey) {
  return records.filter((record) => record.date === dateKey);
}

function getRecentMonthKeys(count, endDate) {
  const monthStart = new Date(endDate.getFullYear(), endDate.getMonth(), 1);
  const keys = [];

  for (let index = count - 1; index >= 0; index -= 1) {
    keys.push(getMonthKey(addMonths(monthStart, -index)));
  }

  return keys;
}

function getRecentDayKeys(count, endDate) {
  const dayStart = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());
  const keys = [];

  for (let index = count - 1; index >= 0; index -= 1) {
    keys.push(getDateKey(addDays(dayStart, -index)));
  }

  return keys;
}

function getTrendRangeLabel() {
  return trendRangeDays === 365 ? "近 1 年" : "近 1 個月";
}

function getPreviousMonthKeys(count, endDate) {
  const monthStart = new Date(endDate.getFullYear(), endDate.getMonth(), 1);
  const keys = [];

  for (let index = count; index >= 1; index -= 1) {
    keys.push(getMonthKey(addMonths(monthStart, -index)));
  }

  return keys;
}

function addMonths(date, amount) {
  return new Date(date.getFullYear(), date.getMonth() + amount, 1);
}

function addDays(date, amount) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + amount);
}

function getMonthKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function getDateKey(date) {
  return `${getMonthKey(date)}-${String(date.getDate()).padStart(2, "0")}`;
}

function formatMonthLabel(monthKey) {
  const [year, month] = monthKey.split("-");
  return `${year.slice(2)}/${Number(month)}`;
}

function formatDayLabel(dateKey) {
  const [, month, day] = dateKey.split("-");
  return `${Number(month)}/${Number(day)}`;
}

function averagePositive(values) {
  const positiveValues = values.filter((value) => value > 0);

  if (positiveValues.length === 0) {
    return 0;
  }

  return positiveValues.reduce((total, value) => total + value, 0) / positiveValues.length;
}

function roundBudget(value) {
  const step = value >= 10000 ? 500 : 100;
  return Math.ceil(value / step) * step;
}

function renderEmptyInsight(message) {
  return `<p class="empty-insight">${escapeHTML(message)}</p>`;
}

function prepareCanvas(canvas) {
  const ratio = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  const width = Math.max(320, Math.floor(rect.width || canvas.width));
  const height = Math.max(240, Math.floor(rect.height || canvas.height));
  const ctx = canvas.getContext("2d");

  canvas.width = Math.floor(width * ratio);
  canvas.height = Math.floor(height * ratio);
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  ctx.clearRect(0, 0, width, height);

  return { ctx, width, height };
}

function getThemeColor(name) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

function getChartBounds(width, height, hasRightAxis = false) {
  const left = 58;
  const right = width - (hasRightAxis ? 58 : 24);
  const top = 26;
  const bottom = height - 46;

  return {
    left,
    right,
    top,
    bottom,
    width: right - left,
    height: bottom - top
  };
}

function drawChartFrame(ctx, width, height) {
  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = getThemeColor("--chart-bg");
  ctx.fillRect(0, 0, width, height);
}

function drawYAxis(ctx, bounds, maxValue) {
  ctx.strokeStyle = getThemeColor("--chart-grid");
  ctx.fillStyle = getThemeColor("--chart-muted");
  ctx.lineWidth = 1;
  ctx.font = "11px sans-serif";
  ctx.textAlign = "right";
  ctx.textBaseline = "middle";

  [0, 0.5, 1].forEach((ratio) => {
    const y = bounds.bottom - bounds.height * ratio;
    const value = maxValue * ratio;

    ctx.beginPath();
    ctx.moveTo(bounds.left, y);
    ctx.lineTo(bounds.right, y);
    ctx.stroke();
    ctx.fillText(formatCompactCurrency(value), bounds.left - 8, y);
  });
}

function drawXAxis(ctx, bounds, labels) {
  ctx.fillStyle = getThemeColor("--chart-muted");
  ctx.font = "11px sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "top";

  getXAxisLabelIndexes(labels.length, bounds).forEach((index) => {
    const x = getXPosition(index, labels.length, bounds);
    ctx.fillText(labels[index], x, bounds.bottom + 18);
  });
}

function getXAxisLabelIndexes(count, bounds) {
  if (count <= 1) return [0];

  const minimumSpacing = 76;
  const maxLabels = Math.max(2, Math.floor(bounds.width / minimumSpacing));
  const step = Math.max(1, Math.ceil((count - 1) / (maxLabels - 1)));
  const indexes = [];

  for (let index = 0; index < count; index += step) {
    indexes.push(index);
  }

  if (indexes[indexes.length - 1] !== count - 1) {
    indexes.push(count - 1);
  }

  for (let index = indexes.length - 2; index >= 0; index -= 1) {
    const currentX = getXPosition(indexes[index], count, bounds);
    const nextX = getXPosition(indexes[index + 1], count, bounds);

    if (nextX - currentX < minimumSpacing) {
      indexes.splice(index, 1);
    }
  }

  return indexes;
}

function drawPercentAxis(ctx, bounds) {
  ctx.fillStyle = getThemeColor("--chart-muted");
  ctx.font = "11px sans-serif";
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";

  [0, 50, 100].forEach((percent) => {
    const y = bounds.bottom - (percent / 100) * bounds.height;
    ctx.fillText(`${percent}%`, bounds.right + 8, y);
  });
}

function drawLine(ctx, points, color, showPercentLabel = false) {
  if (points.length === 0) return;

  ctx.strokeStyle = color;
  ctx.lineWidth = 3;
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  ctx.beginPath();

  points.forEach((point, index) => {
    if (index === 0) {
      ctx.moveTo(point.x, point.y);
      return;
    }

    ctx.lineTo(point.x, point.y);
  });

  ctx.stroke();

  points.forEach((point) => {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(point.x, point.y, 4, 0, Math.PI * 2);
    ctx.fill();

    if (showPercentLabel) {
      ctx.fillStyle = getThemeColor("--gold");
      ctx.font = "11px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(`${Math.round(point.value * 100)}%`, point.x, point.y - 12);
    }
  });
}

function drawEmptyChart(ctx, width, height, message) {
  ctx.fillStyle = getThemeColor("--chart-muted");
  ctx.font = "14px sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(message, width / 2, height / 2);
}

function getXPosition(index, count, bounds) {
  if (count <= 1) {
    return bounds.left + bounds.width / 2;
  }

  return bounds.left + (bounds.width / (count - 1)) * index;
}

function getCumulativeAmount(items, index) {
  return items.slice(0, index + 1).reduce((total, item) => total + item.amount, 0);
}

function formatCompactCurrency(value) {
  const rounded = Math.round(value);
  const abs = Math.abs(rounded);

  if (abs >= 100000000) {
    return `$${compactCurrency.format(Math.round((rounded / 100000000) * 10) / 10)}億`;
  }

  if (abs >= 10000) {
    return `$${compactCurrency.format(Math.round((rounded / 10000) * 10) / 10)}萬`;
  }

  return `$${compactCurrency.format(rounded)}`;
}

function truncateLabel(value, length) {
  const text = String(value);
  return text.length > length ? `${text.slice(0, length)}...` : text;
}

function deleteRecord(id) {
  const index = records.findIndex((record) => record.id === id);
  if (index === -1) return;

  records.splice(index, 1);
  saveRecords();
  renderRecords();
  renderPortfolio();
  updateSummary();
  updateAnalytics();
}

function downloadCsv() {
  if (records.length === 0) return;

  const header = [
    "日期",
    "類型",
    "大項目",
    "細項",
    "備註",
    "金額",
    "市場",
    "市場代號",
    "數量",
    "平均成本",
    "目前市價",
    "目前市值",
    "市價更新時間"
  ];
  const rows = records.map((record) => {
    const marketValue = getMarketValue(record);

    return [
      record.date,
      getTypeLabel(record.type),
      record.main,
      record.sub,
      getRecordNote(record),
      record.amount,
      record.type === "investment" ? getMarketLabel(getRecordMarket(record)) : "",
      record.type === "investment" ? getRecordSymbol(record) : "",
      record.type === "investment" ? record.quantity || "" : "",
      record.type === "investment" ? getAverageCost(record) || "" : "",
      record.type === "investment" ? record.marketPrice || "" : "",
      record.type === "investment" && marketValue !== null ? marketValue : "",
      record.type === "investment" ? formatMarketTimestamp(record.marketUpdatedAt, record.marketDate) : ""
    ];
  });

  const csv = [header, ...rows].map((row) => row.map(toCsvCell).join(",")).join("\n");
  const blob = new Blob([`\ufeff${csv}`], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `記帳明細-${toDateInputValue(new Date())}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

function downloadBackup() {
  const backup = {
    app: "daily-ledger",
    version: 1,
    exportedAt: new Date().toISOString(),
    records,
    categories
  };

  const blob = new Blob([JSON.stringify(backup, null, 2)], {
    type: "application/json;charset=utf-8"
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `日常記帳備份-${toDateInputValue(new Date())}.json`;
  link.click();
  URL.revokeObjectURL(url);
  setBackupStatus("已匯出完整備份。", "success");
}

function importBackup(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();

  reader.addEventListener("load", () => {
    try {
      const data = JSON.parse(String(reader.result).replace(/^\uFEFF/, ""));
      const imported = normalizeBackup(data);

      if (!window.confirm("匯入備份會覆蓋目前這台裝置上的記帳資料，確定要繼續嗎？")) {
        importBackupFile.value = "";
        setBackupStatus("已取消匯入。");
        return;
      }

      records.splice(0, records.length, ...imported.records);
      categories = imported.categories;
      saveRecords();
      saveCategories();

      filterType.value = "all";
      renderCategoryOptions();
      renderInvestmentOptions();
      filterMain.value = "all";
      renderCategoryList();
      renderRecords();
      renderPortfolio();
      updateSummary();
      updateAnalytics();
      localStorage.removeItem(MARKET_DAILY_REFRESH_KEY);
      scheduleAutomaticMarketRefresh();
      setBackupStatus(`匯入完成：${records.length} 筆紀錄。`, "success");
    } catch (error) {
      setBackupStatus("匯入失敗，請確認是本站匯出的 JSON 備份檔。", "error");
    } finally {
      importBackupFile.value = "";
    }
  });

  reader.addEventListener("error", () => {
    setBackupStatus("讀取檔案失敗，請再試一次。", "error");
    importBackupFile.value = "";
  });

  reader.readAsText(file);
}

function normalizeBackup(data) {
  if (!data || typeof data !== "object") {
    throw new Error("Invalid backup");
  }

  const rawRecords = Array.isArray(data.records) ? data.records : null;
  const rawCategories = data.categories && typeof data.categories === "object" ? data.categories : null;

  if (!rawRecords || !rawCategories) {
    throw new Error("Missing backup fields");
  }

  const normalizedCategories = normalizeCategories(rawCategories);
  const normalizedRecords = rawRecords.map(normalizeRecord).filter(Boolean);

  normalizedRecords.forEach((record) => {
    if (!normalizedCategories[record.main]) {
      normalizedCategories[record.main] = [];
    }

    if (!normalizedCategories[record.main].includes(record.sub)) {
      normalizedCategories[record.main].push(record.sub);
    }
  });

  return {
    records: normalizedRecords,
    categories: normalizedCategories
  };
}

function normalizeCategories(rawCategories) {
  const normalized = {};

  Object.entries(rawCategories).forEach(([main, subs]) => {
    const cleanMain = String(main).trim();
    if (!cleanMain || !Array.isArray(subs)) return;

    const cleanSubs = [...new Set(subs.map((sub) => String(sub).trim()).filter(Boolean))];
    normalized[cleanMain] = cleanSubs.length > 0 ? cleanSubs : ["其他"];
  });

  return Object.keys(normalized).length > 0 ? normalized : cloneData(defaultCategories);
}

function normalizeRecord(record) {
  if (!record || typeof record !== "object") return null;

  const type = normalizeType(record.type);
  const amount = Number(record.amount);
  const date = String(record.date || "").trim();
  const main = String(record.main || "").trim();
  const sub = String(record.sub || "").trim();

  if (!type || !Number.isFinite(amount) || amount <= 0 || !isDateString(date) || !main || !sub) {
    return null;
  }

  return {
    id: String(record.id || createId()),
    type,
    date,
    amount,
    main,
    sub,
    market: normalizeInvestmentMarket(record.market, record.symbol),
    symbol: getCanonicalMarketSymbol(record.symbol, normalizeInvestmentMarket(record.market, record.symbol)),
    quantity: normalizeOptionalPositiveNumber(record.quantity),
    marketPrice: normalizeOptionalPositiveNumber(record.marketPrice),
    marketUpdatedAt: String(record.marketUpdatedAt || ""),
    marketDate: String(record.marketDate || ""),
    note: String(record.note || "").trim().slice(0, 60)
  };
}

function isDateString(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;

  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(year, month - 1, day);

  return (
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
  );
}

function setBackupStatus(message, type = "") {
  backupStatus.textContent = message;
  backupStatus.className = `backup-status ${type}`.trim();
}

function normalizeType(type) {
  return ["income", "expense", "investment"].includes(type) ? type : null;
}

function getTypeLabel(type) {
  if (type === "income") return "收入";
  if (type === "investment") return "投資";
  return "支出";
}

function getAmountClass(type) {
  if (type === "income") return "income-text";
  if (type === "investment") return "investment-text";
  return "expense-text";
}

function getAmountSign(type) {
  if (type === "income") return "+";
  if (type === "expense") return "-";
  return "";
}

function normalizeMarketSymbol(value) {
  return String(value || "").trim().toUpperCase();
}

function normalizeTaiwanSymbol(value) {
  const symbol = normalizeMarketSymbol(value).replace(/\.(TW|TWO)$/i, "");
  return /^\d{4,6}$/.test(symbol) ? symbol : "";
}

function normalizeInvestmentMarket(value, symbol = "") {
  const market = String(value || "").trim().toLowerCase();
  if (["tw", "us"].includes(market)) return market;
  return normalizeTaiwanSymbol(symbol) ? "tw" : "us";
}

function getCanonicalMarketSymbol(value, market = "") {
  const symbol = normalizeMarketSymbol(value);
  return normalizeInvestmentMarket(market, symbol) === "tw" ? normalizeTaiwanSymbol(symbol) || symbol : symbol;
}

function getMarketSymbolKey(market, symbol) {
  return `${normalizeInvestmentMarket(market, symbol)}:${getCanonicalMarketSymbol(symbol, market)}`;
}

function isSameMarketSymbol(left, right, market = "") {
  return getCanonicalMarketSymbol(left, market) === getCanonicalMarketSymbol(right, market);
}

function getMarketLabel(market) {
  return market === "us" ? "美股" : "台股";
}

function getMarketTokens() {
  return {
    finMindToken: getFinMindToken(),
    alphaVantageKey: getAlphaVantageKey()
  };
}

function syncMarketPlaceholders() {
  const investmentIsUs = investmentMarket.value === "us";
  investmentSymbol.placeholder = investmentIsUs ? "例如 AAPL、VOO、MSFT" : "例如 0050、2330、006208";
}

function normalizeOptionalPositiveNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? number : null;
}

function formatMarketCurrency(value) {
  return `$${marketCurrency.format(value || 0)}`;
}

function formatSignedCurrency(value) {
  const sign = value >= 0 ? "+" : "-";
  return `${sign}${formatMarketCurrency(Math.abs(value))}`;
}

function formatQuantity(value) {
  return quantityFormatter.format(value || 0);
}

function formatMarketTimestamp(value, marketDate = "") {
  if (!value) return marketDate || "-";

  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return marketDate || "-";

  const timeText = date.toLocaleString("zh-TW", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  });

  return marketDate ? `${timeText} / 交易日 ${marketDate}` : timeText;
}

function sumByType(items, type) {
  return items
    .filter((record) => record.type === type)
    .reduce((total, record) => total + Number(record.amount), 0);
}

function saveRecords() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
}

function saveCategories() {
  localStorage.setItem(CATEGORY_KEY, JSON.stringify(categories));
}

function loadJSON(key, fallback) {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : cloneData(fallback);
  } catch {
    return cloneData(fallback);
  }
}

function cloneData(value) {
  return JSON.parse(JSON.stringify(value));
}

function createId() {
  if (window.crypto && typeof window.crypto.randomUUID === "function") {
    return window.crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function toDateInputValue(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, (char) => {
    const entities = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;"
    };
    return entities[char];
  });
}

function toCsvCell(value) {
  return `"${String(value ?? "").replace(/"/g, '""')}"`;
}

function debounce(callback, delay) {
  let timerId;

  return (...args) => {
    window.clearTimeout(timerId);
    timerId = window.setTimeout(() => callback(...args), delay);
  };
}
