import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import { useAppTheme } from '../../context/ThemeContext';
import { spacing, fontSizes, shadows } from '../../constants/theme';
import { CodeViewer } from '../../components/CodeViewer';
import { readFileContent } from '../../services/filesystem';
import { Ionicons } from '@expo/vector-icons';

export default function FileViewerScreen() {
  const { filePath } = useLocalSearchParams();
  const { colors, isDark } = useAppTheme();

  const [isLoading, setIsLoading] = useState(true);
  const [fileContent, setFileContent] = useState<string | null>(null);
  const [isImage, setIsImage] = useState(false);
  const [fileName, setFileName] = useState('');
  const [fileLang, setFileLang] = useState('text');

  useEffect(() => {
    if (filePath) {
      loadFile();
    }
  }, [filePath]);

  const loadFile = async () => {
    const fullPath = String(filePath);
    // Extract filename
    const name = fullPath.substring(fullPath.lastIndexOf('/') + 1);
    setFileName(name);

    // Detect image vs text
    const ext = name.substring(name.lastIndexOf('.')).toLowerCase();
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];

    if (imageExtensions.includes(ext)) {
      setIsImage(true);
      setIsLoading(false);
    } else {
      setIsImage(false);
      
      // Map extension to language key in SUPPORTED_LANGUAGES
      let lang = 'text';
      if (ext === '.js') lang = 'javascript';
      else if (ext === '.ts') lang = 'typescript';
      else if (ext === '.py') lang = 'python';
      else if (ext === '.sql') lang = 'sql';
      else if (ext === '.go') lang = 'go';
      else if (ext === '.rs') lang = 'rust';
      else if (ext === '.html') lang = 'html';
      else if (ext === '.css') lang = 'css';
      else if (ext === '.json') lang = 'json';
      else if (ext === '.sh') lang = 'shell';

      setFileLang(lang);

      try {
        const content = await readFileContent(fullPath);
        setFileContent(content);
      } catch (e) {
        setFileContent(`[Error reading file contents]\n\nFile: ${name}\nPath: ${fullPath}`);
      } finally {
        setIsLoading(false);
      }
    }
  };

  if (isLoading) {
    return (
      <View style={[styles.container, styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={true}>
        
        {/* File Name Header */}
        <View style={[styles.headerCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Ionicons 
            name={isImage ? "image-outline" : "document-text-outline"} 
            size={22} 
            color={colors.primary} 
            style={{ marginRight: 10 }}
          />
          <Text numberOfLines={1} style={[styles.headerText, { color: colors.text }]}>
            {fileName}
          </Text>
        </View>

        {/* Content Area */}
        {isImage ? (
          <View style={[styles.imageWrapper, { borderColor: colors.border, backgroundColor: colors.card }]}>
            <Image source={{ uri: String(filePath) }} style={styles.viewerImage} />
          </View>
        ) : (
          <View style={styles.codeWrapper}>
            <CodeViewer code={fileContent || ''} language={fileLang} />
          </View>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContainer: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
  },
  headerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  headerText: {
    fontSize: fontSizes.md,
    fontWeight: '700',
    fontFamily: 'monospace',
    flex: 1,
  },
  imageWrapper: {
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
    height: 480,
    width: '100%',
    ...shadows.md,
  },
  viewerImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  },
  codeWrapper: {
    ...shadows.md,
  },
});
