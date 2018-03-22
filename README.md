VSD for GPS 向け <br>
Mychron5用ログリーダ＆カート向けスキンファイル
==================
Mychron5でエクスポートしたログデータを、VSD for GPSに読み込ませるためのログリーダとカート向けにカスタマイズしたスキンファイルです。

----

## スクリプトファイルのコピー
#### Mychron5.js
ログリーダ本体です。<br>
vsd_plugins\\_log_reader フォルダにコピーしてください。

#### kart_standard.js
スキンファイルです。<br>
vsd_plugins フォルダにコピーしてください

----

## ログデータの準備
Race Studio Analysisを使って、Mychron5からログデータをCSV形式でエクスポートしてください。<br>
その際、チャンネルはすべてを選択してください。

----

## VSDメーター合成
本ログデータは拡張子が「.csv」であることが前提となっています。<br>
本ログリーダよりも優先度の高い「.csv」用のログリーダが登録されている場合は、そちらが使用される場合があります。<br>
その場合は、vsd_plugins\_log_reader フォルダに格納されているログリーダから「.csv」用のログリーダの優先度を下げてください。<br>
詳細は
<https://sites.google.com/site/vsdforgps/home/vsd-for-gps/log_reader>
の「プラグイン情報の登録」を参照してください。

vsd_plugins フォルダに kart_standard.js が正しくコピーされている場合は、「スキン」のドロップダウンリストに表示されるはずなので、kart_standard.js を選択してください。

VSD for GPSの使い方や、動画とログの同期のさせ方等については、コレジャナイソフトウェア様のVSD for GPSのHPを参照ください。<https://sites.google.com/site/vsdforgps/home/vsd-for-gps>

