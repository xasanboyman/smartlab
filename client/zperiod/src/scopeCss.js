// Build-time CSS scoping for the vendored Zperiod stylesheets: every selector is nested under
// `.zp-root`, and `:root` / `html` / `body` rules are rewritten to the root element itself, so the
// upstream global styles cannot leak into the rest of SmartLab. Used by the Vite plugin below.

const VERBATIM_AT_RULES = new Set([
  "@keyframes",
  "@-webkit-keyframes",
  "@font-face",
  "@page",
  "@counter-style",
  "@property",
  "@font-feature-values",
]);

function splitSelectors(list) {
  const out = [];
  let depth = 0;
  let cur = "";
  for (const ch of list) {
    if (ch === "(" || ch === "[") depth++;
    else if (ch === ")" || ch === "]") depth--;
    if (ch === "," && depth === 0) {
      out.push(cur);
      cur = "";
    } else cur += ch;
  }
  out.push(cur);
  return out.map((s) => s.trim()).filter(Boolean);
}

function rewriteSelector(sel, scope) {
  if (/^(from|to|\d+(\.\d+)?%)$/.test(sel)) return sel;
  if (sel.startsWith(scope)) return sel;
  if (sel.startsWith(":root")) return scope + sel.slice(5);
  if (/^html(?![\w-])/.test(sel)) return scope + sel.slice(4);
  if (/^body(?![\w-])/.test(sel)) return scope + sel.slice(4);
  return `${scope} ${sel}`;
}

function findBlockEnd(src, open) {
  let depth = 0;
  for (let j = open; j < src.length; j++) {
    const c = src[j];
    if (c === "{") depth++;
    else if (c === "}") {
      depth--;
      if (depth === 0) return j;
    }
  }
  return src.length;
}

function processRules(src, scope) {
  let res = "";
  let k = 0;
  while (k < src.length) {
    const open = src.indexOf("{", k);
    const semi = src.indexOf(";", k);
    if (open === -1) {
      res += src.slice(k);
      break;
    }
    if (semi !== -1 && semi < open) {
      res += src.slice(k, semi + 1);
      k = semi + 1;
      continue;
    }
    const prelude = src.slice(k, open).trim();
    const close = findBlockEnd(src, open);
    const body = src.slice(open + 1, close);
    if (prelude.startsWith("@")) {
      const name = prelude.split(/[\s(]/)[0].toLowerCase();
      res += VERBATIM_AT_RULES.has(name) ? `${prelude}{${body}}` : `${prelude}{${processRules(body, scope)}}`;
    } else if (prelude) {
      res += `${splitSelectors(prelude).map((s) => rewriteSelector(s, scope)).join(",")}{${body}}`;
    }
    k = close + 1;
  }
  return res;
}

export function scopeCss(css, scope = ".zp-root") {
  const stripped = css.replace(/\/\*[\s\S]*?\*\//g, "");
  return processRules(stripped, scope);
}

// Vite plugin: scopes every stylesheet under client/zperiod/css and client/zperiod/src.
export function zperiodCssScope(options = {}) {
  const match = options.match || /[\\/]zperiod[\\/](css|src)[\\/].*\.css$/;
  const scope = options.scope || ".zp-root";
  return {
    name: "zperiod-css-scope",
    enforce: "pre",
    transform(code, id) {
      if (!match.test(id.split("?")[0])) return null;
      return { code: scopeCss(code, scope), map: null };
    },
  };
}
