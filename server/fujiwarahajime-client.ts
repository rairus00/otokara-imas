import fetch from 'node-fetch';

const FUJIWARA_HAJIME_API_ENDPOINT = 'https://api.fujiwarahaji.me/v3/';
const MAX_GET_SONG_LIST_NUM = 1;

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
  static async getSongIdList() {
    const requestUrl = `${FUJIWARA_HAJIME_API_ENDPOINT}/list?type=music`;
    const apiResponse = await fetch(requestUrl);

    if (apiResponse.status != 200) {
      // リクエストに失敗したならば、エラーを返す
      throw apiResponse;
    }

    // 検索結果を取得
    const songs = await apiResponse.json();
    let songIdList: number[] = [];

    let counter = 0;
    for (let song of songs) {
      if (counter >= MAX_GET_SONG_LIST_NUM) {
        break;
      }

      songIdList.push(song.song_id);
      counter++;
    }

    return songIdList;
  }

  static async getSongDetailList(songIds: number[]) {
    const songDetailList = [];

    let counter = 0;
    for (let songId of songIds) {
      if (counter >= MAX_GET_SONG_LIST_NUM) {
        break;
      }

      const songDetail = await this.getSongDetail(songId);
      songDetailList.push(songDetail);
      counter++;
    }

    return songDetailList;
  }

  /**
   * 楽曲の詳細情報を取得
   * @param songId 楽曲ID
   * @returns 楽曲詳細情報
   */
  static async getSongDetail(songId: number) {
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
