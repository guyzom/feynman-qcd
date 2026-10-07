function attribute(tag, name) {
  return tag.match(new RegExp(`\\s${name}\\s*=\\s*(["'])(.*?)\\1`, 'i'))?.[2];
}

function textOf(asset) {
  return typeof asset.source === 'string'
    ? asset.source
    : Buffer.from(asset.source).toString('utf8');
}

function escapeTerminator(text, element) {
  return text.replace(new RegExp(`</${element}`, 'gi'), match => match.replace('/', '\\/'));
}

/** Inline the app's single entry and stylesheet into one offline HTML file. */
export function inlineBuild() {
  return {
    name: 'inline-offline-build',
    apply: 'build',
    enforce: 'post',
    generateBundle: {
      order: 'post',
      handler(_options, bundle) {
        const fail = message => this.error(`Offline build: ${message}`);
        const files = Object.values(bundle);
        const pages = files.filter(file => file.type === 'asset' && file.fileName === 'index.html');
        const entries = files.filter(file => file.type === 'chunk' && file.isEntry);
        const styles = files.filter(file => file.type === 'asset' && file.fileName.endsWith('.css'));
        if (pages.length !== 1 || entries.length !== 1 || styles.length > 1) {
          fail('expected index.html, one JavaScript entry, and at most one stylesheet');
        }
        const page = pages[0];
        const entry = entries[0];
        if (entry.imports.length || entry.dynamicImports.length) {
          fail('the JavaScript entry contains external imports or dynamic chunks');
        }
        const allowed = new Set([page.fileName, entry.fileName, ...styles.map(file => file.fileName)]);
        const unexpected = files.filter(file => !allowed.has(file.fileName));
        if (unexpected.length) {
          fail(`unembedded assets or chunks: ${unexpected.map(file => file.fileName).join(', ')}`);
        }

        let entryTags = 0;
        let styleTags = 0;
        const localPath = value => value?.replace(/^\.\//, '');
        let html = textOf(page).replace(/<link\b[^>]*>/gi, tag => {
          const href = attribute(tag, 'href');
          if (attribute(tag, 'rel') !== 'stylesheet') {
            if (href !== undefined && !/^data:/i.test(href)) fail(`unexpected external link: ${href}`);
            return tag;
          }
          const style = styles.find(file => file.fileName === localPath(href));
          if (!style) fail(`stylesheet was not emitted in the bundle: ${href}`);
          styleTags += 1;
          return `<style>${escapeTerminator(textOf(style), 'style')}</style>`;
        });
        html = html.replace(/<script\b[^>]*>[\s\S]*?<\/script\s*>/gi, tag => {
          const opening = tag.slice(0, tag.indexOf('>') + 1);
          const src = attribute(opening, 'src');
          if (src === undefined) return tag;
          if (localPath(src) !== entry.fileName || attribute(opening, 'type') !== 'module') {
            fail(`unexpected external script: ${src}`);
          }
          entryTags += 1;
          return `<script type="module">${escapeTerminator(entry.code, 'script')}</script>`;
        });
        if (entryTags !== 1 || styleTags !== styles.length) {
          fail('every JavaScript entry and stylesheet must have exactly one HTML reference');
        }
        page.source = html;
        for (const fileName of allowed) {
          if (fileName !== page.fileName) delete bundle[fileName];
        }
      },
    },
  };
}
