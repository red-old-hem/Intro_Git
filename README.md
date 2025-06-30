# 配送カレンダー Webアプリ

Flask を利用した簡易的な配送カレンダーのサンプルです。受注日とリードタイムを入力すると、土日・祝日を考慮した出荷日と納品予定日を計算します。

## リポジトリの入手方法

GitHub 上で公開されている場合は次のコマンドでクローンします。

```bash
git clone <REPO_URL>
cd Intro_Git
```

ZIP ファイルを展開して利用する場合は、以下のように解凍してフォルダに移動します。

```bash
unzip Intro_Git.zip
cd Intro_Git
```

## セットアップ

```bash
pip install -r requirements.txt
python app.py
```

ブラウザで `http://localhost:5000` にアクセスしてください。
