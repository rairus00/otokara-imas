import { Entity, Column, PrimaryColumn, BaseEntity } from 'typeorm';

@Entity()
export class Song extends BaseEntity {
  @PrimaryColumn()
  id: number;

  @Column()
  title: string;

  @Column()
  titleKana: string;

  @Column()
  artist: string;

  @Column()
  brandName: string;
}
