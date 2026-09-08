/**
 * ESLint config. `npm run lint` was advertised in package.json but no config had
 * ever been committed, so it failed with "couldn't find a configuration file" —
 * which is how a `//` comment placed inside a JSX opening tag reached a build.
 */
module.exports = {
    root: true,
    env: { browser: true, es2022: true, node: true },
    extends: [
        'eslint:recommended',
        'plugin:react/recommended',
        'plugin:react/jsx-runtime',
        'plugin:react-hooks/recommended',
    ],
    parserOptions: { ecmaVersion: 'latest', sourceType: 'module' },
    settings: { react: { version: '18.2' } },
    plugins: ['react-refresh'],
    ignorePatterns: ['dist', 'node_modules', 'server/data', '*.config.js'],
    rules: {
        // The data modules export a const and a default; that is intentional.
        'react-refresh/only-export-components': 'off',
        'react/prop-types': 'off',
        'no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
    },
    overrides: [
        {
            // Server code is Node ESM, not browser.
            files: ['server/**/*.js', 'api/**/*.js'],
            env: { node: true, browser: false },
            extends: ['eslint:recommended'],
            rules: { 'no-console': 'off' },
        },
    ],
};
