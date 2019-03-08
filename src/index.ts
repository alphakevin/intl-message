import Intl from './Intl';
import { LocaleConfig } from './types';

function createIntlContext(locales: LocaleConfig) {
  return new Intl(locales);
}

export { Intl };

export default createIntlContext;
