import * as Sharing from 'expo-sharing';
import { Paths, File } from 'expo-file-system';
import { saveFileLocally, getRelativePath } from './filesystem';
import { Snippet } from '../context/DBContext';

export type ExportFormat = 'txt' | 'js' | 'json';

export interface ExportResult {
  success: boolean;
  filePath?: string;
  fileName?: string;
  error?: string;
}

/**
 * Formats a snippet's content based on the target export format
 */
export function formatSnippetContent(snippet: Snippet, format: ExportFormat): string {
  switch (format) {
    case 'js':
      return `/**
 * Title: ${snippet.title}
 * Language: ${snippet.language}
 * Tags: ${snippet.tags.join(', ')}
 * Created via Dev-Pocket on ${new Date(snippet.created_at).toLocaleString()}
 */

${snippet.code}
`;
    case 'json':
      return JSON.stringify(
        {
          title: snippet.title,
          language: snippet.language,
          code: snippet.code,
          tags: snippet.tags,
          created_at: snippet.created_at,
          explanation: snippet.explanation || undefined,
        },
        null,
        2
      );
    case 'txt':
    default:
      return `==========================================
TITLE: ${snippet.title}
LANGUAGE: ${snippet.language.toUpperCase()}
TAGS: ${snippet.tags.join(', ')}
CREATED AT: ${new Date(snippet.created_at).toLocaleString()}
==========================================

${snippet.code}

==========================================
Generated with Dev-Pocket offline assistant.
==========================================`;
  }
}

/**
 * Saves a snippet file locally to the sandbox and returns file information
 */
export async function exportSnippetToFile(
  snippet: Snippet,
  format: ExportFormat,
  subFolderRelativePath: string = ''
): Promise<ExportResult> {
  try {
    const formattedName = snippet.title
      .replace(/[^a-zA-Z0-9_\- ]/g, '')
      .replace(/\s+/g, '_');
    const fileName = `${formattedName}_snippet.${format}`;
    const fileContent = formatSnippetContent(snippet, format);

    const fullPath = await saveFileLocally(fileName, fileContent, subFolderRelativePath);

    return {
      success: true,
      filePath: fullPath,
      fileName,
    };
  } catch (e: any) {
    console.error('Failed to export snippet to file', e);
    return {
      success: false,
      error: e.message || 'Unknown error exporting file',
    };
  }
}

/**
 * Shares a snippet directly to another external application using the new File object
 */
export async function shareSnippet(snippet: Snippet, format: ExportFormat): Promise<boolean> {
  try {
    const isAvailable = await Sharing.isAvailableAsync();
    if (!isAvailable) {
      throw new Error('Sharing is not available on this device');
    }

    // 1. Export snippet to a temporary cache file to share
    const formattedName = snippet.title
      .replace(/[^a-zA-Z0-9_\- ]/g, '')
      .replace(/\s+/g, '_');
    
    const tempFileName = `${formattedName}_share.${format}`;
    const tempFile = new File(Paths.cache.uri, tempFileName);
    const content = formatSnippetContent(snippet, format);

    tempFile.write(content);

    // 2. Open native sharing sheet
    await Sharing.shareAsync(tempFile.uri, {
      dialogTitle: `Share Snippet: ${snippet.title}`,
      mimeType: format === 'json' ? 'application/json' : 'text/plain',
    });

    return true;
  } catch (e) {
    console.error('Failed to share snippet', e);
    return false;
  }
}
