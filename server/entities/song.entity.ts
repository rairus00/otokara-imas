import { Entity, Column, PrimaryColumn, BaseEntity, OneToMany } from 'typeorm';
import { KaraokeSongDam } from './karaoke-song-dam.entity';

@Entity()
export class Song extends BaseEntity {
  // 楽曲ID (ふじわらはじめAPIに基づくID)
  @PrimaryColumn()
  id: number;

  // 曲名
  @Column()
  title: string;

  // 曲名カナ
  @Column()
  titleKana: string;

  // アーティスト名
  @Column({
    nullable: true,
  })
  artist?: string;

  // ブランド名 (例: 'cg')
  @Column()
  brandName: string;

  // 最初にカラオケでリリースされた日
  @Column({
    nullable: true,
    type: 'timestamp',
  })
  dateOfFirstKaraokeRelease: string;

  // 最終取得日時 - DAM
  @Column({
    default: '1970-01-01T00:00:00.000Z',
    type: 'timestamp',
  })
  dateOfCrawlDam: string;

  // カラオケ楽曲 - DAM
  @OneToMany(() => KaraokeSongDam, (karaokeSongDam) => karaokeSongDam.song)
  karaokeSongsDam: KaraokeSongDam[];
}
