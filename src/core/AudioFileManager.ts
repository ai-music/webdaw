import { AudioFile } from './AudioFile';

/**
 * A node in the LRU list
 */
type LruNode = {
  prev: LruNode | null;
  next: LruNode | null;
  url: URL;
  file: AudioFile;
};

/**
 * The AudioFileManager class is responsible for managing the audio files.
 * It is responsible for loading audio files from the server and for
 * creating temporary audio files.
 *
 * It maintains a cache of audio files and manages the lifetime of the
 * contained files.
 */
export class AudioFileManager {
  // cache of files that are maintained temporarily
  private _cachedAudioFiles: Map<string, LruNode> = new Map();

  // Audio files that have been added to the project and are tracked there
  private _permanentAudioFiles: Map<string, AudioFile> = new Map();

  // LRU list of audio files that are currently in use
  // New files are added to the back, when a file is used it is moved to the back
  // When the list is full, the file at the front is removed.
  private _lruHead: LruNode | null = null;
  private _lruTail: LruNode | null = null;

  // Maximum number of files that are cached
  private _maxCachedFiles;

  public static DEFAULT_CACHED_FILES = 10;

  /**
   * Create a new audio file manager
   *
   * @param maxCachedFiles the maximum number of files that are cached
   */
  constructor(maxCachedFiles: number = AudioFileManager.DEFAULT_CACHED_FILES) {
    this._maxCachedFiles = maxCachedFiles;
  }

  /**
   * Register a permanent audio file that is tracked by the project.
   *
   * This will remove the file from the cache if it is currently cached.
   *
   * @param file  the audio file to register
   */
  public registerAudioFile(file: AudioFile): void {
    this._permanentAudioFiles.set(file.id, file);

    const cachedFileNode = this._cachedAudioFiles.get(file.id);

    if (cachedFileNode !== undefined) {
      this._removeCachedFile(cachedFileNode);
    }
  }

  private _removeCachedFile(node: LruNode): void {
    if (node.prev !== null) {
      node.prev.next = node.next;
    } else {
      this._lruHead = node.next;
    }

    if (node.next !== null) {
      node.next.prev = node.prev;
    } else {
      this._lruTail = node.prev;
    }

    this._cachedAudioFiles.delete(node.url.toString());
  }

  /**
   * Unregister a permanent audio file that is tracked by the project
   *
   * @param file  the audio file to unregister
   */
  public unregisterAudioFile(file: AudioFile): void {
    this._permanentAudioFiles.delete(file.id);
  }

  /**
   * Get an audio file by its id
   *
   * @param id  the id of the audio file
   */
  public getAudioFile(id: string): AudioFile | null {
    const file = this._permanentAudioFiles.get(id);
    if (file !== undefined) {
      return file;
    }

    const cachedFileNode = this._cachedAudioFiles.get(id);
    if (cachedFileNode !== undefined) {
      this._moveToBack(cachedFileNode);
      return cachedFileNode.file;
    }

    return null;
  }

  private _moveToBack(node: LruNode): void {
    if (node.prev !== null) {
      node.prev.next = node.next;
    } else {
      this._lruHead = node.next;
    }

    if (node.next !== null) {
      node.next.prev = node.prev;
    } else {
      this._lruTail = node.prev;
    }

    node.prev = this._lruTail;
    node.next = null;

    if (this._lruTail !== null) {
      this._lruTail.next = node;
    }

    this._lruTail = node;
  }

  public getOrCreateAudioFile(url: URL): AudioFile {
    const cachedFileNode = this._cachedAudioFiles.get(url.toString());
    if (cachedFileNode !== undefined) {
      this._moveToBack(cachedFileNode);
      return cachedFileNode.file;
    }

    const file = AudioFile.create(url);
    this._addAudioFile(file);
    return file;
  }

  private _addAudioFile(file: AudioFile): void {
    const node: LruNode = {
      prev: this._lruTail,
      next: null,
      url: file.url,
      file: file,
    };

    if (this._lruTail !== null) {
      this._lruTail.next = node;
    }

    this._lruTail = node;

    if (this._lruHead === null) {
      this._lruHead = node;
    }

    this._cachedAudioFiles.set(file.id, node);

    if (this._cachedAudioFiles.size > this._maxCachedFiles) {
      this._removeOldestFile();
    }
  }

  private _removeOldestFile(): void {
    if (this._lruHead !== null) {
      const node = this._lruHead;
      this._lruHead = node.next;
      if (this._lruHead !== null) {
        this._lruHead.prev = null;
      }

      this._cachedAudioFiles.delete(node.url.toString());
    }
  }
}
