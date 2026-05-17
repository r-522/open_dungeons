# オープン・ダンジョンズ

オープンワールド × タワーディフェンス × アクションRPG（協力型 PvE）。
**エンジン:** Godot 4.3+ / C#（.NET 8）　**Web:** Vercel 静的サイト。

設計書 v1.0 準拠（§17 ディレクトリ構成・§5.3 コアモジュールを反映）。

---

## 1. リポジトリ構成

```
project.godot          Godot プロジェクト本体（既定ロケール: ja）
OpenDungeons.csproj    C# ゲームロジック
OpenDungeons.sln       ソリューション
scenes/                .tscn（ui / world / td / characters / common）
scripts/               C#（core / net / td / jobs / towers / combat / characters / ui / domain）
data/                  .tres 定義（jobs / skills / items / enemies / towers / pets / waves）
localization/          strings.csv（ja/en/zh/ko/es）
tests/                 xUnit テスト（Godot 非依存）
public/                Vercel 配信用 静的ランディング（index.html, status.json）
vercel.json            Vercel ビルド設定（outputDirectory: public）
.github/workflows/     CI（dotnet test）
```

---

## 2. ゲームの起動方法（ローカル）

### 2.1 前提
- **Godot 4.3+（.NET 版）** — https://godotengine.org/download
- **.NET SDK 8.0** — https://dotnet.microsoft.com/

### 2.2 セットアップ
```bash
git clone https://github.com/r-522/open_dungeons.git
cd open_dungeons
dotnet restore
```

### 2.3 エディタで起動
```bash
godot --editor .
```
Godot エディタで開き、初回のみ **プロジェクト → ツール → C# → C# ソリューションを作成** を実行
（既に `OpenDungeons.sln` がある場合は不要）。**F5** で `scenes/ui/Title.tscn` から起動します。

### 2.4 CLI で直接起動
```bash
godot --path . res://scenes/ui/Title.tscn
```

### 2.5 ヘッドレス（CI／専用サーバ検証）
```bash
godot --headless --path . --quit
```

### 2.6 マルチプレイ（最大4人）
- タイトル → 「マルチプレイ」
- **ホスト**: 「ホスト開始」ボタン（UDP 27015 で待受）
- **クライアント**: アドレス入力 → 「参加」
- 同期権威はホスト。敵 AI／戦利品／ウェーブはホスト側で確定（設計書 §6）。

### 2.7 画面遷移
```
Title ─┬─ プレイ ───── Loadout ──── SampleMap（戦闘 + TD）
       ├─ マルチプレイ ── Multiplayer（Host / Join）
       ├─ 設定 ─────── Settings（言語 / 音量 / 表示）
       └─ 終了
```

### 2.8 キーバインド（初期値、設計書 §8.6）
| 操作 | キー |
| --- | --- |
| 移動 | W A S D |
| ジャンプ | Space |
| ダッシュ / しゃがみ | Shift / Ctrl |
| 通常攻撃 / サブ | 左クリック / 右クリック |
| スキル 1〜3 / アルティメット | E / F / V / Z |
| タワーメニュー | T |
| インタラクト / インベントリ / マップ / ポーズ | X / I / M / Esc |

---

## 3. テスト

Godot 非依存のドメインロジックは単独で実行可能:
```bash
cd tests
dotnet test -c Release
```
CI（GitHub Actions, `.github/workflows/ci.yml`）で PR ごとに自動実行。

---

## 4. Web サイト（Vercel）

### 4.1 構成
- `public/` 配下の静的サイトのみ。Next.js などのフレームワークは未使用
  （設計書 §5.2: Vercel は Web と補助 API 用、ゲーム本体ではない）。
- `vercel.json` で `outputDirectory: public` を固定。

### 4.2 デプロイ手順
Vercel に本リポジトリを Import するだけ:

| 項目 | 値 |
| --- | --- |
| Framework Preset | **Other** |
| Build Command | （空欄） |
| Output Directory | `public`（vercel.json で自動設定） |
| Install Command | （空欄） |

設定変更後は **Deployments → ⋯ → Redeploy → "Clear build cache"** で再デプロイ。

### 4.3 ローカルプレビュー
```bash
npx serve public
# または
python3 -m http.server -d public 8000
```
ブラウザで `http://localhost:8000` を開く。

### 4.4 404 トラブルシュート
- `outputDirectory` が `public` になっているか Vercel Dashboard で確認。
- 直アクセス可能なパスは `/`, `/status.json` のみ。
- それでも 404 の場合はビルドキャッシュをクリアして再デプロイ。

---

## 5. ローカライズ

- 原本: `localization/strings.csv`（キー, ja, en, zh, ko, es）
- 既定ロケールは **ja**、フォールバックも **ja**（`project.godot`）。
- Godot エディタの **プロジェクト → ツール → 翻訳をインポート** で `.translation` を生成。
- 設定画面（Settings.tscn）から実行時に切り替え可能。

---

## 6. データ駆動の追加方法

新しい職業／敵／タワー／スキル／アイテムを足すには、対応する `Resource` 派生クラスの
`.tres` を `data/` 配下に置くだけ（コード変更不要）。例:

```
data/jobs/<id>.tres        職業
data/skills/<id>.tres      スキル
data/towers/<id>.tres      タワー
data/enemies/<id>.tres     敵
data/items/<id>.tres       アイテム / アフィックス
data/waves/<id>.tres       ウェーブテンプレート
data/pets/<id>.tres        ペット
```

設計書 §11.1.2 の最終 38 職業、§12.2 の 24 エリア、§13 の MOD はこの枠組みで段階拡張。

---

## 7. 設計書 §20 受け入れ条件との対応

| 受け入れ項目 | 状態 |
| --- | --- |
| Godot 4.3+ で起動しタイトル画面表示 | `scenes/ui/Title.tscn`（日本語化済み） |
| 1マップ・4人協力で通しプレイ | ネット骨格 + TDController + WaveDirector |
| 4職業（Knight/Berserker/Ranger/Wizard）選択 | `data/jobs/*.tres` + Loadout 画面 |
| スキル / タワー / ウェーブ / 報酬 / セーブ | `scripts/{combat,towers,td,core/SaveManager}` |
| 統一テーマ UI と設定反映 | Title / Loadout / Multiplayer / Settings / HUD |
| 5 言語ローカライズ基盤 | `localization/strings.csv` |
| テストと CI | `tests/` + `.github/workflows/ci.yml` |
| 38 職業 / 24 エリア / MOD への拡張性 | Resource 駆動 + `ModLoader`（署名付き PCK） |

---

## 8. ライセンス
社内開発中。コミットメッセージ・ブランチ運用は CLAUDE 規約に従う。
