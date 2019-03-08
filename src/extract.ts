import * as fs from 'fs';
import * as path from 'path';
import * as program from 'commander';
import * as _ from 'lodash';
import * as glob from 'glob';
import mkdirp = require('mkdirp');
import {
  MessageDescriptor,
  MessageDictionary,
  FileMap,
  MessageMap,
  MessageMapItem,
} from './types';


program
  .version('1.0.0')

program.parse(process.argv);

const baseDir = path.normalize(process.env.PWD || '.');

export interface ExtractingParserOptions {
  regex: RegExp;
  parser: 'object' | 'string';
}

export interface ExtractingOptions {
  sourceDir: string[];
  localesDir: string;
  defaultLanguage: string;
  outputDir: string;
  extensions: string[];
  locales: string[];
  fallback: string | null;
  sortBy: string;
  reserveKeys: boolean;
  emptyTags: boolean;
  jsonIntend: number;
  patterns: ExtractingParserOptions[];
}

const defaultOptions: ExtractingOptions = {
  sourceDir: [],
  localesDir: 'locales',
  defaultLanguage: 'en',
  outputDir: 'locales/.extract',
  extensions: ['js', 'jsx', 'ts', 'tsx'],
  locales: ['en', 'es', 'fr', 'it', 'ja', 'ko', 'ru', 'zh-cn', 'zh-hk'],
  fallback: null, // language or null
  sortBy: 'keys', // 'source', 'keys', null
  reserveKeys: true,
  emptyTags: true,
  jsonIntend: 4,
  patterns: [
    {
      regex: /\bformatMessage\(\s*(\{[\s\S]+?\}(?=,|\)))/g,
      parser: 'object',
    },
    {
      regex: /\b__\(\s*(\{[\s\S]+?\}(?=,|\)))/g,
      parser: 'object',
    },
    {
      regex: /\b__\(\s*'((?:[^'\\]|\\.)*)'\s*\)/g,
      parser: 'string',
    },
    {
      regex: /<FormattedMessage id="([^"]+)"(?:\s*values=\{\\s*{\s*([^\{]+)\s*\}\s*\})?\s*\/>/g,
      parser: 'string',
    },
    // Meteor Errors
    {
      regex: /Meteor\.Error\(\d+,\s?'([\w\.]+)'.*\)/g,
      parser: 'string',
    }
  ],
};

function extractKeys(source: string): string[] | undefined {
  if (!source) return undefined;
  const parts = source.replace(/^\{|\}$/g, '').split(',');
  const keys = parts.map(exp => exp.split(':')[0].replace(/^\s|\s$/g, ''));
  return keys;
}

function parseMessageDefine(str: string) {
  let define: Partial<MessageDescriptor> = {};
  try {
    str = str.replace(/\$/g, '');
    eval(`define = ${str}`);
  } catch(e) {
    define = {};
    return null;
  }
  if (define.id && !/^[a-zA-Z_.\-]+$/.test(define.id)) {
    console.log(define.id);
    return null;
  }
  if (define.defaultMessage) {
    define.defaultMessage = define.defaultMessage.replace(/\{.+?\}/g, tag => {
      return `{${_.camelCase(tag)}}`;
    });
  }
  return _.pick(define, 'id', 'defaultMessage');
}

function readJSON(path: string, defaultValue: any = {}): any {
  if (fs.existsSync(path)) {
    const content = fs.readFileSync(path, 'utf8');
    return JSON.parse(content);
  } else {
    return defaultValue;
  }
}

function writeJSON(path: string, object: any, options: ExtractingOptions) {
  fs.writeFileSync(path, JSON.stringify(object, null, options.jsonIntend) + '\n');
}

export function extractMessages(opt: Partial<ExtractingOptions> = {}) {
  const options: ExtractingOptions = _.defaults(opt, defaultOptions);
  console.log('intl tools v1.0.0');
  console.log('extracting intl messages with options:');
  console.log(options);
  if (!options.extensions.length) {
    options.extensions = ['*'];
  }
  const wildcard = options.sourceDir.length ?
    `@(${options.sourceDir.join('|')})/**/*.@(${options.extensions.join('|')})`
    :
    `**/*.@(${options.extensions.join('|')})`;
  const files = glob.sync(wildcard, {
    cwd: baseDir,
  });
  const fileMap: FileMap = {};
  const messageMap: MessageMap = {};
  const defaultMessages: MessageDictionary = {};
  files.forEach(file => {
    const filePath = path.normalize(`${baseDir}/${file}`);
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    lines.forEach((line, no) => {
      no += 1;
      options.patterns.forEach(({ regex, parser }) => {
        let result = regex.exec(line);
        while (result) {
          const [code, idStr, keyExp] = result;
          const pos = `${file}:${no}:${result.index}`;
          let id: string | undefined = idStr;
          if (parser == 'object') {
            const define = parseMessageDefine(idStr);
            if (!define) {
              console.error(`error parsing ${pos}: '${code}'`);
              result = regex.exec(line);
              continue;
            }
            if (define.id) {
              id = define.id;
              const { defaultMessage } = define;
              if (defaultMessage) {
                defaultMessages[id] = defaultMessage;
              }
            }
          } else if (parser == 'string') {
          }
          if (id) {
            if (!messageMap[id]) {
              messageMap[id] = [];
            }
            if (!fileMap[file]) {
              fileMap[file] = [];
            }
          }
          const keys = extractKeys(keyExp);
          let props: MessageMapItem = {
            pos,
            code,
          };
          if (keys) {
            props.keys = keys;
          }
          messageMap[id].push(props);
          fileMap[file].push({id: id, ...props, ln: no, col: result.index + 1});
          props = Object.assign({
            id,
          }, props, {
            ln: no,
            col: result.index + 1,
          });
          result = regex.exec(line);
        }
      });
    });
    if (fileMap[file]) {
      fileMap[file] = _.sortBy(fileMap[file], 'ln', 'col');
    }
  });
  const tags = _.keys(messageMap);
  const template = _.mapValues(messageMap,value => '');
  const getLocaleFile = (lang: string, withBase?: boolean) => {
    let path = `${options.localesDir}/${lang}.json`;
    if (withBase) {
      path = `${baseDir}/${path}`;
    }
    return path;
  };
  let fallback = {};
  if (options.fallback) {
    fallback = readJSON(getLocaleFile(options.fallback, true));
  }
  mkdirp.sync(`${baseDir}/${options.localesDir}`);
  options.locales.forEach(lang => {
    const dictFile = getLocaleFile(lang, true);
    let dict = readJSON(dictFile);
    if (lang === options.defaultLanguage) {
      dict = _.defaults(dict, defaultMessages);
    }
    dict = _.defaults(dict, fallback, options.emptyTags ? template : {});
    if (options.sortBy == 'keys') {
      dict = _(dict).toPairs().sortBy(0).fromPairs().value();
    }
    writeJSON(dictFile, dict, options);
  })
  console.log();
  console.log(`total ${files.length} files processed`);
  console.log(`total ${tags.length} messages extracted in ${_.keys(fileMap).length} files`);
  mkdirp.sync(`${baseDir}/${options.outputDir}`);
  const templateFile = `${options.outputDir}/template.json`;
  writeJSON(`${baseDir}/${templateFile}`, template, options);
  console.log(`template: ${templateFile}`);
  const messageMapFile = `${options.outputDir}/message-map.json`;
  writeJSON(`${baseDir}/${messageMapFile}`, messageMap, options);
  console.log(`message map: ${messageMapFile}`);
  const fileMapFile = `${options.outputDir}/file-map.json`;
  writeJSON(`${baseDir}/${fileMapFile}`, fileMap, options);
  console.log(`file map: ${fileMapFile}`);
  console.log(`locales:`);
  options.locales.forEach(lang => {
    const localeFile = getLocaleFile(lang);
    console.log(`  ${localeFile}`);
  });
}

if (require.main === module) {
  extractMessages();
}
