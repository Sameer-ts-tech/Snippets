import React, { createContext, useContext, useState, useEffect } from 'react';
import * as SQLite from 'expo-sqlite';

export interface Snippet {
  id: number;
  title: string;
  code: string;
  language: string;
  tags: string[]; // Parsed from JSON array in SQLite
  is_favorite: number; // 0 or 1
  screenshot_uri?: string | null;
  explanation?: string | null;
  created_at: string;
}

interface DBContextType {
  snippets: Snippet[];
  isLoading: boolean;
  loadSnippets: () => void;
  getSnippetById: (id: number) => Snippet | null;
  createSnippet: (
    title: string,
    code: string,
    language: string,
    tags: string[],
    screenshotUri?: string | null
  ) => number;
  updateSnippet: (
    id: number,
    fields: Partial<Omit<Snippet, 'id' | 'created_at'>>
  ) => void;
  deleteSnippet: (id: number) => void;
  toggleFavorite: (id: number) => void;
  searchSnippets: (query: string, language?: string, favoriteOnly?: boolean) => Snippet[];
}

const DBContext = createContext<DBContextType | undefined>(undefined);

let db: SQLite.SQLiteDatabase;

// Open database synchronously at module level/during context initialization
try {
  db = SQLite.openDatabaseSync('devpocket.db');
} catch (error) {
  console.error('Failed to open database', error);
}

export function DBProvider({ children }: { children: React.ReactNode }) {
  const [snippets, setSnippets] = useState<Snippet[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize DB and Seed Data
  useEffect(() => {
    try {
      // 1. Create table if not exists
      db.execSync(`
        CREATE TABLE IF NOT EXISTS snippets (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          title TEXT NOT NULL,
          code TEXT NOT NULL,
          language TEXT NOT NULL,
          tags TEXT NOT NULL,
          is_favorite INTEGER DEFAULT 0,
          screenshot_uri TEXT,
          explanation TEXT,
          created_at TEXT NOT NULL
        );
      `);

      // 2. Check if seeded, if empty seed with beautiful developer templates
      const rowCount = db.getFirstSync<{ count: number }>('SELECT COUNT(*) as count FROM snippets;');
      if (rowCount && rowCount.count === 0) {
        seedInitialSnippets();
      }

      // 3. Load snippets
      loadSnippets();
    } catch (e) {
      console.error('Database migration/load failed', e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadSnippets = () => {
    try {
      const rows = db.getAllSync<any>('SELECT * FROM snippets ORDER BY id DESC');
      const parsed: Snippet[] = rows.map(row => ({
        ...row,
        tags: JSON.parse(row.tags || '[]'),
      }));
      setSnippets(parsed);
    } catch (e) {
      console.error('Failed to retrieve snippets', e);
    }
  };

  const getSnippetById = (id: number): Snippet | null => {
    try {
      const row = db.getFirstSync<any>('SELECT * FROM snippets WHERE id = ?', id);
      if (row) {
        return {
          ...row,
          tags: JSON.parse(row.tags || '[]'),
        };
      }
      return null;
    } catch (e) {
      console.error(`Failed to get snippet ${id}`, e);
      return null;
    }
  };

  const createSnippet = (
    title: string,
    code: string,
    language: string,
    tags: string[],
    screenshotUri?: string | null
  ): number => {
    const createdAt = new Date().toISOString();
    const tagsString = JSON.stringify(tags);

    const result = db.runSync(
      `INSERT INTO snippets (title, code, language, tags, is_favorite, screenshot_uri, created_at)
       VALUES (?, ?, ?, ?, 0, ?, ?)`,
      title,
      code,
      language,
      tagsString,
      screenshotUri || null,
      createdAt
    );

    loadSnippets();
    return result.lastInsertRowId;
  };

  const updateSnippet = (
    id: number,
    fields: Partial<Omit<Snippet, 'id' | 'created_at'>>
  ) => {
    const setStatements: string[] = [];
    const params: any[] = [];

    Object.entries(fields).forEach(([key, val]) => {
      if (key === 'tags') {
        setStatements.push(`${key} = ?`);
        params.push(JSON.stringify(val));
      } else {
        setStatements.push(`${key} = ?`);
        params.push(val);
      }
    });

    if (setStatements.length === 0) return;

    params.push(id);
    db.runSync(
      `UPDATE snippets SET ${setStatements.join(', ')} WHERE id = ?`,
      ...params
    );

    loadSnippets();
  };

  const deleteSnippet = (id: number) => {
    db.runSync('DELETE FROM snippets WHERE id = ?', id);
    loadSnippets();
  };

  const toggleFavorite = (id: number) => {
    db.runSync(
      'UPDATE snippets SET is_favorite = CASE WHEN is_favorite = 1 THEN 0 ELSE 1 END WHERE id = ?',
      id
    );
    loadSnippets();
  };

  const searchSnippets = (
    query: string,
    language?: string,
    favoriteOnly?: boolean
  ): Snippet[] => {
    let baseSql = 'SELECT * FROM snippets WHERE 1=1';
    const params: any[] = [];

    if (query && query.trim() !== '') {
      baseSql += ' AND (title LIKE ? OR code LIKE ? OR tags LIKE ?)';
      const likeParam = `%${query.trim()}%`;
      params.push(likeParam, likeParam, likeParam);
    }

    if (language && language !== 'all') {
      baseSql += ' AND language = ?';
      params.push(language.toLowerCase());
    }

    if (favoriteOnly) {
      baseSql += ' AND is_favorite = 1';
    }

    baseSql += ' ORDER BY id DESC';

    try {
      const rows = db.getAllSync<any>(baseSql, ...params);
      return rows.map(row => ({
        ...row,
        tags: JSON.parse(row.tags || '[]'),
      }));
    } catch (e) {
      console.error('Failed searching snippets', e);
      return [];
    }
  };

  const seedInitialSnippets = () => {
    const seeds = [
      {
        title: 'React Custom Hook: useDebounce',
        language: 'typescript',
        tags: ['react', 'hook', 'performance', 'debounce'],
        code: `import { useState, useEffect } from 'react';

/**
 * Custom hook to debounce rapid value updates (e.g. search inputs).
 * @param value The value to delay
 * @param delay Time in milliseconds
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    // Set a timer to update the value after the specified delay
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Clean up the timer if the value or delay changes
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}`
      },
      {
        title: 'Python Timing Decorator',
        language: 'python',
        tags: ['decorator', 'performance', 'utility'],
        code: `import time
from functools import wraps

def time_it(func):
    """
    A decorator that measures and prints the execution time of a function.
    """
    @wraps(func)
    def wrapper(*args, **kwargs):
        start_time = time.perf_counter()
        result = func(*args, **kwargs)
        end_time = time.perf_counter()
        execution_time = end_time - start_time
        print(f"[Timer] Function '{func.__name__}' took {execution_time:.6f} seconds to complete.")
        return result
    return wrapper

# Usage Example:
@time_it
def compute_heavy_sum(limit):
    return sum(i * i for i in range(limit))

result = compute_heavy_sum(10_000_000)`
      },
      {
        title: 'Responsive Glassmorphism Card Style',
        language: 'css',
        tags: ['css', 'glassmorphism', 'design', 'ui'],
        code: `.glass-card {
  background: rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(12px) saturate(160%);
  -webkit-backdrop-filter: blur(12px) saturate(160%);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.37);
  color: #f8fafc;
  
  /* Transition for interactions */
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.glass-card:hover {
  transform: translateY(-4px);
  background: rgba(255, 255, 255, 0.12);
  border-color: rgba(255, 255, 255, 0.25);
  box-shadow: 0 12px 40px 0 rgba(99, 102, 241, 0.25);
}`
      },
      {
        title: 'SQLite Snippet Query (Full Outer Simulation)',
        language: 'sql',
        tags: ['sqlite', 'database', 'sql', 'queries'],
        code: `-- Simulate FULL OUTER JOIN in SQLite (unsupported natively)
SELECT s.id, s.title, f.file_path 
FROM snippets s
LEFT JOIN attachments f ON s.id = f.snippet_id

UNION

SELECT s.id, s.title, f.file_path
FROM attachments f
LEFT JOIN snippets s ON s.id = f.snippet_id
WHERE s.id IS NULL;`
      }
    ];

    const createdAt = new Date().toISOString();
    seeds.forEach(s => {
      db.runSync(
        `INSERT INTO snippets (title, code, language, tags, is_favorite, created_at)
         VALUES (?, ?, ?, ?, 0, ?)`,
        s.title,
        s.code,
        s.language,
        JSON.stringify(s.tags),
        createdAt
      );
    });
  };

  return (
    <DBContext.Provider
      value={{
        snippets,
        isLoading,
        loadSnippets,
        getSnippetById,
        createSnippet,
        updateSnippet,
        deleteSnippet,
        toggleFavorite,
        searchSnippets,
      }}
    >
      {children}
    </DBContext.Provider>
  );
}

export function useDB() {
  const context = useContext(DBContext);
  if (!context) {
    throw new Error('useDB must be used within a DBProvider');
  }
  return context;
}
