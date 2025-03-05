# [shellmancer](https://www.shellmancer.vercel.app/)

![Node.js](https://img.shields.io/badge/Node.js-18%2B-green?logo=node.js)
![JavaScript](https://img.shields.io/badge/JavaScript-ES6%2B-yellow?logo=javascript)
![Gemini API](https://img.shields.io/badge/Gemini-API-blue?logo=google)

<p align="center">
  <img src="https://github.com/user-attachments/assets/f813c74d-4163-43cc-8b0c-d2d32c46e1f1"/>
</p>

A minimalistic terminal chatbot for interacting with Google's Gemini 2.0 Flash API. This CLI tool allows you to query the Gemini API using your API key, which is stored persistently on your system.

## Features

- **Interactive Chat:** Ask your questions and receive responses directly in your terminal.
- **Persistent API Key Storage:** Your Gemini API key is saved in a hidden configuration file in your home directory (e.g., `~/.shell-sage-config.json`), so you don’t need to re-enter it every time.
- **Modern UI:** Enjoy a colorful, gradient ASCII banner and helpful prompts using [figlet](https://www.npmjs.com/package/figlet) and [chalk](https://www.npmjs.com/package/chalk).
- **Real-time API Calls:** Interact with the Gemini 2.0 Flash API using [axios](https://www.npmjs.com/package/axios).
- **Command Line Flags:** Includes helpful commands like:
  - `--help` to show available commands,
  - `--version` to show the current version,
  - `--model` to display the current Gemini model,
  - `--remove-api` to remove the stored API key, and
  - `--update` to update shellmancer to the latest version.
- **New Basic Commands:**
  - **explain:** `shellmancer explain "<shell command>"` – Get a beginner-friendly explanation of a shell command.
  - **generate-script:** `shellmancer generate-script "<description>"` – Generate a bash/zsh script based on your description.
  - **system-info:** `shellmancer system-info` – Display your system information (OS, CPU, Memory, etc.).
  - **set-model:** `shellmancer set-model <model>` – Set the default Gemini model (e.g., `gemini-2.0-flash` or `gemini-2.0-pro`).
- **Automatic Updates:** Easily update to the latest version with `shellmancer --update`.

## Installation

### Install via npm:

```bash
npm install -g shellmancer
