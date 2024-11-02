import { Entity, Column, PrimaryColumn, BaseEntity, ManyToOne } from 'typeorm';
import { Song } from './song.entity';

@Entity()
export class KaraokeSongDam extends BaseEntity {
  @PrimaryColumn()
  damRequestNo: string;

  @Column()
  title: string;

  @ManyToOne(() => Song, (song) => song.karaokeSongsDam)
  song: Song;

  @Column({
    type: 'date',
  })
  damReleaseDate: string;
}
