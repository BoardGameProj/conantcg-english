module.exports = {
  // 扫描所有可能使用Tailwind的文件
  content: [
    "./**/*.html",
    "./**/*.md",
    "./config.toml",
    "./node_modules/flowbite/**/*.js",
    "./**/*.{html,js}",
    "./static/js/**/*.js",
    "./**/*.{js,ts,jsx,tsx}"
  ],

  // 启用黑暗模式（class驱动）
  darkMode: "class",

  // 核心主题配置
  theme: {
    extend: {
      // 自定义颜色
      opacity: ['group-hover'],
      scale: ['group-hover'],
      colors: {
        warmgray: {
          50: "#fafafa",
          100: "#f5f5f5",
          200: "#e5e5e5",
          300: "#d4d4d4",
          400: "#a3a3a3",
          500: "#737373",
          600: "#525252",
          700: "#3a3a3a",
          800: "#1f1f1f",
          900: "#1a1a1a",
        },
        // 扩展默认颜色
        primary: {
          DEFAULT: "#2563eb",
          light: "#3b82f6",
          dark: "#1d4ed8"
        }
      },

      // 自定义透明度（确保 bg-black/70 类似用法）
      opacity: {
        5: "0.05",
        10: "0.1",
        15: "0.15",
        20: "0.2",
        70: "0.7",
        85: "0.85"
      },

      // 自定义间距/尺寸
      spacing: {
        18: "4.5rem",
        112: "28rem",
        128: "32rem"
      },

      typography: (theme) => ({
        DEFAULT: {},
        dark: {
          css: {
            color: theme("colors.gray.200"),
            a: {
              color: theme("colors.gray.200"),
              "&:hover": {
                color: theme("colors.gray.200"),
              },
            },
            "h2 a": {
              color: theme("colors.gray.200"),
            },
            h1: {
              color: theme("colors.gray.200"),
            },
            h2: {
              color: theme("colors.gray.200"),
            },
            h3: {
              color: theme("colors.gray.200"),
            },
            h4: {
              color: theme("colors.gray.200"),
            },
            h5: {
              color: theme("colors.gray.200"),
            },
            h6: {
              color: theme("colors.gray.200"),
            },
            th: {
              color: theme("colors.gray.200"),
            },
            strong: {
              color: theme("colors.gray.200"),
            },
            code: {
              color: theme("colors.gray.200"),
            },
            figcaption: {
              color: theme("colors.gray.200"),
            },
            blockquote: {
              color: theme("colors.gray.200"),
            },
          },
        },
      }),
    }
  },


  safelist: [
    {
      pattern: /(bg|text|border)-(warmgray|primary|black|white)/,
    },
    {
      pattern: /(opacity|bg-opacity)-[0-9]+/,
    },
    {
      pattern: /(max|min)-(w|h)-[0-9]+/,
    },
    'group-hover:opacity-100',
    'group-hover:bg-opacity-70',
    'group-hover:bg-black/20',
    'group-hover:scale-105',
    'group-hover:scale-110',
    'max-h-[90vh]',
    'col-span-5',
    'max-h-32'
  ],

  // 插件配置
  plugins: [
    require("@tailwindcss/typography"),
    require('flowbite/plugin'),
  ]
}