import { DataSource } from 'typeorm';
import { Song } from './entities/song.entity';
import { KaraokeSong } from './entities/karaoke-song.entity';
import { LiveEvent } from './entities/live-event.entity';

// 環境変数 DATABASE_URL の読み込み
const databaseUrl: string = process.env['DATABASE_URL'] as string;
if (!databaseUrl) {
  throw '環境変数 DATABASE_URL が未指定です';
}
const isLocalHost = databaseUrl.match(/@localhost/);

// データベース接続の初期化
export const AppDataSource = new DataSource({
  type: 'postgres',
  url: databaseUrl,
  logging: !process.env['NODE_ENV'] || process.env['NODE_ENV'] != 'production',
  entities: [Song, KaraokeSong, LiveEvent],
  synchronize: true,
  ssl: isLocalHost
    ? undefined
    : {
        rejectUnauthorized: false,
      },
});

// 各エンティティをリポジトリとして取得してエクスポート
export const SongRepository = AppDataSource.getRepository(Song);
export const KaraokeSongRepository = AppDataSource.getRepository(KaraokeSong);
export const LiveEventRepository = AppDataSource.getRepository(LiveEvent);
