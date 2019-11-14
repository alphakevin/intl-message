import _ from 'lodash';
import parser from 'accept-language-parser';
import moment from 'moment';
import IntlMessageFormat from 'intl-messageformat';
import { isBrowser } from 'browser-or-node';
import {
  LocaleConfig,
  LanguageListItem,
  MessageDescriptor,
  MessageVariables,
  FormatMessageOptions,
} from './types';

/**
 * Language message detector and translator
 */
export default class Intl {

  /**
   * @description Default language fallback
   */
  public defaultLanguage: string;
  /**
   * @description Currently used language
   */
  public language: string;
  /**
   * @description Detected navigator language
   */
  public navigatorLanguage?: string;
  /**
   * @description Message dictionaries
   */
  public locales: LocaleConfig;

  constructor(locales: LocaleConfig) {
    this.defaultLanguage = 'en';
    this.language = 'en';
    this.navigatorLanguage = 'en';
    this.locales = locales;
    this.init();
  }

  /**
   * fill in empty message with default language message
   */
  prepareLocales() {
    const defaultLocale = this.locales[this.defaultLanguage];
    for (const lang of Object.keys(this.locales)) {
      if (lang === this.defaultLanguage) {
        continue;
      }
      const messages = this.locales[lang];
      for (const id of Object.keys(messages)) {
        if (!messages[id]) {
          messages[id] = `[${this.defaultLanguage}]${defaultLocale[id]}`;
        }
      }
    }
  }

  /**
   * Calculate and get best match language
   */
  getPreferredLanguage(): string {
    if (!isBrowser) {
      throw new Error('getPreferredLanguage() can be only called in browser');
    }
    const lang = localStorage.getItem('lang') || this.detectNavigatorLanguage();
    if (lang && this.locales[lang]) {
      return lang;
    }
    return this.defaultLanguage;
  }

  /**
   * Sync with `localStorage`
   */
  getStoredLanguage() {
    return localStorage.getItem('lang') || 'auto';
  }

  /**
   * Get language name in its own language
   * @param lang - language code
   */
  getLanguageName(lang: string) {
    if (lang === 'auto') {
      const nativeName = this.formatMessage({ id: 'intl.language' }, {}, this.navigatorLanguage);
      return this.formatMessage({ id: 'intl.autoDetectWithLanguage', defaultMessage: 'Automatic: {language}' }, { language: nativeName });
    }
    return this.formatMessage({ id: 'intl.language' }, {}, lang);
  }

  /**
   * Sync with `moment()`
   */
  setMomentLocale() {
    const locale = this.language.toLowerCase();
    moment.locale(locale);
  }

  /**
   * Set current language
   * @param lang - Language code to be used
   */
  setLang(lang: string) {
    if (!isBrowser) {
      throw new Error('getPreferredLanguage() can be only called in browser');
    }
    if (lang === this.getStoredLanguage()) {
      return;
    }
    if (!lang || lang.toLowerCase() === 'auto') {
      localStorage.removeItem('lang');
    } else {
      this.language = lang;
      localStorage.setItem('lang', lang);
    }
    window.location.reload();
  }

  getLang() {
    return this.language;
  }

  getLocaleNativeNames() {
    return _.mapValues(this.locales, messages => messages['intl.language']);
  }

  /**
   * Get language list with name of native language
   */
  getLanguageList() {
    const list: LanguageListItem[] = [];
    _.each(this.locales, (messages, lang) => {
      list.push({
        lang,
        name: messages['intl.language'] || lang,
      });
    });
    return list;
  }

  /**
   * Auto detect navigator language
   */
  detectNavigatorLanguage(): string | undefined {
    const supported = _.keys(this.locales);
    const singleLang = navigator.language || (navigator as any).userLanguage;
    // prefer language list than single language
    const languages = _.concat(navigator.languages) || (singleLang ? [singleLang] : []);
    // append parent language for fallback
    languages.filter(lang => _.includes(lang, '-')).forEach(lang => {
      [lang] = lang.split('-');
      if (!_.includes(languages, lang)) {
        languages.push(lang);
      }
    });
    // generate accept-language format
    let q = 1;
    const accepts = languages.map(lang => {
      const qStr = q === 1 ? '' : `;q=${q}`;
      q -= 0.1;
      return lang + qStr;
    });
    const acceptLanguages = accepts.join(',');
    this.navigatorLanguage = parser.pick(supported, acceptLanguages) || undefined;
    return this.navigatorLanguage;
  }

  /**
   * Get message template for specified language
   * @param desc - Message descriptor
   * @param locale - language code
   */
  getMessageTemplate(desc: MessageDescriptor, locale?: string) {
    if (_.isString(desc)) {
      desc = { id: desc };
    }
    if (!_.isPlainObject(desc) || !desc.id) {
      throw new Error('invalid message description');
    }
    const messages = this.getMessages(locale);
    return messages[desc.id];
  }

  /**
   * Format date string
   * @param date - Date object
   * @param format - Date format
   */
  formatDate(date: Date, format = 'YYYY-MM-DD') {
    return moment(date).format(format);
  }

  /**
   * Format time string
   * @param date - Date object
   * @param format - Date format
   */
  formatTime(date: Date, format = 'HH:mm') {
    return moment(date).format(format);
  }

  /**
   * Format relative time string
   * @param date - Date object
   * @param format - Date format for a week ago
   */
  formatRelative(date: Date, format = 'YYYY-MM-DD'): string {
    const d = moment(date);
    if (d.diff(moment(), 'weeks') <= 1) {
      return d.fromNow();
    }
    return d.format(format);
  }

  /**
   * Translate message in current locale
   * @param desc - Message descriptor
   * @param values - Variable values to replace in message template
   * @param locale - Locale code, e.g. zh-CN
   * @param options - Additional options
   * @param options.fallback - Default message when nothing matched
   */
  formatMessage(desc: MessageDescriptor | string, values?: MessageVariables, locale?: string, options: FormatMessageOptions = {}) {
    const { fallback } = options;
    if (_.isString(desc)) {
      desc = { id: desc };
    }
    let str = this.getMessageTemplate(desc, locale);
    str = str || desc.defaultMessage || '';
    if (!str) {
      str = desc.id;
      if (fallback) {
        return fallback;
      }
      console.error(`Could not found language message "${desc.id}", fallback to message id`);
    }
    str = this.replaceMessageVariables(str, values, locale, fallback);
    try {
      const fmt = new IntlMessageFormat(str, locale || this.language);
      str = fmt.format(values);
    } catch (err) {
      console.error(err);
    }
    return str;
  }

  /**
   * Format string template
   * @param str - String template
   * @param values - Template variables
   * @param fallback - Fallback if variables not found
   * @returns Formated string
   * @example
     ```javascript
     message.replaceMessageVariables('{user} assigned {assignee} a task', {user: 'Jack', assignee: 'Black'})
     // => 'Jack assigned Black a task'
     // Use another message in template:
     message.replaceMessageVariables('User status is {@'user.status.{status}'}', {status: 'ok'})
     // => call formatMessage({id: 'user.status.ok'})
     ```
   */
  replaceMessageVariables(str: string, values: MessageVariables = {}, locale?: string, fallback?: string): string {
    const pattern = /{(\w+|@'((?:[\w\.]+|{\w+})+?)')}/g;
    const original = str;
    let found = pattern.exec(str);
    if (found && !_.isObject(values)) {
      console.warn(`message '${original}': values are not provided`);
      if (fallback) {
        return fallback;
      }
    }
    const replace: MessageVariables = {};
    const missingKeys = [];
    while (found) {
      const [wrap, key, expression] = found;
      let value;
      if (expression) {
        const msgId = this.replaceMessageVariables(expression, values);
        value = this.formatMessage({ id: msgId }, {}, locale);
      } else {
        value = values[key];
      }
      if (value) {
        replace[wrap] = value;
      } else {
        missingKeys.push(wrap);
      }
      found = pattern.exec(str);
    }
    if (missingKeys.length) {
      console.warn(`message '${original}': missing variable value(s) ${missingKeys.join(', ')}`);
      if (fallback) {
        console.warn(`using fallback: '${fallback}'`);
        return fallback;
      }
    }
    _.each(replace, (value, key) => {
      str = str.replace(key, `${value}`);
    });
    return str;
  }

  /**
   * Parse message and extract variables - reverse function of `replaceMessageVariables`
   * @param desc - Message descriptor
   * @param str - Message string
   * @param locale - Language code
   * @returns Variables
   */
  parseMessageVariables(desc: MessageDescriptor, str: string, locale: string) {
    const template = this.getMessageTemplate(desc, locale);
    const pattern = /\{\w+\}/g;
    if (!template) {
      return {};
    }
    const wrappedKeys = template.match(pattern);
    pattern.lastIndex = 0;
    if (!wrappedKeys) {
      return {};
    }
    const keys = wrappedKeys.map(v => v.replace(/\{|\}/g, ''));
    const parts = template.split(pattern);
    const values = [];
    let part = parts.shift();
    let pos = part ? str.indexOf(part) : str.length;
    while (part !== undefined && pos >= 0) {
      if (pos === 0) {
        str = str.slice(part.length);
      } else {
        const value = str.slice(0, pos);
        str = str.slice(pos + part.length);
        values.push(value);
      }
      part = parts.shift();
      pos = part ? str.indexOf(part) : str.length;
    }
    if (values.length === keys.length) {
      return _.zipObject(keys, values);
    }
    return {};
  }

  /**
   * Get language dictionary
   * @param locale - Language code
   */
  getMessages(locale?: string) {
    return this.locales[locale || this.language];
  }

  /**
   * Update `html` `lang` attribute & page title
   */
  updatePage() {
    if (!isBrowser) {
      throw new Error('updatePage() can be only called in browser');
    }
    document.getElementsByTagName('html')[0].setAttribute('lang', this.language);
    document.title = this.formatMessage({ id: 'page.defaultTitle' });
  }

  /**
   * Init in client
   */
  init() {
    if (!isBrowser) {
      return;
    }
    this.prepareLocales();
    this.language = this.getPreferredLanguage();
    this.setMomentLocale();
    this.updatePage();
  }
}
