# shell-sage

![Node.js](https://img.shields.io/badge/Node.js-18%2B-green?logo=node.js)
![JavaScript](https://img.shields.io/badge/JavaScript-ES6%2B-yellow?logo=javascript)
![Gemini API](https://img.shields.io/badge/Gemini-API-blue?logo=google)

A minimalistic terminal chatbot for interacting with Google's Gemini 2.0 Flash API. This CLI tool allows you to query the Gemini API using your API key, which is stored persistently on your system.

## Features

- **Interactive Chat:** Ask your questions and receive responses directly in your terminal.
- **Persistent API Key Storage:** Your Gemini API key is saved in a hidden file in your home directory (`.gemini_api_key`), so you don’t need to re-enter it every time.
- **Modern UI:** Enjoy a colorful, gradient ASCII banner and helpful prompts using [figlet](https://www.npmjs.com/package/figlet) and [chalk](https://www.npmjs.com/package/chalk).
- **Real-time API Calls:** Interact with the Gemini 2.0 Flash API using [axios](https://www.npmjs.com/package/axios).
- **Command Line Flags:** Includes helpful commands like `--help`, `--version`, `--model`, `--remove-api`, and `--update`.
- **Automatic Updates:** Easily update to the latest version with `shell-sage --update`.

## Installation

### Install via npm:

```bash
npm install -g shell-sage
```

This will install `shell-sage` globally, allowing you to run it from anywhere in your terminal.

### Or Clone the repository manually:

```bash
git clone https://github.com/yourusername/shell-sage.git
cd shell-sage
npm install
```

## Usage

Run the CLI with:

```bash
shell-sage
```

On the first run, you'll be prompted to enter your Gemini API key. The key will be saved persistently in a hidden file in your home directory. Once stored, the CLI will load the key automatically on subsequent runs.

### Available Commands:

```bash
shell-sage --help       # Show available commands
shell-sage --version    # Show current version
shell-sage --model      # Show the current model (default: gemini-2.0-flash)
shell-sage --remove-api # Remove the stored API key
shell-sage --update     # Update shell-sage to the latest version
```

### Interactive Chat Mode:

Simply run `shell-sage` and type your queries when prompted. To exit, type `exit`.

## API Integration

This CLI interacts with the Gemini API using the following endpoint:

```text
https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash:generateContent?key=YOUR_API_KEY
```

The API expects a JSON payload structured like this:

```json
{
  "contents": [
    {
      "parts": [
        { "text": "Your query goes here" }
      ]
    }
  ]
}
```

The API key is dynamically inserted into the URL at runtime.

## Acknowledgements

This project is built using:

- [Axios](https://www.npmjs.com/package/axios)
- [Chalk](https://www.npmjs.com/package/chalk)
- [Figlet](https://www.npmjs.com/package/figlet)
- [Nanospinner](https://www.npmjs.com/package/nanospinner)
- [Gradient String](https://www.npmjs.com/package/gradient-string)
- [Inquirer](https://www.npmjs.com/package/inquirer)

## License

This project is licensed under the MIT License.

