import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppTheme } from '../../context/ThemeContext';
import { useApiKey } from '../../context/ApiKeyContext';
import { useDB } from '../../context/DBContext';
import { spacing, fontSizes, shadows } from '../../constants/theme';
import { GlassCard } from '../../components/GlassCard';
import { Button } from '../../components/Button';
import { Ionicons } from '@expo/vector-icons';
import { Paths, File } from 'expo-file-system';
import { SANDBOX_DIR } from '../../services/filesystem';

export default function SettingsScreen() {
  const { colors, themeMode, setThemeMode, isDark } = useAppTheme();
  const { geminiKey, saveGeminiKey, deleteGeminiKey, selectedModel, setSelectedModel } = useApiKey();
  const { snippets } = useDB();

  const [inputKey, setInputKey] = useState('');
  const [isEditingKey, setIsEditingKey] = useState(false);
  const [dbSize, setDbSize] = useState('0 KB');

  // Load database info
  useEffect(() => {
    calculateDbSize();
  }, [snippets]);

  const calculateDbSize = async () => {
    try {
      const dbFile = new File(Paths.document.uri, 'SQLite/devpocket.db');
      if (dbFile.exists) {
        setDbSize(`${(dbFile.size / 1024).toFixed(1)} KB`);
      }
    } catch (e) {
      console.warn('Failed to calculate database size', e);
    }
  };

  const handleSaveKey = async () => {
    if (!inputKey.trim()) {
      Alert.alert('Key Required', 'Please enter a valid Gemini API Key.');
      return;
    }
    
    try {
      await saveGeminiKey(inputKey.trim());
      setInputKey('');
      setIsEditingKey(false);
      Alert.alert('Success', 'Google Gemini API Key securely stored.');
    } catch (e) {
      Alert.alert('Secure Save Error', 'Could not save secure key.');
    }
  };

  const handleDeleteKey = () => {
    Alert.alert(
      'Remove API Key',
      'Are you sure you want to remove your securely stored Gemini API Key? The app will revert back to high-fidelity offline explanations.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Remove', 
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteGeminiKey();
              Alert.alert('Removed', 'API Key deleted.');
            } catch (e) {
              Alert.alert('Error', 'Could not delete key.');
            }
          }
        }
      ]
    );
  };

  const totalFavorites = snippets.filter(s => s.is_favorite === 1).length;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        
        {/* Section 1: Themes preference */}
        <Text style={[styles.sectionTitle, { color: colors.primary }]}>Appearance Theme</Text>
        <GlassCard style={styles.card}>
          <View style={styles.themesRow}>
            {(['light', 'dark', 'system'] as const).map(mode => {
              const isActive = themeMode === mode;
              return (
                <TouchableOpacity
                  key={mode}
                  onPress={() => setThemeMode(mode)}
                  activeOpacity={0.7}
                  style={[
                    styles.themeOption,
                    { 
                      backgroundColor: isActive ? colors.primary : isDark ? '#1E293B' : '#E2E8F0',
                      borderColor: isActive ? colors.primary : colors.border
                    }
                  ]}
                >
                  <Ionicons 
                    name={
                      mode === 'light' 
                        ? 'sunny' 
                        : mode === 'dark' 
                          ? 'moon' 
                          : 'phone-portrait-outline'
                    } 
                    size={16} 
                    color={isActive ? '#FFFFFF' : colors.text} 
                  />
                  <Text 
                    style={[
                      styles.themeText, 
                      { 
                        color: isActive ? '#FFFFFF' : colors.text,
                        textTransform: 'capitalize',
                        fontWeight: isActive ? '700' : '500'
                      }
                    ]}
                  >
                    {mode}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </GlassCard>

        {/* Section 2: AI Settings */}
        <Text style={[styles.sectionTitle, { color: colors.primary }]}>Gemini AI Integration</Text>
        <GlassCard style={styles.card}>
          {geminiKey ? (
            <View>
              <View style={styles.apiKeyConfiguredRow}>
                <Ionicons name="shield-checkmark" size={24} color={colors.secondary} />
                <View style={styles.apiKeyConfiguredDetails}>
                  <Text style={[styles.configTitle, { color: colors.text }]}>
                    API Key Active
                  </Text>
                  <Text style={[styles.configSub, { color: colors.textMuted }]}>
                    Live AI Explanations enabled.
                  </Text>
                </View>
                <TouchableOpacity onPress={handleDeleteKey} style={styles.removeKeyBtn}>
                  <Text style={{ color: colors.danger, fontWeight: '700', fontSize: fontSizes.xs }}>
                    REMOVE
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Model selection */}
              <View style={[styles.modelSelectionRow, { borderTopColor: colors.border }]}>
                <Text style={[styles.modelLabel, { color: colors.text }]}>Selected Model:</Text>
                <View style={styles.modelPills}>
                  {(['gemini-2.5-flash', 'gemini-1.5-flash'] as const).map(model => {
                    const isSelected = selectedModel === model;
                    return (
                      <TouchableOpacity
                        key={model}
                        onPress={() => setSelectedModel(model)}
                        style={[
                          styles.modelPill,
                          {
                            backgroundColor: isSelected ? colors.primaryLight : 'transparent',
                            borderColor: isSelected ? colors.primary : colors.border
                          }
                        ]}
                      >
                        <Text style={[styles.modelPillText, { color: isSelected ? colors.primary : colors.textMuted }]}>
                          {model === 'gemini-2.5-flash' ? '2.5 Flash' : '1.5 Flash'}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            </View>
          ) : isEditingKey ? (
            <View>
              <Text style={[styles.inputLabel, { color: colors.text }]}>
                Enter Gemini API Key
              </Text>
              <TextInput
                placeholder="AIzaSy..."
                placeholderTextColor={colors.textMuted}
                secureTextEntry={true}
                value={inputKey}
                onChangeText={setInputKey}
                style={[styles.keyInput, { color: colors.text, borderColor: colors.border }]}
              />
              <View style={styles.keyActions}>
                <Button 
                  title="Cancel" 
                  variant="outline" 
                  onPress={() => setIsEditingKey(false)} 
                  style={{ flex: 1, marginRight: spacing.sm, minHeight: 40 }}
                />
                <Button 
                  title="Save Key" 
                  onPress={handleSaveKey} 
                  style={{ flex: 1, minHeight: 40 }}
                />
              </View>
            </View>
          ) : (
            <View style={styles.apiKeyEmptyState}>
              <Ionicons name="information-circle-outline" size={36} color={colors.primary} />
              <Text style={[styles.emptyApiText, { color: colors.text }]}>
                Using Local Offline Assistant
              </Text>
              <Text style={[styles.emptyApiSub, { color: colors.textMuted }]}>
                Core explanation features run locally on device. To fetch deep live custom insights from Google servers, paste a Gemini API Key.
              </Text>
              <Button 
                title="Configure Gemini API Key" 
                variant="outline" 
                onPress={() => setIsEditingKey(true)}
                style={styles.configureBtn}
              />
            </View>
          )}
        </GlassCard>

        {/* Section 3: SQLite Metrics */}
        <Text style={[styles.sectionTitle, { color: colors.primary }]}>Local System Analytics</Text>
        <GlassCard style={styles.card}>
          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={[styles.statValue, { color: colors.text }]}>{snippets.length}</Text>
              <Text style={[styles.statLabel, { color: colors.textMuted }]}>Snippets</Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
            <View style={styles.statBox}>
              <Text style={[styles.statValue, { color: colors.text }]}>{totalFavorites}</Text>
              <Text style={[styles.statLabel, { color: colors.textMuted }]}>Favorites</Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
            <View style={styles.statBox}>
              <Text style={[styles.statValue, { color: colors.text }]}>{dbSize}</Text>
              <Text style={[styles.statLabel, { color: colors.textMuted }]}>DB Weight</Text>
            </View>
          </View>
        </GlassCard>

        {/* Section 4: User Manual */}
        <Text style={[styles.sectionTitle, { color: colors.primary }]}>Documentation & Sandbox</Text>
        <GlassCard style={styles.card}>
          <View style={styles.manualEntry}>
            <Ionicons name="book-outline" size={20} color={colors.primary} style={{ marginRight: 10 }} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.manualTitle, { color: colors.text }]}>Offline-First Engine</Text>
              <Text style={[styles.manualText, { color: colors.textMuted }]}>
                Dev-Pocket uses a regex-based classifier to check languages, identify scopes, detect async routines, and recommend code performance improvements without needing an active internet connection.
              </Text>
            </View>
          </View>
          <View style={[styles.manualEntry, { borderTopWidth: 1, borderTopColor: colors.border, marginTop: spacing.sm, paddingTop: spacing.sm }]}>
            <Ionicons name="folder-outline" size={20} color={colors.primary} style={{ marginRight: 10 }} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.manualTitle, { color: colors.text }]}>FileSystem Sandbox</Text>
              <Text style={[styles.manualText, { color: colors.textMuted }]}>
                Exported snippets are written to your app Document Directory. Browse files under the Sandbox tab, create project directories, or copy templates to your device.
              </Text>
            </View>
          </View>
        </GlassCard>

        {/* App Version Info */}
        <Text style={[styles.versionText, { color: colors.textMuted }]}>
          Dev-Pocket Mobile v1.0.0 (Expo SQLite Edition)
        </Text>
      </ScrollView>
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
  sectionTitle: {
    fontSize: fontSizes.sm,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: spacing.md,
    marginBottom: spacing.xs + 2,
    marginLeft: 4,
  },
  card: {
    marginBottom: spacing.md,
    borderWidth: 1,
  },
  themesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  themeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    marginHorizontal: 3,
  },
  themeText: {
    fontSize: fontSizes.xs + 1,
    marginLeft: 6,
  },
  apiKeyEmptyState: {
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  emptyApiText: {
    fontSize: fontSizes.md,
    fontWeight: '700',
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
  },
  emptyApiSub: {
    fontSize: fontSizes.xs + 1,
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: spacing.sm,
    marginBottom: spacing.md,
  },
  configureBtn: {
    width: '100%',
    minHeight: 40,
  },
  apiKeyConfiguredRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.xs,
  },
  apiKeyConfiguredDetails: {
    flex: 1,
    marginLeft: spacing.md,
  },
  configTitle: {
    fontSize: fontSizes.md,
    fontWeight: '700',
  },
  configSub: {
    fontSize: fontSizes.xs,
    marginTop: 2,
  },
  removeKeyBtn: {
    padding: spacing.sm,
  },
  modelSelectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    marginTop: spacing.md,
    paddingTop: spacing.md,
  },
  modelLabel: {
    fontSize: fontSizes.sm,
    fontWeight: '600',
  },
  modelPills: {
    flexDirection: 'row',
  },
  modelPill: {
    borderWidth: 1,
    borderRadius: 16,
    paddingVertical: 4,
    paddingHorizontal: 12,
    marginLeft: spacing.sm,
  },
  modelPillText: {
    fontSize: fontSizes.xs,
    fontWeight: '700',
  },
  inputLabel: {
    fontSize: fontSizes.sm,
    fontWeight: '700',
    marginBottom: spacing.xs,
  },
  keyInput: {
    borderWidth: 1,
    borderRadius: 8,
    height: 44,
    paddingHorizontal: spacing.md,
    fontSize: fontSizes.md,
    marginBottom: spacing.md,
  },
  keyActions: {
    flexDirection: 'row',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  statBox: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: fontSizes.xl,
    fontWeight: '800',
  },
  statLabel: {
    fontSize: fontSizes.xs,
    marginTop: 4,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statDivider: {
    width: 1,
    height: 36,
  },
  manualEntry: {
    flexDirection: 'row',
  },
  manualTitle: {
    fontSize: fontSizes.sm,
    fontWeight: '700',
    marginBottom: 4,
  },
  manualText: {
    fontSize: fontSizes.xs + 1,
    lineHeight: 18,
  },
  versionText: {
    fontSize: fontSizes.xs,
    textAlign: 'center',
    marginTop: spacing.xl,
    fontWeight: '500',
  },
});
