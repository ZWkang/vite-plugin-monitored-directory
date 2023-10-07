import { createFilter, type Plugin } from 'vite';
import { FilterPattern } from '@rollup/pluginutils';

import colors from 'picocolors';
import path from 'node:path';

import pkg from '../package.json';

interface Options {
  [key: string]: any;

  enforce?: Plugin['enforce'];
  include?: FilterPattern;
  exclude?: FilterPattern;
  options?: { resolve?: string | false | null };
}

function prettyPrintPath(pathText: string) {
  const baseName = path.basename(pathText);
  const dirPath = path.dirname(pathText);
  return `${colors.gray(`${dirPath}/`)}${colors.green(baseName)}`;
}

export const queryRE = /\?.*$/s;
export const hashRE = /#.*$/s;

export const cleanUrl = (url: string): string => url.replace(hashRE, '').replace(queryRE, '');

const DEFAULT_INCLUDE = ['**/*'];
const DEFAULT_EXCLUDE = [/\/Deprecated\/*/i, /\/__Deprecated\/*/i];

function printList(list: Set<string>, root: string) {
  console.log('');
  console.log(
    `${colors.cyan(`[${pkg.name}]:`)} There are a total of ${colors.cyan(
      `${list.size} files`,
    )} found that are referenced in the monitoring directory.`,
  );
  for (const item of list) {
    console.log(prettyPrintPath(item.replace(root, '.')));
  }
  console.log('');
  console.log('');
}

function VitePlugin(opts: Options = {}): Plugin {
  const {
    enforce = 'post',
    include = DEFAULT_INCLUDE,
    exclude = DEFAULT_EXCLUDE,
    options,
    root = process.cwd(),
  } = opts;

  const coll = new Set<string>();
  return {
    name: `vite-plugin-not-using`,
    enforce,
    load(id) {
      const url = cleanUrl(id);
      const filter = createFilter(include, exclude, options);
      if (!filter(url)) {
        coll.add(url);
      }
    },
    async closeBundle() {
      printList(coll, root);
      coll.clear();
    },
  };
}

export default VitePlugin;
