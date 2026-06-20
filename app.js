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

let trendRangeDays = 30;

const formatCurrency = new Intl.NumberFormat("zh-TW", {
  style: "currency",
  currency: "TWD",
  maximumFractionDigits: 0
});

const compactCurrency = new Intl.NumberFormat("zh-TW", {
  notation: "compact",
  maximumFractionDigits: 1
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
  updateAnalytics();

  mainCategory.addEventListener("change", () => renderSubCategoryOptions());
  entryForm.addEventListener("submit", addRecord);
  categoryForm.addEventListener("submit", addCategory);
  filterType.addEventListener("change", renderRecords);
  filterMain.addEventListener("change", renderRecords);
  resetCategories.addEventListener("click", restoreDefaultCategories);
  exportCsv.addEventListener("click", downloadCsv);
  exportBackup.addEventListener("click", downloadBackup);
  importBackupFile.addEventListener("change", importBackup);
  trendRangeToggle.addEventListener("click", toggleTrendRange);
  window.addEventListener("resize", debounce(updateAnalytics, 160));
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
  updateAnalytics();
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
  const uniqueMonths = new Set(records.map((record) => String(record.date).slice(0, 7))).size;

  forecastIncome.textContent = formatCurrency.format(forecast.income);
  forecastExpense.textContent = formatCurrency.format(forecast.expense);
  forecastBalance.textContent = formatCurrency.format(forecast.balance);
  forecastIncomeNote.textContent = forecast.incomeNote;
  forecastExpenseNote.textContent = forecast.expenseNote;
  forecastBalanceNote.textContent = forecast.balanceNote;
  analysisStatus.textContent =
    records.length === 0 ? "尚無資料" : `依 ${records.length} 筆、${uniqueMonths} 個月份計算`;

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
  const values = dailySeries.flatMap((day) => [day.income, day.expense]);
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
  drawLine(ctx, pointsFor("expense"), "#ff7a7a");
  drawLine(ctx, pointsFor("income"), "#5ff0a2");
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

    ctx.fillStyle = "rgba(85, 220, 234, 0.72)";
    ctx.fillRect(x, y, barWidth, barHeight);
    ctx.fillStyle = "#cfe4ea";
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
  drawLine(ctx, cumulativePoints, "#ffd66b", true);
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
  ctx.fillStyle = "rgba(7, 21, 27, 0.78)";
  ctx.fillRect(0, 0, width, height);
}

function drawYAxis(ctx, bounds, maxValue) {
  ctx.strokeStyle = "rgba(184, 201, 210, 0.16)";
  ctx.fillStyle = "#9fb4bd";
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
  ctx.fillStyle = "#9fb4bd";
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
  ctx.fillStyle = "#9fb4bd";
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
      ctx.fillStyle = "#ffe69c";
      ctx.font = "11px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(`${Math.round(point.value * 100)}%`, point.x, point.y - 12);
    }
  });
}

function drawEmptyChart(ctx, width, height, message) {
  ctx.fillStyle = "#9fb4bd";
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
  return `$${compactCurrency.format(Math.round(value))}`;
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
  updateSummary();
  updateAnalytics();
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
      updateAnalytics();
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

function debounce(callback, delay) {
  let timerId;

  return (...args) => {
    window.clearTimeout(timerId);
    timerId = window.setTimeout(() => callback(...args), delay);
  };
}
