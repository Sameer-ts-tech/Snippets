export interface LanguageConfig {
  name: string;
  extension: string;
  keywords: string[];
  builtins: string[];
  icon: string;
  color: string;
}

export const SUPPORTED_LANGUAGES: Record<string, LanguageConfig> = {
  javascript: {
    name: 'JavaScript',
    extension: '.js',
    icon: 'logo-javascript',
    color: '#F7DF1E',
    keywords: [
      'break', 'case', 'catch', 'class', 'const', 'continue', 'debugger', 'default',
      'delete', 'do', 'else', 'export', 'extends', 'finally', 'for', 'function',
      'if', 'import', 'in', 'instanceof', 'new', 'return', 'super', 'switch',
      'this', 'throw', 'try', 'typeof', 'var', 'void', 'while', 'with', 'yield',
      'let', 'await', 'async', 'null', 'undefined', 'true', 'false'
    ],
    builtins: [
      'console', 'window', 'document', 'process', 'global', 'Object', 'Array',
      'String', 'Number', 'Boolean', 'Function', 'Symbol', 'Map', 'Set', 'Promise',
      'JSON', 'Math', 'Error', 'setTimeout', 'setInterval'
    ]
  },
  typescript: {
    name: 'TypeScript',
    extension: '.ts',
    icon: 'logo-typescript',
    color: '#3178C6',
    keywords: [
      'break', 'case', 'catch', 'class', 'const', 'continue', 'debugger', 'default',
      'delete', 'do', 'else', 'export', 'extends', 'finally', 'for', 'function',
      'if', 'import', 'in', 'instanceof', 'new', 'return', 'super', 'switch',
      'this', 'throw', 'try', 'typeof', 'var', 'void', 'while', 'with', 'yield',
      'let', 'await', 'async', 'null', 'undefined', 'true', 'false', 'interface',
      'type', 'namespace', 'declare', 'any', 'unknown', 'never', 'keyof', 'readonly',
      'private', 'protected', 'public', 'static', 'as', 'implements'
    ],
    builtins: [
      'console', 'window', 'document', 'Object', 'Array', 'String', 'Number',
      'Boolean', 'Function', 'Symbol', 'Map', 'Set', 'Promise', 'JSON', 'Math',
      'Record', 'Partial', 'Required', 'Readonly', 'Pick', 'Omit', 'Exclude', 'Extract'
    ]
  },
  python: {
    name: 'Python',
    extension: '.py',
    icon: 'logo-python',
    color: '#3776AB',
    keywords: [
      'False', 'None', 'True', 'and', 'as', 'assert', 'async', 'await', 'break',
      'class', 'continue', 'def', 'del', 'elif', 'else', 'except', 'finally',
      'for', 'from', 'global', 'if', 'import', 'in', 'is', 'lambda', 'nonlocal',
      'not', 'or', 'pass', 'raise', 'return', 'try', 'while', 'with', 'yield'
    ],
    builtins: [
      'print', 'len', 'range', 'str', 'int', 'float', 'list', 'dict', 'set', 'tuple',
      'open', 'type', 'id', 'sum', 'min', 'max', 'abs', 'round', 'map', 'filter',
      'zip', 'enumerate', 'super', 'self'
    ]
  },
  go: {
    name: 'Go',
    extension: '.go',
    icon: 'code-slash',
    color: '#00ADD8',
    keywords: [
      'break', 'default', 'func', 'interface', 'select', 'case', 'defer', 'go',
      'map', 'struct', 'chan', 'else', 'goto', 'package', 'switch', 'const',
      'fallthrough', 'if', 'range', 'type', 'continue', 'for', 'import', 'return',
      'var', 'nil', 'true', 'false'
    ],
    builtins: [
      'append', 'cap', 'close', 'complex', 'copy', 'delete', 'imag', 'len',
      'make', 'new', 'panic', 'print', 'println', 'real', 'recover',
      'string', 'int', 'int64', 'float64', 'bool', 'uint', 'byte', 'rune', 'error'
    ]
  },
  rust: {
    name: 'Rust',
    extension: '.rs',
    icon: 'construct',
    color: '#000000',
    keywords: [
      'as', 'async', 'await', 'break', 'const', 'continue', 'crate', 'dyn', 'else',
      'enum', 'extern', 'false', 'fn', 'for', 'if', 'impl', 'in', 'let', 'loop',
      'match', 'mod', 'move', 'mut', 'pub', 'ref', 'return', 'self', 'Self',
      'static', 'struct', 'super', 'trait', 'true', 'type', 'union', 'unsafe',
      'use', 'where', 'while'
    ],
    builtins: [
      'Option', 'Some', 'None', 'Result', 'Ok', 'Err', 'String', 'str', 'Vec',
      'Box', 'Rc', 'Arc', 'println', 'format', 'panic', 'assert_eq'
    ]
  },
  sql: {
    name: 'SQL',
    extension: '.sql',
    icon: 'server',
    color: '#4479A1',
    keywords: [
      'SELECT', 'FROM', 'WHERE', 'AND', 'OR', 'NOT', 'INSERT', 'UPDATE', 'DELETE',
      'CREATE', 'TABLE', 'DROP', 'ALTER', 'JOIN', 'LEFT', 'RIGHT', 'INNER', 'OUTER',
      'ON', 'GROUP', 'BY', 'ORDER', 'HAVING', 'LIMIT', 'OFFSET', 'INDEX', 'PRIMARY',
      'KEY', 'FOREIGN', 'REFERENCES', 'INTO', 'VALUES', 'SET', 'DEFAULT', 'NULL',
      'AS', 'DISTINCT', 'UNION', 'ALL', 'CASE', 'WHEN', 'THEN', 'ELSE', 'END'
    ],
    builtins: [
      'SUM', 'AVG', 'COUNT', 'MIN', 'MAX', 'CONCAT', 'SUBSTR', 'NOW', 'DATE',
      'INTEGER', 'TEXT', 'REAL', 'BLOB', 'VARCHAR', 'CHAR', 'TIMESTAMP'
    ]
  },
  html: {
    name: 'HTML',
    extension: '.html',
    icon: 'globe',
    color: '#E34F26',
    keywords: [
      'doctype', 'html', 'head', 'title', 'meta', 'link', 'style', 'script',
      'body', 'div', 'span', 'p', 'a', 'img', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'ul', 'ol', 'li', 'table', 'tr', 'td', 'th', 'thead', 'tbody', 'form',
      'input', 'button', 'textarea', 'select', 'option', 'label', 'iframe',
      'header', 'footer', 'nav', 'section', 'article', 'aside', 'main'
    ],
    builtins: [
      'class', 'id', 'style', 'href', 'src', 'alt', 'type', 'value', 'placeholder',
      'rel', 'name', 'target', 'width', 'height', 'onclick'
    ]
  },
  css: {
    name: 'CSS',
    extension: '.css',
    icon: 'brush',
    color: '#1572B6',
    keywords: [
      'import', 'media', 'keyframes', 'font-face', 'supports', 'charset'
    ],
    builtins: [
      'color', 'background', 'background-color', 'margin', 'padding', 'border',
      'width', 'height', 'display', 'position', 'top', 'bottom', 'left', 'right',
      'flex', 'grid', 'justify-content', 'align-items', 'font-family', 'font-size',
      'font-weight', 'text-align', 'text-decoration', 'box-shadow', 'border-radius',
      'transition', 'animation', 'opacity', 'overflow', 'z-index'
    ]
  },
  json: {
    name: 'JSON',
    extension: '.json',
    icon: 'document-text',
    color: '#292929',
    keywords: ['true', 'false', 'null'],
    builtins: []
  },
  shell: {
    name: 'Shell',
    extension: '.sh',
    icon: 'terminal',
    color: '#4EAA25',
    keywords: [
      'if', 'then', 'else', 'elif', 'fi', 'case', 'esac', 'for', 'while', 'until',
      'do', 'done', 'in', 'function', 'return', 'exit', 'break', 'continue', 'local'
    ],
    builtins: [
      'echo', 'cd', 'pwd', 'ls', 'mkdir', 'rm', 'cp', 'mv', 'touch', 'chmod',
      'grep', 'awk', 'sed', 'cat', 'sudo', 'export', 'alias', 'env', 'git', 'bun', 'npm'
    ]
  },
  text: {
    name: 'Text',
    extension: '.txt',
    icon: 'document',
    color: '#94A3B8',
    keywords: [],
    builtins: []
  }
};
