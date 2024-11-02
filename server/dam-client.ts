import fetch from 'node-fetch';

// Denmoku API についての定義
const DAM_API_ENDPOINT = 'https://csgw.clubdam.com/dkwebsys/search-api';
const MAX_GET_SONGS_NUM = 1;

export interface DamKaraokeSong {
  // タイトル
  title: string;
  titleYomi: string;
  // リリース日 (例: "2023-07-13")
  releaseDate: string;
  // リクエスト番号 (例: "3361-94")
  requestNo: string;
  // アーティスト
  artist: string;
  artistCode: number;
  artistYomi: string;
  // 再生時間 (秒)
  playbackTime: number;
  // なんかわからん
  animeFlag: string;
  damTomoMovieFlag: string;
  damTomoRecordingFlag: string;
  duetFlag: string;
  futureReleaseFlag: string;
  guideVocalFlag: string;
  highlightTieUp: string;
  honninFlag: string;
  kidsFlag: string;
  liveFlag: string;
  mamaotoFlag: string;
  myListFlag: string;
  namaotoFlag: string;
  newArrivalsFlag: string;
  newReleaseFlag: string;
  prookeFlag: string;
  scoreFlag: string;
  shift: string;
}

export class DamClient {
  //   async function getSongsBySongName (songName: string) {
  //     // Denmoku API へ楽曲検索をリクエスト
  //     const apiResponse = await requestToDam({
  //         categoryCd: DENMOKU_API_CATEGORIES.SONG_NAME,
  //         page: '1',
  //         songMatchType: '0', // 0 = 前方一致, 1 = 部分一致
  //         songName: songName,
  //     });

  //     if (apiResponse.status != 200) {
  //         // リクエストに失敗したならば、エラーを返す
  //         throw apiResponse.error;
  //     }

  //     // 検索結果を返す
  //     const result = await apiResponse.json();
  //     return result.searchResult;
  // }

  static async getKaraokeSongsByTitle(
    songTitle: string,
    page = 1
  ): Promise<DamKaraokeSong[]> {
    // Denmoku API へ楽曲検索をリクエスト
    const requestUrl = `${DAM_API_ENDPOINT}/SearchMusicByKeywordApi`;
    const requestBody = {
      authKey: process.env['DENMOKU_API_AUTH_KEY'],
      compId: '1',
      dispCount: '100',
      keyword: songTitle,
      modelTypeCode: '1',
      pageNo: page,
      serialNo: 'AT00001', // 'AT00001' = LIVE DAM Ai, 'AF00001' = LIVE DAM, ...
      sort: '2', // '1' = 50音順、'2' = 人気順
    };

    const apiResponse = await fetch(requestUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (apiResponse.status != 200) {
      // リクエストに失敗したならば、エラーを返す
      throw apiResponse;
    }

    // 検索結果を取得
    const result = await apiResponse.json();
    let songs = result.list;

    if (result.data.hasNext == true && page < 5) {
      // 次ページがあれば、次ページを取得 (ただし最大5ページまで)
      const nextPageSongs = await DamClient.getSongsByKeyword(
        songTitle,
        page + 1
      );
      songs = songs.concat(nextPageSongs);
    }

    return songs;
  }

  /**
   * 指定されたキーワードから楽曲を取得
   * @param keyword keyword
   * @returns 楽曲の配列
   */
  static async getSongsByKeyword(keyword: string, page = 1) {
    // Denmoku API へ楽曲検索をリクエスト
    const requestUrl = `${DAM_API_ENDPOINT}/SearchVariousByKeywordApi`;
    const requestBody = {
      authKey: process.env['DENMOKU_API_AUTH_KEY'],
      compId: '1',
      dispCount: '100',
      keyword: keyword,
      ondemandSearchPatternCode: '0',
      modelTypeCode: '3',
      pageNo: page,
      serialNo: 'AT00001', // 'AT00001' = LIVE DAM Ai, 'AF00001' = LIVE DAM, ...
      sort: '2', // '1' = 50音順、'2' = 人気順
    };

    const apiResponse = await fetch(requestUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (apiResponse.status != 200) {
      // リクエストに失敗したならば、エラーを返す
      throw apiResponse;
    }

    // 検索結果を取得
    const result = await apiResponse.json();
    let songs = result.list;

    if (result.data.hasNext == true && page < 5) {
      // 次ページがあれば、次ページを取得 (ただし最大5ページまで)
      const nextPageSongs = await DamClient.getSongsByKeyword(
        keyword,
        page + 1
      );
      songs = songs.concat(nextPageSongs);
    }

    return songs;
  }
}
