import { inflate } from 'pako';

// Minimal NBT (Named Binary Tag) parser for Minecraft level.dat files.
// Supports reading compound tags, strings, and numeric primitives.
// level.dat format: Gzip compressed -> Compound tag -> "Data" compound -> world properties

enum TagType {
  End = 0,
  Byte = 1,
  Short = 2,
  Int = 3,
  Long = 4,
  Float = 5,
  Double = 6,
  ByteArray = 7,
  String = 8,
  List = 9,
  Compound = 10,
  IntArray = 11,
  LongArray = 12,
}

class NbtReader {
  private view: DataView;
  private offset = 0;

  constructor(buffer: ArrayBuffer) {
    this.view = new DataView(buffer);
  }

  private readByte(): number {
    return this.view.getInt8(this.offset++);
  }

  private readUnsignedByte(): number {
    return this.view.getUint8(this.offset++);
  }

  private readShort(): number {
    const v = this.view.getInt16(this.offset, false);
    this.offset += 2;
    return v;
  }

  private readInt(): number {
    const v = this.view.getInt32(this.offset, false);
    this.offset += 4;
    return v;
  }

  private readLong(): bigint {
    const v = this.view.getBigInt64(this.offset, false);
    this.offset += 8;
    return v;
  }

  private readFloat(): number {
    const v = this.view.getFloat32(this.offset, false);
    this.offset += 4;
    return v;
  }

  private readDouble(): number {
    const v = this.view.getFloat64(this.offset, false);
    this.offset += 8;
    return v;
  }

  private readString(): string {
    const len = this.readShort();
    if (len < 0) return '';
    const bytes: number[] = [];
    for (let i = 0; i < len; i++) {
      bytes.push(this.readUnsignedByte());
    }
    return String.fromCharCode(...bytes);
  }

  private readByteArray(): number[] {
    const len = this.readInt();
    const arr: number[] = [];
    for (let i = 0; i < len; i++) {
      arr.push(this.readByte());
    }
    return arr;
  }

  private readIntArray(): number[] {
    const len = this.readInt();
    const arr: number[] = [];
    for (let i = 0; i < len; i++) {
      arr.push(this.readInt());
    }
    return arr;
  }

  private readLongArray(): bigint[] {
    const len = this.readInt();
    const arr: bigint[] = [];
    for (let i = 0; i < len; i++) {
      arr.push(this.readLong());
    }
    return arr;
  }

  private readList(): unknown[] {
    const tagType = this.readByte() as TagType;
    const len = this.readInt();
    const arr: unknown[] = [];
    for (let i = 0; i < len; i++) {
      arr.push(this.readPayload(tagType));
    }
    return arr;
  }

  private readPayload(tagType: TagType): unknown {
    switch (tagType) {
      case TagType.Byte:
        return this.readByte();
      case TagType.Short:
        return this.readShort();
      case TagType.Int:
        return this.readInt();
      case TagType.Long:
        return this.readLong();
      case TagType.Float:
        return this.readFloat();
      case TagType.Double:
        return this.readDouble();
      case TagType.ByteArray:
        return this.readByteArray();
      case TagType.String:
        return this.readString();
      case TagType.List:
        return this.readList();
      case TagType.Compound:
        return this.readCompound();
      case TagType.IntArray:
        return this.readIntArray();
      case TagType.LongArray:
        return this.readLongArray();
      default:
        return null;
    }
  }

  private readCompound(): Record<string, unknown> {
    const result: Record<string, unknown> = {};
    while (true) {
      const tagType = this.readByte() as TagType;
      if (tagType === TagType.End) break;
      const name = this.readString();
      result[name] = this.readPayload(tagType);
    }
    return result;
  }

  parseRoot(): Record<string, unknown> | null {
    try {
      const tagType = this.readByte() as TagType;
      if (tagType !== TagType.Compound) {
        throw new Error(`Expected root compound tag, got ${tagType}`);
      }
      this.readString(); // root name (usually empty)
      return this.readCompound();
    } catch {
      return null;
    }
  }
}

export interface WorldProperties {
  levelName: string;
  gameType: number;
  difficulty: number;
  spawnX: number;
  spawnY: number;
  spawnZ: number;
  time: number;
  dayTime: number;
  randomSeed?: bigint;
  version?: number;
}

export function parseNbt(buffer: ArrayBuffer): Record<string, unknown> | null {
  const reader = new NbtReader(buffer);
  return reader.parseRoot();
}

export function decompressLevelDat(gzipData: Uint8Array): ArrayBuffer | null {
  try {
    const inflated = inflate(gzipData);
    return inflated.buffer.slice(inflated.byteOffset, inflated.byteOffset + inflated.byteLength);
  } catch {
    return null;
  }
}

export function extractWorldProperties(
  nbtRoot: Record<string, unknown> | null
): Partial<WorldProperties> {
  if (!nbtRoot) return {};
  const data = nbtRoot.Data as Record<string, unknown> | undefined;
  if (!data) return {};

  return {
    levelName: typeof data.LevelName === 'string' ? data.LevelName : undefined,
    gameType: typeof data.GameType === 'number' ? data.GameType : undefined,
    difficulty: typeof data.Difficulty === 'number' ? data.Difficulty : undefined,
    spawnX: typeof data.SpawnX === 'number' ? data.SpawnX : undefined,
    spawnY: typeof data.SpawnY === 'number' ? data.SpawnY : undefined,
    spawnZ: typeof data.SpawnZ === 'number' ? data.SpawnZ : undefined,
    time: typeof data.Time === 'number' ? data.Time : undefined,
    dayTime: typeof data.DayTime === 'number' ? data.DayTime : undefined,
    randomSeed: typeof data.RandomSeed === 'bigint' ? data.RandomSeed : undefined,
    version: typeof data.Version === 'number' ? data.Version : undefined,
  };
}
