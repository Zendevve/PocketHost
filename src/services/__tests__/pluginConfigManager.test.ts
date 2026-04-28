import { getPluginMetadata, isCorruptedJar, uriToNativePath, type PluginMetadata } from '../pluginConfigManager';

jest.mock('adm-zip', () => {
  return jest.fn().mockImplementation(() => {
    return {
      getEntry: jest.fn(),
      getEntries: jest.fn(),
      readAsText: jest.fn(),
    };
  });
});
jest.mock('js-yaml', () => ({
  load: jest.fn(),
}));

import AdmZip from 'adm-zip';
import yaml from 'js-yaml';

const MockAdmZip = AdmZip as jest.MockedClass<typeof AdmZip>;

describe('uriToNativePath', () => {
  it('should strip file:// prefix', () => {
    expect(uriToNativePath('file:///path/to/plugin.jar')).toBe('/path/to/plugin.jar');
  });

  it('should return unchanged if no file:// prefix', () => {
    expect(uriToNativePath('/path/to/plugin.jar')).toBe('/path/to/plugin.jar');
  });

  it('should handle empty string', () => {
    expect(uriToNativePath('')).toBe('');
  });
});

describe('getPluginMetadata', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should extract name, version, author from plugin.yml', async () => {
    const mockZip = {
      getEntry: jest.fn().mockReturnValue('plugin-entry'),
      getEntries: jest.fn().mockReturnValue([]),
      readAsText: jest.fn().mockReturnValue('name: MyPlugin\nversion: 1.0.0\nauthor: TestAuthor\ndescription: A test plugin'),
    };
    MockAdmZip.mockImplementation(() => mockZip as any);
    (yaml.load as jest.Mock).mockReturnValue({
      name: 'MyPlugin',
      version: '1.0.0',
      author: 'TestAuthor',
      description: 'A test plugin',
    });

    const metadata = await getPluginMetadata('/path/to/plugin.jar');

    expect(metadata).not.toBeNull();
    expect(metadata?.name).toBe('MyPlugin');
    expect(metadata?.version).toBe('1.0.0');
    expect(metadata?.author).toBe('TestAuthor');
    expect(metadata?.description).toBe('A test plugin');
    expect(mockZip.getEntry).toHaveBeenCalledWith('plugin.yml');
  });

  it('should fall back to MANIFEST.MF when plugin.yml missing', async () => {
    const mockZip = {
      getEntry: jest.fn().mockImplementation((entry: string) => {
        if (entry === 'plugin.yml') return null;
        if (entry === 'META-INF/MANIFEST.MF') return 'manifest-entry';
        return null;
      }),
      getEntries: jest.fn().mockReturnValue([]),
      readAsText: jest.fn().mockReturnValue(
        'Implementation-Title: LegacyPlugin\nImplementation-Version: 2.1.0\nImplementation-Vendor: VendorInc\n'
      ),
    };
    MockAdmZip.mockImplementation(() => mockZip as any);

    const metadata = await getPluginMetadata('/path/to/legacy.jar');

    expect(metadata).not.toBeNull();
    expect(metadata?.name).toBe('LegacyPlugin');
    expect(metadata?.version).toBe('2.1.0');
    expect(metadata?.author).toBe('VendorInc');
    expect(mockZip.getEntry).toHaveBeenCalledWith('plugin.yml');
    expect(mockZip.getEntry).toHaveBeenCalledWith('META-INF/MANIFEST.MF');
  });

  it('should return null when no metadata found in either location', async () => {
    const mockZip = {
      getEntry: jest.fn().mockReturnValue(null),
      getEntries: jest.fn().mockReturnValue([]),
      readAsText: jest.fn(),
    };
    MockAdmZip.mockImplementation(() => mockZip as any);

    const metadata = await getPluginMetadata('/path/to/empty.jar');

    expect(metadata).toBeNull();
  });

  it('should return null when plugin.yml has empty name', async () => {
    const mockZip = {
      getEntry: jest.fn().mockReturnValue('plugin-entry'),
      getEntries: jest.fn().mockReturnValue([]),
      readAsText: jest.fn().mockReturnValue('name: \nversion: 1.0\n'),
    };
    MockAdmZip.mockImplementation(() => mockZip as any);
    (yaml.load as jest.Mock).mockReturnValue({ name: '', version: '1.0' });

    const metadata = await getPluginMetadata('/path/to/no-name.jar');

    expect(metadata).toBeNull();
  });

  it('should fall back to manifest when plugin.yml parse fails', async () => {
    const mockZip = {
      getEntry: jest.fn().mockImplementation((entry: string) => {
        return entry === 'META-INF/MANIFEST.MF' ? 'manifest-entry' : 'plugin-entry';
      }),
      getEntries: jest.fn().mockReturnValue([]),
      readAsText: jest.fn().mockImplementation((entry: string) => {
        if (entry === 'plugin-entry') return '{{{invalid yaml';
        return 'Implementation-Title: ManifestPlugin\n';
      }),
    };
    MockAdmZip.mockImplementation(() => mockZip as any);
    (yaml.load as jest.Mock).mockImplementation(() => {
      throw new Error('Parse error');
    });

    const metadata = await getPluginMetadata('/path/to/bad-yaml.jar');

    expect(metadata).not.toBeNull();
    expect(metadata?.name).toBe('ManifestPlugin');
  });

  it('should handle constructor throw gracefully and return null', async () => {
    MockAdmZip.mockImplementation(() => {
      throw new Error('Corrupt ZIP');
    });

    const metadata = await getPluginMetadata('/path/to/corrupted.jar');

    expect(metadata).toBeNull();
  });
});

describe('isCorruptedJar', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return false for a valid JAR', async () => {
    MockAdmZip.mockImplementation(() => ({
      getEntries: jest.fn().mockReturnValue([{}, {}]),
      getEntry: jest.fn(),
      readAsText: jest.fn(),
    }) as any);

    const result = await isCorruptedJar('/path/to/valid.jar');

    expect(result).toBe(false);
  });

  it('should return false for an empty but structurally valid JAR', async () => {
    MockAdmZip.mockImplementation(() => ({
      getEntries: jest.fn().mockReturnValue([]),
      getEntry: jest.fn(),
      readAsText: jest.fn(),
    }) as any);

    const result = await isCorruptedJar('/path/to/empty.jar');

    expect(result).toBe(false);
  });

  it('should return true when constructor throws (corrupt ZIP)', async () => {
    MockAdmZip.mockImplementation(() => {
      throw new Error('Invalid ZIP format');
    });

    const result = await isCorruptedJar('/path/to/corrupt.jar');

    expect(result).toBe(true);
  });

  it('should return true when getEntries throws after construction', async () => {
    MockAdmZip.mockImplementation(() => ({
      getEntries: jest.fn().mockImplementation(() => {
        throw new Error('Unexpected end');
      }),
      getEntry: jest.fn(),
      readAsText: jest.fn(),
    }) as any);

    const result = await isCorruptedJar('/path/to/broken.jar');

    expect(result).toBe(true);
  });
});
