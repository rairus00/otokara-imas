// .envファイルを読み込む
import * as dotenv from 'dotenv';
dotenv.config({ path: `${__dirname}/.env` });

import {
  FujiwarahajimeClient,
  FujiwarahajimeSongDetail,
} from './fujiwarahajime-client';

import { Helper } from './helper';

// Database接続を初期化
import {
  AppDataSource,
  KaraokeSongDamRepository,
  KaraokeSongRepository,
  LiveEventRepository,
  SongRepository,
} from './database';
import { Like } from 'typeorm';
import { DamClient, DamKaraokeSong } from './dam-client';
import { Song } from './entities/song.entity';

class Cron {
  static async execute() {
    // データベースの接続完了まで待機
    await AppDataSource.initialize();

    // 楽曲の一覧をふじわらはじめから取得しDBに保存
    await this.crawlSongs();

    // TODO: DAM・JOYSOUNDからそれぞれカラオケ配信情報を取得し、DBに保存
    await this.crawlDamKaraokeSongs();

    // ふじわらはじめからライブイベントを取得しDBに保存
    // await this.crawlLiveEvents();

    // ライブイベントと楽曲をマッチング
    // await this.matchSongOfLiveEvents();
  }

  /**
   * 楽曲の一覧をふじわらはじめから取得しDBに保存
   */
  static async crawlSongs() {
    // ふじわらはじめAPIから全ての楽曲IDを取得
    let songIds = await FujiwarahajimeClient.getSongIds();

    // DBから保存済みの楽曲IDを取得
    const wheres = [];
    for (let songId of songIds) {
      wheres.push({ id: songId });
    }
    const storedSongIds = await SongRepository.find({
      select: ['id'],
      where: wheres,
    });

    // 未保存の楽曲IDのみを抽出
    for (let storedSongId of storedSongIds) {
      songIds = songIds.filter((songId) => songId !== storedSongId.id);
    }

    // ふじわらはじめAPI から一度に取得する上限数を10件とする
    const MAX_NUM_OF_CRAWL_SONGS = 3; // TODO: 要調整
    songIds = songIds.slice(0, MAX_NUM_OF_CRAWL_SONGS);

    // 未保存の楽曲情報を取得
    const songs = await FujiwarahajimeClient.getSongDetails(songIds);

    // 楽曲情報をDBに保存
    this.storeSongs(songs);
  }

  /**
   * 楽曲情報のリストをDBに保存
   * @param songs 楽曲リスト
   */
  static async storeSongs(songs: FujiwarahajimeSongDetail[]) {
    for (let song of songs) {
      console.log(`楽曲を保存`, song);
      // 楽曲メンバーの配列から、各メンバーの名前をカンマ区切りで文字列に変換
      let memberNames = song.member
        ?.map((member: { name: string }) => member.name)
        .join(',');

      let brandName = song.music_type;
      if (brandName === 'as' || brandName === 'ml') {
        brandName = '765';
      }

      await SongRepository.save({
        id: song.song_id,
        title: song.name,
        titleKana: song.kana,
        artist: memberNames,
        brandName: brandName,
      });

      console.log(`${song.name}を保存しました。`);
    }
    console.log(`${songs.length}件の楽曲を保存しました。`);
  }

  /**
   * DAMからカラオケ楽曲情報を取得しDBに保存
   */
  static async crawlDamKaraokeSongs() {
    const MAX_NUM_OF_UPDATE_SONGS = 3; // TODO: 要調整
    let firstReleaseDate: Date | undefined = undefined;
    const todayDateTime = new Date().toISOString();

    // 最近取得していない楽曲のリストを取得
    let songs = await Cron.getSongsOfRecentlyNotGet(MAX_NUM_OF_UPDATE_SONGS);

    // 楽曲を反復
    for (const song of songs) {
      const imasKaraokeSongs: DamKaraokeSong[] = [];
      // DAMからのカラオケ楽曲の取得日時を更新
      song.dateOfCrawlDam = todayDateTime;

      // DAMから同じタイトルのカラオケ楽曲を取得
      console.log(`DAMからカラオケ楽曲を検索: ${song.title}`);
      const karaokeSongs = await DamClient.getKaraokeSongsByTitle(song.title);

      // カラオケ楽曲を反復
      for (const karaokeSong of karaokeSongs) {
        // アイマス楽曲でないならスキップ
        if (!Cron.isImasSong(song, karaokeSong)) {
          console.log(`🚫  ${karaokeSong.title}`);
          continue;
        }
        // カラオケ楽曲をアイマスカラオケ楽曲の配列へ追加
        imasKaraokeSongs.push(karaokeSong);
        // カラオケ楽曲情報をDBに保存
        Cron.storeKaraokeSong(song, karaokeSong);
        console.log(`✅  ${karaokeSong.title}`);
      }

      // アイマスカラオケ楽曲のもっとも古いリリース日を取得
      firstReleaseDate = Cron.getOldestFirstReleaseDateByKaraokeSongs(
        imasKaraokeSongs,
        firstReleaseDate
      );

      // 楽曲のリリース日を更新
      if (firstReleaseDate) {
        const dateOfFirstKaraokeRelease = Cron.getFirstKaraokeReleaseDate(
          song,
          firstReleaseDate
        );
        if (dateOfFirstKaraokeRelease) {
          song.dateOfFirstKaraokeRelease = dateOfFirstKaraokeRelease;
        }
        console.log(`DAMによるリリース日: ${firstReleaseDate}`);
      } else {
        console.log(`DAMによるリリース日: -`);
      }

      // 楽曲を保存
      await song.save();
    }
  }

  /**
   * ふじわらはじめAPIからイベントを取得しDBに保存
   */
  static async crawlLiveEvents() {
    // ライブのリストを取得
    const liveEvents = await FujiwarahajimeClient.getLiveEvents();

    let counter = 0;
    for (let liveEvent of liveEvents) {
      if (
        await LiveEventRepository.findOne({
          where: {
            id: liveEvent.tax_id,
          },
        })
      ) {
        continue;
      }

      // 一度に取得するライブ情報の最大取得件数を設定
      const maxGetLiveEventNum = 5;
      if (maxGetLiveEventNum < counter) {
        break;
      }
      counter++;

      // ライブ情報を取得
      const liveEventDetail =
        await FujiwarahajimeClient.getLiveEventDetailByTaxId(liveEvent.tax_id);

      // 楽曲配列を初期化
      let songs: {
        title: string;
        artist: string;
        damRequestNo?: string;
      }[] = [];

      // ライブのメンバー情報をもとにしてどのブランドのライブかを特定
      let brandNames: Set<string> = new Set();

      if (liveEventDetail.member) {
        for (let member of liveEventDetail.member) {
          if (member.production) {
            if (member.production === '765') {
              brandNames.add('as');
            } else {
              brandNames.add(member.production);
            }
          }
        }
      }

      if (1 <= brandNames.size) {
        // ブランドが一つでもあれば、楽曲情報を反復

        for (let song of liveEventDetail.song) {
          if (song.name == null) {
            continue;
          }

          let artists: string[] = [];

          if (song.unit) {
            for (let unit of song.unit) {
              for (let member of unit.member) {
                artists.push(member.name);
              }
            }
          }

          if (song.member) {
            for (let member of song.member) {
              artists.push(member.name);
            }
          }

          // アーティスト情報を配列から文字列に変換
          let artistString: string = artists.join('、');

          // 楽曲情報を配列にプッシュ
          songs.push({
            title: song.name,
            artist: artistString,
            damRequestNo: undefined,
          });
        }
      }

      //ライブ情報をDBに保存
      await LiveEventRepository.save({
        id: liveEvent.tax_id,
        title: liveEvent.name,
        date: liveEvent.date,
        brandNames: Array.from(brandNames.values()),
        songs: songs,
      });
      console.log(`${liveEvent.name}を保存しました。`);
    }

    console.log(`${counter}件のライブを保存しました。`);
  }

  /**
   * DBに保存されたライブイベントとカラオケ楽曲をマッチング
   */
  static async matchSongOfLiveEvents() {
    // DBから保存されたライブ情報を取得
    const liveEvents = await LiveEventRepository.find();

    // 各ライブを反復
    for (let liveEvent of liveEvents) {
      if (!liveEvent.brandNames || liveEvent.brandNames.length == 0) {
        // ブランドが登録されていないライブ (声優さんのイベントなど？) はスキップ
        continue;
      }

      // ライブの楽曲数を初期化
      let numOfMatchedSongs = 0;

      // 各ライブ情報の楽曲を反復
      for (let liveSong of liveEvent.songs) {
        // DAMリクエスト番号が入っていればなにもしない
        if (liveSong.damRequestNo !== undefined) {
          numOfMatchedSongs++;
          continue;
        }

        const songTitle = liveSong.title;

        // 楽曲名の機種依存文字をスペースに置換
        const replacedSongTitle =
          Helper.replacePlatformDependentCharacter(songTitle);

        // 検索条件を設定
        const searchCondition = {
          // そのままの条件
          default: replacedSongTitle.replace(/[ 　]/g, '%') + '%',
          // 全角記号を半角にした条件
          replaceSymbol:
            replacedSongTitle
              .replace(/[ 　]/g, '%')
              .replace(/[！-～]/g, (str: string) => {
                return String.fromCharCode(str.charCodeAt(0) - 0xfee0);
              }) + '%',
        };

        // 条件に当てはまる楽曲を取得
        const karaokeSongs = await KaraokeSongRepository.find({
          where: [
            {
              title: Like(searchCondition.default),
            },
            {
              title: Like(searchCondition.replaceSymbol),
            },
          ],
        });

        for (let karaokeSong of karaokeSongs) {
          // 楽曲タイトルに「G@ME VERSION」が含まれるならスキップ
          if (karaokeSong.title.match('G@ME VERSION')) {
            continue;
          } else {
            // ライブ楽曲とrequestNoを紐付け
            liveSong.damRequestNo = karaokeSong.damRequestNo;
            console.log(
              `${liveSong.title}と${karaokeSong.title}をマッチングしました。`
            );
            numOfMatchedSongs++;
            break;
          }
        }
      }

      // ライブ情報をDBに保存 (または上書き)
      liveEvent.numOfMatchedSongs = numOfMatchedSongs;
      await liveEvent.save();
    }
  }

  /**
   * 最近、DAMから取得していない楽曲のリストを取得
   * @param maxNumOfGetSongs 楽曲の最大取得数
   * @returns
   */
  static async getSongsOfRecentlyNotGet(maxNumOfGetSongs: number) {
    return await SongRepository.find({
      order: {
        dateOfCrawlDam: 'ASC',
      },
      take: maxNumOfGetSongs,
    });
  }

  /**
   * アイマス楽曲かどうかを判定
   * @param song 楽曲
   * @param karaokeSong カラオケ楽曲
   * @returns
   */
  static isImasSong(song: Song, karaokeSong: DamKaraokeSong) {
    return (
      // アイドル名の存在チェック
      Cron.containsIdolNameByKaraokeSongArtist(song, karaokeSong) ||
      // アイマス楽曲特有タイトルの一致チェック
      Cron.isImasSongTitleByKaraokeSongTitle(song, karaokeSong) ||
      // アイマスユニット名の存在チェック
      Cron.containsImasUnitNameByKaraokeSongArtist(song, karaokeSong)
    );
  }

  /**
   * カラオケ楽曲のアーティストにアイドル名が含まれているかを判定
   * @param song 楽曲
   * @param karaokeSong カラオケ楽曲
   * @returns
   */
  static containsIdolNameByKaraokeSongArtist(
    song: Song,
    karaokeSong: DamKaraokeSong
  ) {
    if (typeof song.artist === 'undefined') {
      return false;
    }

    // 楽曲のアーティスト名をカンマごとに配列に分割
    const idolNames = song.artist.split(',');
    // アイドル名の配列に、カラオケ楽曲のアーティスト名が含まれているかを判定
    return idolNames.some((idolName) => karaokeSong.artist.match(idolName));
  }

  /**
   * カラオケ楽曲のタイトルがアイマス楽曲特有のタイトルと一致するかを判定
   * @param song
   * @param karaokeSong
   * @returns
   */
  static isImasSongTitleByKaraokeSongTitle(
    song: Song,
    karaokeSong: DamKaraokeSong
  ) {
    // カラオケ楽曲のタイトルが、楽曲タイトルに「(M@STER VERSION)」をつけたものと一致するか
    return karaokeSong.title === `${song.title}(M@STER VERSION)`;
  }

  /**
   * カラオケ楽曲のアーティストに、アイマスのユニット名が含まれているかを判定
   * @param song
   * @param karaokeSong
   * @returns
   */
  static containsImasUnitNameByKaraokeSongArtist(
    song: Song,
    karaokeSong: DamKaraokeSong
  ): boolean {
    let imasUnitNames: string[] = [];
    // 楽曲のブランド名によって、存在判定に使用するユニット名を設定
    switch (song.brandName) {
      case '765':
        imasUnitNames = ['765 MILLION ALLSTARS'];
        break;
      case 'sc':
        imasUnitNames = [
          'シャイニーカラーズ',
          'イルミネーションスターズ',
          'アンティーカ',
          '放課後クライマックスガールズ',
          'アルストロメリア',
          'ストレイライト',
          'ノクチル',
          'シーズ',
          'コメティック',
        ];
        break;
    }

    return (
      imasUnitNames.length !== 0 &&
      karaokeSong.artist.length > 0 &&
      imasUnitNames.some(
        (imasUnitName) => karaokeSong.artist.trim() == imasUnitName
      )
    );
  }

  /**
   * カラオケ楽曲をDBに保存
   * @param song
   * @param karaokeSong
   */
  static async storeKaraokeSong(song: Song, karaokeSong: DamKaraokeSong) {
    // DAM楽曲をDBに保存
    await KaraokeSongDamRepository.save({
      song: song, // Song と紐付け
      title: karaokeSong.title,
      damRequestNo: karaokeSong.requestNo,
      damReleaseDate: karaokeSong.releaseDate,
    });
  }

  /**
   * カラオケ楽曲の最も古いリリース日を返す
   * @param karaokeSongs
   * @param firstReleaseDate
   * @returns
   */
  static getOldestFirstReleaseDateByKaraokeSongs(
    karaokeSongs: DamKaraokeSong[],
    firstReleaseDate: Date | undefined
  ) {
    for (const karaokeSong of karaokeSongs) {
      const d = new Date(karaokeSong.releaseDate);

      if (firstReleaseDate === undefined || d < firstReleaseDate) {
        firstReleaseDate = d;
      }
    }

    return firstReleaseDate;
  }

  /**
   * カラオケ配信開始日を返す
   * @param song 楽曲
   * @param firstReleaseDate 配信開始日
   * @returns
   */
  static getFirstKaraokeReleaseDate(song: Song, firstReleaseDate: Date) {
    let dateOfFirstKaraokeRelease: string | null = null;

    if (!song.dateOfFirstKaraokeRelease) {
      dateOfFirstKaraokeRelease = firstReleaseDate.toISOString();
    } else {
      if (firstReleaseDate < new Date(song.dateOfFirstKaraokeRelease)) {
        dateOfFirstKaraokeRelease = firstReleaseDate.toISOString();
      }
    }

    return dateOfFirstKaraokeRelease;
  }
}

// 非同期処理を実行
(async () => {
  await Cron.execute();
})();
