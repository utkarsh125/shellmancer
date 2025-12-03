# Shellmancer Product Requirements Document

**Timestamp:** 2025-06-03  
**Version:** 1.0  
**Author:** Product Team

## 1. Overview

Shellmancer is a minimal terminal chatbot that allows developers and power users to interact with Google's Gemini 2.0 Flash API directly from the command line. The CLI emphasizes quick setup, persistent credentials, and a modern UX (ASCII banner, gradient prompts) while remaining lightweight and scriptable.

## 2. Goals

- Provide an ergonomic CLI for chatting with Gemini 2.0 Flash without leaving the terminal.
- Persist Gemini API credentials locally so users authenticate once.
- Offer guided helper commands (explain, generate scripts, show system info) that complement the chat experience.
- Ensure the CLI can run cross-platform on any machine with Node.js 18+.

## 3. Non-Goals

- Building a graphical UI or hosted web client.
- Supporting non-Gemini LLM providers.
- Managing multi-user accounts or cloud-stored API keys.
- Guaranteeing offline functionality.

## 4. Target Users & Personas

- **CLI Enthusiasts / DevOps Engineers:** Live in the terminal, value rapid command execution, and appreciate scriptable tooling.
- **Learners / Junior Developers:** Need explanations of shell commands and step-by-step guidance.
- **Automation-focused Power Users:** Want to generate scripts or automate repetitive system tasks quickly.

## 5. User Scenarios

1. **First-time setup:** User installs via `npm install -g shellmancer`, runs `shellmancer`, enters their Gemini API key when prompted, and immediately starts chatting.
2. **Command explanation:** User runs `shellmancer explain "rsync -av --delete"` to understand what a complex command does in plain language.
3. **Script generation:** User runs `shellmancer generate-script "backup photos folder to S3"` and receives a tailored bash/zsh script.
4. **System diagnostics:** User runs `shellmancer system-info` before sharing environment details with support.
5. **Model management:** User switches from the default `gemini-2.0-flash` to `gemini-2.0-pro` via `shellmancer set-model gemini-2.0-pro`.

## 6. Functional Requirements

### 6.1 CLI Core
- Display branded ASCII banner and gradient prompts on launch.
- Offer interactive chat loop; exit on `exit` command or Ctrl+C.
- Persist API key, default model, and other config in `~/.shell-sage-config.json`.

### 6.2 Commands & Flags
- `shellmancer --help` lists all commands and flags.
- `shellmancer --version` shows package version from `package.json`.
- `shellmancer --model` prints the currently selected Gemini model.
- `shellmancer --remove-api` deletes the stored API key.
- `shellmancer --update` initiates self-update guidance or automation.

### 6.3 Helper Commands
- `shellmancer explain "<command>"` sends the command string to the API and returns a beginner-friendly explanation.
- `shellmancer generate-script "<description>"` returns a ready-to-run bash/zsh script.
- `shellmancer system-info` outputs OS, CPU, memory, and other diagnostics.
- `shellmancer set-model <model>` updates the stored default model (e.g., `gemini-2.0-flash`, `gemini-2.0-pro`).

### 6.4 API Integration
- Use Axios to POST `contents.parts[].text` payloads to `https://generativelanguage.googleapis.com/v1/models/{model}:generateContent?key={API_KEY}`.
- Gracefully log and return errors (invalid key, network issues) with actionable suggestions.
- Allow future endpoint changes via configuration without breaking the CLI.

## 7. Non-Functional Requirements

- **Performance:** Responses should appear within the typical Gemini API latency plus <200ms CLI overhead.
- **Reliability:** Handle missing config or corrupt files by recreating defaults; never crash the CLI.
- **Security:** Keep API keys local only; never transmit outside requests to Gemini. Provide an easy removal command.
- **Portability:** Support macOS, Linux, and Windows terminals where Node.js 18+ is available.
- **UX:** Maintain accessible color schemes; log errors using distinct colors via Chalk.

## 8. Success Metrics

- Time-to-first-response after install < 2 minutes (install + API key entry).
- >80% of active users retain stored API key (indicates trust and successful persistence).
- Helper commands (`explain`, `generate-script`, `system-info`, `set-model`) account for ≥30% of total invocations, showing adoption beyond basic chat.
- Issue rate for config corruption or API failures <2% of sessions.

## 9. Dependencies

- Node.js 18+
- npm for global install (`npm install -g shellmancer`)
- Packages: axios, chalk, figlet, gradient-string, inquirer, nanospinner, remove-markdown.

## 10. Open Questions

- Should we add streaming responses for long outputs?
- Do we need workspace-level configs for teams sharing API keys?
- How should updates be delivered (self-update vs. npm upgrade guidance)?
- Are additional Gemini models (e.g., vision, audio) required in the near term?

## 11. Risks & Mitigations

- **API changes:** Endpoint versioning handled via centralized `api.js` and `config.js`.
- **User onboarding friction:** Inquirer prompts ensure API key is collected once; consider fallback instructions if key is invalid.
- **Rate limits/cost:** Encourage users to monitor usage; possibly add request summaries in future releases.

---

