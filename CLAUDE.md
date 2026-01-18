# CLAUDE.md - AI Assistant Guide for iSpeed

This document provides comprehensive guidance for AI assistants working with the iSpeed codebase. It covers the project structure, development workflows, coding conventions, and best practices.

## Table of Contents

- [Repository Overview](#repository-overview)
- [Project Structure](#project-structure)
- [Development Workflow](#development-workflow)
- [Coding Conventions](#coding-conventions)
- [Testing Strategy](#testing-strategy)
- [Git Practices](#git-practices)
- [AI Assistant Guidelines](#ai-assistant-guidelines)
- [Common Tasks](#common-tasks)

## Repository Overview

**Project Name:** iSpeed
**Repository:** kamongi/iSpeed
**Purpose:** [To be documented as project develops]

### Technology Stack

[To be documented based on project implementation]

### Key Dependencies

[To be documented when dependencies are added]

## Project Structure

```
iSpeed/
├── src/              # Source code
├── tests/            # Test files
├── docs/             # Documentation
├── config/           # Configuration files
├── scripts/          # Build and utility scripts
└── assets/           # Static assets
```

**Note:** Update this structure as the project evolves.

### Key Directories

- **src/**: Main application source code
- **tests/**: Unit, integration, and e2e tests
- **docs/**: Additional documentation and guides
- **config/**: Environment-specific configuration files
- **scripts/**: Build, deployment, and utility scripts

## Development Workflow

### Branch Strategy

- **Main Branch:** `main` (or `master`)
- **Feature Branches:** `claude/<feature-name>-<session-id>`
- **Hotfix Branches:** `hotfix/<issue-description>`
- **Release Branches:** `release/<version>`

### Feature Development Process

1. **Create Feature Branch**
   ```bash
   git checkout -b claude/<feature-name>-<session-id>
   ```

2. **Implement Changes**
   - Write code following the conventions below
   - Add tests for new functionality
   - Update documentation as needed

3. **Commit Changes**
   ```bash
   git add .
   git commit -m "feat: descriptive commit message"
   ```

4. **Push to Remote**
   ```bash
   git push -u origin claude/<feature-name>-<session-id>
   ```

5. **Create Pull Request**
   - Use descriptive title
   - Include summary of changes
   - Reference related issues
   - Add test plan

## Coding Conventions

### General Principles

- **KISS (Keep It Simple, Stupid):** Avoid over-engineering
- **DRY (Don't Repeat Yourself):** Extract common functionality
- **YAGNI (You Aren't Gonna Need It):** Don't add features speculatively
- **Single Responsibility:** Each function/class should have one clear purpose

### Code Style

[To be defined based on chosen language/framework]

#### Naming Conventions

- **Variables:** `camelCase` for most languages, `snake_case` for Python
- **Functions:** Descriptive verb-noun combinations (e.g., `getUserData`, `processPayment`)
- **Classes:** `PascalCase`
- **Constants:** `UPPER_SNAKE_CASE`
- **Private Members:** Prefix with `_` or use language-specific conventions

#### File Naming

- Use descriptive names that reflect the file's purpose
- Follow the project's established naming pattern
- Keep names concise but meaningful

#### Comments

- Write self-documenting code where possible
- Add comments only when the logic isn't self-evident
- Use JSDoc/docstrings for public APIs
- Avoid redundant comments that just restate the code

### Error Handling

- Validate input at system boundaries (user input, external APIs)
- Don't add error handling for scenarios that can't happen
- Trust internal code and framework guarantees
- Use specific error types/classes
- Log errors with sufficient context

### Security Practices

- **Input Validation:** Sanitize all user inputs
- **SQL Injection:** Use parameterized queries
- **XSS Prevention:** Escape output, use Content Security Policy
- **Authentication:** Use established libraries/frameworks
- **Secrets Management:** Never commit secrets; use environment variables
- **Dependency Security:** Regularly update dependencies and scan for vulnerabilities

## Testing Strategy

### Test Types

1. **Unit Tests**
   - Test individual functions/methods in isolation
   - Mock external dependencies
   - Aim for high coverage of business logic

2. **Integration Tests**
   - Test interaction between components
   - Use test databases or mock services
   - Verify data flow and transformations

3. **End-to-End Tests**
   - Test complete user workflows
   - Run against staging environment
   - Cover critical paths

### Test Organization

```
tests/
├── unit/           # Unit tests
├── integration/    # Integration tests
├── e2e/           # End-to-end tests
└── fixtures/      # Test data and mocks
```

### Running Tests

[To be documented based on test framework]

```bash
# Run all tests
npm test  # or equivalent command

# Run specific test suite
npm test -- <test-file>

# Run with coverage
npm run test:coverage
```

## Git Practices

### Commit Message Format

Follow the Conventional Commits specification:

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

**Examples:**
```
feat(auth): add OAuth2 authentication support

fix(api): resolve null pointer exception in user endpoint

docs(readme): update installation instructions

refactor(database): optimize query performance
```

### Commit Best Practices

- Make atomic commits (one logical change per commit)
- Write clear, descriptive commit messages
- Commit frequently to avoid losing work
- Don't commit commented-out code or debug statements
- Don't commit secrets, credentials, or sensitive data

### Branch Management

- Keep branches focused on a single feature/fix
- Delete branches after merging
- Regularly sync with the main branch
- Use descriptive branch names

### Pull Request Guidelines

1. **Title:** Clear, concise description of changes
2. **Summary:** Bullet points covering:
   - What was changed
   - Why it was changed
   - Impact on existing functionality
3. **Test Plan:** Steps to verify the changes
4. **Screenshots:** For UI changes
5. **Breaking Changes:** Clearly document any breaking changes

## AI Assistant Guidelines

### Before Making Changes

1. **Read Before Writing**
   - Always read files before modifying them
   - Understand existing code patterns
   - Check for similar implementations

2. **Use Specialized Tools**
   - Use `Read` for reading files (not `cat`)
   - Use `Edit` for editing files (not `sed/awk`)
   - Use `Grep` for searching (not bash `grep`)
   - Use `Glob` for finding files (not `find`)

3. **Explore the Codebase**
   - Use the Task tool with `subagent_type=Explore` for understanding code structure
   - Search for existing patterns before implementing new ones
   - Check for established conventions

### When Making Changes

1. **Minimal Changes**
   - Only change what's necessary
   - Don't refactor surrounding code unless asked
   - Don't add extra features or "improvements"
   - Don't add comments to code you didn't change

2. **Code Quality**
   - Follow existing code style
   - Match the patterns used in the codebase
   - Don't introduce security vulnerabilities
   - Test your changes

3. **Task Management**
   - Use `TodoWrite` for multi-step tasks
   - Mark tasks as `in_progress` before starting
   - Mark tasks as `completed` immediately after finishing
   - Keep only ONE task `in_progress` at a time

### Common Patterns

#### Reading Files
```
Use: Read tool with file_path
Not: cat, head, tail commands
```

#### Searching Code
```
Use: Grep tool with pattern
Not: bash grep or rg commands
```

#### Finding Files
```
Use: Glob tool with pattern
Not: find or ls commands
```

#### Exploring Codebase
```
Use: Task tool with subagent_type=Explore
For: Understanding structure, finding error handlers, etc.
```

### Error Handling

- If a command fails, analyze the error before retrying
- For network errors, retry up to 4 times with exponential backoff
- Don't proceed if prerequisites are missing
- Ask for clarification if requirements are unclear

### Security Considerations

- Never commit files containing secrets (.env, credentials.json)
- Validate input at system boundaries
- Use parameterized queries for databases
- Escape output to prevent XSS
- Follow OWASP top 10 guidelines

## Common Tasks

### Adding a New Feature

1. Create todo list with steps
2. Research existing patterns
3. Implement minimal viable solution
4. Add tests
5. Update documentation
6. Commit and push

### Fixing a Bug

1. Reproduce the issue
2. Identify the root cause
3. Write a test that fails
4. Implement the fix
5. Verify the test passes
6. Commit with descriptive message

### Refactoring Code

1. Ensure tests exist and pass
2. Make small, incremental changes
3. Run tests after each change
4. Don't change behavior
5. Commit frequently

### Creating a Pull Request

1. Check git status
2. Review diff
3. Ensure all tests pass
4. Commit outstanding changes
5. Push to remote branch
6. Use `gh pr create` with:
   - Descriptive title
   - Summary with bullet points
   - Test plan

### Running CI/CD

[To be documented based on CI/CD setup]

## Environment Setup

### Prerequisites

[To be documented based on project requirements]

### Installation

[To be documented with actual installation steps]

```bash
# Clone repository
git clone <repository-url>
cd iSpeed

# Install dependencies
[package manager command]

# Set up environment
cp .env.example .env
# Edit .env with your configuration

# Run development server
[start command]
```

### Environment Variables

[To be documented as environment variables are added]

## Debugging

### Logging

[To be documented based on logging framework]

### Common Issues

[To be documented as issues are encountered and resolved]

## Deployment

[To be documented based on deployment strategy]

### Development
[Commands and process]

### Staging
[Commands and process]

### Production
[Commands and process]

## Resources

### Documentation Links

- [Project README](./README.md)
- [API Documentation](./docs/api.md) (if applicable)
- [Architecture Overview](./docs/architecture.md) (if applicable)

### External Resources

[Links to relevant documentation, tutorials, etc.]

## Maintenance

### Regular Tasks

- Update dependencies monthly
- Review and close stale issues
- Update documentation
- Security audits
- Performance monitoring

### Contact

[Project maintainer contact information]

---

## Document Updates

This document should be updated whenever:
- Project structure changes significantly
- New conventions are established
- Development workflow changes
- New tools or frameworks are added
- Common issues are identified and resolved

**Last Updated:** 2026-01-18
**Maintained By:** AI Assistants and Project Contributors
