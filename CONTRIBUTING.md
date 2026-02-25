# Contributing to Meeting Notes Distiller

Thanks for your interest in contributing! This guide will help you get started.

## Development Setup

1. Fork and clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Copy the environment file and add your API key:
   ```bash
   cp .env.local.example .env.local
   ```
4. Start the development server:
   ```bash
   npm run dev
   ```

## Running Tests

```bash
# Run the full test suite
npm test

# Run tests in watch mode during development
npm run test:watch
```

All 33 tests must pass before submitting a PR.

## Code Style

- **TypeScript** in strict mode — no `any` types unless absolutely necessary
- **ESLint** enforced via `npm run lint`
- **Tailwind CSS** for styling — avoid inline styles

## How to Contribute

### Reporting Bugs

Open an issue using the [bug report template](.github/ISSUE_TEMPLATE/bug_report.md) and include:

- Steps to reproduce
- Expected vs actual behavior
- Browser and OS information

### Suggesting Features

Open an issue using the [feature request template](.github/ISSUE_TEMPLATE/feature_request.md) describing:

- The problem you're trying to solve
- Your proposed solution
- Any alternatives you've considered

### Submitting Pull Requests

1. Create a branch from `main`
2. Make your changes
3. Ensure all tests pass (`npm test`) and linting is clean (`npm run lint`)
4. Submit a PR using the [pull request template](.github/PULL_REQUEST_TEMPLATE.md)

## Commit Convention

This project follows [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` — new feature
- `fix:` — bug fix
- `docs:` — documentation changes
- `test:` — adding or updating tests
- `refactor:` — code changes that neither fix a bug nor add a feature
- `chore:` — maintenance tasks

Examples:
```
feat: add PDF export format
fix: handle empty notes input gracefully
docs: update environment variable documentation
```

## License

By contributing, you agree that your contributions will be licensed under the [AGPLv3](LICENSE).
