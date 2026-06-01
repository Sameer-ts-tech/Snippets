import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Modal, Image, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useDB, Snippet } from '../../context/DBContext';
import { useAppTheme } from '../../context/ThemeContext';
import { useApiKey } from '../../context/ApiKeyContext';
import { SUPPORTED_LANGUAGES } from '../../constants/languages';
import { spacing, fontSizes, shadows } from '../../constants/theme';
import { CodeViewer } from '../../components/CodeViewer';
import { GlassCard } from '../../components/GlassCard';
import { Button } from '../../components/Button';
import { Ionicons } from '@expo/vector-icons';
import { explainSnippet, AIExplanationResult } from '../../services/ai';
import { exportSnippetToFile, shareSnippet, ExportFormat } from '../../services/export';

// A simple custom markdown renderer that processes standard explanation patterns elegantly
function MarkdownRenderer({ text }: { text: string }) {
  const { colors } = useAppTheme();
  
  if (!text) return null;

  const lines = text.split('\n');

  return (
    <View style={styles.markdownContainer}>
      {lines.map((line, i) => {
        // Headers
        if (line.startsWith('### ')) {
          return (
            <Text key={`md-${i}`} style={[styles.mdH3, { color: colors.primary }]}>
              {line.substring(4)}
            </Text>
          );
        }
        if (line.startsWith('#### ')) {
          return (
            <Text key={`md-${i}`} style={[styles.mdH4, { color: colors.text }]}>
              {line.substring(5)}
            </Text>
          );
        }
        // Bullets
        if (line.startsWith('- ') || line.startsWith('* ')) {
          return (
            <View key={`md-${i}`} style={styles.mdBulletRow}>
              <Text style={[styles.mdBulletDot, { color: colors.primary }]}>•</Text>
              <Text style={[styles.mdBulletText, { color: colors.text }]}>
                {line.substring(2)}
              </Text>
            </View>
          );
        }
        // Numbered list
        const numMatch = line.match(/^(\d+)\.\s(.*)/);
        if (numMatch) {
          return (
            <View key={`md-${i}`} style={styles.mdBulletRow}>
              <Text style={[styles.mdBulletNumber, { color: colors.secondary }]}>
                {numMatch[1]}.
              </Text>
              <Text style={[styles.mdBulletText, { color: colors.text }]}>
                {numMatch[2]}
              </Text>
            </View>
          );
        }
        // Empty lines
        if (line.trim() === '') {
          return <View key={`md-${i}`} style={{ height: 6 }} />;
        }
        
        // General text (supports inline bold code like `text` or **text**)
        // For simplicity and high visual quality, we clean bold wrappers
        const cleanedLine = line.replace(/\*\*|`/g, '');
        return (
          <Text key={`md-${i}`} style={[styles.mdParagraph, { color: colors.text }]}>
            {cleanedLine}
          </Text>
        );
      })}
    </View>
  );
}

export default function SnippetDetailsScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { colors, isDark } = useAppTheme();
  const { geminiKey, selectedModel } = useApiKey();
  const { getSnippetById, toggleFavorite, deleteSnippet, updateSnippet } = useDB();

  const [snippet, setSnippet] = useState<Snippet | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiResult, setAiResult] = useState<AIExplanationResult | null>(null);
  const [isExportModalVisible, setIsExportModalVisible] = useState(false);

  // Load snippet details
  useEffect(() => {
    loadSnippetDetails();
  }, [id]);

  const loadSnippetDetails = () => {
    if (!id) return;
    const item = getSnippetById(Number(id));
    if (item) {
      setSnippet(item);
      
      // If explanation is cached in SQLite, parse and load it
      if (item.explanation) {
        try {
          const parsed: AIExplanationResult = JSON.parse(item.explanation);
          setAiResult(parsed);
        } catch (e) {
          // If cached as plain text
          setAiResult({
            summary: 'Snippet Explanation',
            explanation: item.explanation,
            suggestions: [],
            isMock: true,
          });
        }
      } else {
        setAiResult(null);
      }
    }
  };

  if (!snippet) {
    return (
      <View style={[styles.container, styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const handleFavoriteToggle = () => {
    toggleFavorite(snippet.id);
    // Reload state
    setTimeout(loadSnippetDetails, 50);
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Snippet',
      'Are you sure you want to permanently delete this snippet from your local pocket?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: () => {
            deleteSnippet(snippet.id);
            Alert.alert('Deleted', 'Snippet removed successfully.', [
              { text: 'OK', onPress: () => router.back() }
            ]);
          }
        }
      ]
    );
  };

  const handleGenerateExplanation = async () => {
    setIsGenerating(true);
    try {
      const result = await explainSnippet(
        snippet.title,
        snippet.code,
        snippet.language,
        geminiKey,
        selectedModel
      );

      // Save explanation inside local SQLite DB row for offline persistent reading
      updateSnippet(snippet.id, {
        explanation: JSON.stringify(result)
      });

      setAiResult(result);
    } catch (e) {
      Alert.alert('Error', 'Failed to generate explanation.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleExport = async (format: ExportFormat) => {
    setIsExportModalVisible(false);
    const res = await exportSnippetToFile(snippet, format);
    if (res.success) {
      Alert.alert(
        'Export Successful',
        `Saved locally to sandbox directory:\n\n${res.fileName}\n\nYou can access it under the 'Files' tab.`,
        [
          { text: 'View Files', onPress: () => router.navigate('/(tabs)/files') },
          { text: 'Dismiss', style: 'cancel' }
        ]
      );
    } else {
      Alert.alert('Export Failed', res.error || 'Failed to write file.');
    }
  };

  const handleShare = async (format: ExportFormat) => {
    setIsExportModalVisible(false);
    const success = await shareSnippet(snippet, format);
    if (!success) {
      Alert.alert('Sharing Failed', 'Could not open OS sharing sheet.');
    }
  };

  const langInfo = SUPPORTED_LANGUAGES[snippet.language.toLowerCase()] || SUPPORTED_LANGUAGES.text;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        
        {/* Top Header Card */}
        <View style={styles.headerRow}>
          <View style={styles.headerInfo}>
            <View style={[styles.langBadge, { backgroundColor: colors.primaryLight }]}>
              <Text style={[styles.langBadgeText, { color: colors.primary }]}>
                {langInfo.name}
              </Text>
            </View>
            <Text style={[styles.titleText, { color: colors.text }]}>{snippet.title}</Text>
          </View>
          
          <TouchableOpacity onPress={handleFavoriteToggle} style={styles.favoriteBtn}>
            <Ionicons
              name={snippet.is_favorite === 1 ? 'star' : 'star-outline'}
              size={26}
              color={snippet.is_favorite === 1 ? colors.accent : colors.textMuted}
            />
          </TouchableOpacity>
        </View>

        {/* Tags */}
        {snippet.tags.length > 0 && (
          <View style={styles.tagsContainer}>
            {snippet.tags.map((tag, i) => (
              <View key={`tag-${i}`} style={[styles.tagBadge, { backgroundColor: isDark ? '#1E293B' : '#E2E8F0' }]}>
                <Text style={[styles.tagText, { color: colors.textMuted }]}>
                  #{tag}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Code Block */}
        <View style={styles.codeContainer}>
          <CodeViewer code={snippet.code} language={snippet.language} />
        </View>

        {/* Attachments Section */}
        {snippet.screenshot_uri && (
          <View style={styles.screenshotSection}>
            <Text style={[styles.sectionHeading, { color: colors.text }]}>Screenshot Attachment</Text>
            <TouchableOpacity 
              activeOpacity={0.9}
              onPress={() => router.push({
                pathname: '/files/viewer',
                params: { filePath: snippet.screenshot_uri }
              })}
              style={[styles.screenshotCard, { borderColor: colors.border }]}
            >
              <Image source={{ uri: snippet.screenshot_uri }} style={styles.screenshotImage} />
              <View style={[styles.screenshotOverlay, { backgroundColor: 'rgba(0,0,0,0.45)' }]}>
                <Ionicons name="expand-outline" size={24} color="#FFFFFF" />
                <Text style={styles.screenshotOverlayText}>Tap to enlarge</Text>
              </View>
            </TouchableOpacity>
          </View>
        )}

        {/* AI Explainer Area */}
        <View style={styles.explainerSection}>
          <Text style={[styles.sectionHeading, { color: colors.text }]}>AI Developer Briefing</Text>
          
          {isGenerating ? (
            <GlassCard style={styles.loadingCard}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={[styles.loadingText, { color: colors.text }]}>
                {geminiKey ? 'Consulting Gemini Cloud...' : 'Parsing code syntax trees...'}
              </Text>
              <Text style={[styles.loadingSub, { color: colors.textMuted }]}>
                Analyzing token flow, variables, and logic.
              </Text>
            </GlassCard>
          ) : aiResult ? (
            <GlassCard style={styles.aiCard}>
              {/* AI Badge */}
              <View style={styles.aiHeader}>
                <View style={styles.aiBadge}>
                  <Ionicons name="hardware-chip-outline" size={14} color="#FFFFFF" />
                  <Text style={styles.aiBadgeText}>
                    {aiResult.isMock ? 'OFFLINE STATIC AI' : `${selectedModel.toUpperCase()} LIVE`}
                  </Text>
                </View>
                {aiResult.isMock && !geminiKey && (
                  <Text style={[styles.mockAlertText, { color: colors.primary }]}>
                    Mock mode
                  </Text>
                )}
              </View>

              {/* Summary */}
              <Text style={[styles.aiSummary, { color: colors.text }]}>
                {aiResult.summary}
              </Text>

              <View style={[styles.aiDivider, { backgroundColor: colors.border }]} />

              {/* Deep Explanation */}
              <MarkdownRenderer text={aiResult.explanation} />

              {/* Suggestions */}
              {aiResult.suggestions.length > 0 && (
                <View style={{ marginTop: spacing.md }}>
                  <Text style={[styles.suggestionsHeading, { color: colors.primary }]}>
                    ⚡ Recommended Improvements
                  </Text>
                  {aiResult.suggestions.map((sug, i) => (
                    <View key={`sug-${i}`} style={styles.suggestionRow}>
                      <Ionicons name="flash" size={14} color={colors.accent} style={{ marginTop: 2, marginRight: 8 }} />
                      <Text style={[styles.suggestionText, { color: colors.text }]}>{sug}</Text>
                    </View>
                  ))}
                </View>
              )}

              {/* Regerate Button */}
              <TouchableOpacity 
                activeOpacity={0.7}
                onPress={handleGenerateExplanation}
                style={[styles.reexplainBtn, { borderColor: colors.border }]}
              >
                <Ionicons name="refresh" size={14} color={colors.textMuted} />
                <Text style={[styles.reexplainText, { color: colors.textMuted }]}>
                  Re-analyze Snippet
                </Text>
              </TouchableOpacity>

            </GlassCard>
          ) : (
            <GlassCard style={styles.emptyAiCard}>
              <Ionicons name="sparkles" size={32} color={colors.primary} />
              <Text style={[styles.emptyAiText, { color: colors.text }]}>
                No Explanation Cached
              </Text>
              <Text style={[styles.emptyAiSubText, { color: colors.textMuted }]}>
                Generate a structured code analysis, logic breakdown, and developer tips.
              </Text>
              <Button 
                title="Generate AI Explanation" 
                icon="sparkles-outline"
                onPress={handleGenerateExplanation}
                style={styles.generateBtn}
              />
            </GlassCard>
          )}
        </View>

        {/* Utility Actions Bar */}
        <View style={styles.utilitiesSection}>
          <Text style={[styles.sectionHeading, { color: colors.text }]}>Management Toolbar</Text>
          <View style={styles.utilityButtonsGrid}>
            <TouchableOpacity 
              onPress={() => setIsExportModalVisible(true)}
              style={[styles.utilityBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
            >
              <Ionicons name="cloud-download-outline" size={20} color={colors.primary} />
              <Text style={[styles.utilityBtnText, { color: colors.text }]}>Export / Share</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              onPress={() => router.push({
                pathname: '/snippet/edit',
                params: { id: snippet.id }
              })}
              style={[styles.utilityBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
            >
              <Ionicons name="create-outline" size={20} color={colors.secondary} />
              <Text style={[styles.utilityBtnText, { color: colors.text }]}>Edit Snippet</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              onPress={handleDelete}
              style={[styles.utilityBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
            >
              <Ionicons name="trash-outline" size={20} color={colors.danger} />
              <Text style={[styles.utilityBtnText, { color: colors.text }]}>Delete Code</Text>
            </TouchableOpacity>
          </View>
        </View>

      </ScrollView>

      {/* Export / Share Modal Options Sheet */}
      <Modal visible={isExportModalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card, borderColor: colors.border }]}>
            
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Export Code Options</Text>
              <TouchableOpacity onPress={() => setIsExportModalVisible(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <Text style={[styles.modalSub, { color: colors.textMuted }]}>
                Select the format below to save into the Local Sandbox directory, or share with external messaging programs:
              </Text>

              {/* Formats row */}
              <View style={styles.formatsRow}>
                {(['txt', 'js', 'json'] as const).map(format => (
                  <View key={format} style={styles.formatActionCol}>
                    <Text style={[styles.formatLabel, { color: colors.text }]}>.{format.toUpperCase()}</Text>
                    
                    <TouchableOpacity
                      onPress={() => handleExport(format)}
                      style={[styles.formatBtn, { backgroundColor: colors.primary }]}
                    >
                      <Ionicons name="folder-outline" size={16} color="#FFFFFF" />
                      <Text style={styles.formatBtnText}>Save</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => handleShare(format)}
                      style={[styles.formatBtn, { backgroundColor: colors.secondary, marginTop: 8 }]}
                    >
                      <Ionicons name="share-social-outline" size={16} color="#FFFFFF" />
                      <Text style={styles.formatBtnText}>Share</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            </View>

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
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContainer: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  headerInfo: {
    flex: 1,
    marginRight: spacing.md,
  },
  langBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: 6,
    marginBottom: spacing.xs,
  },
  langBadgeText: {
    fontSize: fontSizes.xs,
    fontWeight: '700',
    fontFamily: 'monospace',
  },
  titleText: {
    fontSize: fontSizes.xl + 2,
    fontWeight: '800',
    lineHeight: 28,
  },
  favoriteBtn: {
    padding: spacing.xs,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: spacing.sm,
    marginBottom: spacing.md,
  },
  tagBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: 6,
    marginRight: spacing.xs,
    marginBottom: spacing.xs,
  },
  tagText: {
    fontSize: fontSizes.xs,
    fontWeight: '600',
  },
  codeContainer: {
    marginBottom: spacing.lg,
  },
  sectionHeading: {
    fontSize: fontSizes.sm,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.sm,
    marginLeft: 2,
  },
  screenshotSection: {
    marginBottom: spacing.lg,
  },
  screenshotCard: {
    position: 'relative',
    height: 220,
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
    ...shadows.sm,
  },
  screenshotImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  screenshotOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  screenshotOverlayText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: fontSizes.xs + 1,
    marginLeft: 6,
  },
  explainerSection: {
    marginBottom: spacing.lg,
  },
  loadingCard: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxl,
    borderWidth: 1,
  },
  loadingText: {
    fontSize: fontSizes.md,
    fontWeight: '700',
    marginTop: spacing.md,
  },
  loadingSub: {
    fontSize: fontSizes.xs,
    marginTop: 4,
  },
  aiCard: {
    borderWidth: 1,
  },
  aiHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  aiBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#8B5CF6', // Purple Glow
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 6,
  },
  aiBadgeText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 9,
    letterSpacing: 0.5,
    marginLeft: 4,
  },
  mockAlertText: {
    fontSize: fontSizes.xs - 1,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  aiSummary: {
    fontSize: fontSizes.md,
    fontWeight: '700',
    lineHeight: 22,
    marginBottom: spacing.md,
  },
  aiDivider: {
    height: 1,
    marginBottom: spacing.sm,
  },
  markdownContainer: {
    marginBottom: spacing.sm,
  },
  mdH3: {
    fontSize: fontSizes.md,
    fontWeight: '800',
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  mdH4: {
    fontSize: fontSizes.sm + 1,
    fontWeight: '700',
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
  },
  mdParagraph: {
    fontSize: fontSizes.sm + 1,
    lineHeight: 20,
    marginBottom: spacing.sm,
  },
  mdBulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.xs,
    paddingRight: spacing.md,
  },
  mdBulletDot: {
    fontSize: 16,
    width: 14,
    textAlign: 'center',
  },
  mdBulletNumber: {
    fontSize: fontSizes.sm,
    fontWeight: '700',
    width: 18,
    textAlign: 'left',
  },
  mdBulletText: {
    fontSize: fontSizes.sm + 1,
    lineHeight: 20,
    flex: 1,
  },
  suggestionsHeading: {
    fontSize: fontSizes.sm,
    fontWeight: '700',
    marginBottom: spacing.sm,
  },
  suggestionRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
    paddingLeft: 4,
  },
  suggestionText: {
    fontSize: fontSizes.sm + 1,
    lineHeight: 18,
    flex: 1,
  },
  reexplainBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginTop: spacing.lg,
  },
  reexplainText: {
    fontSize: fontSizes.xs,
    fontWeight: '600',
    marginLeft: 6,
  },
  emptyAiCard: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xl,
    borderWidth: 1,
  },
  emptyAiText: {
    fontSize: fontSizes.md,
    fontWeight: '700',
    marginTop: spacing.sm,
  },
  emptyAiSubText: {
    fontSize: fontSizes.xs + 1,
    textAlign: 'center',
    paddingHorizontal: spacing.md,
    marginTop: 4,
    marginBottom: spacing.md,
  },
  generateBtn: {
    width: '100%',
  },
  utilitiesSection: {
    marginBottom: spacing.xxl,
  },
  utilityButtonsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  utilityBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: spacing.md,
    marginHorizontal: 3,
    ...shadows.sm,
  },
  utilityBtnText: {
    fontSize: fontSizes.xs - 1,
    fontWeight: '700',
    marginTop: spacing.sm - 2,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
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
  modalBody: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
  },
  modalSub: {
    fontSize: fontSizes.xs + 1,
    lineHeight: 18,
    marginBottom: spacing.md,
  },
  formatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  formatActionCol: {
    flex: 1,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
    backgroundColor: 'rgba(148, 163, 184, 0.05)',
    borderRadius: 12,
    padding: spacing.sm,
    marginHorizontal: 4,
  },
  formatLabel: {
    fontSize: fontSizes.md,
    fontWeight: '800',
    marginBottom: spacing.sm,
  },
  formatBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    paddingVertical: 8,
    borderRadius: 8,
    ...shadows.sm,
  },
  formatBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: fontSizes.xs,
    marginLeft: 4,
  },
});
