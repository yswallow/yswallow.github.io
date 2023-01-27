## 逆アセンブラなしでファームウェアの知的財産権を侵害した話

### まとめ

逆アセンブルしなくても破滅的なコード改変は可能だから気を付けよう

### 何をしたか

* ファームウェアファイルをバイト列に戻して
* データ領域を探して
* 対象外ハードウェアで動くよう書き換えて
* 動作をSNSに公開した

### 結果

* 作者によって対策が行われた

### 記事の責任逃れ

* 私は法律の専門家ではないので記事の内容の正しさは保証しません。

### どうして今書いているのか

* AtmelのQTouchを使っているのだがライブラリのソースファイルが提供されておらず，「バイナリを読めば使用するレジスタやその設定値がわかるのではないか」と思ってしまったため

### 何があったか

とあるソースコードが公開されていないファームウェアがありました。

ぼくは同じMCUを持っていました。

そのソフトウェアはピン番号でGPIOのピンを指定するようになっており，きっと内部に変換テーブルを持っているだろうとぼくは考えました。

GPIOのピン番号は8ビット正整数型で保持されている蓋然性が高いと考えました。

ファームウェアのUF2ファイルをintel Hexファイルに変換してピン番号の順に並べた8ビット正整数を検索すると１か所だけヒットしました。

嬉々としてGPIO番号を書き換え，MCUに書き込むと書き換えたGPIO番号で動作しました。

嬉々としてSNSに動作動画をアップロードしました。

後日新しいバージョンのファームウェアで同様のことを行うとファームウェアが起動しないようになっていました。

過去のバージョンのファームウェアも公開場所から削除されていました。

### どのようにすれば良かったか

* そもそも実行しない
* 結果をSNSに上げない。他人に見せない。ファームウェアをクラックした事実を口外しない。