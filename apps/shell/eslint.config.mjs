import root from '../../eslint.config.mjs';
import next from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';

const config = [...root, ...next, ...nextTs];

export default config;
