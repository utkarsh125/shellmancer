# [shellmancer](https://www.shellmancer.vercel.app/)

![Node.js](https://img.shields.io/badge/Node.js-18%2B-green?logo=node.js)
![JavaScript](https://img.shields.io/badge/JavaScript-ES6%2B-yellow?logo=javascript)
![Gemini API](https://img.shields.io/badge/Gemini-API-blue?logo=google)

<p align="center">
  <img src="https://github.com/user-attachments/assets/f813c74d-4163-43cc-8b0c-d2d32c46e1f1" alt="Shellmancer Banner"/>
</p>

A minimalistic terminal chatbot for interacting with Google's *Gemini 2.0 Flash API*. This CLI tool allows you to query the Gemini API using your API key, which is stored persistently on your system.

## 🚀 Features

✅ **Interactive Chat** – Ask questions and receive responses directly in your terminal.  
✅ **Persistent API Key Storage** – The Gemini API key is stored in `~/.shell-sage-config.json`, so you don't have to re-enter it.  
✅ **Modern UI** – Features a colorful ASCII banner and stylish prompts using [figlet](https://www.npmjs.com/package/figlet) and [chalk](https://www.npmjs.com/package/chalk).  
✅ **Real-time API Calls** – Uses [axios](https://www.npmjs.com/package/axios) for seamless communication with Gemini 2.0 Flash.  
✅ **Command Line Flags** – Includes useful commands:  
  - `--help` → Show available commands  
  - `--version` → Show the current version  
  - `--model` → Display the current Gemini model  
  - `--remove-api` → Remove the stored API key  
  - `--update` → Update *shellmancer* to the latest version  

### 🛠️ New Basic Commands:
| Command | Description |
|---------|------------|
| `shellmancer explain "<shell command>"` | Get a beginner-friendly explanation of a shell command |
| `shellmancer generate-script "<description>"` | Generate a bash/zsh script based on a description |
| `shellmancer system-info` | Display system information (OS, CPU, Memory, etc.) |
| `shellmancer set-model <model>` | Set the default Gemini model (`gemini-2.0-flash`, `gemini-2.0-pro`) |

## 📥 Installation

### Install via npm:
```bash
npm install -g shellmancer
```
This will install *shellmancer* globally, allowing you to run it from anywhere in your terminal.

### Or Clone the Repository Manually:
```bash
git clone https://github.com/yourusername/shellmancer.git
cd shellmancer
npm install
```

## 📌 Usage

### 🔹 Run the CLI
```bash
shellmancer
```
On the first run, you'll be prompted to enter your **Gemini API key**. The key is stored persistently in a hidden config file (`~/.shell-sage-config.json`) and automatically loaded on future runs.

### 🔹 Available Commands
```bash
shellmancer --help       # Show available commands
shellmancer --version    # Show current version
shellmancer --model      # Show the current Gemini model
shellmancer --remove-api # Remove the stored API key
shellmancer --update     # Update shellmancer to the latest version
```

### 🔹 Basic Commands
```bash
shellmancer explain "<shell command>"       
# Get an explanation of a shell command

shellmancer generate-script "<description>"  
# Generate a bash/zsh script

shellmancer system-info                     
# Display system information

shellmancer set-model <model>               
# Change the Gemini model (e.g., gemini-2.0-flash, gemini-2.0-pro)
```

### 🔹 Interactive Chat Mode
Run `shellmancer` without any arguments and type queries when prompted.  
To exit, type `exit`.

---

## 🌐 API Integration

This CLI interacts with the **Gemini API** using the following endpoint:
```
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

---

## 🔗 Acknowledgements

Built using:
- [Axios](https://www.npmjs.com/package/axios) – HTTP client for API requests
- [Chalk](https://www.npmjs.com/package/chalk) – Terminal string styling
- [Figlet](https://www.npmjs.com/package/figlet) – ASCII banners
- [Nanospinner](https://www.npmjs.com/package/nanospinner) – Elegant CLI spinners
- [Gradient String](https://www.npmjs.com/package/gradient-string) – Colorful terminal output
- [Inquirer](https://www.npmjs.com/package/inquirer) – Interactive CLI prompts
- [Remove Markdown](https://www.npmjs.com/package/remove-markdown) – Clean text formatting

## 📜 License

This project is licensed under the **MIT License**.
