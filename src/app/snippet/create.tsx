import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, ScrollView, TouchableOpacity, Alert, Modal, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDB } from '../../context/DBContext';
import { useAppTheme } from '../../context/ThemeContext';
import { SUPPORTED_LANGUAGES } from '../../constants/languages';
import { spacing, fontSizes, shadows } from '../../constants/theme';
import { Button } from '../../components/Button';
import { GlassCard } from '../../components/GlassCard';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { saveScreenshot } from '../../services/filesystem';

export default function CreateSnippetScreen() {
  const { colors, isDark } = useAppTheme();
  const { createSnippet } = useDB();
  const router = useRouter();

  const [title, setTitle] = useState('');
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState('javascript');
  const [tagsInput, setTagsInput] = useState('');
  const [screenshotUri, setScreenshotUri] = useState<string | null>(null);
  
  const [isLangModalVisible, setIsLangModalVisible] = useState(false);

  const handleAttachScreenshot = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Please grant library permissions to attach screenshots.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const tempUri = result.assets[0].uri;
        // Copy to sandbox screenshots folder immediately
        const persistentUri = await saveScreenshot(tempUri);
        setScreenshotUri(persistentUri);
      }
    } catch (e) {
      console.error('Image picking failed', e);
      Alert.alert('Error', 'Failed to select image.');
    }
  };

  const handleSave = () => {
    if (!title.trim()) {
      Alert.alert('Validation Error', 'Please enter a snippet title.');
      return;
    }
    if (!code.trim()) {
      Alert.alert('Validation Error', 'Please enter some code content.');
      return;
    }

    // Parse tags (comma separated)
    const tags = tagsInput
      .split(',')
      .map(tag => tag.trim().toLowerCase())
      .filter(tag => tag !== '');

    try {
      createSnippet(title.trim(), code, language, tags, screenshotUri);
      Alert.alert('Success', 'Snippet saved offline!', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (e) {
      Alert.alert('Error', 'Failed to save snippet locally.');
    }
  };

  const currentLangInfo = SUPPORTED_LANGUAGES[language] || SUPPORTED_LANGUAGES.text;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        
        {/* Title Input */}
        <Text style={[styles.inputLabel, { color: colors.text }]}>Snippet Title</Text>
        <TextInput
          placeholder="e.g. Fetch API Async Helper"
          placeholderTextColor={colors.textMuted}
          value={title}
          onChangeText={setTitle}
          style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.card }]}
        />

        {/* Language Selector */}
        <Text style={[styles.inputLabel, { color: colors.text }]}>Programming Language</Text>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => setIsLangModalVisible(true)}
          style={[styles.selector, { borderColor: colors.border, backgroundColor: colors.card }]}
        >
          <View style={styles.selectorLeft}>
            <View style={[styles.langColorIndicator, { backgroundColor: currentLangInfo.color }]} />
            <Text style={[styles.selectorText, { color: colors.text }]}>
              {currentLangInfo.name}
            </Text>
          </View>
          <Ionicons name="chevron-down" size={18} color={colors.textMuted} />
        </TouchableOpacity>

        {/* Code Input */}
        <Text style={[styles.inputLabel, { color: colors.text }]}>Code Block</Text>
        <View style={[styles.editorContainer, { borderColor: colors.border, backgroundColor: isDark ? '#080C14' : '#F1F5F9' }]}>
          <TextInput
            placeholder="// Paste or write your reusable code snippet here..."
            placeholderTextColor={colors.textMuted}
            multiline={true}
            value={code}
            onChangeText={setCode}
            autoCapitalize="none"
            autoCorrect={false}
            spellCheck={false}
            style={[styles.codeEditor, { color: colors.text }]}
          />
        </View>

        {/* Tags Input */}
        <Text style={[styles.inputLabel, { color: colors.text }]}>Tags (comma separated)</Text>
        <TextInput
          placeholder="e.g. react, hook, fetch"
          placeholderTextColor={colors.textMuted}
          value={tagsInput}
          onChangeText={setTagsInput}
          autoCapitalize="none"
          autoCorrect={false}
          style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.card }]}
        />

        {/* Screenshots Section */}
        <Text style={[styles.inputLabel, { color: colors.text }]}>Attachment (Optional)</Text>
        <GlassCard style={styles.attachmentCard}>
          {screenshotUri ? (
            <View style={styles.screenshotPreviewContainer}>
              <Image source={{ uri: screenshotUri }} style={styles.screenshotImage} />
              <TouchableOpacity 
                onPress={() => setScreenshotUri(null)}
                style={[styles.removeScreenshotBtn, { backgroundColor: colors.danger }]}
              >
                <Ionicons name="close" size={18} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity 
              activeOpacity={0.7}
              onPress={handleAttachScreenshot}
              style={styles.attachPlaceholder}
            >
              <Ionicons name="camera-outline" size={32} color={colors.primary} />
              <Text style={[styles.attachText, { color: colors.text }]}>
                Attach Screenshot Reference
              </Text>
              <Text style={[styles.attachSubText, { color: colors.textMuted }]}>
                Supports PNG or JPEG images from camera roll
              </Text>
            </TouchableOpacity>
          )}
        </GlassCard>

        {/* Save button */}
        <Button 
          title="Save Snippet to Pocket" 
          onPress={handleSave}
          style={styles.saveBtn}
        />
      </ScrollView>

      {/* Language Selector Modal */}
      <Modal visible={isLangModalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card, borderColor: colors.border }]}>
            
            {/* Modal Header */}
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Select Language</Text>
              <TouchableOpacity onPress={() => setIsLangModalVisible(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            {/* Modal List */}
            <ScrollView style={styles.modalScroll}>
              {Object.keys(SUPPORTED_LANGUAGES).map(langKey => {
                const info = SUPPORTED_LANGUAGES[langKey];
                const isSelected = language === langKey;
                return (
                  <TouchableOpacity
                    key={langKey}
                    onPress={() => {
                      setLanguage(langKey);
                      setIsLangModalVisible(false);
                    }}
                    style={[
                      styles.modalOption, 
                      { 
                        borderBottomColor: colors.border,
                        backgroundColor: isSelected ? colors.primaryLight : 'transparent'
                      }
                    ]}
                  >
                    <View style={styles.optionLeft}>
                      <View style={[styles.langColorIndicator, { backgroundColor: info.color }]} />
                      <Text style={[styles.optionText, { color: colors.text, fontWeight: isSelected ? '700' : '500' }]}>
                        {info.name}
                      </Text>
                    </View>
                    {isSelected && (
                      <Ionicons name="checkmark" size={20} color={colors.primary} />
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
  },
  inputLabel: {
    fontSize: fontSizes.sm,
    fontWeight: '700',
    marginBottom: spacing.xs,
    marginLeft: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    height: 48,
    paddingHorizontal: spacing.md,
    fontSize: fontSizes.md,
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  selector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: 12,
    height: 48,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  selectorLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  langColorIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 10,
  },
  selectorText: {
    fontSize: fontSizes.md,
    fontWeight: '600',
  },
  editorContainer: {
    borderWidth: 1,
    borderRadius: 12,
    height: 220,
    padding: spacing.sm,
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  codeEditor: {
    flex: 1,
    fontFamily: 'monospace',
    fontSize: fontSizes.sm,
    textAlignVertical: 'top', // Crucial for Android multi-line top alignment
  },
  attachmentCard: {
    borderWidth: 1,
    marginBottom: spacing.lg,
  },
  attachPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
  },
  attachText: {
    fontSize: fontSizes.md,
    fontWeight: '700',
    marginTop: spacing.sm,
  },
  attachSubText: {
    fontSize: fontSizes.xs,
    marginTop: 4,
    textAlign: 'center',
  },
  screenshotPreviewContainer: {
    position: 'relative',
    height: 200,
    width: '100%',
    borderRadius: 8,
    overflow: 'hidden',
  },
  screenshotImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  removeScreenshotBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.sm,
  },
  saveBtn: {
    marginTop: spacing.sm,
    marginBottom: spacing.xl,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderBottomWidth: 0,
    maxHeight: '75%',
    paddingBottom: spacing.xl,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: fontSizes.lg,
    fontWeight: '700',
  },
  modalScroll: {
    padding: spacing.sm,
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  optionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  optionText: {
    fontSize: fontSizes.md,
  },
});
