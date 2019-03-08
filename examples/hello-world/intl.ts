import { Intl } from '../..';
import { LocaleConfig } from '../../typings/types';
export const locales = ['en', 'es', 'fr', 'it', 'ja', 'ko', 'ru', 'zh-cn', 'zh-hk'];
const localeConfig: LocaleConfig = {};
locales.forEach(lang => {
  localeConfig[lang] = require(`./locales/${lang}.json`);
});
const intl = new Intl(localeConfig);
export default intl;
export const __ = intl.formatMessage.bind(intl);
