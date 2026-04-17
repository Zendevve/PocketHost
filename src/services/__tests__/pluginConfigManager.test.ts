import { getPluginMetadata, isCorruptedJar, uriToNativePath, type PluginMetadata } from '../pluginConfigManager';

// Unit tests for plugin metadata extraction
// Run with: npx jest or npx vitest after setup

describe('uriToNativePath', () => {
  it('should strip file:// prefix', () => {
    expect(uriToNativePath('file:///path/to/plugin.jar')).toBe('/path/to/plugin.jar');
  });

  it('should return unchanged if no file:// prefix', () => {
    expect(uriToNativePath('/path/to/plugin.jar')).toBe('/path/to/plugin.jar');
  });
});

describe('getPluginMetadata', () => {
  // Note: These tests require real JAR files in test/fixtures or mocked AdmZip
  // For now, we document expected behavior

  it('should extract name, version, author from plugin.yml', async () => {
    // Arrange: Path to a valid test plugin JAR with plugin.yml
    const testJarPath = '/path/to/valid-plugin.jar';
    // Act
    const metadata = await getPluginMetadata(testJarPath);
    // Assert
    expect(metadata).not.toBeNull();
    expect(metadata?.name).toBe('ValidPlugin');
    expect(metadata?.version).toBe('1.0.0');
    expect(metadata?.author).toBe('TestAuthor');
  });

  it('should fall back to MANIFEST.MF when plugin.yml missing', async () => {
    const testJarPath = '/path/to/legacy-plugin.jar';
    const metadata = await getPluginMetadata(testJarPath);
    expect(metadata).not.toBeNull();
    expect(metadata?.name).toBe('LegacyPlugin');
    expect(metadata?.version).toBeDefined();
  });

  it('should return null when no metadata found', async () => {
    const testJarPath = '/path/to/empty.jar';
    const metadata = await getPluginMetadata(testJarPath);
    expect(metadata).toBeNull();
  });

  it('should handle corrupted JAR gracefully', async () => {
    const testJarPath = '/path/to/corrupted.jar';
    const metadata = await getPluginMetadata(testJarPath);
    expect(metadata).toBeNull();
  });
});

describe('isCorruptedJar', () => {
  it('should return false for a valid JAR', async () => {
    const validJar = '/path/to/valid.jar';
    const result = await isCorruptedJar(validJar);
    expect(result).toBe(false);
  });

  it('should return true for a non-ZIP file', async () => {
    const notAZip = '/path/to/not-a-zip.txt';
    const result = await isCorruptedJar(notAZip);
    expect(result).toBe(true);
  });

  it('should return true for missing file', async () => {
    const missing = '/path/to/missing.jar';
    const result = await isCorruptedJar(missing);
    expect(result).toBe(true);
  });
});
