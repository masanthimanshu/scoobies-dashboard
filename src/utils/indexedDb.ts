import { SaleRecord } from "../types";

const DB_NAME = "ScoobiesSalesDB";
const DB_VERSION = 1;
const STORE_NAME = "sales_store";

interface CachedDatasetMeta {
  fileName: string;
  timestamp: number;
  totalRows: number;
}

interface CachedSalesDataset {
  records: SaleRecord[];
  fileName: string;
  timestamp: number;
}

/**
 * Opens or upgrades the IndexedDB instance for Scoobies Sales Storage.
 */
function openSalesDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined" || !window.indexedDB) {
      reject(new Error("IndexedDB is not supported in this environment."));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = () => {
      reject(request.error || new Error("Failed to open IndexedDB"));
    };
  });
}

/**
 * Completely replaces any existing data in IndexedDB with the newly uploaded dataset.
 * Uses an atomic transaction: clears old records, then writes the new dataset and metadata.
 */
export async function saveSalesDataset(
  records: SaleRecord[],
  fileName: string,
): Promise<void> {
  try {
    const db = await openSalesDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);

      // 1. Wipe all existing entries to guarantee 100% clean replacement
      store.clear();

      // 2. Write new records and metadata
      const meta: CachedDatasetMeta = {
        fileName,
        timestamp: Date.now(),
        totalRows: records.length,
      };

      store.put(records, "active_records");
      store.put(meta, "active_meta");

      tx.oncomplete = () => {
        resolve();
      };

      tx.onerror = () => {
        reject(tx.error || new Error("Failed to save dataset to IndexedDB"));
      };

      tx.onabort = () => {
        reject(
          tx.error ||
            new Error("Transaction aborted while saving to IndexedDB"),
        );
      };
    });
  } catch (error) {
    console.error("[IndexedDB] Error saving sales dataset:", error);
    throw error;
  }
}

/**
 * Loads the active sales dataset and metadata from IndexedDB if available.
 * Returns null if no cached dataset exists or store is empty.
 */
export async function loadSalesDataset(): Promise<CachedSalesDataset | null> {
  try {
    const db = await openSalesDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, "readonly");
      const store = tx.objectStore(STORE_NAME);

      const recordsReq = store.get("active_records");
      const metaReq = store.get("active_meta");

      tx.oncomplete = () => {
        const records = recordsReq.result as SaleRecord[] | undefined;
        const meta = metaReq.result as CachedDatasetMeta | undefined;

        if (records && Array.isArray(records) && records.length > 0) {
          resolve({
            records,
            fileName: meta?.fileName || "Restored Dataset",
            timestamp: meta?.timestamp || Date.now(),
          });
        } else {
          resolve(null);
        }
      };

      tx.onerror = (e) => {
        console.warn("[IndexedDB] Error reading cached dataset:", e);
        resolve(null);
      };
    });
  } catch (error) {
    console.warn("[IndexedDB] Failed to load dataset from IndexedDB:", error);
    return null;
  }
}

/**
 * Completely purges all stored sales records and metadata from IndexedDB.
 */
export async function clearSalesDataset(): Promise<void> {
  try {
    const db = await openSalesDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);

      store.clear();

      tx.oncomplete = () => {
        resolve();
      };

      tx.onerror = () => {
        reject(tx.error || new Error("Failed to clear IndexedDB dataset"));
      };
    });
  } catch (error) {
    console.error("[IndexedDB] Error clearing sales dataset:", error);
    throw error;
  }
}
