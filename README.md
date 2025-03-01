
# shell-sage

A minimalistic terminal chatbot for interacting with Google's Gemini 2.0 Flash API. This CLI tool allows you to query the Gemini API using your API key, which is stored persistently on your system.

## Features

- **Interactive Chat:** Ask your questions and receive responses directly in your terminal.
- **Persistent API Key Storage:** Your Gemini API key is saved in a hidden file in your home directory (`.gemini_api_key`), so you don’t need to re-enter it every time.
- **Modern UI:** Enjoy a colorful, gradient ASCII banner and helpful prompts using [figlet](https://www.npmjs.com/package/figlet) and [chalk](https://www.npmjs.com/package/chalk).
- **Real-time API Calls:** Interact with the Gemini 2.0 Flash API using [axios](https://www.npmjs.com/package/axios).

## Installation

1. **Clone the repository:**

   ```bash
   git clone https://github.com/yourusername/geminibot-cli.git
   cd geminibot-cli
```



## Install dependencies:

```
npm install
```

**Usage**

Run the CLI with:

```
node index.js
```

On the first run, you'll be prompted to enter your Gemini API key. The key will be saved persistently in a hidden file in your home directory. Once stored, the CLI will load the key automatically on subsequent runs.

Type your query when prompted. To exit, type exit.
API Integration

This CLI interacts with the Gemini API using the following endpoint:

`https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash:generateContent?key=YOUR_API_KEY`

The API expects a JSON payload structured like this:
```

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

Acknowledgements

    Axios
    Chalk
    Figlet
    Nanospinner
    Gradient String
    Inquirer


