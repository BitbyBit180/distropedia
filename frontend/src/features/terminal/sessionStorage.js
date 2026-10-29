/**
 * IndexedDB helper for persisting v86 Linux virtual machine snapshots.
 * Uses native browser IndexedDB to store raw ArrayBuffers (typically 20MB - 40MB)
 * without hitting localStorage quotas or thread bottlenecks.
 */

const DB_NAME = 'distropedia_v86_db';
const DB_VERSION = 1;
const STORE_NAME = 'vm_sessions';
const SESSION_KEY = 'active_session';

function openDB() {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB is not supported in this environment'));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error('Failed to open IndexedDB'));
  });
}

/**
 * Save VM memory & CPU state buffer to IndexedDB
 */
export async function saveSessionToDB(stateBuffer, metadata = {}) {
  try {
    const db = await openDB();
    const entry = {
      id: SESSION_KEY,
      buffer: stateBuffer,
      savedAt: new Date().toISOString(),
      size: stateBuffer.byteLength,
      ...metadata,
    };

    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.put(entry);

      req.onsuccess = () => resolve(entry);
      req.onerror = () => reject(req.error || new Error('Failed to write session to IndexedDB'));
      tx.oncomplete = () => db.close();
    });
  } catch (err) {
    console.error('Error saving session to IndexedDB:', err);
    throw err;
  }
}

/**
 * Get saved session state buffer and metadata from IndexedDB
 */
export async function getSavedSessionFromDB() {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(SESSION_KEY);

      req.onsuccess = () => {
        resolve(req.result || null);
      };
      req.onerror = () => reject(req.error || new Error('Failed to read session from IndexedDB'));
      tx.oncomplete = () => db.close();
    });
  } catch (err) {
    console.warn('Could not read saved session from IndexedDB:', err);
    return null;
  }
}

/**
 * Delete saved session from IndexedDB
 */
export async function clearSavedSessionFromDB() {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.delete(SESSION_KEY);

      req.onsuccess = () => resolve(true);
      req.onerror = () => reject(req.error);
      tx.oncomplete = () => db.close();
    });
  } catch (err) {
    console.warn('Could not delete session from IndexedDB:', err);
    return false;
  }
}

/**
 * Trigger browser file download of a session state buffer
 */
export function exportSessionToFile(buffer, filename) {
  const name = filename || `distropedia-session-${new Date().toISOString().replace(/[:.]/g, '-')}.v86state`;
  const blob = new Blob([buffer], { type: 'application/octet-stream' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 500);
}

/**
 * Read ArrayBuffer from a user-uploaded File object
 */
export function importSessionFromFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error || new Error('Failed to read session file'));
    reader.readAsArrayBuffer(file);
  });
}

