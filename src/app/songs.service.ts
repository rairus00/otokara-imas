import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class SongsService {
  constructor() {}

  /**
   * 指定されたキーワードから楽曲を取得
   * @param keyword キーワード
   * @param brandName ブランド名
   * @returns 楽曲の配列
   */
  async getSongsByKeyword(keyword: string, brandName: string = 'all') {
    let url = `/api/imasSongs/keyword/${keyword}`;
    if (brandName != 'all') {
      url += `?brandName=${brandName}`;
    }

    // バックエンドに対してリクエストを送信
    const apiResponse = await fetch(url);

    // リクエストに失敗した場合、エラーをスロー
    if (!apiResponse.ok) {
      throw apiResponse.status;
    }

    // レスポンスとして返されたjsonを配列に変換して、変数に代入
    const songs = await apiResponse.json();

    // 楽曲の配列を返す
    return songs;
  }

  /**
   * 指定された曲名から楽曲を取得
   * @param songName 曲名
   * @param brandName ブランド名
   * @returns 楽曲の配列
   */
  async getSongsBySongName(songName: string, brandName: string = 'all') {
    let url = `/api/imasSongs/songName/${songName}`;
    if (brandName != 'all') {
      url += `?brandName=${brandName}`;
    }

    // バックエンドに対してリクエストを送信
    const apiResponse = await fetch(url);

    // リクエストに失敗した場合、エラーをスロー
    if (!apiResponse.ok) {
      throw apiResponse.status;
    }

    // レスポンスとして返されたjsonを配列に変換して、変数に代入
    const songs = await apiResponse.json();

    // 楽曲の配列を返す
    return songs;
  }

  /**
   * 指定されたブランド名で全ての楽曲を取得
   * @param brandName ブランド名
   * @returns 楽曲の配列
   */
  async getSongsByBrandName(brandName: string) {
    // バックエンドに対してリクエストを送信
    const apiResponse = await fetch(`/api/imasSongs/brandName/${brandName}`);

    // リクエストに失敗した場合、エラーをスロー
    if (!apiResponse.ok) {
      throw apiResponse.status;
    }

    // レスポンスとして返されたjsonを配列に変換して、変数に代入
    const songs = await apiResponse.json();

    // 楽曲の配列を返す
    return songs;
  }

  /**
   * 指定されたライブイベントをセトリ順に楽曲を取得
   * @param liveEventId ライブイベントのID
   * @returns 楽曲の配列
   */
  async getSongsByLiveEventId(liveEventId: number) {
    // バックエンドに対してリクエストを送信
    const apiResponse = await fetch(`/api/imasSongs/liveEvent/${liveEventId}`);

    // リクエストに失敗した場合、エラーをスロー
    if (!apiResponse.ok) {
      throw apiResponse.status;
    }

    // レスポンスとして返されたjsonを配列に変換して、変数に代入
    const songs = await apiResponse.json();

    // 楽曲の配列を返す
    return songs;
  }

  /**
   * 指定されたブランド名でライブ情報を取得
   * @param brandName ブランド名
   * @returns ライブ情報の配列
   */
  async getLiveEventsByBrandName(brandName: string) {
    // バックエンドに対してリクエストを送信
    const apiResponse = await fetch(
      `/api/imasLiveEvents?brandName=${brandName}`
    );

    // リクエストに失敗した場合、エラーをスロー
    if (!apiResponse.ok) {
      throw apiResponse.status;
    }

    // レスポンスとして返されたjsonを配列に変換して、変数に代入
    let liveEvents = await apiResponse.json();

    // イベントの一覧表示時に不要な重複した内容を削除
    liveEvents = liveEvents.map((liveEvent: any) => {
      liveEvent.title = liveEvent.title.replace(
        /THE IDOLM@STER CINDERELLA GIRLS /,
        ''
      );
      return liveEvent;
    });

    // 楽曲の配列を返す
    return liveEvents;
  }

  /**
   * 指定されたIDでライブ情報を取得
   * @param liveEventId ライブイベントのID
   */
  async getLiveEventById(liveEventId: number) {
    // バックエンドに対してリクエストを送信
    const apiResponse = await fetch(`/api/imasLiveEvents/${liveEventId}`);

    // リクエストに失敗した場合、エラーをスロー
    if (!apiResponse.ok) {
      throw apiResponse.status;
    }

    // レスポンスとして返されたjsonをオブジェクトに変換して、変数に代入
    let liveEvent = await apiResponse.json();

    // イベントの一覧表示時に不要な重複した内容を削除
    liveEvent.title = liveEvent.title.replace(
      /THE IDOLM@STER CINDERELLA GIRLS /,
      ''
    );

    // イベント情報を返す
    return liveEvent;
  }
}
