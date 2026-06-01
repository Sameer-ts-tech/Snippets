import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Clipboard } from 'react-native';
import { useAppTheme } from '../context/ThemeContext';
import { SUPPORTED_LANGUAGES } from '../constants/languages';
import { spacing, shadows, fontSizes } from '../constants/theme';
import { Ionicons } from '@expo/vector-icons';

interface CodeViewerProps {
  code: string;
  language: string;
  maxLines?: number;
}

export interface Token {
  type: 'keyword' | 'string' | 'comment' | 'number' | 'builtin' | 'operator' | 'text';
  text: string;
}

/**
 * Robust regex-based tokenizer that runs offline on the JS thread
 */
export function tokenize(code: string, language: string): Token[][] {
  const lines = code.split('\n');
  const config = SUPPORTED_LANGUAGES[language.toLowerCase()] || SUPPORTED_LANGUAGES.text;
  
  return lines.map(line => {
    if (line.trim() === '') {
      return [{ type: 'text', text: ' ' }];
    }
    
    const isFullComment = (
      (language === 'sql' && line.trim().startsWith('--')) ||
      ((language === 'python' || language === 'shell') && line.trim().startsWith('#')) ||
      ((language === 'javascript' || language === 'typescript' || language === 'css' || language === 'go' || language === 'rust') && line.trim().startsWith('//'))
    );
    
    if (isFullComment) {
      return [{ type: 'comment', text: line }];
    }
    
    const tokens: Token[] = [];
    let remaining = line;
    
    while (remaining.length > 0) {
      // 1. Match inline comments
      let commentMatch: RegExpMatchArray | null = null;
      if (language === 'sql') commentMatch = remaining.match(/^(--.*)$/);
      else if (language === 'python' || language === 'shell') commentMatch = remaining.match(/^(#.*)$/);
      else if (language === 'css') commentMatch = remaining.match(/^(\/\*.*\*\/)$/);
      else commentMatch = remaining.match(/^(\/\/.*)$/);
      
      if (commentMatch) {
        tokens.push({ type: 'comment', text: commentMatch[1] });
        break;
      }
      
      // 2. Match Strings
      const stringMatch = remaining.match(/^("[^"\\]*(?:\\.[^"\\]*)*"|'[^'\\]*(?:\\.[^'\\]*)*'|`[^`\\]*(?:\\.[^`\\]*)*`)/);
      if (stringMatch) {
        tokens.push({ type: 'string', text: stringMatch[1] });
        remaining = remaining.substring(stringMatch[1].length);
        continue;
      }
      
      // 3. Match Numbers
      const numberMatch = remaining.match(/^(\b\d+(?:\.\d+)?\b)/);
      if (numberMatch) {
        tokens.push({ type: 'number', text: numberMatch[1] });
        remaining = remaining.substring(numberMatch[1].length);
        continue;
      }
      
      // 4. Match Words (Keywords, Builtins, Types)
      const wordMatch = remaining.match(/^([a-zA-Z_][a-zA-Z0-9_]*)/);
      if (wordMatch) {
        const word = wordMatch[1];
        let type: Token['type'] = 'text';
        
        if (config.keywords.includes(word)) {
          type = 'keyword';
        } else if (config.builtins.includes(word)) {
          type = 'builtin';
        }
        
        tokens.push({ type, text: word });
        remaining = remaining.substring(word.length);
        continue;
      }
      
      // 5. Match Operators / Punctuation
      const operatorMatch = remaining.match(/^([{}()[\];.,=+<>!&|*/^%:-]+)/);
      if (operatorMatch) {
        tokens.push({ type: 'operator', text: operatorMatch[1] });
        remaining = remaining.substring(operatorMatch[1].length);
        continue;
      }
      
      // 6. Match Spaces
      const spaceMatch = remaining.match(/^(\s+)/);
      if (spaceMatch) {
        tokens.push({ type: 'text', text: spaceMatch[1] });
        remaining = remaining.substring(spaceMatch[1].length);
        continue;
      }
      
      // 7. Fallback char-by-char to avoid infinite loop
      tokens.push({ type: 'text', text: remaining.charAt(0) });
      remaining = remaining.substring(1);
    }
    
    return tokens;
  });
}

export function CodeViewer({ code, language, maxLines }: CodeViewerProps) {
  const { colors, isDark } = useAppTheme();
  const [copied, setCopied] = useState(false);

  const tokenLines = tokenize(code, language);
  const displayedLines = maxLines ? tokenLines.slice(0, maxLines) : tokenLines;

  // Custom VS Code like themes based on app state
  const codeStyles = {
    keyword: { color: isDark ? '#E5C07B' : '#E28A37', fontWeight: 'bold' as const }, // Yellow/Orange
    string: { color: isDark ? '#98C379' : '#50A14F' }, // Green
    comment: { color: isDark ? '#5C6370' : '#A0A1A7', fontStyle: 'italic' as const }, // Gray-ish
    number: { color: isDark ? '#D19A66' : '#986801' }, // Orange-brown
    builtin: { color: isDark ? '#61AFEF' : '#4078F2' }, // Blue
    operator: { color: isDark ? '#56B6C2' : '#0184BC' }, // Cyan
    text: { color: isDark ? '#ABB2BF' : '#383A42' }, // Light-Slate or Dark-Gray
  };

  const handleCopy = () => {
    Clipboard.setString(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const langInfo = SUPPORTED_LANGUAGES[language.toLowerCase()] || SUPPORTED_LANGUAGES.text;

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#080C14' : '#F1F5F9', borderColor: colors.border }]}>
      {/* Top Header Bar */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <View style={styles.headerInfo}>
          <Text style={[styles.langText, { color: colors.textMuted }]}>
            {langInfo.name}
          </Text>
        </View>
        <TouchableOpacity style={styles.copyButton} onPress={handleCopy} activeOpacity={0.6}>
          <Ionicons 
            name={copied ? "checkmark-circle" : "copy-outline"} 
            size={16} 
            color={copied ? colors.secondary : colors.textMuted} 
          />
          <Text style={[styles.copyText, { color: copied ? colors.secondary : colors.textMuted }]}>
            {copied ? 'Copied!' : 'Copy'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Code Editor Body */}
      <ScrollView horizontal contentContainerStyle={{ flexGrow: 1 }} showsHorizontalScrollIndicator={true}>
        <View style={styles.codeContainer}>
          {/* Line Numbers column */}
          <View style={[styles.lineNumbersColumn, { borderRightColor: colors.border }]}>
            {displayedLines.map((_, i) => (
              <Text key={`line-${i}`} style={[styles.lineNumberText, { color: isDark ? '#4B5263' : '#94A3B8' }]}>
                {i + 1}
              </Text>
            ))}
          </View>

          {/* Tokens column */}
          <View style={styles.tokensColumn}>
            {displayedLines.map((lineTokens, lineIdx) => (
              <View key={`row-${lineIdx}`} style={styles.codeRow}>
                {lineTokens.map((token, tokenIdx) => (
                  <Text
                    key={`token-${lineIdx}-${tokenIdx}`}
                    style={[styles.codeFont, codeStyles[token.type] || codeStyles.text]}
                  >
                    {token.text}
                  </Text>
                ))}
              </View>
            ))}
            {maxLines && tokenLines.length > maxLines && (
              <Text style={[styles.codeFont, styles.moreLinesText, { color: colors.textMuted }]}>
                ... and {tokenLines.length - maxLines} more lines
              </Text>
            )}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
    ...shadows.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
  },
  headerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  langText: {
    fontSize: fontSizes.xs,
    fontFamily: 'monospace',
    fontWeight: '600',
  },
  copyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 4,
  },
  copyText: {
    fontSize: fontSizes.xs,
    marginLeft: 4,
    fontWeight: '500',
  },
  codeContainer: {
    flexDirection: 'row',
    paddingVertical: spacing.sm,
  },
  lineNumbersColumn: {
    width: 38,
    alignItems: 'flex-end',
    paddingRight: spacing.sm,
    borderRightWidth: 1,
  },
  lineNumberText: {
    fontFamily: 'monospace',
    fontSize: fontSizes.sm,
    lineHeight: 20,
    textAlign: 'right',
  },
  tokensColumn: {
    paddingLeft: spacing.md,
    paddingRight: spacing.xl,
  },
  codeRow: {
    flexDirection: 'row',
    lineHeight: 20,
  },
  codeFont: {
    fontFamily: 'monospace',
    fontSize: fontSizes.sm,
    lineHeight: 20,
  },
  moreLinesText: {
    fontStyle: 'italic',
    marginTop: 4,
  },
});
