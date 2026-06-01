import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppTheme } from '../../context/ThemeContext';
import { 
  listDirectory, 
  createDirectory, 
  deleteItem, 
  SANDBOX_DIR, 
  getRelativePath, 
  FileItem 
} from '../../services/filesystem';
import { spacing, fontSizes, shadows } from '../../constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export default function FileManagerScreen() {
  const { colors, isDark } = useAppTheme();
  const router = useRouter();

  const [currentRelativePath, setCurrentRelativePath] = useState('');
  const [files, setFiles] = useState<FileItem[]>([]);
  const [newFolderName, setNewFolderName] = useState('');
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);

  // Load files on focus or path change
  useEffect(() => {
    loadFiles();
  }, [currentRelativePath]);

  const loadFiles = async () => {
    const list = await listDirectory(currentRelativePath);
    setFiles(list);
  };

  const handleNavigate = (item: FileItem) => {
    if (item.isDirectory) {
      // Append directory name with slash
      const relativeSubPath = getRelativePath(item.path);
      setCurrentRelativePath(relativeSubPath);
    } else {
      // Open file viewer route
      router.push({
        pathname: '/files/viewer',
        params: { filePath: item.path }
      });
    }
  };

  const handleGoBack = () => {
    if (currentRelativePath === '') return;
    
    // Remove the last folder segment
    const segments = currentRelativePath.replace(/\/$/, '').split('/');
    segments.pop();
    const parentPath = segments.length > 0 ? segments.join('/') + '/' : '';
    setCurrentRelativePath(parentPath);
  };

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) {
      setIsCreatingFolder(false);
      return;
    }
    
    try {
      await createDirectory(newFolderName.trim(), currentRelativePath);
      setNewFolderName('');
      setIsCreatingFolder(false);
      loadFiles();
    } catch (e: any) {
      Alert.alert('Folder Creation Failed', e.message || 'Unknown error occurred.');
    }
  };

  const handleDeleteItem = (item: FileItem) => {
    Alert.alert(
      'Confirm Deletion',
      `Are you sure you want to permanently delete "${item.name}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteItem(item.path);
              loadFiles();
            } catch (e: any) {
              Alert.alert('Deletion Blocked', e.message || 'Cannot delete item.');
            }
          }
        }
      ]
    );
  };

  const renderFileRow = ({ item }: { item: FileItem }) => {
    // Check file type
    const isImage = item.name.toLowerCase().match(/\.(jpg|jpeg|png|gif|webp)$/);
    const iconName = item.isDirectory 
      ? 'folder' 
      : isImage 
        ? 'image' 
        : 'document-text';
    const iconColor = item.isDirectory 
      ? colors.primary 
      : isImage 
        ? colors.secondary 
        : colors.textMuted;

    return (
      <View style={[styles.fileRow, { borderBottomColor: colors.border }]}>
        <TouchableOpacity
          style={styles.fileRowPressable}
          activeOpacity={0.7}
          onPress={() => handleNavigate(item)}
        >
          <Ionicons name={iconName} size={24} color={iconColor} style={styles.fileIcon} />
          <View style={styles.fileDetails}>
            <Text numberOfLines={1} style={[styles.fileName, { color: colors.text }]}>
              {item.name}
            </Text>
            {!item.isDirectory && item.size !== undefined && (
              <Text style={[styles.fileSize, { color: colors.textMuted }]}>
                {(item.size / 1024).toFixed(1)} KB
              </Text>
            )}
          </View>
        </TouchableOpacity>

        {/* Delete Trigger */}
        <TouchableOpacity
          onPress={() => handleDeleteItem(item)}
          style={styles.deleteButton}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="trash-outline" size={18} color={colors.danger} />
        </TouchableOpacity>
      </View>
    );
  };

  const breadcrumbs = `dev_pocket/${currentRelativePath}`;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Directory Breadcrumb Navigation */}
      <View style={[styles.breadcrumbHeader, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <View style={styles.breadcrumbContent}>
          <Ionicons name="terminal" size={16} color={colors.secondary} style={{ marginRight: 6 }} />
          <Text numberOfLines={1} style={[styles.breadcrumbText, { color: colors.text }]}>
            {breadcrumbs}
          </Text>
        </View>
        
        {currentRelativePath !== '' && (
          <TouchableOpacity onPress={handleGoBack} style={[styles.backButton, { borderColor: colors.border }]}>
            <Ionicons name="arrow-back-outline" size={14} color={colors.text} />
            <Text style={[styles.backText, { color: colors.text }]}>Up</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Directory Creation Dialog */}
      {isCreatingFolder ? (
        <View style={[styles.folderInputCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <TextInput
            placeholder="Folder name..."
            placeholderTextColor={colors.textMuted}
            value={newFolderName}
            onChangeText={setNewFolderName}
            autoFocus={true}
            maxLength={30}
            style={[styles.folderInput, { color: colors.text, borderColor: colors.border }]}
          />
          <View style={styles.folderInputActions}>
            <TouchableOpacity 
              onPress={() => setIsCreatingFolder(false)}
              style={[styles.folderInputBtn, { backgroundColor: isDark ? '#1E293B' : '#E2E8F0' }]}
            >
              <Text style={{ color: colors.text, fontWeight: '600' }}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              onPress={handleCreateFolder}
              style={[styles.folderInputBtn, { backgroundColor: colors.primary }]}
            >
              <Text style={{ color: '#FFFFFF', fontWeight: '700' }}>Create</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <View style={styles.actionsBar}>
          <TouchableOpacity
            onPress={() => setIsCreatingFolder(true)}
            style={[styles.createFolderBtn, { borderColor: colors.border }]}
          >
            <Ionicons name="folder-outline" size={16} color={colors.primary} />
            <Text style={[styles.createFolderText, { color: colors.primary }]}>
              New Folder
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* File List */}
      <FlatList
        data={files}
        keyExtractor={item => item.path}
        renderItem={renderFileRow}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="folder-open-outline" size={48} color={colors.textMuted} />
            <Text style={[styles.emptyText, { color: colors.text }]}>Directory Empty</Text>
            <Text style={[styles.emptySubText, { color: colors.textMuted }]}>
              Create a subfolder or export code snippets to fill this directory.
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  breadcrumbHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 4,
    borderBottomWidth: 1,
  },
  breadcrumbContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: spacing.md,
  },
  breadcrumbText: {
    fontFamily: 'monospace',
    fontSize: fontSizes.xs + 1,
    fontWeight: '700',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 6,
    paddingVertical: 3,
    paddingHorizontal: 8,
  },
  backText: {
    fontSize: fontSizes.xs,
    marginLeft: 3,
    fontWeight: '700',
  },
  actionsBar: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  createFolderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm + 4,
  },
  createFolderText: {
    fontSize: fontSizes.sm,
    fontWeight: '600',
    marginLeft: 6,
  },
  folderInputCard: {
    margin: spacing.md,
    padding: spacing.md,
    borderRadius: 12,
    borderWidth: 1,
    ...shadows.sm,
  },
  folderInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: spacing.sm,
    height: 40,
    fontSize: fontSizes.md,
    marginBottom: spacing.sm,
  },
  folderInputActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  folderInputBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginLeft: spacing.sm,
  },
  listContainer: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.lg,
  },
  fileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  fileRowPressable: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: spacing.md,
  },
  fileIcon: {
    marginRight: spacing.md,
  },
  fileDetails: {
    flex: 1,
  },
  fileName: {
    fontSize: fontSizes.md,
    fontWeight: '600',
  },
  fileSize: {
    fontSize: fontSizes.xs,
    marginTop: 2,
  },
  deleteButton: {
    padding: spacing.xs,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxl * 2,
  },
  emptyText: {
    fontSize: fontSizes.lg,
    fontWeight: '700',
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  emptySubText: {
    fontSize: fontSizes.sm,
    textAlign: 'center',
    paddingHorizontal: spacing.xl,
  },
});
