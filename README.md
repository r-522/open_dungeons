# Open Dungeons (オペダン)

Open World × Tower Defense × Action RPG (co-op PvE).
**Engine:** Godot 4.3+ / C# (.NET 8) ／ **Web:** Vercel static landing site.

Design doc: v1.0 (本書は §17 ディレクトリ構成・§5.3 コアモジュールを忠実に反映)。

---

## 1. リポジトリ構成

```
project.godot          Godot プロジェクト本体
OpenDungeons.csproj    C# ゲームロジック
OpenDungeons.sln       ソリューション
scenes/                .tscn (ui / world / td / characters / common)
scripts/               C# (core / net / td / jobs / towers / combat / characters / ui / domain)
data/                  .tres 定義 (jobs / items / enemies / towers / pets)
localization/          strings.csv (ja/en/zh/ko/es) + README
tests/                 xUnit テスト (Godot 非依存)
public/                Vercel に配信する静的ランディング (index.html, status.json)
vercel.json            Vercel ビルド設定 (outputDirectory: public)
.github/workflows/     CI (dotnet test)
```

---

## 2. ゲームの起動方法 (ローカル)

### 2.1 前提
- **Godot 4.3+ (.NET 版)** — https://godotengine.org/download
- **.NET SDK 8.0** — https://dotnet.microsoft.com/

### 2.2 初回セットアップ
```bash
git clone https://github.com/r-522/open_dungeons.git
cd open_dungeons
dotnet restore
```

### 2.3 エディタで起動
```bash
godot --editor .
```
Godot エディタが開いたら、初回のみ **Project → Tools → C# → Create C# solution** を実行
(既に `OpenDungeons.sln` がある場合はスキップ可)。
**F5** または再生ボタンで `scenes/ui/Title.tscn` から起動します。

### 2.4 CLI で直接起動
```bash
godot --path . res://scenes/ui/Title.tscn
```

### 2.5 ヘッドレス (専用サーバ / CI 検証用)
```bash
godot --headless --path . --quit
```

### 2.6 マルチプレイ (4人協力 PvE)
- **ホスト**: `NetManager.Host()` を呼ぶ UI ボタン経由 (デフォルト UDP 27015)
- **クライアント**: `NetManager.Join(address)` で接続
- 同期権威はホスト側。敵 AI / 戦利品 / ウェーブはホスト確定 (設計書 §6)

### 2.7 キーバインド (初期値、設計書 §8.6)
| 操作 | キー |
| --- | --- |
| 移動 | WASD |
| ジャンプ | Space |
| ダッシュ / しゃがみ | Shift / Ctrl |
| 通常攻撃 / サブ | 左クリック / 右クリック |
| スキル 1/2/3/Ult | E / F / V / Z |
| タワーメニュー | T |
| インタラクト / インベントリ / マップ / ポーズ | X / I / M / Esc |

---

## 3. テスト

Godot 非依存の C# ドメインロジック (LootGenerator など) は単独で実行可能:
```bash
cd tests
dotnet test -c Release
```
CI (GitHub Actions, `.github/workflows/ci.yml`) では PR ごとに自動実行。

---

## 4. Web サイト (Vercel)

### 4.1 構成
- 静的サイトのみ。 `public/` 配下を配信、`vercel.json` の `outputDirectory: public` で固定。
- Next.js などのフレームワークは未使用 (設計書 §5.2: Vercel は Web と補助 API 用、ゲーム本体ではない)。

### 4.2 デプロイ
リポジトリを Vercel に Import するだけ。Framework Preset は **Other (Static)**、
Build Command は **空欄**、Output Directory は **`public`** を選択 (自動検出されます)。

### 4.3 ローカルプレビュー
```bash
npx serve public
# または
python3 -m http.server -d public 8000
```
ブラウザで `http://localhost:8000` を開く。

### 4.4 404 トラブルシュート
- Vercel Dashboard → Project → Settings → Build & Output で `Output Directory` が
  `public` になっているか確認 (本リポジトリの `vercel.json` で固定済み)。
- 再デプロイ後も 404 が続く場合は **Deployments → Redeploy → "Clear build cache"**。
- 直アクセスする URL は `/`, `/status.json` のみ存在。

---

## 5. ローカライズ

- 原本: `localization/strings.csv` (キー, ja, en, zh, ko, es)
- Godot エディタの **Project → Tools → Import Translations** で `.translation` を生成。
- フォールバックは `en` (`project.godot` の `locale/fallback`)。

---

## 6. 設計書との対応 (§20 受け入れ条件)

| 受け入れ項目 | 状態 |
| --- | --- |
| Godot 4.3+ で起動しタイトル画面表示 | `scenes/ui/Title.tscn` |
| 1マップ・4人協力で通しプレイ | ネット骨格 + TDController + WaveDirector |
| 4職業 (Knight/Berserker/Ranger/Wizard) 選択 | `data/jobs/*.tres` |
| スキル/タワー/ウェーブ/報酬/セーブ | `scripts/{combat,towers,td,core/SaveManager}` |
| 統一テーマ UI と設定反映 | HUD/Title + LocaleManager |
| 5言語ローカライズ基盤 | `localization/strings.csv` |
| テストと CI | `tests/` + `.github/workflows/ci.yml` |
| 38職/24エリア/MOD への拡張性 | `Resource` 定義 + ModLoader フック予定地 |

---

## 7. ライセンスとコントリビューション
社内開発中。コミットメッセージ・ブランチ運用は CLAUDE 規約に従う。
