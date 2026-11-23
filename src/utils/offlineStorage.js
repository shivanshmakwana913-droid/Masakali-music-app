// AS Music - Zero-Dependency Native IndexedDB Offline Music Cache
const DB_NAME = 'as_music_offline_db';
const DB_VERSION = 1;
const STORE_NAME = 'cached_tracks';

function openDB() {
  return new Promise((resolve, reject) => {
    if (!window.indexedDB) {
      reject(new Error('IndexedDB not supported in this browser'));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Save track audio stream and lyrics to IndexedDB for 100% offline playback
 */
export async function saveTrackOffline(track, audioUrl) {
  try {
    const urlToFetch = audioUrl || track.audioUrl;
    let audioBlob = null;

    // Fetch audio blob
    try {
      const response = await fetch(urlToFetch);
      if (response.ok) {
        audioBlob = await response.blob();
      }
    } catch (err) {
      console.warn('Could not fetch binary audio blob for offline, saving metadata only:', err);
    }

    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);

      const record = {
        id: track.id,
        title: track.title,
        artist: track.artist,
        album: track.album,
        duration: track.duration,
        durationFormatted: track.durationFormatted,
        cover: track.cover,
        genre: track.genre,
        tags: track.tags || [],
        lyrics: track.lyrics || [],
        audioBlob: audioBlob,
        savedAt: Date.now()
      };

      const putRequest = store.put(record);
      putRequest.onsuccess = () => resolve(true);
      putRequest.onerror = () => reject(putRequest.error);
    });
  } catch (error) {
    console.error('saveTrackOffline error:', error);
    return false;
  }
}

/**
 * Retrieve cached offline track record by ID
 */
export async function getOfflineTrack(trackId) {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(trackId);

      req.onsuccess = () => {
        const record = req.result;
        if (!record) {
          resolve(null);
          return;
        }

        // Convert stored Blob back to an object URL for playback
        let localAudioUrl = null;
        if (record.audioBlob) {
          localAudioUrl = URL.createObjectURL(record.audioBlob);
        }

        resolve({
          ...record,
          audioUrl: localAudioUrl || record.audioUrl,
          isOfflineSaved: true
        });
      };
      req.onerror = () => reject(req.error);
    });
  } catch (error) {
    console.error('getOfflineTrack error:', error);
    return null;
  }
}

/**
 * Retrieve all offline cached tracks
 */
export async function getAllOfflineTracks() {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.getAll();

      req.onsuccess = () => {
        const results = req.result || [];
        const mapped = results.map((record) => {
          let localAudioUrl = null;
          if (record.audioBlob) {
            localAudioUrl = URL.createObjectURL(record.audioBlob);
          }
          return {
            ...record,
            audioUrl: localAudioUrl || record.audioUrl,
            isOfflineSaved: true
          };
        });
        resolve(mapped);
      };
      req.onerror = () => reject(req.error);
    });
  } catch (error) {
    console.error('getAllOfflineTracks error:', error);
    return [];
  }
}

/**
 * Remove track from IndexedDB
 */
export async function removeOfflineTrack(trackId) {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.delete(trackId);

      req.onsuccess = () => resolve(true);
      req.onerror = () => reject(req.error);
    });
  } catch (error) {
    console.error('removeOfflineTrack error:', error);
    return false;
  }
}

/**
 * Check if a track is cached offline
 */
export async function isTrackOffline(trackId) {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.getKey(trackId);

      req.onsuccess = () => resolve(req.result !== undefined);
      req.onerror = () => resolve(false);
    });
  } catch {
    return false;
  }
}
