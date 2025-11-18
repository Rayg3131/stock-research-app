import type { WatchlistItem, TickerNote } from './types';

const WATCHLIST_KEY = 'stock-research-watchlist';
const NOTES_KEY_PREFIX = 'stock-research-notes-';

/**
 * Check if we're in a browser environment
 */
function isBrowser(): boolean {
  return typeof window !== 'undefined';
}

/**
 * Get watchlist from localStorage
 */
export function getWatchlist(): WatchlistItem[] {
  if (!isBrowser()) return [];

  try {
    const stored = localStorage.getItem(WATCHLIST_KEY);
    if (!stored) return [];
    return JSON.parse(stored) as WatchlistItem[];
  } catch (error) {
    console.error('Error reading watchlist from localStorage:', error);
    return [];
  }
}

/**
 * Save watchlist to localStorage
 */
export function saveWatchlist(items: WatchlistItem[]): void {
  if (!isBrowser()) return;

  try {
    localStorage.setItem(WATCHLIST_KEY, JSON.stringify(items));
  } catch (error) {
    console.error('Error saving watchlist to localStorage:', error);
  }
}

/**
 * Add ticker to watchlist
 */
export function addToWatchlist(ticker: string): void {
  if (!isBrowser()) return;

  const watchlist = getWatchlist();
  const upperTicker = ticker.toUpperCase();

  // Check if already in watchlist
  if (watchlist.some((item) => item.ticker === upperTicker)) {
    return;
  }

  const newItem: WatchlistItem = {
    ticker: upperTicker,
    addedAt: new Date().toISOString(),
  };

  watchlist.push(newItem);
  saveWatchlist(watchlist);
}

/**
 * Remove ticker from watchlist
 */
export function removeFromWatchlist(ticker: string): void {
  if (!isBrowser()) return;

  const watchlist = getWatchlist();
  const upperTicker = ticker.toUpperCase();
  const filtered = watchlist.filter((item) => item.ticker !== upperTicker);
  saveWatchlist(filtered);
}

/**
 * Check if ticker is in watchlist
 */
export function isInWatchlist(ticker: string): boolean {
  if (!isBrowser()) return false;

  const watchlist = getWatchlist();
  return watchlist.some((item) => item.ticker === ticker.toUpperCase());
}

/**
 * Get notes for a specific ticker
 */
export function getNotesForTicker(ticker: string): TickerNote[] {
  if (!isBrowser()) return [];

  try {
    const key = `${NOTES_KEY_PREFIX}${ticker.toUpperCase()}`;
    const stored = localStorage.getItem(key);
    if (!stored) return [];
    return JSON.parse(stored) as TickerNote[];
  } catch (error) {
    console.error('Error reading notes from localStorage:', error);
    return [];
  }
}

/**
 * Save notes for a specific ticker
 */
export function saveNotesForTicker(ticker: string, notes: TickerNote[]): void {
  if (!isBrowser()) return;

  try {
    const key = `${NOTES_KEY_PREFIX}${ticker.toUpperCase()}`;
    localStorage.setItem(key, JSON.stringify(notes));
  } catch (error) {
    console.error('Error saving notes to localStorage:', error);
  }
}

/**
 * Add a note for a ticker
 */
export function addNoteForTicker(ticker: string, text: string): void {
  if (!isBrowser() || !text.trim()) return;

  const notes = getNotesForTicker(ticker);
  const now = new Date().toISOString();

  const newNote: TickerNote = {
    ticker: ticker.toUpperCase(),
    noteId: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    createdAt: now,
    updatedAt: now,
    text: text.trim(),
  };

  notes.push(newNote);
  saveNotesForTicker(ticker, notes);
}

/**
 * Update an existing note
 */
export function updateNoteForTicker(
  ticker: string,
  noteId: string,
  text: string
): void {
  if (!isBrowser() || !text.trim()) return;

  const notes = getNotesForTicker(ticker);
  const noteIndex = notes.findIndex((note) => note.noteId === noteId);

  if (noteIndex === -1) return;

  notes[noteIndex] = {
    ...notes[noteIndex],
    text: text.trim(),
    updatedAt: new Date().toISOString(),
  };

  saveNotesForTicker(ticker, notes);
}

/**
 * Delete a note
 */
export function deleteNoteForTicker(ticker: string, noteId: string): void {
  if (!isBrowser()) return;

  const notes = getNotesForTicker(ticker);
  const filtered = notes.filter((note) => note.noteId !== noteId);
  saveNotesForTicker(ticker, filtered);
}

/**
 * Get all notes across all tickers
 */
export function getAllNotes(): TickerNote[] {
  if (!isBrowser()) return [];

  const allNotes: TickerNote[] = [];
  const watchlist = getWatchlist();

  for (const item of watchlist) {
    const notes = getNotesForTicker(item.ticker);
    allNotes.push(...notes);
  }

  // Sort by updatedAt (newest first)
  return allNotes.sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );
}

