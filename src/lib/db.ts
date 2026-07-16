import { ImageObj } from '@/app/page';

export interface Board {
  id: string;
  name: string;
  pins: ImageObj[];
  createdAt: number;
}

const DB_NAME = 'pinny_db';
const STORE_NAME = 'boards';
const DB_VERSION = 1;

function getDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    
    request.onerror = () => reject(request.error);
    
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
  });
}

export async function getBoards(): Promise<Board[]> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result || []);
  });
}

export async function getBoard(id: string): Promise<Board | null> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get(id);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result || null);
  });
}

export async function saveBoard(board: Board): Promise<void> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.put(board);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}

export async function deleteBoard(id: string): Promise<void> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.delete(id);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}

export async function createBoard(name: string): Promise<Board> {
  const newBoard: Board = {
    id: `board_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    name,
    pins: [],
    createdAt: Date.now()
  };
  await saveBoard(newBoard);
  return newBoard;
}

export async function savePinToBoard(boardId: string, pin: ImageObj): Promise<Board> {
  const board = await getBoard(boardId);
  if (!board) throw new Error('Board not found');
  
  // Prevent duplicates
  if (!board.pins.find(p => p.id === pin.id)) {
    board.pins.unshift(pin); // Add newest pin to the front
    await saveBoard(board);
  }
  return board;
}
