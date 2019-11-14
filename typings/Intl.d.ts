import * as _ from 'lodash';
import { LocaleConfig, LanguageListItem, MessageDescriptor, MessageVariables, FormatMessageOptions } from './types';
/**
 * Language message detector and translator
 */
export default class Intl {
    /**
     * @description Default language fallback
     */
    defaultLanguage: string;
    /**
     * @description Currently used language
     */
    language: string;
    /**
     * @description Detected navigator language
     */
    navigatorLanguage?: string;
    /**
     * @description Message dictionaries
     */
    locales: LocaleConfig;
    constructor(locales: LocaleConfig);
    /**
     * fill in empty message with default language message
     */
    prepareLocales(): void;
    /**
     * Calculate and get best match language
     */
    getPreferredLanguage(): string;
    /**
     * Sync with `localStorage`
     */
    getStoredLanguage(): string;
    /**
     * Get language name in its own language
     * @param lang - language code
     */
    getLanguageName(lang: string): string;
    /**
     * Sync with `moment()`
     */
    setMomentLocale(): void;
    /**
     * Set current language
     * @param lang - Language code to be used
     */
    setLang(lang: string): void;
    getLang(): string;
    getLocaleNativeNames(): {
        [x: string]: string;
    };
    /**
     * Get language list with name of native language
     */
    getLanguageList(): LanguageListItem[];
    /**
     * Auto detect navigator language
     */
    detectNavigatorLanguage(): string | undefined;
    /**
     * Get message template for specified language
     * @param desc - Message descriptor
     * @param locale - language code
     */
    getMessageTemplate(desc: MessageDescriptor, locale?: string): string;
    /**
     * Format date string
     * @param date - Date object
     * @param format - Date format
     */
    formatDate(date: Date, format?: string): string;
    /**
     * Format time string
     * @param date - Date object
     * @param format - Date format
     */
    formatTime(date: Date, format?: string): string;
    /**
     * Format relative time string
     * @param date - Date object
     * @param format - Date format for a week ago
     */
    formatRelative(date: Date, format?: string): string;
    /**
     * Translate message in current locale
     * @param desc - Message descriptor
     * @param values - Variable values to replace in message template
     * @param locale - Locale code, e.g. zh-CN
     * @param options - Additional options
     * @param options.fallback - Default message when nothing matched
     */
    formatMessage(desc: MessageDescriptor | string, values?: MessageVariables, locale?: string, options?: FormatMessageOptions): string;
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
    replaceMessageVariables(str: string, values?: MessageVariables, locale?: string, fallback?: string): string;
    /**
     * Parse message and extract variables - reverse function of `replaceMessageVariables`
     * @param desc - Message descriptor
     * @param str - Message string
     * @param locale - Language code
     * @returns Variables
     */
    parseMessageVariables(desc: MessageDescriptor, str: string, locale: string): _.Dictionary<string>;
    /**
     * Get language dictionary
     * @param locale - Language code
     */
    getMessages(locale?: string): import("./types").MessageDictionary;
    /**
     * Update `html` `lang` attribute & page title
     */
    updatePage(): void;
    /**
     * Init in client
     */
    init(): void;
}
