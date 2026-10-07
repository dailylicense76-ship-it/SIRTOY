import { Database } from '../types';
import { today } from './calculations';

declare global {
  interface Window {
    showDirectoryPicker?: (options?: object) => Promise<FileSystemDirectoryHandle>;
  }
}

// IndexedDB helper to store directory handle across page reloads
const IDB_NAME = 'SirtoyDirectoryDB';
const IDB_STORE = 'handles';
const HANDLE_KEY = 'current_pc_directory';

export function isInIframe(): boolean {
  try {
    return window.self !== window.top;
  } catch {
    return true;
  }
}

function openIDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(IDB_NAME, 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(IDB_STORE)) {
        db.createObjectStore(IDB_STORE);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function saveStoredHandle(handle: FileSystemDirectoryHandle): Promise<void> {
  try {
    const db = await openIDB();
    const tx = db.transaction(IDB_STORE, 'readwrite');
    tx.objectStore(IDB_STORE).put(handle, HANDLE_KEY);
  } catch {
    // IDB write failed, continue with in-memory handle
  }
}

export async function getStoredHandle(): Promise<FileSystemDirectoryHandle | null> {
  try {
    const db = await openIDB();
    return new Promise((resolve) => {
      const tx = db.transaction(IDB_STORE, 'readonly');
      const req = tx.objectStore(IDB_STORE).get(HANDLE_KEY);
      req.onsuccess = () => resolve((req.result as FileSystemDirectoryHandle) || null);
      req.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
}

export async function removeStoredHandle(): Promise<void> {
  try {
    const db = await openIDB();
    const tx = db.transaction(IDB_STORE, 'readwrite');
    tx.objectStore(IDB_STORE).delete(HANDLE_KEY);
  } catch {
    // ignore
  }
}

export async function verifyPermission(fileHandle: FileSystemDirectoryHandle, readWrite = true): Promise<boolean> {
  try {
    const options = readWrite ? { mode: 'readwrite' as const } : {};
    if ((await (fileHandle as unknown as { queryPermission: (opt: object) => Promise<string> }).queryPermission(options)) === 'granted') {
      return true;
    }
    if ((await (fileHandle as unknown as { requestPermission: (opt: object) => Promise<string> }).requestPermission(options)) === 'granted') {
      return true;
    }
  } catch {
    return false;
  }
  return false;
}

export async function choosePCFolder(): Promise<{ handle: FileSystemDirectoryHandle | null; error?: string }> {
  // Check if running in a cross-origin iframe where showDirectoryPicker is forbidden by browser security
  if (isInIframe()) {
    return {
      handle: null,
      error: 'iframe_blocked'
    };
  }

  if (typeof window.showDirectoryPicker !== 'function') {
    return {
      handle: null,
      error: 'unsupported'
    };
  }

  try {
    const handle = await window.showDirectoryPicker({
      mode: 'readwrite',
      startIn: 'documents'
    });
    await saveStoredHandle(handle);
    return { handle };
  } catch (err) {
    const errorObj = err as Error;
    if (errorObj.name === 'SecurityError') {
      return { handle: null, error: 'iframe_blocked' };
    }
    if (errorObj.name !== 'AbortError') {
      return { handle: null, error: errorObj.message || 'unknown' };
    }
    return { handle: null };
  }
}

async function writeJsonFile(dirHandle: FileSystemDirectoryHandle, filename: string, data: unknown): Promise<void> {
  const fileHandle = await dirHandle.getFileHandle(filename, { create: true });
  const writable = await (fileHandle as unknown as { createWritable: () => Promise<WritableStreamDefaultWriter> }).createWritable();
  const content = JSON.stringify(data, null, 2);
  await (writable as unknown as { write: (c: string) => Promise<void>; close: () => Promise<void> }).write(content);
  await (writable as unknown as { close: () => Promise<void> }).close();
}

async function readJsonFile<T>(dirHandle: FileSystemDirectoryHandle, filename: string): Promise<T | null> {
  try {
    const fileHandle = await dirHandle.getFileHandle(filename, { create: false });
    const file = await fileHandle.getFile();
    const text = await file.text();
    return JSON.parse(text) as T;
  } catch {
    return null;
  }
}

export async function writeDatabaseToPCFolder(dirHandle: FileSystemDirectoryHandle, db: Database): Promise<boolean> {
  try {
    const hasPerm = await verifyPermission(dirHandle, true);
    if (!hasPerm) return false;

    // 1. Write partitioned table JSON files into the selected PC folder
    await writeJsonFile(dirHandle, 'DATABASE_INDEX.json', {
      app: 'SIRTOY LENDING PLUS',
      company: db.settings.company,
      version: db.version,
      updatedAt: new Date().toISOString(),
      counts: {
        borrowers: db.borrowers.length,
        loans: db.loans.length,
        payments: db.payments.length,
        expenses: db.expenses.length,
        capital: db.capital.length,
        audit: db.audit.length
      }
    });

    await writeJsonFile(dirHandle, 'SETTINGS.json', db.settings);
    await writeJsonFile(dirHandle, 'BORROWERS.json', db.borrowers);
    await writeJsonFile(dirHandle, 'LOANS.json', db.loans);
    await writeJsonFile(dirHandle, 'PAYMENTS.json', db.payments);
    await writeJsonFile(dirHandle, 'CAPITAL.json', db.capital);
    await writeJsonFile(dirHandle, 'EXPENSES.json', db.expenses);
    await writeJsonFile(dirHandle, 'COLLECTORS.json', db.collectors);
    await writeJsonFile(dirHandle, 'AREAS.json', db.areas);
    await writeJsonFile(dirHandle, 'CASH_RECONCILIATIONS.json', db.cashReconciliations);
    await writeJsonFile(dirHandle, 'RENEWAL_REQUESTS.json', db.renewalRequests);
    await writeJsonFile(dirHandle, 'USERS.json', db.users);
    await writeJsonFile(dirHandle, 'AUDIT.json', db.audit);

    // 2. Also write master backup file SIRTOY_MASTER_DATABASE.json inside the folder
    await writeJsonFile(dirHandle, 'SIRTOY_MASTER_DATABASE.json', db);

    // 3. Save official logo.png and icon.png directly into the PC folder
    try {
      const resp = await fetch('/logo.png');
      if (resp.ok) {
        const blob = await resp.blob();
        const logoFileHandle = await dirHandle.getFileHandle('logo.png', { create: true });
        const logoWritable = await (logoFileHandle as unknown as { createWritable: () => Promise<WritableStreamDefaultWriter> }).createWritable();
        await (logoWritable as unknown as { write: (c: Blob) => Promise<void>; close: () => Promise<void> }).write(blob);
        await (logoWritable as unknown as { close: () => Promise<void> }).close();

        const iconFileHandle = await dirHandle.getFileHandle('icon.png', { create: true });
        const iconWritable = await (iconFileHandle as unknown as { createWritable: () => Promise<WritableStreamDefaultWriter> }).createWritable();
        await (iconWritable as unknown as { write: (c: Blob) => Promise<void>; close: () => Promise<void> }).write(blob);
        await (iconWritable as unknown as { close: () => Promise<void> }).close();
      }
    } catch {
      // Icon write skipped
    }

    // 4. Create automatic date-stamped backup inside 'Backups' subfolder
    try {
      const backupSubdir = await dirHandle.getDirectoryHandle('Backups', { create: true });
      const backupFilename = `SIRTOY_DB_BACKUP_${today()}.json`;
      await writeJsonFile(backupSubdir, backupFilename, db);
    } catch {
      // Backup subfolder write skipped
    }

    return true;
  } catch {
    return false;
  }
}

export async function readDatabaseFromPCFolder(dirHandle: FileSystemDirectoryHandle): Promise<Database | null> {
  try {
    const hasPerm = await verifyPermission(dirHandle, false);
    if (!hasPerm) return null;

    // Try reading master file first
    const master = await readJsonFile<Database>(dirHandle, 'SIRTOY_MASTER_DATABASE.json');
    if (master && Array.isArray(master.loans) && Array.isArray(master.borrowers)) {
      return master;
    }

    // Otherwise reconstruct from partitioned JSON files
    const settings = await readJsonFile<Database['settings']>(dirHandle, 'SETTINGS.json');
    const borrowers = await readJsonFile<Database['borrowers']>(dirHandle, 'BORROWERS.json');
    const loans = await readJsonFile<Database['loans']>(dirHandle, 'LOANS.json');
    const payments = await readJsonFile<Database['payments']>(dirHandle, 'PAYMENTS.json');
    const capital = await readJsonFile<Database['capital']>(dirHandle, 'CAPITAL.json');
    const expenses = await readJsonFile<Database['expenses']>(dirHandle, 'EXPENSES.json');
    const collectors = await readJsonFile<Database['collectors']>(dirHandle, 'COLLECTORS.json');
    const areas = await readJsonFile<Database['areas']>(dirHandle, 'AREAS.json');
    const cashReconciliations = await readJsonFile<Database['cashReconciliations']>(dirHandle, 'CASH_RECONCILIATIONS.json');
    const renewalRequests = await readJsonFile<Database['renewalRequests']>(dirHandle, 'RENEWAL_REQUESTS.json');
    const users = await readJsonFile<Database['users']>(dirHandle, 'USERS.json');
    const audit = await readJsonFile<Database['audit']>(dirHandle, 'AUDIT.json');

    if (borrowers && loans) {
      return {
        version: settings?.integrityRulesVersion || 10,
        settings: settings || {
          company: 'SIRTOY LENDING PLUS, INC.',
          diskFolderName: dirHandle.name,
          diskFolderConfigured: true,
          diskDatabaseVersion: 1,
          fakeDataRemoved: true,
          integrityRulesVersion: 5
        },
        areas: areas || [],
        collectors: collectors || [],
        borrowers: borrowers || [],
        capital: capital || [],
        expenses: expenses || [],
        loans: loans || [],
        payments: payments || [],
        audit: audit || [],
        cashReconciliations: cashReconciliations || [],
        renewalRequests: renewalRequests || [],
        users: users || []
      };
    }

    return null;
  } catch {
    return null;
  }
}
