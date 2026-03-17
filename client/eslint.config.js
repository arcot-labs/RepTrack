import { includeIgnoreFile } from '@eslint/compat'
import js from '@eslint/js'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'
import globals from 'globals'
import { fileURLToPath, URL } from 'node:url'
import tseslint from 'typescript-eslint'

const gitignorePath = fileURLToPath(new URL('.gitignore', import.meta.url))

export default defineConfig([
    includeIgnoreFile(gitignorePath),
    globalIgnores(['src/components/ui', 'src/api/generated']),
    {
        files: ['src/**/*.{ts,tsx}'],
        extends: [
            js.configs.recommended,
            tseslint.configs.strictTypeChecked,
            tseslint.configs.stylisticTypeChecked,
            reactHooks.configs.flat.recommended,
            reactRefresh.configs.vite,
        ],
        languageOptions: {
            ecmaVersion: 2022,
            globals: globals.browser,
            parserOptions: {
                project: 'tsconfig.app.json',
            },
        },
        rules: {
            'no-console': 'warn',
            'no-restricted-imports': [
                'warn',
                {
                    patterns: [
                        {
                            group: ['.*', 'src/'],
                            message:
                                'Use @/ path alias instead of relative path',
                        },
                        {
                            group: ['@radix-ui/*'],
                            message:
                                'Use components from @/components/ui instead of radix-ui directly',
                        },
                    ],
                    paths: [
                        {
                            name: '@/components/ui/button',
                            message:
                                'Use Button from @/components/ui/overrides/button',
                        },
                        {
                            name: '@/components/ui/tooltip',
                            message:
                                'Use Tooltip from @/components/ui/overrides/tooltip',
                        },
                        {
                            name: 'sonner',
                            importNames: ['toast'],
                            message:
                                'Use notify from @/lib/notify instead of toast directly',
                        },
                    ],
                },
            ],
        },
    },
    {
        files: ['*.{js,ts}'],
        ignores: ['vite.config.ts'],
        extends: [js.configs.recommended],
    },
    {
        files: ['vite.config.ts'],
        extends: [
            js.configs.recommended,
            tseslint.configs.strictTypeChecked,
            tseslint.configs.stylisticTypeChecked,
        ],
        languageOptions: {
            ecmaVersion: 2022,
            globals: globals.node,
            parserOptions: {
                project: 'tsconfig.node.json',
            },
        },
    },
])
