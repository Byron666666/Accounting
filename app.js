const STORAGE_KEY = "dailyLedgerRecords";
const CATEGORY_KEY = "dailyLedgerCategories";

const defaultCategories = {
  餐飲: ["早餐", "午餐", "晚餐", "飲料", "聚餐"],
  交通: ["捷運", "公車", "計程車", "加油", "停車"],
  生活: ["日用品", "房租", "水電瓦斯", "電話網路", "維修"],
  娛樂: ["電影", "遊戲", "旅遊", "訂閱", "活動"],
  醫療: ["看診", "藥品", "保健", "保險"],
  收入: ["薪資", "獎金", "投資", "兼職", "其他收入"]
};

const records = loadJSON(STORAGE_KEY, []);
let categories = loadJSON(CATEGORY_KEY, defaultCategories);

const currentDate = document.querySelector("#currentDate");
const currentTime = document.querySelector("#currentTime");
const entryForm = document.querySelector("#entryForm");
const categoryForm = document.querySelector("#categoryForm");
const categoryList = document.querySelector("#categoryList");
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
const emptyState = document.querySelector("#emptyState");
const resetCategories = document.querySelector("#resetCategories");
const exportCsv = document.querySelector("#exportCsv");
const exportBackup = document.querySelector("#exportBackup");
const importBackupFile = document.querySelector("#importBackupFile");
const backupStatus = document.querySelector("#backupStatus");

const formatCurrency = new Intl.NumberFormat("zh-TW", {
  style: "currency",
  currency: "TWD",
  maximumFractionDigits: 0
});

init();

function init() {
  entryDate.value = toDateInputValue(new Date());
  updateClock();
  setInterval(updateClock, 1000);

  renderCategoryOptions();
  renderCategoryList();
  renderRecords();
  updateSummary();

  mainCategory.addEventListener("change", () => renderSubCategoryOptions());
  entryForm.addEventListener("submit", addRecord);
  categoryForm.addEventListener("submit", addCategory);
  filterType.addEventListener("change", renderRecords);
  filterMain.addEventListener("change", renderRecords);
  resetCategories.addEventListener("click", restoreDefaultCategories);
  exportCsv.addEventListener("click", downloadCsv);
  exportBackup.addEventListener("click", downloadBackup);
  importBackupFile.addEventListener("change", importBackup);
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

  const type = new FormData(entryForm).get("type");
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
  renderCategoryList();
}

function restoreDefaultCategories() {
  categories = cloneData(defaultCategories);
  saveCategories();
  renderCategoryOptions();
  renderCategoryList();
}

function renderCategoryOptions(selectedMain = mainCategory.value, selectedSub = subCategory.value) {
  const mains = Object.keys(categories);

  mainCategory.innerHTML = mains
    .map((category) => `<option value="${escapeHTML(category)}">${escapeHTML(category)}</option>`)
    .join("");

  filterMain.innerHTML = [
    '<option value="all">所有大項目</option>',
    ...mains.map((category) => `<option value="${escapeHTML(category)}">${escapeHTML(category)}</option>`)
  ].join("");

  mainCategory.value = mains.includes(selectedMain) ? selectedMain : mains[0];
  renderSubCategoryOptions(selectedSub);
}

function renderSubCategoryOptions(selectedSub = subCategory.value) {
  const subs = categories[mainCategory.value] || [];
  subCategory.innerHTML = subs
    .map((category) => `<option value="${escapeHTML(category)}">${escapeHTML(category)}</option>`)
    .join("");
  subCategory.value = subs.includes(selectedSub) ? selectedSub : subs[0];
}

function renderCategoryList() {
  categoryList.innerHTML = Object.entries(categories)
    .map(([main, subs]) => {
      const tags = subs.map((sub) => `<span class="tag">${escapeHTML(sub)}</span>`).join("");
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
}

function renderRecords() {
  const filteredRecords = records.filter((record) => {
    const typeMatched = filterType.value === "all" || record.type === filterType.value;
    const mainMatched = filterMain.value === "all" || record.main === filterMain.value;
    return typeMatched && mainMatched;
  });

  recordsBody.innerHTML = filteredRecords
    .map((record) => {
      const amountClass = record.type === "income" ? "income-text" : "expense-text";
      const typeLabel = record.type === "income" ? "收入" : "支出";
      const sign = record.type === "income" ? "+" : "-";
      return `
        <tr>
          <td>${escapeHTML(record.date)}</td>
          <td><span class="type-pill ${record.type}">${typeLabel}</span></td>
          <td>${escapeHTML(record.main)}</td>
          <td>${escapeHTML(record.sub)}</td>
          <td>${escapeHTML(record.note || "-")}</td>
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
  const totalIncome = sumByType(records, "income");
  const totalExpense = sumByType(records, "expense");

  document.querySelector("#monthlyIncome").textContent = formatCurrency.format(monthlyIncome);
  document.querySelector("#monthlyExpense").textContent = formatCurrency.format(monthlyExpense);
  document.querySelector("#monthlyBalance").textContent = formatCurrency.format(monthlyIncome - monthlyExpense);
  document.querySelector("#totalBalance").textContent = formatCurrency.format(totalIncome - totalExpense);
}

function deleteRecord(id) {
  const index = records.findIndex((record) => record.id === id);
  if (index === -1) return;

  records.splice(index, 1);
  saveRecords();
  renderRecords();
  updateSummary();
}

function downloadCsv() {
  if (records.length === 0) return;

  const header = ["日期", "類型", "大項目", "細項", "備註", "金額"];
  const rows = records.map((record) => [
    record.date,
    record.type === "income" ? "收入" : "支出",
    record.main,
    record.sub,
    record.note,
    record.amount
  ]);

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
      filterMain.value = "all";
      renderCategoryList();
      renderRecords();
      updateSummary();
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

  const type = record.type === "income" ? "income" : record.type === "expense" ? "expense" : null;
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
