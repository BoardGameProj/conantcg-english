module.exports = {
  // 扫描所有可能使用Tailwind的文件
  content: [
    "./**/*.html",
    "./**/*.md",
    "./config.toml",
    "./node_modules/flowbite/**/*.js",
    "./src/**/*.{js,ts,jsx,tsx}"  // 如果使用JS框架请添加
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

      // 深色模式下的排版样式
      typography: (theme) => ({
        DEFAULT: {
          css: {
            maxWidth: "none" // 移除prose默认宽度限制
          }
        },
        dark: {
          css: {
            color: theme("colors.gray.200"),
            a: {
              color: theme("colors.primary.light"),
              "&:hover": {
                color: theme("colors.primary.DEFAULT"),
              },
            },
            // 其他深色模式排版样式...
          }
        }
      })
    }
  },


  safelist: [
    {
      pattern: /(bg|text|border)-(warmgray|primary|black|white)/, // 颜色安全列表
    },
    {
      pattern: /(opacity|bg-opacity)-[0-9]+/, // 透明度安全列表
    },
    {
      pattern: /group-hover:(opacity|bg-opacity|bg-black|scale)-.+/
    },
    'group-hover:opacity-100', // 显式指定需要保障的group-hover类
    'group-hover:bg-opacity-70',
    'group-hover:bg-black/20',
    'group-hover:scale-105'
  ],

  // 插件配置
  plugins: [
    require("@tailwindcss/typography"), // 排版插件
    require('flowbite/plugin'),         // Flowbite组件库
    // require('tailwindcss-textshadow')   // 文本阴影插件（可选）
  ]
}