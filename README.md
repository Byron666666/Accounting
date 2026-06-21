# 日常記帳

一個純前端的日常記帳網站，可以記錄收入、支出、投資投入、分類、備註，並提供 CSV 匯出、完整 JSON 備份/還原與投資市價追蹤。

## 功能

- 新增收入、支出與投資紀錄
- 投資紀錄會合併在同一份記帳明細，可用篩選查看
- 投資可切換台股與美股；台股自動更新使用 FinMind，美股自動更新使用 Alpha Vantage，也可在新增投資時手動輸入市價
- 依本月收入、本月支出、本月結餘和累積結餘顯示日常摘要
- 顯示本月投資、累積投資、目前市值、未實現損益和投資筆數
- 管理自訂大項目與細項分類，分類清單可收合且細項可刪除
- 篩選記帳明細，記帳明細可收合；網站開啟時所有可收合區塊預設收起
- 匯出 CSV 明細
- 匯出與匯入完整 JSON 備份
- 月底收入、支出和結餘預測
- 異常支出提醒
- 分類預算建議
- 每日收支折線圖，可用放大按鍵從近 1 個月展開到近 1 年
- 本月支出柏拉圖
- 淺色高質感介面與按壓回饋

## 使用方式

直接用瀏覽器打開 `index.html` 即可使用，不需要安裝套件或執行建置指令。

```bash
open index.html
```

## 資料保存

資料會保存在目前瀏覽器的 `localStorage`。不同瀏覽器、不同裝置之間不會自動同步，換裝置前請先使用「匯出完整備份」，再到新裝置匯入。FinMind Token 與 Alpha Vantage Key 也只會存在目前瀏覽器，不會寫進 GitHub 檔案。

## 投資市價更新

投資表單需要選擇台股或美股，並填入市場代號和持有數量。台股自動更新使用 FinMind 的 `TaiwanStockPrice` 資料集，直接輸入 `0050`、`2330`、`006208` 這類代號即可；FinMind Token 選填。美股自動更新使用 Alpha Vantage 的 Quote Endpoint，需填入 Alpha Vantage Key，例如 `AAPL`、`VOO`。兩個市場都可以在新增投資時手動輸入目前市價來查看目前市值與未實現損益。投資區可收合，投資歷史紀錄每筆都可單獨刪除。

## 部署到 GitHub Pages

1. 將此資料夾推送到 GitHub repository。
2. 到 repository 的 `Settings` > `Pages`。
3. `Source` 選擇 `Deploy from a branch`。
4. Branch 選 `main`，資料夾選 `/root`。
5. 儲存後等待 GitHub 產生網站網址。

## 專案結構

```text
.
├── index.html
├── styles.css
├── app.js
├── README.md
└── .gitignore
```
