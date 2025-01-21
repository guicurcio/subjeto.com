// utils/store.ts

export type StaticFile = {
    content: string;
    contentType: string;
  };
  
  const buildArtifacts = new Map<string, Record<string, StaticFile>>();
  
  /** Store the entire set of exported files under a given buildId. */
  export function storeBuild(
    buildId: string,
    filesMap: Record<string, StaticFile>
  ) {
    buildArtifacts.set(buildId, filesMap);
  }
  
  /** Retrieve all files for a given buildId. */
  export function getBuild(buildId: string): Record<string, StaticFile> | undefined {
    return buildArtifacts.get(buildId);
  }
  
  /** Remove build files from store (for cleanup). */
  export function deleteBuild(buildId: string) {
    buildArtifacts.delete(buildId);
  }
  