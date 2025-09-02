import eslintjs from '@eslint/js'
import eslintjsdoc from 'eslint-plugin-jsdoc'
import unicorn from 'eslint-plugin-unicorn'

import eslintPluginJsonc from 'eslint-plugin-jsonc'
import eslintPluginYml from 'eslint-plugin-yml'

import globals from 'globals'

import { defineConfig } from "eslint/config";

export default defineConfig([
    {
        ignores: [
            'build/',
            'node_modules/',
            'FlatpakRepo',
            '.flatpak-builder/'
        ]
    },
    {
        files: ['src/*.js', 'eslint.config.js'],
        languageOptions: {
            globals: {
                ...globals.node
            },
            parserOptions: {
                sourceType: 'module'
            }
        },
        extends: [
            eslintjs.configs.recommended,
            unicorn.configs.recommended,
            eslintjsdoc.configs['flat/recommended']
        ],
        rules: {
            'jsdoc/require-returns': 'off',
            'jsdoc/require-returns-description': 'off'
        }
    },
    {
        files: ['data/*.json', '*.json'],
        extends: [
            eslintPluginJsonc.configs['flat/recommended-with-json']
        ]
    },
    {
        files: ['.github/**/*.yaml'],
        extends: [
            eslintPluginYml.configs['flat/recommended']
        ]
    }
])