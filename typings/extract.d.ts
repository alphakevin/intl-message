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
export declare function extractMessages(opt?: Partial<ExtractingOptions>): void;
