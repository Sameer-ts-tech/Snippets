import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TextInput, ScrollView, FlatList, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDB, Snippet } from '../../context/DBContext';
import { useAppTheme } from '../../context/ThemeContext';
import { SUPPORTED_LANGUAGES } from '../../constants/languages';
import { spacing, fontSizes, shadows } from '../../constants/theme';
import { CodeViewer } from '../../components/CodeViewer';
import { GlassCard } from '../../components/GlassCard';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';

export default function HomeScreen() {
  const { colors, isDark } = useAppTheme();
  const { searchSnippets, toggleFavorite, loadSnippets } = useDB();
  const router = useRouter();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState('all');
  const [filteredSnippets, setFilteredSnippets] = useState<Snippet[]>([]);

  // Refresh snippets whenever the screen is focused
  useFocusEffect(
    useCallback(() => {
      loadSnippets();
      performSearch(searchQuery, selectedLanguage);
    }, [searchQuery, selectedLanguage])
  );

  const performSearch = (query: string, lang: string) => {
    const results = searchSnippets(query, lang, false);
    setFilteredSnippets(results);
  };

  const handleSearchChange = (text: string) => {
    setSearchQuery(text);
    performSearch(text, selectedLanguage);
  };

  const handleLanguageSelect = (lang: string) => {
    setSelectedLanguage(lang);
    performSearch(searchQuery, lang);
  };

  const renderLanguagePill = (key: string, label: string) => {
    const isSelected = selectedLanguage === key;
    const langInfo = SUPPORTED_LANGUAGES[key];
    const pillColor = isSelected 
      ? colors.primary 
      : isDark ? '#1E293B' : '#E2E8F0';

    return (
      <TouchableOpacity
        key={key}
        onPress={() => handleLanguageSelect(key)}
        activeOpacity={0.7}
        style={[
          styles.pill,
          { 
            backgroundColor: pillColor,
            borderColor: isSelected ? colors.primary : colors.border,
          }
        ]}
      >
        {langInfo && langInfo.color && (
          <View 
            style={[
              styles.pillIndicator, 
              { backgroundColor: langInfo.color }
            ]} 
          />
        )}
        <Text 
          style={[
            styles.pillText, 
            { 
              color: isSelected ? '#FFFFFF' : colors.text,
              fontWeight: isSelected ? '700' : '500' 
            }
          ]}
        >
          {label}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderSnippetCard = ({ item }: { item: Snippet }) => {
    const langInfo = SUPPORTED_LANGUAGES[item.language.toLowerCase()] || SUPPORTED_LANGUAGES.text;
    
    return (
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={() => router.push(`/snippet/${item.id}`)}
        style={styles.cardContainer}
      >
        <GlassCard glow={item.is_favorite === 1} style={styles.snippetCard}>
          {/* Header Area */}
          <View style={styles.cardHeader}>
            <View style={styles.cardHeaderLeft}>
              <View style={[styles.langBadge, { backgroundColor: colors.primaryLight }]}>
                <Text style={[styles.langBadgeText, { color: colors.primary }]}>
                  {langInfo.name}
                </Text>
              </View>
              <Text numberOfLines={1} style={[styles.snippetTitle, { color: colors.text }]}>
                {item.title}
              </Text>
            </View>
            
            <TouchableOpacity
              onPress={() => {
                toggleFavorite(item.id);
                // Immediately refresh state
                setTimeout(() => performSearch(searchQuery, selectedLanguage), 50);
              }}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons
                name={item.is_favorite === 1 ? 'star' : 'star-outline'}
                size={22}
                color={item.is_favorite === 1 ? colors.accent : colors.textMuted}
              />
            </TouchableOpacity>
          </View>

          {/* Tags list */}
          {item.tags.length > 0 && (
            <View style={styles.tagsContainer}>
              {item.tags.map((tag, i) => (
                <View key={`${item.id}-tag-${i}`} style={[styles.tagBadge, { backgroundColor: isDark ? '#1E293B' : '#E2E8F0' }]}>
                  <Text style={[styles.tagText, { color: colors.textMuted }]}>
                    #{tag}
                  </Text>
                </View>
              ))}
            </View>
          )}

          {/* Preview of Code */}
          <View style={styles.codePreview}>
            <CodeViewer code={item.code} language={item.language} maxLines={4} />
          </View>

          {/* Timestamp footer */}
          <View style={styles.cardFooter}>
            <Text style={[styles.dateText, { color: colors.textMuted }]}>
              Created {new Date(item.created_at).toLocaleDateString()}
            </Text>
            <View style={styles.openIndicator}>
              <Text style={[styles.openText, { color: colors.primary }]}>Inspect</Text>
              <Ionicons name="chevron-forward" size={14} color={colors.primary} />
            </View>
          </View>
        </GlassCard>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Search Header */}
      <View style={styles.searchHeader}>
        <View style={[styles.searchBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Ionicons name="search" size={20} color={colors.textMuted} style={styles.searchIcon} />
          <TextInput
            placeholder="Search code snippets, titles, or tags..."
            placeholderTextColor={colors.textMuted}
            value={searchQuery}
            onChangeText={handleSearchChange}
            style={[styles.searchInput, { color: colors.text }]}
          />
          {searchQuery !== '' && (
            <TouchableOpacity onPress={() => handleSearchChange('')}>
              <Ionicons name="close-circle" size={18} color={colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Language filter pills */}
      <View style={styles.pillsContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pillsScroll}>
          {renderLanguagePill('all', 'All Languages')}
          {Object.keys(SUPPORTED_LANGUAGES).map(langKey => 
            renderLanguagePill(langKey, SUPPORTED_LANGUAGES[langKey].name)
          )}
        </ScrollView>
      </View>

      {/* Snippet Grid */}
      <FlatList
        data={filteredSnippets}
        keyExtractor={item => `snippet-${item.id}`}
        renderItem={renderSnippetCard}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="code-working" size={48} color={colors.textMuted} />
            <Text style={[styles.emptyText, { color: colors.text }]}>No Snippets Found</Text>
            <Text style={[styles.emptySubText, { color: colors.textMuted }]}>
              {searchQuery !== '' || selectedLanguage !== 'all'
                ? 'Try adjusting your search criteria or filtering'
                : 'Create your first offline code snippet!'}
            </Text>
          </View>
        }
      />

      {/* Floating Create FAB */}
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => router.push('/snippet/create')}
        style={[styles.fab, { backgroundColor: colors.primary, shadowColor: colors.primary }]}
      >
        <Ionicons name="add" size={28} color="#FFFFFF" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchHeader: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    ...shadows.sm,
  },
  searchIcon: {
    marginRight: spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: fontSizes.md,
    fontWeight: '500',
  },
  pillsContainer: {
    marginVertical: spacing.xs,
  },
  pillsScroll: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm - 2,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: spacing.sm,
  },
  pillIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  pillText: {
    fontSize: fontSizes.sm,
  },
  listContainer: {
    padding: spacing.md,
    paddingBottom: spacing.xxl + 20,
  },
  cardContainer: {
    marginBottom: spacing.md,
  },
  snippetCard: {
    borderWidth: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: spacing.md,
  },
  langBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: 6,
    marginRight: spacing.sm,
  },
  langBadgeText: {
    fontSize: fontSizes.xs,
    fontWeight: '700',
    fontFamily: 'monospace',
  },
  snippetTitle: {
    fontSize: fontSizes.md,
    fontWeight: '700',
    flex: 1,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: spacing.sm,
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
    fontWeight: '500',
  },
  codePreview: {
    marginTop: spacing.xs,
    marginBottom: spacing.sm,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(148, 163, 184, 0.2)',
    paddingTop: spacing.sm,
  },
  dateText: {
    fontSize: fontSizes.xs,
  },
  openIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  openText: {
    fontSize: fontSizes.xs,
    fontWeight: '600',
    marginRight: 2,
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
  fab: {
    position: 'absolute',
    bottom: spacing.lg,
    right: spacing.lg,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.md,
    zIndex: 999,
  },
});
