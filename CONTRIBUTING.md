# Contributing to SipHeron VDR CLI

First off, thank you for considering contributing to the SipHeron Virtual Data Room CLI! It's people like you that make this cryptographic infrastructure highly secure and accessible. 

## 📝 Code of Conduct

By participating in this project, you agree to abide by our [Code of Conduct](CODE_OF_CONDUCT.md). We expect all contributors to maintain a welcoming, inclusive, and professional environment.

## 🛠️ Development Setup

The `vdr-cli` repository is authored in **TypeScript** and heavily relies on the upstream `@sipheron/vdr-core` library. Follow these steps to set up your local development environment:

### Prerequisites
- Node.js (>= 18.x)
- `npm` or `pnpm`
- Git

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/leaderofARS/vdr-cli.git
   cd vdr-cli
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Link local core (Optional if editing `vdr-core` concurrently):**
   If you are co-developing the core SDK, link it locally to avoid syncing issues:
   ```bash
   npm link ../vdr-core
   ```

4. **Build the CLI:**
   ```bash
   npm run build
   ```

5. **Test the executable:**
   ```bash
   node ./dist/index.js --help
   ```

## 🔍 Pull Request Process

We maintain a strict review process to systematically prevent bugs from reaching our production ecosystem.

1. **Branch Naming**: 
   Use semantic branching names, such as `feat/authentication-updates`, `fix/hash-parsing-bug`, or `docs/readme-overhaul`.

2. **Commit Formatting**: 
   We employ [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/). Please structure your commit messages exactly as follows:
   - `feat: added ability to track version chains`
   - `fix: resolved failing stream boundaries on >50MB files`
   - `docs: updated spelling in the contributing guide`

3. **Testing**: 
   Ensure your code maintains robust test coverage. 
   ```bash
   npm run test
   ```
   If you add a new CLI command or feature, you **must** include applicable Jest test sweeps covering its logic and failure patterns.

4. **Code Quality**: 
   Run our formatting targets before submitting your PR to seamlessly align with repository standards:
   ```bash
   npm run lint
   npm run format
   ```

5. **Review**: 
   Once your PR is submitted, core maintainers will review the code, typically within 48 hours. Please be open to constructive feedback.

## 💡 Proposing Features

Have an idea for a new cryptographic feature, subcommand, or integration? 
Before opening an enormous PR, please **open an issue** labeled `enhancement` discussing your proposed architecture. We want to ensure it aligns perfectly with the SipHeron roadmap before you spend valuable time writing the code.

Thank you for contributing to SipHeron!
