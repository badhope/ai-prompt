/**
 * Prompt Engineering Optimizer
 * 提示词工程优化器
 *
 * Core: Same result, fewer tokens, better accuracy
 * 核心理念：同样的效果，更少的 token，更高的准确率
 */

export type Language = 'en' | 'zh' | 'auto';
export type CompressLevel = 0 | 1 | 2 | 3;
export type RoleType = 'code' | 'review' | 'translate' | 'doc' | 'test' | 'analyze' | 'architect' | 'security' | 'product' | 'math';
export type CoTType = 'none' | 'minimal' | 'structured' | 'selfconsistency' | 'leasttomost';
export type OutputFormat = 'none' | 'json' | 'markdown' | 'steps' | 'bullet';

export interface OptimizationOptions {
  language: Language;
  compressLevel: CompressLevel;
  role?: RoleType;
  cot: CoTType;
  format?: OutputFormat;
  targetTokens?: number;
}

interface CompressedTerm {
  original: RegExp;
  compressed: string;
}

export class PromptOptimizer {
  private static readonly LANG_PATTERNS = {
    en: /[a-zA-Z]{3,}/,
    zh: /[\u4e00-\u9fa5]/
  };

  private static readonly COMPRESS_ZH: CompressedTerm[] = [
    { original: /请你?/g, compressed: '' },
    { original: /详细的?/g, compressed: '' },
    { original: /一步一步/g, compressed: '' },
    { original: /非常感谢?/g, compressed: '' },
    { original: /麻烦/g, compressed: '' },
    { original: /谢谢/g, compressed: '' },
    { original: /一下/g, compressed: '' },
    { original: /帮我/g, compressed: '' },
    { original: /好吗/g, compressed: '' },
    { original: /可以吗/g, compressed: '' },
    { original: /专业的/g, compressed: '' },
    { original: /认真的/g, compressed: '' },
    { original: /仔细的/g, compressed: '' },
    { original: /尽可能/g, compressed: '' },
    { original: /接下来/g, compressed: '' },
    { original: /希望/g, compressed: '' },
    { original: /能够/g, compressed: '' },
    { original: /相应的/g, compressed: '' },
    { original: /进行/g, compressed: '' },
    { original: /提供/g, compressed: '' },
    { original: /使用/g, compressed: '用' },
    { original: /基于/g, compressed: '' },
  ];

  private static readonly COMPRESS_EN: CompressedTerm[] = [
    { original: /please\s+/gi, compressed: '' },
    { original: /could\s+you\s+/gi, compressed: '' },
    { original: /would\s+you\s+/gi, compressed: '' },
    { original: /kindly\s+/gi, compressed: '' },
    { original: /thank\s+you/gi, compressed: '' },
    { original: /thanks/gi, compressed: '' },
    { original: /in\s+detail/gi, compressed: '' },
    { original: /step\s+by\s+step/gi, compressed: '' },
    { original: /as\s+much\s+as\s+possible/gi, compressed: '' },
    { original: /i\s+want\s+you\s+to/gi, compressed: '' },
    { original: /i\s+would\s+like/gi, compressed: '' },
    { original: /can\s+you/gi, compressed: '' },
    { original: /help\s+me/gi, compressed: '' },
    { original: /professional/gi, compressed: '' },
    { original: /carefully/gi, compressed: '' },
    { original: /thoroughly/gi, compressed: '' },
  ];

  private static readonly ROLES_ZH: Record<RoleType, string> = {
    code: '代码专家',
    review: '代码审查',
    translate: '翻译',
    doc: '文档写作',
    test: '测试专家',
    analyze: '数据分析',
    architect: '架构师',
    security: '安全专家',
    product: '产品经理',
    math: '数学专家',
  };

  private static readonly ROLES_EN: Record<RoleType, string> = {
    code: 'Expert programmer',
    review: 'Code reviewer',
    translate: 'Translator',
    doc: 'Technical writer',
    test: 'QA expert',
    analyze: 'Data analyst',
    architect: 'Architect',
    security: 'Security expert',
    product: 'Product manager',
    math: 'Mathematician',
  };

  private static readonly COT_ZH: Record<string, string> = {
    minimal: '先思考再回答。',
    structured: '1.分析：2.推理：3.验证：4.结论：',
    selfconsistency: '从3个不同角度推理，取最优答案。',
    leasttomost: '拆解子问题，逐个解决。',
  };

  private static readonly COT_EN: Record<string, string> = {
    minimal: 'Think step by step.',
    structured: '1.Analyze: 2.Reason: 3.Verify: 4.Conclude:',
    selfconsistency: 'Reason from 3 perspectives, pick best.',
    leasttomost: 'Break into subproblems, solve sequentially.',
  };

  private static readonly FORMAT_ZH: Record<string, string> = {
    json: '输出严格JSON。',
    markdown: '用Markdown。',
    steps: '分步骤。',
    bullet: '分点。',
  };

  private static readonly FORMAT_EN: Record<string, string> = {
    json: 'Output valid JSON only.',
    markdown: 'Use Markdown.',
    steps: 'Numbered steps.',
    bullet: 'Bullet points.',
  };

  private detectLang(text: string): 'en' | 'zh' {
    const enScore = (text.match(PromptOptimizer.LANG_PATTERNS.en) || []).length;
    const zhScore = (text.match(PromptOptimizer.LANG_PATTERNS.zh) || []).length;
    return zhScore > enScore ? 'zh' : 'en';
  }

  optimize(text: string, userOpts?: Partial<OptimizationOptions>) {
    const opts: OptimizationOptions = {
      language: 'auto',
      compressLevel: 2,
      cot: 'minimal',
      ...userOpts
    };

    const lang = opts.language === 'auto' ? this.detectLang(text) : opts.language;
    const originalLength = text.length;
    let result = text.trim();

    if (opts.compressLevel >= 1) {
      result = this.basicCompress(result, lang);
    }
    if (opts.compressLevel >= 2) {
      result = this.deepCompress(result, lang);
    }
    if (opts.compressLevel >= 3) {
      result = this.aggressiveCompress(result, lang);
    }

    const roles = lang === 'zh' ? PromptOptimizer.ROLES_ZH : PromptOptimizer.ROLES_EN;
    if (opts.role && roles[opts.role]) {
      result = `${roles[opts.role]}。${result}`;
    }

    const cots = lang === 'zh' ? PromptOptimizer.COT_ZH : PromptOptimizer.COT_EN;
    if (opts.cot !== 'none' && cots[opts.cot]) {
      result = `${result}${cots[opts.cot]}`;
    }

    const formats = lang === 'zh' ? PromptOptimizer.FORMAT_ZH : PromptOptimizer.FORMAT_EN;
    if (opts.format && opts.format !== 'none' && formats[opts.format]) {
      result = `${result}${formats[opts.format]}`;
    }

    result = result.replace(/。+/g, '。').replace(/\.+/g, '.').trim();

    return {
      original: text,
      optimized: result,
      language: lang,
      tokenSaved: originalLength - result.length,
      compressionRate: originalLength > 0 ? (originalLength - result.length) / originalLength : 0,
      options: opts
    };
  }

  private basicCompress(text: string, lang: 'en' | 'zh'): string {
    let result = text;
    const map = lang === 'zh' ? PromptOptimizer.COMPRESS_ZH : PromptOptimizer.COMPRESS_EN;
    for (const { original, compressed } of map) {
      result = result.replace(original, compressed);
    }
    return result;
  }

  private deepCompress(text: string, _lang: 'en' | 'zh'): string {
    return text
      .replace(/\s+/g, ' ')
      .replace(/([，。！？；：])\1+/g, '$1')
      .trim();
  }

  private aggressiveCompress(text: string, _lang: 'en' | 'zh'): string {
    return text
      .replace(/的/g, '')
      .replace(/了/g, '')
      .replace(/着/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }
}

export function createOptimizer() {
  return new PromptOptimizer();
}

export function optimizePrompt(text: string, opts?: Partial<OptimizationOptions>) {
  return new PromptOptimizer().optimize(text, opts);
}
