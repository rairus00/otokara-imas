import { Router } from 'express';
import { KaraokeSong } from 'server/entities/karaoke-song.entity';
import { LiveEvent } from 'server/entities/live-event.entity';
import { ILike, Like } from 'typeorm';

const imasSongsRouter = Router();

// Database接続を初期化
import {
  KaraokeSongRepository,
  LiveEventRepository,
  SongRepository,
} from '../database';
import { Song } from 'server/entities/song.entity';

/**
 * GET /api/imasSongs/brandName/:brandName
 * 指定されたブランド名から全ての楽曲を返すAPI
 */
imasSongsRouter.get('/brandName/:brandName', async (req, res) => {
  const result = await SongRepository.find({
    where: { brandName: req.params.brandName },
    relations: ['karaokeSongsDam'],
  });

  res.send(result);
});

/**
 * GET /api/imasSongs/keyword/:keyword
 * 指定されたキーワードから楽曲を返すAPI
 */
imasSongsRouter.get('/keyword/:keyword', async (req, res) => {
  let result: Song[] = [];

  if (req.query['brandName']) {
    const brandName = req.query['brandName'].toString();

    // ブランド名で絞り込んだ検索結果を取得
    result = await SongRepository.find({
      where: [
        { title: ILike(`%${req.params.keyword}%`), brandName: brandName },
        { titleKana: Like(`%${req.params.keyword}%`), brandName: brandName },
        { artist: Like(`%${req.params.keyword}%`), brandName: brandName },
        // { artistYomi: Like(`%${req.params.keyword}%`), brandName: brandName },
      ],
      order: { titleKana: 'ASC' },
    });
  } else {
    // 検索結果を取得
    result = await SongRepository.find({
      where: [
        { title: ILike(`%${req.params.keyword}%`) },
        { titleKana: Like(`%${req.params.keyword}%`) },
        { artist: Like(`%${req.params.keyword}%`) },
        // { artistYomi: Like(`%${req.params.keyword}%`) },
      ],
      order: { titleKana: 'ASC' },
    });
  }

  // 検索結果をクライアントに返す
  res.send(result);
});

/**
 * GET /api/imasSongs/songName/:songName
 * 指定された曲名から楽曲を返すAPI
 */
imasSongsRouter.get('/songName/:songName', async (req, res) => {
  let result: Song[] = [];

  if (req.query['brandName']) {
    const brandName = req.query['brandName'].toString();

    // ブランド名で絞り込んだ検索結果を取得
    result = await SongRepository.find({
      where: [
        { title: ILike(`%${req.params.songName}%`), brandName: brandName },
        { titleKana: Like(`%${req.params.songName}%`), brandName: brandName },
      ],
      order: { titleKana: 'ASC' },
    });
  } else {
    // 検索結果を取得
    result = await SongRepository.find({
      where: [
        { title: ILike(`%${req.params.songName}%`) },
        { titleKana: Like(`%${req.params.songName}%`) },
      ],
      order: { titleKana: 'ASC' },
    });
  }

  // 検索結果をクライアントに返す
  res.send(result);
});

/**
 * GET /api/imasSongs/liveEvent/:liveEventId
 * 指定されたライブイベントからセトリ順に楽曲を返すAPI
 */
imasSongsRouter.get(
  '/liveEvent/:liveEventId',
  async (req, res): Promise<any> => {
    const liveEvent = await LiveEventRepository.findOne({
      where: { id: parseInt(req.params.liveEventId, 10) },
    });

    if (liveEvent === null) {
      return res.send([]);
    }

    // where条件を初期化
    let wheres = [];

    for (const liveSong of liveEvent.songs) {
      if (!liveSong.damRequestNo) {
        continue;
      }

      // where条件にDAMリクエスト番号を追加
      wheres.push({
        damRequestNo: liveSong.damRequestNo,
      });
    }

    if (wheres.length === 0) {
      return res.send([]);
    }

    // DAMリクエスト番号を元にカラオケ曲を取得
    const karaokeSongs = await KaraokeSongRepository.find({
      where: wheres,
    });

    let sortedKaraokeSongs: any[] = [];

    // ライブのセトリ順に並び替え
    for (const liveSong of liveEvent.songs) {
      let karaokeSong = karaokeSongs.find(
        (karaokeSong) => karaokeSong.damRequestNo === liveSong.damRequestNo
      );
      if (karaokeSong) {
        sortedKaraokeSongs.push(karaokeSong);
      }
    }

    // 並び替えた結果をレスポンスとして返す
    res.send(sortedKaraokeSongs);
  }
);

export default imasSongsRouter;
