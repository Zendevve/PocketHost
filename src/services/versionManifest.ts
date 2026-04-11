import axios from 'axios';

interface ManifestVersion {
  id: string;
  type: 'release' | 'snapshot';
  url: string;
  releaseTime: string;
}

interface VersionManifest {
  versions: ManifestVersion[];
}

let manifestCache: VersionManifest | null = null;

async function getManifest(): Promise<VersionManifest> {
  if (manifestCache) return manifestCache;
  const { data } = await axios.get<VersionManifest>(
    'https://piston-meta.mojang.com/mc/game/version_manifest_v2.json'
  );
  manifestCache = data;
  return data;
}

export async function fetchVersions(): Promise<ManifestVersion[]> {
  const manifest = await getManifest();
  return manifest.versions.filter((v) => v.type === 'release');
}

export async function getServerJarUrl(versionId: string): Promise<string> {
  const manifest = await getManifest();
  const version = manifest.versions.find((v) => v.id === versionId);
  if (!version) {
    throw new Error(`Minecraft version ${versionId} not found`);
  }

  const { data } = await axios.get<{ downloads: { server: { url: string } } }>(version.url);
  return data.downloads.server.url;
}
