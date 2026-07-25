# Empower Beauty - 妝識你的美 💄

[![Python Version](https://img.shields.io/badge/python-3.11-blue.svg)](https://www.python.org/)
[![Flask Version](https://img.shields.io/badge/flask-3.1.3-green.svg)](https://flask.palletsprojects.com/)
[![PostgreSQL](https://img.shields.io/badge/postgres-16%20%7C%2018-blue.svg)](https://www.postgresql.org/)
[![Redis](https://img.shields.io/badge/redis-7--alpine-red.svg)](https://redis.io/)
[![Docker Compose](https://img.shields.io/badge/docker--compose-ready-blue.svg)](https://docs.docker.com/compose/)  

> **Empower Beauty（妝識你的美）** 是一款專屬您的虛擬試妝與美妝推薦平台。
> 本專案基於 **Flask 3.x + PostgreSQL + Redis** 技術棧開發，結合了高精度的智慧彩妝色彩比對演算法、安全的身份驗證、自動化的美妝爬蟲、豐富的會員任務積點體系以及完整的管理稽核後台，為使用者提供一站式的個人化美妝體驗。

---

## 🌟 核心功能模組

### 1. 👥 會員帳號與安全防護系統 (Identity & Security)
* **雙軌身份驗證 (Dual Authentication)**：
  * **Session 模式**：採用 PostgreSQL 後端 Session 儲存（`MemberSession`），提供安全、具備過期管理、自動更新 Last Seen 以及支援跨網域安全 Cookie（Secure, HttpOnly, SameSite=None）的登入機制。
  * **Stateless JWT 模式**：採用自訂的高效安全簽章算法（HS256 簽署 HMAC），提供客戶端無狀態 Bearer Token。
* **帳號安全機制**：
  * 使用 **Bcrypt** 加密儲存密碼雜湊，主動防範暴力破解與彩虹表攻擊。
  * 支援 **全域 Session 撤銷 (Revocation)**：更改密碼、被管理員停權或角色變更時，自動更新 `session_version` 並撤銷該會員的所有 Session 與 JWT 存取權限。
* **Email OTP 驗證機制**：註冊與忘記密碼流程引入安全驗證。資料庫僅加密儲存驗證碼雜湊（`code_hash`），SMTP 發送支援精美 HTML 品牌風格範本。

### 2. 🧠 智慧色彩與風格推薦演算法 (AI Recommendation Engine)
* **色彩精準比對**：採用 **CIELAB 空間 Delta E 2000 幾何比對演算法**，比對使用者膚色（skinTone）/ 唇色（lipLab）與彩妝商品主色，計算色彩相近度與 Delta E 距離。
* **語意風格匹配**：採用 **Jaccard 相似度演算法**，針對商品標籤（tags）、風格偏好標籤（styleTags）與自訂喜好色系進行交集聯集權重分析，智慧過濾避開「地雷標籤（avoidTags）」以防作弊。
* **多維特徵匹配**：使用 **O(1) 查表特徵評分矩陣 (Scoring Matrix)**。依據使用者的臉型、眼型與唇型，對底妝、眼影、腮紅、修容與唇彩進行針對性修飾評分。
* **動態加權分配 (Dynamic Weights)**：依據不同的核心風格（如日常清透妝、港風、病嬌妝等）動態調整色彩準確度、風格匹配與特徵分數的權重占比。
* **隨機微擾與類別多樣化**：在推薦結果中引入隨機微擾（Jittering 振幅 ±1.5%），並自動打散分類（Diversification），防止推薦結果過於單一，提升使用者探索多樣性。

#### 推薦流程圖
flowchart TD
    A["輸入：臉部分析、風格、商品候選集"] --> B["取得風格標籤與偏好 / 避開色系"]
    B --> C["逐一篩掉缺 ID、缺貨、不在指定分類的商品"]
    C --> D["色彩分數：LAB 空間 ΔE"]
    C --> E["風格分數：Jaccard + Recall - 避開標籤懲罰"]
    C --> F["臉部特徵分數：查表矩陣"]
    D --> G["依彩妝分類與風格取得動態權重"]
    E --> G
    F --> G
    G --> H["加權總分 + ±1.5% 微擾"]
    H --> I["依分數排序"]
    I --> J["先保留各分類第一名，增加多樣性"]
    J --> K["回傳前 N 項與推薦理由"]
```

### 3. 🛍️ 個人化與會員積點系統 (Gamification & Points)
* **每日簽到與連續獎勵**：具備 **台北時區 (Asia/Taipei)** 日期校準的簽到邏輯，提供連續簽到（3 / 7 / 14 / 30 天）級距式點數加碼獎勵（Streak Bonus）。
* **任務進度中心**：動態追蹤使用者行為（如首次分析、首次收藏、首次推薦好友、每日簽到等），提供一鍵點數兌換與防重複領取機制（TaskClaim）。
* **點數主題商店**：會員可扣除指定點數，解鎖專屬的會員中心視覺主題（如 Classic, Rose, Jade, Noir 等）。
* **推薦碼機制**：為每位註冊會員產生唯一的推薦代碼，新會員填寫後雙方均可獲得專屬推廣積點獎勵。

### 4. 🕸️ 安全美妝網頁爬蟲與預覽服務 (Product Preview Crawler)
* **連線安全驗證**：在解析 URL 時，強制實施嚴格的主機 DNS 域名解析，確保排除任何私有、保留或本機 IP，徹底防止 **SSRF（伺服器端請求偽造）**。
* **多層級頻率限制器 (Rate Limiter)**：結合 **Redis 交易管道** 實現 Admin 限額、Domain 網域限額以及全域限額，有效防止系統過載與目標站點阻斷。
* **商品結構解析**：支援 **JSON-LD (ld+json) 結構化資料**、OpenGraph 與 Twitter 元數據解析。自動擷取品牌、品名、規格、價格、色彩、色票代碼與主圖，並提供完整的預覽資料回傳。

### 5. 🛠️ 管理稽核與安全刪除機制 (Admin Dashboard)
* **資料安全永久刪除 (Hard Delete Job)**：
  * 引入 `MemberDeletionJob` 與 `AdminAuditLog` 機制。
  * 永久刪除帳號時，會以**資料庫鎖定機制（with_for_update）** 安全執行。在單一資料庫交易中，一次性安全清除該會員所有收藏、試妝、簽到、點數、推薦紀錄、購物車及驗證碼關聯資料，確保系統無孤立關聯外鍵。
* **管理稽核日誌 (Audit Logs)**：
  * 全面追蹤高風險行為。在紀錄日誌時，將操作者（Actor）與目標（Target）的 Email 進行 **SHA-256 雜湊去識別化**，兼顧內部合規審計與 **GDPR / 個人資料保護安全規格**。
* **全功能管理介面**：提供即時的數據看板（Dashboard）、會員等級/角色管理、帳號手動停權（Suspension）、點數手動微調、以及商品新增與修改。

---

## 🛠️ 技術棧 (Technology Stack)

### 後端技術
* **核心框架**：Python 3.11 + Flask 3.1.3
* **資料庫 ORM**：Flask-SQLAlchemy + SQLAlchemy 2.x + psycopg2-binary
* **快取與頻率限制**：Redis 8.x + redis-py
* **安全與驗證**：Flask-Bcrypt + WTForms (Flask-WTF) + PyJWT
* **伺服器與部署**：Gunicorn (WSGI) + Docker + Docker Compose

### 前端技術
* **視圖範本**：Jinja2 + HTML5 / CSS3
* **CSS 框架**：Bootstrap 5.3.3
* **JavaScript**：Vanilla JS (ES6) + Fetch API
* **色彩視覺化**：整合 CIELAB / HSV / RGB 與 12維色彩向量（Qdrant 向量欄位架構）的可視化色卡元件

---

## 📂 專案目錄結構

```text
PythonProject/
├── Backend database/           # 後端與資料庫核心代碼
│   ├── csv/                    # 初始化批量匯入 CSV 資料夹
│   ├── static/                 # 靜態資源 (上傳檔案, 樣式等)
│   ├── templates/              # Jinja2 網頁範本目錄
│   │   ├── admin_dashboard.html# 管理員控制台
│   │   ├── base.html           # 全站通用版型
│   │   ├── profile.html        # 個人化會員中心
│   │   ├── products.html       # 商品列表與 AI 色彩推薦
│   │   └── ...                 # 登入、註冊、重設密碼等頁面
│   ├── app.py                  # Flask 主程式 (整合所有 API 路由與頁面)
│   ├── config.py               # 資料庫與連線設定
│   ├── extensions.py           # 擴充套件實例化 (db, bcrypt, login_manager)
│   ├── models.py               # SQLAlchemy 資料庫模型與 ORM 定義
│   ├── forms.py                # WTForms 表單驗證類別
│   ├── otp_utils.py            # SMTP 信件寄送與 OTP 產生輔助工具
│   ├── recommendation.py       # 核心彩妝推薦與 Delta E 色彩比對演算法
│   ├── crawler_preview.py      # 安全商品爬蟲與 JSON-LD 解析服務
│   ├── seed_data.py            # 初始化資料庫種子指令
│   ├── sql.py                  # 手動/批量插入 CSV 輔助函數
│   ├── wait_for_services.py    # 容器啟動順序檢測 (等待 DB / Redis 連線)
│   ├── Dockerfile              # Docker 映像檔建置檔
│   ├── docker-compose.yml      # 多容器調度設定
│   ├── requirements.txt        # 專案 Python 套件清單
│   └── ...                     # 本地診斷與測試腳本
├── .gitignore                  # Git 忽略清單設定
└── README.md                   # 專案說明文件 (本檔案)
```
---

## 🚀 快速開始 (Quick Start)

### 方案 A：使用本地虛擬環境運行 (Local Setup)

#### 1. 複製專案與準備環境
```bash
# 複製專案
git clone <your-repo-url>
cd PythonProject

# 建立並啟用虛擬環境
python3 -m venv .venv
source .venv/bin/activate  # macOS/Linux
# .venv\Scripts\activate   # Windows

# 安裝套件
pip install -r "Backend database/requirements.txt"
```

#### 2. 設定環境變數
在 `Backend database/` 目錄下建立 `.env` 檔案（可參考 `.env.example`）：
```env
# Flask 設定
FLASK_DEBUG=1
PORT=5000
SECRET_KEY=your-super-secret-key

# PostgreSQL 設定 (本地安裝)
DATABASE_URL=postgresql://postgres:yourpassword@127.0.0.1:5432/empower_beauty
DB_HOST=127.0.0.1
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=yourpassword
DB_NAME=empower_beauty

# Redis 設定
REDIS_HOST=127.0.0.1
REDIS_PORT=6379

# SMTP 寄信服務設定 (發送 OTP 驗證碼使用)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-16-digit-app-password
```

#### 3. 資料庫初始化與種子資料匯入
```bash
cd "Backend database"
# 執行種子程式以匯入 CSV 的會員、商品、最愛與色票
python seed_data.py
```

#### 4. 啟動本地開發伺服器
```bash
python run_local_5000.py
```
打開瀏覽器訪問 `http://127.0.0.1:5000`。

---

### 方案 B：使用 Docker 容器一鍵啟動 (Docker Deploy)

本專案支援一鍵容器化部署，會自動啟動三大服務：
1. **API Web 服務** (Flask + Gunicorn)
2. **PostgreSQL 16 資料庫服務** (自動掛載資料卷並支援 Healthcheck)
3. **Redis 快取服務** (頻率限制與過期管理)

#### 1. 複製設定檔
在 `Backend database/` 目錄下建立 `.env` 檔案，配置您的資料庫密碼與 SMTP 密鑰（可參考 `.env.docker.example`）。

#### 2. 啟動容器服務
```bash
cd "Backend database"
docker compose up -d --build
```

#### 3. 確認啟動狀態
```bash
# 查看容器運行狀態
docker compose ps

# 查看應用程式日誌
docker compose logs -f app
```
打開瀏覽器訪問 `http://127.0.0.1:5000/health`，若顯示 `{"status": "ok"}` 則表示服務已完全就緒！

---

## 🧪 系統測試與診斷工具 (Tests & Diagnostics)

專案內建了數個診斷腳本，供開發者驗證各項安全性、資料庫寫入與登入狀態。

* **單純連線測試 (`quick_test.py`)**：
  驗證資料庫是否可查詢會員並建立 `MemberSession`。
* **登入與 Cookie 設定測試 (`test_cookie.py`)**：
  專門用來測試 `/api/login` 成功後是否有確實回傳安全 Secure/HttpOnly Cookie 標頭。
* **全流程診斷工具 (`full_diagnostic.py`)**：
  自動檢測 `/api/login` 路由、`MemberSession` 模型、Cookie 的寫入以及用 Cookie 讀取個人資料 API 的授權完整度，並輸出 `diagnostic_result.txt` 報告。
* **密碼雜湊與驗證比對 (`test_login.py`)**：
  直接測試資料庫會員密碼在 Bcrypt 雜湊下的校對反應。

---

## 🔒 資料庫預存程序與 Trigger 

為了保證極致的效能與資料完整性，PostgreSQL 中加入了數項 Trigger 與預存程序（詳細定義可參考 `postgre.sql`）：
* `func_prevent_multiple_checkin()`：防止使用者在同一個日曆天內進行重複簽到。
* `func_auto_upgrade_level()`：在使用者累積足夠簽到次數後，自動在資料庫底層觸約升級會員等級（Bronze ➔ Silver ➔ Gold）。
* `func_before_favorite_insert()`：避免重複建立相同的最愛收藏。
* `enforce_product_contract()`：在商品寫入/更新時，自動補全欄位、校驗 HEX 色票格式、利用 RGB 自動換算 CIELAB 的 $L, a, b$ 向量並給予商品數據品質評分（Data Quality Score）。

---

## 📄 開源授權

本專案採用 [MIT License](LICENSE) 授權開源。歡迎學術交流、畢業專題引用與技術研究。
