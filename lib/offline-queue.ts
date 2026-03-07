// IndexedDB 기반 오프라인 요청 큐
// SSR 환경에서 안전하게 사용하기 위해 typeof window 체크 필요

const DB_NAME = 'mylifeos-offline'
const DB_VERSION = 1
const STORE_NAME = 'queue'
const MAX_RETRIES = 3

export interface QueuedRequest {
  id?: number
  method: string
  url: string
  body: unknown
  timestamp: number
  retries: number
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true })
      }
    }

    request.onsuccess = (event) => {
      resolve((event.target as IDBOpenDBRequest).result)
    }

    request.onerror = (event) => {
      reject((event.target as IDBOpenDBRequest).error)
    }
  })
}

export async function enqueueRequest(
  method: string,
  url: string,
  body: unknown
): Promise<void> {
  if (typeof window === 'undefined') return

  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    const store = tx.objectStore(STORE_NAME)
    const item: QueuedRequest = {
      method,
      url,
      body,
      timestamp: Date.now(),
      retries: 0,
    }
    const req = store.add(item)
    req.onsuccess = () => resolve()
    req.onerror = () => reject(req.error)
  })
}

export async function getPendingCount(): Promise<number> {
  if (typeof window === 'undefined') return 0

  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly')
    const store = tx.objectStore(STORE_NAME)
    const req = store.count()
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

async function getAllQueued(): Promise<QueuedRequest[]> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly')
    const store = tx.objectStore(STORE_NAME)
    const req = store.getAll()
    req.onsuccess = () => resolve(req.result as QueuedRequest[])
    req.onerror = () => reject(req.error)
  })
}

async function deleteQueued(id: number): Promise<void> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    const store = tx.objectStore(STORE_NAME)
    const req = store.delete(id)
    req.onsuccess = () => resolve()
    req.onerror = () => reject(req.error)
  })
}

async function updateRetries(id: number, retries: number): Promise<void> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    const store = tx.objectStore(STORE_NAME)
    const getReq = store.get(id)
    getReq.onsuccess = () => {
      const item = getReq.result as QueuedRequest
      if (!item) return resolve()
      item.retries = retries
      const putReq = store.put(item)
      putReq.onsuccess = () => resolve()
      putReq.onerror = () => reject(putReq.error)
    }
    getReq.onerror = () => reject(getReq.error)
  })
}

export async function processQueue(): Promise<void> {
  if (typeof window === 'undefined') return
  if (!navigator.onLine) return

  const items = await getAllQueued()
  for (const item of items) {
    const id = item.id!
    try {
      const res = await fetch(item.url, {
        method: item.method,
        headers: { 'Content-Type': 'application/json' },
        body: item.body != null ? JSON.stringify(item.body) : undefined,
      })

      if (res.ok) {
        await deleteQueued(id)
      } else if (item.retries >= MAX_RETRIES) {
        // 재시도 한도 초과 → 제거
        await deleteQueued(id)
      } else {
        await updateRetries(id, item.retries + 1)
      }
    } catch {
      if (item.retries >= MAX_RETRIES) {
        await deleteQueued(id)
      } else {
        await updateRetries(id, item.retries + 1)
      }
    }
  }
}
