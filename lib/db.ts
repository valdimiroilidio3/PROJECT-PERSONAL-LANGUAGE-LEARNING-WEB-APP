/**
 * Small IndexedDB wrapper with a session-only memory fallback.
 * No learning data leaves the browser: there is no network code in this module.
 */

export type StoreName = 'kv' | 'completions' | 'attempts' | 'vocabulary' | 'sessions';

const DB_NAME = 'lumio-learning';
const DB_VERSION = 1;
const STORES: StoreName[] = ['kv', 'completions', 'attempts', 'vocabulary', 'sessions'];

export type StorageMode = 'indexeddb' | 'memory';

let dbPromise: Promise<IDBDatabase> | null = null;
let mode: StorageMode | null = null;
let nextMemoryId = 1;
const memory: Record<StoreName, Map<string, unknown>> = {
  kv: new Map(),
  completions: new Map(),
  attempts: new Map(),
  vocabulary: new Map(),
  sessions: new Map(),
};

function openDatabase(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise<IDBDatabase>((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB is not available in this browser.'));
      return;
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      for (const name of STORES) {
        if (!db.objectStoreNames.contains(name)) {
          db.createObjectStore(name, {
            keyPath: name === 'kv' ? 'key' : name === 'attempts' ? 'id' : name === 'completions' ? 'lessonId' : 'id',
            autoIncrement: name === 'attempts',
          });
        }
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('Could not open IndexedDB.'));
    request.onblocked = () => reject(new Error('IndexedDB upgrade is blocked by another tab.'));
  }).catch((error: unknown) => {
    mode = 'memory';
    throw error;
  });
  return dbPromise;
}

/** Switch to session-only storage when a write fails; never presented as durable storage. */
export function markMemoryMode(): void {
  mode = 'memory';
}

export async function getStorageMode(): Promise<StorageMode> {
  if (mode === 'memory') return 'memory';
  try {
    await openDatabase();
    mode = 'indexeddb';
  } catch {
    mode = 'memory';
  }
  return mode;
}

function memoryKey(store: StoreName, value: unknown): string {
  if (store === 'kv') return String((value as { key: string }).key);
  if (store === 'attempts') {
    const record = value as { id?: number };
    if (record.id == null) record.id = nextMemoryId++;
    return String(record.id);
  }
  return String((value as { id?: string; lessonId?: string }).id ?? (value as { lessonId?: string }).lessonId);
}

export async function getAll<T>(store: StoreName): Promise<T[]> {
  if (await getStorageMode() === 'memory') return [...memory[store].values()] as T[];
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const request = db.transaction(store, 'readonly').objectStore(store).getAll();
    request.onsuccess = () => resolve(request.result as T[]);
    request.onerror = () => reject(request.error ?? new Error(`Could not read ${store}.`));
  });
}

export async function getRecord<T>(store: StoreName, key: string | number): Promise<T | undefined> {
  if (await getStorageMode() === 'memory') return memory[store].get(String(key)) as T | undefined;
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const request = db.transaction(store, 'readonly').objectStore(store).get(key);
    request.onsuccess = () => resolve(request.result as T | undefined);
    request.onerror = () => reject(request.error ?? new Error(`Could not read ${store}.`));
  });
}

export async function putRecord(store: StoreName, value: unknown): Promise<void> {
  if (await getStorageMode() === 'memory') {
    memory[store].set(memoryKey(store, value), value);
    return;
  }
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const request = db.transaction(store, 'readwrite').objectStore(store).put(value);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error ?? new Error(`Could not save to ${store}.`));
  });
}

export async function deleteRecord(store: StoreName, key: string | number): Promise<void> {
  if (await getStorageMode() === 'memory') {
    memory[store].delete(String(key));
    return;
  }
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const request = db.transaction(store, 'readwrite').objectStore(store).delete(key);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error ?? new Error(`Could not delete from ${store}.`));
  });
}

export async function clearStore(store: StoreName): Promise<void> {
  if (await getStorageMode() === 'memory') {
    memory[store].clear();
    return;
  }
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const request = db.transaction(store, 'readwrite').objectStore(store).clear();
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error ?? new Error(`Could not clear ${store}.`));
  });
}

export interface SnapshotRecords {
  profile: unknown;
  completions: unknown[];
  attempts: unknown[];
  vocabulary: unknown[];
  sessions: unknown[];
}

/** Replaces all local data in one transaction so a failed import cannot leave a partial restore. */
export async function replaceAll(data: SnapshotRecords): Promise<void> {
  if (await getStorageMode() === 'memory') {
    for (const store of STORES) memory[store].clear();
    memory.kv.set('profile', { key: 'profile', value: data.profile });
    for (const item of data.completions) memory.completions.set(String((item as { lessonId: string }).lessonId), item);
    for (const item of data.attempts) memory.attempts.set(memoryKey('attempts', item), item);
    for (const item of data.vocabulary) memory.vocabulary.set(memoryKey('vocabulary', item), item);
    for (const item of data.sessions) memory.sessions.set(memoryKey('sessions', item), item);
    return;
  }

  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORES, 'readwrite');
    for (const store of STORES) transaction.objectStore(store).clear();
    transaction.objectStore('kv').put({ key: 'profile', value: data.profile });
    for (const item of data.completions) transaction.objectStore('completions').put(item);
    for (const item of data.attempts) transaction.objectStore('attempts').put(item);
    for (const item of data.vocabulary) transaction.objectStore('vocabulary').put(item);
    for (const item of data.sessions) transaction.objectStore('sessions').put(item);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error ?? new Error('Could not replace local data.'));
    transaction.onabort = () => reject(transaction.error ?? new Error('Data replacement was aborted.'));
  });
}

export interface KvRecord<T> {
  key: string;
  value: T;
}

export async function readKv<T>(key: string): Promise<T | undefined> {
  const record = await getRecord<KvRecord<T>>('kv', key);
  return record?.value;
}

export async function writeKv<T>(key: string, value: T): Promise<void> {
  await putRecord('kv', { key, value } satisfies KvRecord<T>);
}

export function describeStorageError(error: unknown): string {
  return error instanceof Error ? error.message : 'Erro desconhecido ao guardar dados.';
}
