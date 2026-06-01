export interface AIExplanationResult {
  summary: string;
  explanation: string;
  suggestions: string[];
  isMock: boolean;
}

/**
 * Explains code snippets using Gemini API when API key is provided, or a high-fidelity
 * rule-based static analyzer for offline/no-key situations.
 */
export async function explainSnippet(
  title: string,
  code: string,
  language: string,
  apiKey: string | null,
  model: string = 'gemini-2.5-flash'
): Promise<AIExplanationResult> {
  if (apiKey && apiKey.trim() !== '') {
    try {
      return await generateGeminiExplanation(title, code, language, apiKey, model);
    } catch (e) {
      console.warn('Gemini API request failed, falling back to offline analyzer', e);
      return generateOfflineExplanation(title, code, language);
    }
  }

  // No API key - return the gorgeous, tailored offline mock analyzer
  return generateOfflineExplanation(title, code, language);
}

/**
 * Sends a request to Google Gemini API
 */
async function generateGeminiExplanation(
  title: string,
  code: string,
  language: string,
  apiKey: string,
  model: string
): Promise<AIExplanationResult> {
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const prompt = `You are a Senior developer assistant. Explain the following code snippet.
Title: "${title}"
Language: "${language}"

Code:
\`\`\`${language}
${code}
\`\`\`

Provide the response in EXACTLY the following JSON format (no markdown blocks, just raw JSON, and do NOT wrap it in \`\`\`json):
{
  "summary": "A 1-2 sentence high-level summary of what this code does.",
  "explanation": "A thorough, step-by-step markdown formatted explanation of the logic, variables, and structure.",
  "suggestions": [
    "Suggestion 1 for efficiency/security/readability",
    "Suggestion 2 for best practices",
    "Suggestion 3 (optional)"
  ]
}`;

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contents: [
        {
          parts: [{ text: prompt }]
        }
      ]
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Gemini API error (${response.status}): ${errText}`);
  }

  const json = await response.json();
  const rawText = json.candidates?.[0]?.content?.parts?.[0]?.text || '';
  
  // Clean potential JSON markdown wrapping
  const cleanedText = rawText
    .replace(/^```json\s*/i, '')
    .replace(/```\s*$/, '')
    .trim();

  try {
    const result = JSON.parse(cleanedText);
    return {
      summary: result.summary || 'Analyzed code successfully.',
      explanation: result.explanation || 'No detailed explanation provided.',
      suggestions: Array.isArray(result.suggestions) ? result.suggestions : [],
      isMock: false,
    };
  } catch (parseError) {
    // If response isn't clean JSON, treat the whole response as explanation
    return {
      summary: `AI Explanation for ${title}`,
      explanation: rawText || 'Analyzed snippet successfully.',
      suggestions: [
        'Ensure you review variable scopes.',
        'Optimize execution loops where possible.'
      ],
      isMock: false,
    };
  }
}

/**
 * Robust static-analysis rule-based generator for 100% offline usage.
 * Inspects imports, structures, variables, functions, and returns a tailored developer brief.
 */
function generateOfflineExplanation(
  title: string,
  code: string,
  language: string
): AIExplanationResult {
  // Determine key structural features of the snippet
  const lines = code.split('\n');
  const functions = code.match(/(function\s+[a-zA-Z0-9_]+|const\s+[a-zA-Z0-9_]+\s*=\s*(\([^)]*\)|[a-zA-Z0-9_]+)\s*=>|def\s+[a-zA-Z0-9_]+|func\s+[a-zA-Z0-9_]+|fn\s+[a-zA-Z0-9_]+)/g) || [];
  const classes = code.match(/(class\s+[a-zA-Z0-9_]+|struct\s+[a-zA-Z0-9_]+)/g) || [];
  const imports = code.match(/(import\s+|from\s+|require\()/g) || [];
  const stateHooks = code.match(/useState|useEffect|useRef|useCallback|useMemo/g) || [];
  const promises = code.match(/async|await|Promise|\.then/g) || [];
  const loops = code.match(/for\s*\(|while\s*\(|for\s+[a-zA-Z0-9_]+\s+in|for\s+[a-zA-Z0-9_]+\s+of/g) || [];

  const cleanLang = language.toLowerCase();
  
  // 1. Generate Custom Summary based on static analysis findings
  let summary = `This local offline snippet implements custom code block structure in ${language}.`;
  if (cleanLang === 'typescript' || cleanLang === 'javascript') {
    if (stateHooks.length > 0) {
      summary = `A functional React/React Native component or hook leveraging state controls for reactive rendering.`;
    } else if (promises.length > 0) {
      summary = `An asynchronous JavaScript/TypeScript execution routine for concurrent tasks or network exchanges.`;
    } else {
      summary = `A structured utility block in JavaScript/TypeScript designed for procedural execution or mathematical logic.`;
    }
  } else if (cleanLang === 'python') {
    if (functions.length > 0) {
      summary = `A Python script utilizing nested functions or decorators to provide scalable modular helpers.`;
    } else {
      summary = `A functional script containing data operations or scripting algorithms in Python.`;
    }
  } else if (cleanLang === 'sql') {
    summary = `A relational database manipulation query written in structured SQL to filter, join, or project records.`;
  } else if (cleanLang === 'css') {
    summary = `A cascade style sheet configuring layout visual tokens, styles, or glassmorphic animations.`;
  }

  // 2. Generate detailed Markdown breakdown
  let explanation = `### 💻 Local Code Architecture Brief\n\n`;
  explanation += `This report was compiled by **Dev-Pocket Local Engine** (Offline-First mode).\n\n`;
  
  explanation += `#### 🔍 Static Code Indicators\n`;
  explanation += `- **Language Class**: \`${language.toUpperCase()}\`\n`;
  explanation += `- **Source Lines**: \`${lines.length}\` lines of code.\n`;
  explanation += `- **Identifiers Found**: \`${functions.length}\` function declaration(s) and \`${classes.length}\` structural class/object model(s).\n`;
  if (imports.length > 0) {
    explanation += `- **Dependencies**: External namespaces loaded via \`import\` or \`require\` (${imports.length} detected).\n`;
  }
  explanation += `\n`;

  explanation += `#### 🛠️ Structure & Execution Flow\n`;
  if (cleanLang === 'typescript' || cleanLang === 'javascript') {
    explanation += `1. **Scope and Scope Bindings**: Code operates under JS block scoping. Constants (\`const\`) restrict re-binding, while local state handles mutable parameters.\n`;
    if (stateHooks.length > 0) {
      explanation += `2. **React Ecosystem**: The presence of hooks (${stateHooks.join(', ')}) indicates reactive UI state cycles. The code sets side-effects or holds local re-render buffers.\n`;
    }
    if (promises.length > 0) {
      explanation += `3. **Async / Await Flow**: Executed on the Event Loop using asynchronous microtasks. The routine safely awaits values without freezing UI processes.\n`;
    }
  } else if (cleanLang === 'python') {
    explanation += `1. **Python Dynamic Environment**: Uses dynamic types, standard namespaces, and scoping indentation rules.\n`;
    explanation += `2. **Functional Blocks**: Uses \`def\` keywords to encapsulate logic blocks, isolating state and returning results to standard pipelines.\n`;
  } else if (cleanLang === 'sql') {
    explanation += `1. **Relational Context**: Interacts directly with database rows using declarative queries.\n`;
    explanation += `2. **Filtering & Joining**: Leverages indexed indexing keys or temporary tables to join sets of entries rapidly.\n`;
  } else {
    explanation += `1. **Modular Routine**: Initializes standard inputs, declares procedural structures, and loops/evaluates expressions dynamically.\n`;
  }

  explanation += `\n*Note: To fetch a live AI analysis from Gemini, please add a personal Google API Key in the Settings panel.*`;

  // 3. Generate tailored improvement suggestions
  const suggestions: string[] = [];
  
  if (cleanLang === 'javascript' || cleanLang === 'typescript') {
    if (code.includes('var ')) {
      suggestions.push('Replace obsolete "var" references with modern "let" or "const" scopes.');
    }
    if (stateHooks.length > 0 && !code.includes('useCallback') && functions.length > 1) {
      suggestions.push('Consider wrapping inner handlers in "useCallback" to minimize rendering overhead.');
    }
    if (promises.length > 0 && !code.includes('try') && !code.includes('catch')) {
      suggestions.push('Add a try/catch block around async await requests to handle network or execution faults.');
    }
  }
  
  if (loops.length > 1) {
    suggestions.push('Multiple loops detected. Verify complexity index (e.g. O(n²)) and optimize nested maps.');
  }

  if (suggestions.length === 0) {
    suggestions.push('Incorporate strong return type definitions for better compiler check safety.');
    suggestions.push('Add modular inline documentation (JSDoc/Docstrings) to support multi-developer usage.');
  }

  suggestions.push('Enable caching mechanics if this snippet runs repeatedly in high-performance loops.');

  return {
    summary,
    explanation,
    suggestions,
    isMock: true,
  };
}
