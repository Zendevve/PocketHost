import { parseNbt, extractWorldProperties, decompressLevelDat } from '../nbtParser';

describe('nbtParser', () => {
  it('returns null for empty buffer', () => {
    const result = parseNbt(new ArrayBuffer(0));
    expect(result).toBeNull();
  });

  it('returns null for invalid buffer', () => {
    const buffer = new ArrayBuffer(4);
    new DataView(buffer).setInt8(0, 99); // invalid tag type
    const result = parseNbt(buffer);
    expect(result).toBeNull();
  });

  it('parses a simple compound tag', () => {
    // Build a minimal NBT compound:
    // TagType (1 byte) = Compound (10)
    // Name length (2 bytes) = 0
    // Child: TagType Byte (1), Name "x" (len 1), Value 42
    // End tag (0)
    const buffer = new ArrayBuffer(9);
    const view = new DataView(buffer);
    let offset = 0;
    view.setInt8(offset++, 10); // Compound
    view.setInt16(offset, 0, false); offset += 2; // name length = 0
    view.setInt8(offset++, 1); // Byte
    view.setInt16(offset, 1, false); offset += 2; // name length = 1
    view.setUint8(offset++, 120); // 'x'
    view.setInt8(offset++, 42); // value
    view.setInt8(offset++, 0); // End

    const result = parseNbt(buffer);
    expect(result).toEqual({ x: 42 });
  });

  it('extracts world properties from Data compound', () => {
    const root = {
      Data: {
        LevelName: 'MyWorld',
        GameType: 1,
        Difficulty: 2,
        SpawnX: 100,
        SpawnY: 64,
        SpawnZ: -200,
        Time: 12000,
        DayTime: 12000,
        RandomSeed: 12345n,
        Version: 19133,
      },
    };
    const props = extractWorldProperties(root);
    expect(props.levelName).toBe('MyWorld');
    expect(props.gameType).toBe(1);
    expect(props.difficulty).toBe(2);
    expect(props.spawnX).toBe(100);
    expect(props.spawnY).toBe(64);
    expect(props.spawnZ).toBe(-200);
    expect(props.time).toBe(12000);
    expect(props.dayTime).toBe(12000);
    expect(props.randomSeed).toBe(12345n);
    expect(props.version).toBe(19133);
  });

  it('returns empty properties for null root', () => {
    const props = extractWorldProperties(null);
    expect(props).toEqual({});
  });

  it('returns empty properties for root without Data', () => {
    const props = extractWorldProperties({ other: 'value' });
    expect(props).toEqual({});
  });

  it('decompressLevelDat returns null for invalid gzip', () => {
    const result = decompressLevelDat(new Uint8Array([0, 1, 2, 3]));
    expect(result).toBeNull();
  });
});
