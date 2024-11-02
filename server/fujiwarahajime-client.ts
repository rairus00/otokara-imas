import fetch from 'node-fetch';

const FUJIWARA_HAJIME_API_ENDPOINT = 'https://api.fujiwarahaji.me/v3/';

export interface FujiwarahajimeSongDetail {
  // タイトル
  name: string;
  // カナ
  kana: string;
  // タイプ
  type: 'music';
  // 楽曲ID
  song_id: number;
  // リンクURL
  link: string;
  // API URL
  api: string;
  // ブランド
  music_type: string;
  // 作詞者
  lyrics: any[];
  // 作曲者
  composer: any[];
  // 編曲者
  arrange: any[];
  // 歌詞URL
  lyrics_link: string | null;
  // 収録ディスク
  disc: any[];
  // メンバー情報
  member:
    | {
        name: string;
        type: string;
        tax_id: number;
        link: string;
        api: string;
        production: string;
        cv: string;
      }[]
    | undefined;
  // ライブ情報
  live: any[] | null;
  // その他
  digital: boolean;
}

export interface LiveEventDetailResponse {
  name: string;
  type: string;
  tax_id: number;
  link: string;
  api: string;
  date: string;
  place: string;
  member:
    | {
        name: string;
        type: string;
        tax_id: number;
        link: string;
        api: string;
        production: string;
        cv: string;
      }[]
    | null;
  setlist: boolean;
  song: {
    name: string | null;
    type: string | null;
    music_type: string | undefined;
    song_id: number | null;
    link: string | null;
    api: string | null;
    song_text: string;
    unit?: {
      name: string;
      type: string;
      tax_id: number;
      link: string;
      api: string;
      member: {
        name: string;
        type: string;
        tax_id: number;
        link: string;
        api: string;
        production: string;
        cv: string;
      }[];
    }[];
    member?: {
      name: string;
      type: string;
      tax_id: number;
      link: string;
      api: string;
      production: string;
      cv: string;
    }[];
    member_text: string;
  }[];
}

export class FujiwarahajimeClient {
  /**
   * 楽曲IDの一覧を取得
   * @returns 楽曲ID一覧の配列
   */
  static async getSongIds() {
    const requestUrl = `${FUJIWARA_HAJIME_API_ENDPOINT}/list?type=music&order=asc`;
    const apiResponse = await fetch(requestUrl);

    if (apiResponse.status != 200) {
      // リクエストに失敗したならば、エラーを返す
      throw apiResponse;
    }

    // 検索結果を取得
    const songs = await apiResponse.json();
    let songIds: number[] = [];

    for (let song of songs) {
      songIds.push(song.song_id);
    }

    return songIds;
  }

  static async getSongDetails(songIds: number[]) {
    const songDetails = [];

    for (let songId of songIds) {
      const songDetail = await this.getSongDetail(songId);
      songDetails.push(songDetail);
    }

    return songDetails;
  }

  /**
   * 楽曲の詳細情報を取得
   * @param songId 楽曲ID
   * @returns 楽曲詳細情報
   */
  static async getSongDetail(
    songId: number
  ): Promise<FujiwarahajimeSongDetail> {
    const requestUrl = `${FUJIWARA_HAJIME_API_ENDPOINT}/music?id=${songId}`;
    const apiResponse = await fetch(requestUrl);

    if (apiResponse.status != 200) {
      // リクエストに失敗したならば、エラーを返す
      throw apiResponse;
    }

    // 検索結果を取得
    return await apiResponse.json();
  }

  /**
   * すべてのライブ情報を取得
   * @returns ライブ情報の配列
   */
  static async getLiveEvents() {
    const requestUrl = `${FUJIWARA_HAJIME_API_ENDPOINT}/list?type=live`;

    const apiResponse = await fetch(requestUrl);

    if (apiResponse.status != 200) {
      // リクエストに失敗したならば、エラーを返す
      throw apiResponse;
    }

    // 検索結果を取得
    const result = await apiResponse.json();

    return result;
  }

  /**
   * 指定されたキーワードからライブ情報を取得
   * @param keyword keyword
   * @returns ライブ情報の配列
   */
  static async getLiveEventsByKeyword(keyword: string) {
    const requestUrl = `${FUJIWARA_HAJIME_API_ENDPOINT}/list?type=live&search=${keyword}`;

    const apiResponse = await fetch(requestUrl);

    if (apiResponse.status != 200) {
      // リクエストに失敗したならば、エラーを返す
      throw apiResponse;
    }

    // 検索結果を取得
    const result = await apiResponse.json();

    return result;
  }

  /**
   * ライブの詳細情報を取得
   * @param taxId taxID
   * @returns ライブの詳細情報
   */
  static async getLiveEventDetailByTaxId(
    taxId: number
  ): Promise<LiveEventDetailResponse> {
    const requestUrl = `${FUJIWARA_HAJIME_API_ENDPOINT}/tax?id=${taxId}`;

    const apiResponse = await fetch(requestUrl);

    if (apiResponse.status != 200) {
      // リクエストに失敗したならば、エラーを返す
      throw apiResponse;
    }

    // 検索結果を取得
    const result = await apiResponse.json();

    return result;
  }
}
