/**
 * Smoke test for writing-workflow/client.js.
 *
 * Loads the browser bundle inside a `vm` sandbox with tiny stubs for the module
 * table, localStorage and the DOM, then exercises the registration wiring and
 * one React render pass through a fake slot context.
 */
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const CLIENT = path.join(HERE, '..', 'client.js');

/* ---- fake React: hooks are inert, createElement builds plain trees ------ */

let hookStates = [];
let hookIndex = 0;
let hookCalls = 0;
const React = {
  createElement(type, props, ...children) {
    return { type, props: props || {}, children };
  },
  useState(initial) {
    hookCalls += 1;
    const value = hookIndex < hookStates.length ? hookStates[hookIndex] : typeof initial === 'function' ? initial() : initial;
    hookIndex += 1;
    return [value, () => {}];
  },
  useEffect() {},
  useMemo(fn) {
    return fn();
  },
  useCallback(fn) {
    return fn;
  },
  useRef(value) {
    return { current: value };
  },
};
const JSX = {
  jsx: (type, props) => React.createElement(type, props),
  jsxs: (type, props) => React.createElement(type, props),
};
const modules = { react: React, 'react/jsx-runtime': JSX };

/* ---- sandbox ------------------------------------------------------------ */

const styleTags = [];
const localStorage = {
  data: new Map(),
  getItem(key) {
    return this.data.has(key) ? this.data.get(key) : null;
  },
  setItem(key, value) {
    this.data.set(key, String(value));
  },
};

let registrations = null;
const window = {
  localStorage,
  setTimeout: (fn, ms) => {
    void fn;
    void ms;
    return 0;
  },
  __ModuleLoader__: {
    load(spec) {
      registrations = spec;
    },
  },
};

const document = {
  querySelector: () => null,
  createElement: () => ({ dataset: {}, style: {}, textContent: '', appendChild() {}, remove() {} }),
  head: { appendChild: (tag) => styleTags.push(tag) },
  body: { appendChild() {}, removeChild() {} },
};
const navigator = { clipboard: { writeText: async () => {} } };
const sandbox = { window, document, navigator, console, DOMParser: class {}, Blob: class {}, Response: class {}, DecompressionStream: undefined, TextDecoder, TextEncoder, Map, Set, URL };
sandbox.globalThis = sandbox;

const source = await readFile(CLIENT, 'utf8');
vm.runInNewContext(source, sandbox, { filename: CLIENT });

assert.ok(registrations, 'bundle must call window.__ModuleLoader__.load');
assert.equal(registrations.id, '@local/writing-workflow');

const plugin = registrations.factory((name) => {
  const found = modules[name];
  if (!found) throw new Error(`missing module ${name}`);
  return found;
});
assert.deepEqual([...plugin.inject], ['slots', 'layout', 'locale', 'sessions', 'remote']);

/* ---- fake slot context -------------------------------------------------- */

const calls = [];
const ctx = {
  effect(fn) {
    const disposer = fn();
    return typeof disposer === 'function' ? disposer : () => {};
  },
  locale: {
    dictionary: {},
    register(ns, dicts) {
      this.dictionary = { ...this.dictionary, ...(dicts.zh || {}) };
      return () => {};
    },
    bind() {
      return (key) => this.dictionary[key] ?? key;
    },
  },
  slots: {
    inject(slot, callback) {
      calls.push(['inject', slot]);
      const effect = callback();
      return typeof effect === 'function' ? effect : () => {};
    },
    register(options, component) {
      calls.push(['register', options.name, options.key || options.id]);
      return () => {};
    },
  },
  layout: { selectPanel() {} },
  remote: {
    commands: {
      async execute(sessionId, line) {
        calls.push(['execute', sessionId, line.slice(0, 24)]);
        return {
          ok: true,
          value: {
            result: {
              kind: 'success',
              text: JSON.stringify({
                ok: true,
                runId: 'r-test',
                runDir: '.dsh/writing-workflow/runs/r-test',
                requestPath: '.dsh/writing-workflow/runs/r-test/request.md',
                documentPath: '.dsh/writing-workflow/runs/r-test/doc.md',
              }),
            },
          },
        };
      },
    },
  },
  sessions: {
    using: async (_id, _options, operation) => operation({ binding: { session: { prompt: async () => ({ ok: true }) } } }),
  },
};

plugin.apply(ctx);

/* ---- assertions --------------------------------------------------------- */

const registered = calls.filter((entry) => entry[0] === 'register');
const names = registered.map((entry) => entry[1]).sort();
assert.deepEqual(names, ['conversation.composer.dock', 'main', 'sidebar.panellist']);
assert.ok(registered.some((entry) => entry[1] === 'main' && entry[2] === 'writing-workflow'));
assert.ok(registered.some((entry) => entry[1] === 'sidebar.panellist' && entry[2] === 'writing-workflow'));

/* locate the components again to render them */
let mainComponent = null;
let glyphComponent = null;
const ctx2 = {
  ...ctx,
  slots: {
    inject(slot, callback) {
      callback();
      return () => {};
    },
    register(options, component) {
      if (options.name === 'main') mainComponent = component;
      if (options.name === 'sidebar.panellist') glyphComponent = component;
      return () => {};
    },
  },
};
plugin.apply(ctx2);
assert.ok(mainComponent && glyphComponent);

hookIndex = 0;
hookStates = [];
mainComponent({
  t: (key) => (key === 'panel.title' ? '论文改写工作台' : 'sub'),
  useSessions: (selector) => selector({ byId: { s1: { id: 's1', retainedBy: { mainView: 1 } } } }),
});
const topLevelHooks = hookCalls;
const tree = mainComponent({
  t: (key) => (key === 'panel.title' ? '论文改写工作台' : 'sub'),
  useSessions: (selector) => selector({ byId: { s1: { id: 's1', retainedBy: { mainView: 1 } } } }),
});
/** Expand function components once so their rendered text is visible. */
function expand(node, depth = 0) {
  if (node === null || node === undefined || depth > 8) return node;
  if (Array.isArray(node)) return node.map((child) => expand(child, depth + 1));
  if (typeof node === 'object' && typeof node.type === 'function') {
    hookIndex = 0;
    return expand(node.type(node.props), depth + 1);
  }
  if (typeof node === 'object' && node.type) {
    return { type: node.type, props: expand(node.props, depth + 1), children: expand(node.children, depth + 1) };
  }
  return node;
}
const text = JSON.stringify(expand(tree), (key, value) => (typeof value === 'function' ? '[fn]' : value));
for (const expected of ['论文改写工作台', '技巧组合', '可扩展的指令库', '任务单预览', '生成任务单并开始']) {
  assert.ok(text.includes(expected), `panel must render ${expected}`);
}
assert.ok(hookIndex >= 0, 'render pass completed');

const glyph = JSON.stringify(glyphComponent({ size: 16 }));
assert.ok(glyph.includes('"svg"'), 'panellist entry draws an svg glyph');

console.log('client smoke test: OK');
console.log('registered slots:', names.join(', '));
console.log('style tags appended:', styleTags.length);



