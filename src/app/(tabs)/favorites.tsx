import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TextInput, FlatList, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDB, Snippet } from '../../context/DBContext';
import { useAppTheme } from '../../context/ThemeContext';
import { SUPPORTED_LANGUAGES } from '../../constants/languages';
import { spacing, fontSizes, shadows } from '../../constants/theme';
import { CodeViewer } from '../../components/CodeViewer';
import { GlassCard } from '../../components/GlassCard';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';

export default function FavoritesScreen() {
  const { colors, isDark } = useAppTheme();
  const { searchSnippets, toggleFavorite, loadSnippets } = useDB();
  const router = useRouter();

  const [searchQuery, setSearchQuery] = useState('');
  const [favoriteSnippets, setFavoriteSnippets] = useState<Snippet[]>([]);

  useFocusEffect(
    useCallback(() => {
      loadSnippets();
      performSearch(searchQuery);
    }, [searchQuery])
  );

  const performSearch = (query: string) => {
    const results = searchSnippets(query, 'all', true); // favoriteOnly = true
    setFavoriteSnippets(results);
  };

  const handleSearchChange = (text: string) => {
    setSearchQuery(text);
    performSearch(text);
  };

  const renderSnippetCard = ({ item }: { item: Snippet }) => {
    const langInfo = SUPPORTED_LANGUAGES[item.language.toLowerCase()] || SUPPORTED_LANGUAGES.text;

    return (
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={() => router.push(`/snippet/${item.id}`)}
        style={styles.cardContainer}
      >
        <GlassCard glow={true} style={styles.snippetCard}>
          {/* Header Area */}
          <View style={styles.cardHeader}>
            <View style={styles.cardHeaderLeft}>
              <View style={[styles.langBadge, { backgroundColor: colors.secondaryLight }]}>
                <Text style={[styles.langBadgeText, { color: colors.secondary }]}>
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
                // Immediately refresh list
                setTimeout(() => performSearch(searchQuery), 50);
              }}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons
                name="star"
                size={22}
                color={colors.accent}
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
            placeholder="Search starred snippets..."
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

      {/* Starred Snippets List */}
      <FlatList
        data={favoriteSnippets}
        keyExtractor={item => `snippet-${item.id}`}
        renderItem={renderSnippetCard}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="star-outline" size={48} color={colors.textMuted} />
            <Text style={[styles.emptyText, { color: colors.text }]}>No Starred Snippets</Text>
            <Text style={[styles.emptySubText, { color: colors.textMuted }]}>
              {searchQuery !== ''
                ? 'Try adjusting your search criteria'
                : 'Click the star icon on any code snippet to bookmark it for offline quick-access!'}
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
  searchHeader: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
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
  listContainer: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
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
});
