export interface MessageDictionary {
  [id: string]: string;
}

export interface LocaleConfig {
  [id: string]: MessageDictionary;
}

export interface MessageDescriptor {
  id: string;
  defaultMessage?: string;
}

export interface MessageVariables {
  [key: string]: string | number;
}

export interface LanguageListItem {
  lang: string;
  name: string;
}

export interface FormatMessageOptions {
  fallback?: string;
}

export interface FileMapItem {
  id: string;
  pos: string;
  code: string;
  ln: number;
  col: number;
}

export interface FileMap {
  [key: string]: FileMapItem[];
}

export interface MessageMapItem {
  pos: string;
  code: string;
  keys?: string[];
}

export interface MessageMap {
  [key: string]: MessageMapItem[];
}
