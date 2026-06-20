# 日常記帳

一個純前端的日常記帳網站，可以記錄收入、支出、分類、備註，並提供 CSV 匯出和完整 JSON 備份/還原。

## 功能

- 新增收入與支出紀錄
- 依本月收入、本月支出、本月結餘和全部累積顯示摘要
- 管理自訂大項目與細項分類
- 篩選記帳明細
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

資料會保存在目前瀏覽器的 `localStorage`。不同瀏覽器、不同裝置之間不會自動同步，換裝置前請先使用「匯出完整備份」，再到新裝置匯入。

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
