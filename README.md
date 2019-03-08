# intl-message

Simple intl message translation

## Install

```shell
npm i intl-message
# or
yarn add intl-message
```

## Usage

See [hello world example](./examples/hello-world)

### Add command line tool to `package.json`

```js
{
  //...
  "script": {
    "intl:extract": "intl-extract"
  }
  //...
}
```

### Extracting Messages from Source Code

```shell
yarn intl:extract
```

### Source Code

`intl.js`

```js
import { Intl } from 'intl-message';
const intl = new Intl({
  en: require('./locales/en.json'),
  'zh-cn': require('./locales/zh-cn.json'),
});
export default intl;
export const __ = (...params) => intl.formatMessage(...params);
```

`app.js`

```js
import intl, { __ } from './intl';
console.log(__({ id: 'hello', defaultMessage: 'Hello, World!' }));
// Hello, World!
intl.language = 'zh-cn';
console.log(__({ id: 'hello' }));
// [en]Hello, World!
```

### Update Dictionary

Edit `locales/zh-ch.json`

```json
{
  "hello": "你好，世界！"
}
```

Run `app.js` again:

```text
Hello, World!
你好，世界！
```

## Licence

MIT
