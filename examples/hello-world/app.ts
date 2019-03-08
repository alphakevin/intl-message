import intl, { __, locales } from './intl';
locales.forEach(lang => {
  intl.language = lang;
  console.log(__({ id: 'hello' }));
})
