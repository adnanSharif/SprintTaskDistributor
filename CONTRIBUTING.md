# Contributing to Sprint Task Distributor

Thanks for taking time to contribute! This document outlines the process so we can merge changes quickly and safely.

## Code of Conduct
Please follow the [Contributor Covenant](https://www.contributor-covenant.org/version/2/1/code_of_conduct/) when interacting in issues, pull requests, and discussions.

## Development Workflow
1. Fork the repository and create a feature branch from `main`.
2. Install dependencies with `npm install`.
3. Run `npm run lint` and `npm test` before opening a pull request.
4. Submit a PR that describes **why** you made the change and how it was tested.
5. Keep PRs focused. Large refactors should be discussed in an issue first.

## Commit Guidelines
- Use present tense: `Add developer timeline`.
- Reference issues when possible: `Fixes #123`.
- Squash trivial commits before requesting review.

## Coding Standards
- TypeScript, React, and Next.js best practices.
- Prefer functional components with hooks.
- Keep components small and testable.
- Add/Update tests for new functionality.
- Document exported functions/components with comments when not obvious.

## Testing
```
npm run lint
npm run test
npm run test:coverage
```
All commands must pass before a pull request can be merged.

## Pull Request Checklist
- [ ] Tests cover new or updated logic
- [ ] Lint passes
- [ ] Docs/README updated when necessary
- [ ] Screenshots/GIFs provided for UI changes

Thank you for helping improve Sprint Task Distributor! 🙌
