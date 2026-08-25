export const locales = {
  en: {
    'turn-nav.aria': 'Turn navigation',
    'turn-nav.goto': (n: number) => `Go to turn ${n}`,
  },
  zh: {
    'turn-nav.aria': '轮次导航',
    'turn-nav.goto': (n: number) => `跳转到第 ${n} 轮`,
  },
} as const
