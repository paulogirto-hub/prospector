# Contributing to Prospector

First off, thanks for considering contributing! 🎉

## Quick Start

1. **Fork** the repository
2. **Clone** your fork: `git clone https://github.com/YOUR_USER/prospector.git`
3. **Create a branch**: `git checkout -b feature/my-feature`
4. **Make changes** and commit: `git commit -m 'feat: add amazing feature'`
5. **Push**: `git push origin feature/my-feature`
6. **Open a Pull Request**

## Development Setup

```bash
# Clone and enter the project
git clone https://github.com/paulogirto-hub/prospector.git
cd prospector

# Copy environment variables
cp .env.example .env
# Edit .env with your API keys

# Start with Docker
docker compose up -d --build

# Or run manually:
# Backend
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
export SERPER_KEY=your_key
export OLLAMA_KEY=your_key
gunicorn app.main:app --bind 0.0.0.0:5000 --workers 4 --timeout 300

# Frontend (any static server that proxies /api/ to backend)
cd frontend
python -m http.server 8088
```

## Code Style

### Backend (Python)
- Follow **PEP 8** with type hints
- Use **docstrings** for all public functions
- Keep functions small and focused
- Use Flask Blueprint patterns

### Frontend (JavaScript/CSS)
- **No inline CSS/JS** in HTML — keep modules separate
- Use `html` tagged template for XSS-safe rendering
- Use `rawHtml()` only for trusted content
- Follow existing module pattern: `state.js`, `api.js`, `components.js`, `app.js`

## Commit Messages

Use [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add lead export to CSV
fix: handle SSE reconnection on network error
docs: update API reference for diagnosis endpoint
refactor: extract scoring logic into separate module
test: add unit tests for persistence layer
chore: update dependencies
```

## Pull Request Process

1. **Update documentation** if you change behavior
2. **Add tests** for new features (when test framework is set up)
3. **Keep PRs small** — one feature/fix per PR
4. **Describe the "why"** — not just the "what"
5. **Link related issues** when applicable

## API Changes

- Maintain **backward compatibility**
- Document changes in both [`docs/API.md`](docs/API.md) (PT) and [`docs/API.en.md`](docs/API.en.md) (EN)
- Add new endpoints to the Key Endpoints table in both READMEs

## Reporting Bugs

Open an issue with:

- **OS and browser** (or Docker version)
- **Steps to reproduce**
- **Expected vs actual behavior**
- **Logs or screenshots** if possible

## Feature Requests

Open an issue with:

- **Use case** — what problem does this solve?
- **Proposed solution** — how should it work?
- **Alternatives considered** — what else did you think about?

## Questions?

Open a [Discussion](https://github.com/paulogirto-hub/prospector/discussions) or reach out via issues.

---

Thanks for making Prospector better! 💜