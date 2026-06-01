import { Paths, Directory, File } from 'expo-file-system';

export interface FileItem {
  name: string;
  path: string;
  isDirectory: boolean;
  size?: number;
  mimeType?: string;
}

// Establish sandboxed directory trees using the new object-oriented API
export const SANDBOX_DIR = new Directory(Paths.document, 'dev_pocket');
export const SCREENSHOTS_DIR = new Directory(SANDBOX_DIR, 'screenshots');
export const TEMPLATES_DIR = new Directory(SANDBOX_DIR, 'templates');

export function getFullPath(relativePath: string): string {
  if (relativePath.startsWith(SANDBOX_DIR.uri)) {
    return relativePath;
  }
  const cleaned = relativePath.replace(/^\//, '');
  return `${SANDBOX_DIR.uri}${cleaned}`;
}

export function getRelativePath(fullPath: string): string {
  if (fullPath.startsWith(SANDBOX_DIR.uri)) {
    return fullPath.substring(SANDBOX_DIR.uri.length);
  }
  return fullPath;
}

export async function ensureSandboxExists(): Promise<void> {
  // Sync existence checks and synchronous directory creation
  if (!SANDBOX_DIR.exists) {
    SANDBOX_DIR.create({ intermediates: true, idempotent: true });
  }

  if (!SCREENSHOTS_DIR.exists) {
    SCREENSHOTS_DIR.create({ intermediates: true, idempotent: true });
  }

  if (!TEMPLATES_DIR.exists) {
    TEMPLATES_DIR.create({ intermediates: true, idempotent: true });
    await seedTemplates();
  }
}

async function seedTemplates(): Promise<void> {
  try {
    // Write React Cheat Sheet using standard File class
    const reactSheet = new File(TEMPLATES_DIR, 'React_CheatSheet.txt');
    reactSheet.write(`=== REACT & REACT NATIVE DEVELOPER CHEAT SHEET ===

1. Component Lifecycle & Hooks
   - useState: Holds local state.
   - useEffect: Side effects (fetching, subscriptions, intervals).
   - useContext: Subscribes to React context updates.
   - useMemo: Memoizes expensive computations.
   - useCallback: Memoizes function instances to avoid re-renders.
   - useRef: References DOM element or mutable value without re-rendering.

2. Simple React Hook Pattern:
   const [state, setState] = useState(initialValue);

3. Navigation Tips (Expo Router):
   - router.push('/path') - navigate to a screen
   - router.replace('/path') - replace history
   - router.back() - return to previous screen
   - useLocalSearchParams() - get URL parameters

Created dynamically by Dev-Pocket.`);

    // Write SQL Cheat Sheet
    const sqlSheet = new File(TEMPLATES_DIR, 'SQL_CrashCourse.sql');
    sqlSheet.write(`-- SQL QUICK REF GUIDE
-- Core Queries

-- 1. Create a table with key constraints
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL,
  role TEXT DEFAULT 'developer',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 2. Querying with filters
SELECT username, email FROM users
WHERE role = 'admin' AND username LIKE 'admin%'
ORDER BY created_at DESC
LIMIT 10;

-- 3. Group by and Aggregations
SELECT role, COUNT(*) as count, AVG(id) as avg_id
FROM users
GROUP BY role
HAVING count > 1;

-- 4. Clean indexing for performance
CREATE INDEX idx_users_username ON users(username);`);

    // Write TypeScript Utility Types
    const tsSheet = new File(TEMPLATES_DIR, 'TypeScript_Utility_Types.ts');
    tsSheet.write(`// TYPESCRIPT BUILT-IN UTILITIES QUICK-REFERENCE

interface User {
  id: number;
  name: string;
  email: string;
  isAdmin?: boolean;
}

// 1. Partial<T> - Makes all properties optional
type OptionalUser = Partial<User>; // { id?, name?, email?, isAdmin? }

// 2. Required<T> - Makes all properties required
type StrictlyUser = Required<User>; // { id, name, email, isAdmin }

// 3. Readonly<T> - Disallows reassignment of keys
type LockedUser = Readonly<User>;

// 4. Record<K, T> - Map structure helper
type UserDatabase = Record<string, User>; // { [username: string]: User }

// 5. Pick<T, K> - Extracts subset of keys
type UserContactInfo = Pick<User, 'name' | 'email'>; // { name, email }

// 6. Omit<T, K> - Excludes keys
type NonAdminUserInfo = Omit<User, 'isAdmin'>; // { id, name, email }`);

  } catch (e) {
    console.error('Failed to seed templates', e);
  }
}

export async function listDirectory(relativePath: string = ''): Promise<FileItem[]> {
  await ensureSandboxExists();
  
  const targetDir = relativePath === '' 
    ? SANDBOX_DIR 
    : new Directory(SANDBOX_DIR.uri, relativePath);
  
  try {
    if (!targetDir.exists) {
      return [];
    }

    // Call class-based list method
    const children = targetDir.list();
    const items: FileItem[] = [];

    for (const child of children) {
      const isDirectory = child instanceof Directory;
      items.push({
        name: child.name,
        path: child.uri,
        isDirectory,
        size: isDirectory ? undefined : (child as File).size,
      });
    }

    // Sort: folders first, then files alphabetically
    return items.sort((a, b) => {
      if (a.isDirectory && !b.isDirectory) return -1;
      if (!a.isDirectory && b.isDirectory) return 1;
      return a.name.localeCompare(b.name);
    });
  } catch (e) {
    console.error(`Failed to read directory at relative path "${relativePath}"`, e);
    return [];
  }
}

export async function createDirectory(dirName: string, relativeParentPath: string = ''): Promise<string> {
  await ensureSandboxExists();
  const cleanName = dirName.replace(/[^a-zA-Z0-9_\-]/g, '_');
  const parentDir = relativeParentPath === '' 
    ? SANDBOX_DIR 
    : new Directory(SANDBOX_DIR.uri, relativeParentPath);
  
  const dirPath = new Directory(parentDir.uri, cleanName);
  dirPath.create({ intermediates: true, idempotent: true });
  return dirPath.uri;
}

export async function deleteItem(fullPath: string): Promise<void> {
  // Guard core directories
  if (
    fullPath === SANDBOX_DIR.uri || 
    fullPath === SCREENSHOTS_DIR.uri || 
    fullPath === TEMPLATES_DIR.uri
  ) {
    throw new Error('Cannot delete core app directories');
  }

  const fileRef = new File(fullPath);
  if (fileRef.exists) {
    fileRef.delete();
    return;
  }

  const dirRef = new Directory(fullPath);
  if (dirRef.exists) {
    dirRef.delete();
    return;
  }
}

export async function copyItem(fromFullPath: string, toFullPath: string): Promise<void> {
  const fromFile = new File(fromFullPath);
  const toFile = new File(toFullPath);
  if (fromFile.exists) {
    await fromFile.copy(toFile);
    return;
  }

  const fromDir = new Directory(fromFullPath);
  const toDir = new Directory(toFullPath);
  if (fromDir.exists) {
    await fromDir.copy(toDir);
    return;
  }
}

export async function moveItem(fromFullPath: string, toFullPath: string): Promise<void> {
  const fromFile = new File(fromFullPath);
  const toFile = new File(toFullPath);
  if (fromFile.exists) {
    await fromFile.move(toFile);
    return;
  }

  const fromDir = new Directory(fromFullPath);
  const toDir = new Directory(toFullPath);
  if (fromDir.exists) {
    await fromDir.move(toDir);
    return;
  }
}

export async function saveFileLocally(
  fileName: string,
  content: string,
  relativeParentPath: string = ''
): Promise<string> {
  await ensureSandboxExists();
  const parentDir = relativeParentPath === '' 
    ? SANDBOX_DIR 
    : new Directory(SANDBOX_DIR.uri, relativeParentPath);
  
  const targetFile = new File(parentDir.uri, fileName);
  targetFile.write(content);
  return targetFile.uri;
}

export async function readFileContent(fullPath: string): Promise<string> {
  const targetFile = new File(fullPath);
  if (!targetFile.exists) {
    throw new Error('File does not exist');
  }
  return await targetFile.text();
}

/**
 * Moves an attached image into the screenshots folder securely using class methods
 */
export async function saveScreenshot(tempUri: string): Promise<string> {
  await ensureSandboxExists();
  const timestamp = Date.now();
  const fileName = `screenshot_${timestamp}.jpg`;
  
  const tempFile = new File(tempUri);
  const destFile = new File(SCREENSHOTS_DIR.uri, fileName);

  await tempFile.copy(destFile);
  return destFile.uri;
}
