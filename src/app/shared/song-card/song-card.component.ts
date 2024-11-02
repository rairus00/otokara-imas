import { Component, Input, OnInit } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';

@Component({
  selector: 'app-song-card',
  templateUrl: './song-card.component.html',
  styleUrls: ['./song-card.component.scss'],
})
export class SongCardComponent implements OnInit {
  // 楽曲データ
  @Input()
  public song: any;

  constructor(private sanitizer: DomSanitizer) {}

  /**
   * コンポーネントが初期化されたときの処理
   */
  async ngOnInit(): Promise<void> {}

  /**
   * デンモクアプリを起動するためのURLの取得
   * @returns デンモクアプリを起動するためのURL (ただし、PCの場合は公式WebサイトのURL)
   */
  public getReserveIntentUrl() {
    // URLを生成
    let url: string;
    if (navigator.userAgent.match(/(iPhone|iPad)/)) {
      // iOS
      url = `denmoku://reserve?reqno=${this.song.damRequestNo.replace(
        /-/g,
        ''
      )}`;
    } else if (navigator.userAgent.match(/Android/)) {
      // Android
      url = `intent://reserve/?reqno=${this.song.damRequestNo.replace(
        /-/g,
        ''
      )}#Intent;scheme=denmoku;package=jp.co.dkkaraoke.denmokumini01;end;`;
    } else {
      // その他
      url = `https://www.clubdam.com/karaokesearch/songleaf.html?requestNo=${this.song.damRequestNo}`;
    }

    // 信頼のできるURLとしてマークして返す
    return this.sanitizer.bypassSecurityTrustUrl(url);
  }

  public getSongVersionTitle(songTitle: string) {
    return (
      songTitle
        // タイトルから楽曲名を削除
        .replace(this.song.title, '')
        // 前後の空白を削除
        .trim()
        // 先頭や末尾の括弧を削除
        .replace(/^\(/, '')
        .replace(/\)$/, '')
    );
  }
}
