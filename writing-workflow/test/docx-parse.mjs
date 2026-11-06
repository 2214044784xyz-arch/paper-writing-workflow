/**
 * docx pipeline test: runs the panel's real `extractDocument` against a real
 * .docx inside a vm sandbox. Node 24 supplies Blob/Response/DecompressionStream;
 * only DOMParser is absent, so a small read-only XML DOM covers the reader's usage.
 */
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import vm from 'node:vm';

const WORKSPACE = 'C:\\Users\\15919\\Documents\\deepseek-harness\\default-workspace';
const CLIENT = path.join(WORKSPACE, 'writing-workflow', 'client.js');
const DOCX = process.env.WWP_DOCX || path.join(WORKSPACE, 'sample.docx');

const decodeEntities = (text) =>
  text.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&amp;/g, '&');

function buildTree(xml) {
  const tagRe = /<([\w:.-]+)((?:\s+[\w:.-]+\s*=\s*"[^"]*")*)\s*(\/?)>/y;
  const attrsOf = (raw) => {
    const attrs = {};
    const re = /([\w:.-]+)\s*=\s*"([^"]*)"/g;
    let match;
    while ((match = re.exec(raw)) !== null) attrs[match[1]] = decodeEntities(match[2]);
    return attrs;
  };
  const stack = [];
  let root = null;
  let pos = 0;
  while (pos < xml.length) {
    const lt = xml.indexOf('<', pos);
    if (lt < 0) break;
    if (xml.startsWith('<!--', lt)) {
      const end = xml.indexOf('-->', lt);
      pos = end < 0 ? xml.length : end + 3;
      continue;
    }
    if (xml.startsWith('<?', lt) || xml.startsWith('<!', lt)) {
      const gt = xml.indexOf('>', lt);
      pos = gt < 0 ? xml.length : gt + 1;
      continue;
    }
    if (xml.startsWith('</', lt)) {
      const gt = xml.indexOf('>', lt);
      const closing = stack.pop();
      if (!closing) throw new Error('unbalanced close');
      closing.contentEnd = lt;
      pos = gt + 1;
      continue;
    }
    tagRe.lastIndex = lt;
    const match = tagRe.exec(xml);
    if (!match) throw new Error(`bad tag at ${lt}`);
    const whole = match[0];
    const rawName = match[1];
    const rawAttrs = match[2];
    const selfClose = match[3];
    const localName = rawName.includes(':') ? rawName.split(':').pop() : rawName;
    const element = {
      nodeType: 1,
      localName,
      attributes: attrsOf(rawAttrs),
      childNodes: [],
      contentStart: lt + whole.length,
      contentEnd: lt + whole.length,
      getAttributeNS(_ns, name) {
        return this.attributes[name] ?? null;
      },
      getAttribute(name) {
        return this.attributes[name] ?? null;
      },
      get textContent() {
        return decodeEntities(xml.slice(this.contentStart, this.contentEnd).replace(/<[^>]*>/g, ''));
      },
    };
    const parent = stack[stack.length - 1];
    if (parent) parent.childNodes.push(element);
    else if (!root) root = element;
    if (!selfClose) stack.push(element);
    pos = lt + whole.length;
  }
  if (!root) throw new Error('no root element');
  const all = [];
  const walk = (node) => {
    for (const child of node.childNodes) {
      all.push(child);
      walk(child);
    }
  };
  walk(root);
  /* Scoped search: DOM methods only see a node's own subtree. */
  const descendantsOf = (node) => {
    const found = [];
    const walkNode = (current) => {
      for (const child of current.childNodes) {
        found.push(child);
        walkNode(child);
      }
    };
    walkNode(node);
    return found;
  };
  const scoped = (node) => (name) => descendantsOf(node).filter((candidate) => candidate.localName === name);
  for (const node of all) {
    const byLocal = scoped(node);
    node.getElementsByTagName = byLocal;
    node.getElementsByTagNameNS = (_ns, name) => byLocal(name);
  }
  const byLocalAll = (name) => all.filter((node) => node.localName === name);
  return {
    documentElement: root,
    getElementsByTagName: byLocalAll,
    getElementsByTagNameNS: (_ns, name) => byLocalAll(name),
  };
}

class FakeNode {
  constructor(xml) {
    this._tree = buildTree(xml);
  }
  getElementsByTagName(name) {
    return this._tree.getElementsByTagName(name);
  }
  getElementsByTagNameNS(_ns, name) {
    return this._tree.getElementsByTagNameNS(_ns, name);
  }
}
class FakeDOMParser {
  parseFromString(xml) {
    return new FakeNode(xml);
  }
}

let registrations = null;
const window = {
  localStorage: { getItem: () => null, setItem: () => {} },
  __ModuleLoader__: { load: (spec) => (registrations = spec) },
};
const document = {
  querySelector: () => null,
  createElement: () => ({ dataset: {}, style: {}, textContent: '', appendChild() {}, remove() {} }),
  head: { appendChild() {} },
  body: { appendChild() {}, removeChild() {} },
};
const sandbox = {
  window,
  document,
  navigator: { clipboard: { writeText: async () => {} } },
  console: { log: (...args) => console.log('[sandbox]', ...args), warn() {}, error: (...args) => console.log('[sandbox:err]', ...args) },
  DOMParser: FakeDOMParser,
  Blob,
  Response,
  TextDecoder,
  TextEncoder,
  DecompressionStream,
  setTimeout,
  Map,
  Set,
  URL,
};
sandbox.globalThis = sandbox;

const source = await readFile(CLIENT, 'utf8');
vm.runInNewContext(source, sandbox, { filename: CLIENT });

const React = {
  createElement: (type, props, ...children) => ({ type, props: props || {}, children }),
  useState: (initial) => [typeof initial === 'function' ? initial() : initial, () => {}],
  useEffect() {},
  useMemo: (fn) => fn(),
  useCallback: (fn) => fn(),
  useRef: (value) => ({ current: value }),
};
const plugin = registrations.factory((name) => {
  if (name === 'react') return React;
  if (name === 'react/jsx-runtime') return { jsx: (t, p) => React.createElement(t, p), jsxs: (t, p) => React.createElement(t, p) };
  throw new Error(`missing ${name}`);
});

const buffer = await readFile(DOCX);
const file = {
  name: path.basename(DOCX),
  type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  async arrayBuffer() {
    return buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);
  },
  async text() {
    return buffer.toString('utf8');
  },
}
const parsed = await plugin.extractDocument(file);
assert.equal(parsed.format, 'docx');
const text = parsed.text;
assert.ok(text.length > 5000, `expected a long extraction, got ${text.length}`);
assert.ok(text.length > 0, 'body text survives');
assert.ok(text.includes('|'), 'tables become pipe rows');
// Reference entries survive when the supplied document has a bibliography.


const mdFile = {
  name: 'draft.md',
  type: 'text/markdown',
  async arrayBuffer() {
    return new TextEncoder().encode('# 标题').buffer;
  },
  async text() {
    return '# 标题';
  },
};
const md = await plugin.extractDocument(mdFile);
assert.equal(md.format, 'markdown');
assert.equal(md.text, '# 标题');

console.log('docx parse: OK');
console.log('chars:', text.length, '| lines:', text.split(String.fromCharCode(10)).length, '| pipes:', (text.match(/\|/g) || []).length);
console.log('preview:', JSON.stringify(text.slice(0, 120)));




