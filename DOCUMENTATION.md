# Shellmancer Documentation

## Table of Contents
1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Core Components](#core-components)
4. [Command Modules](#command-modules)
5. [Data Flow](#data-flow)
6. [Configuration Management](#configuration-management)
7. [API Integration](#api-integration)

---

## Overview

**Shellmancer** is a CLI tool that provides an AI-powered terminal assistant using Google's Gemini 2.0 Flash API. It allows users to:
- Interact with Gemini AI directly from the terminal
- Explain shell commands in beginner-friendly terms
- Generate bash/zsh scripts from descriptions
- Automate tasks by generating and executing commands
- Fix errors with AI-powered suggestions
- Display system information
- Manage API keys and model settings

The tool is built with Node.js and uses ES6 modules. It stores configuration persistently in the user's home directory.

---

## Architecture

### Entry Point: `index.js`

The main entry point (`index.js`) acts as a command router:

1. **No Arguments**: Launches interactive shell mode (`startInteractiveShell()`)
2. **With Arguments**: Parses the first argument as a command and routes to the appropriate handler

**Command Structure:**
```
shellmancer [command] [options]
```

**Available Commands:**
- `explain "<command>"` - Explain a shell command
- `generate-script "<description>"` - Generate a bash script
- `automate "<description>"` - Automate a task
- `fix "<error message>"` - Get error fixing suggestions
- `system-info` - Display system information
- `set-model <model>` - Change the Gemini model
- `--help` - Show help menu
- `--version` - Show version
- `--model` - Show current model
- `--remove-api` - Remove stored API key
- `--update` - Update the package
- `--check-version` - Debug command to check version detection and API key cleanup status

---

## Core Components

### 1. Configuration Module (`src/config.js`)

**Purpose**: Manages persistent configuration storage and retrieval.

**Key Functions:**

- **`loadConfig()`**: 
  - Reads configuration from `~/.shell-sage-config.json`
  - Returns parsed JSON object or empty object if file doesn't exist
  - Handles file read errors gracefully

- **`saveConfig(config)`**: 
  - Writes configuration object to `~/.shell-sage-config.json`
  - Creates file if it doesn't exist
  - Handles write errors gracefully

- **`getApiKey()`**: 
  - Retrieves API key from config
  - If not found, prompts user via `inquirer` to enter API key
  - Saves the API key to config for future use
  - Returns the API key (either from config or newly entered)

- **`removeApiKey()`**: 
  - Deletes the API key from config
  - Saves updated config to disk
  - Provides user feedback

- **`getDefaultModel()`**: 
  - Returns the configured model or falls back to `"gemini-2.0-flash"`
  - Note: There's a bug in the code - it checks `config.getDefaultModel` instead of `config.defaultModel`

- **`setDefaultModel(newModel)`**: 
  - Updates the default model in config
  - Saves to disk
  - Provides user feedback

- **`getCurrentPackageVersion(debug)`**: 
  - Retrieves the current package version from `package.json`
  - Uses multiple strategies to locate package.json (local dev, global installs)
  - Returns version string or null if not found
  - Optional debug parameter for troubleshooting

- **`checkVersionAndCleanApiKey(debug)`**: 
  - Checks if package version has changed since last run
  - Compares current version with stored version in config
  - If versions differ, removes API key and notifies user
  - Updates stored version in config
  - Optional debug parameter shows detailed version information
  - Called automatically on every startup

**Configuration File Structure:**
```json
{
  "apiKey": "your-api-key-here",
  "getDefaultModel": "gemini-2.0-flash"
}
```

---

### 2. API Module (`src/api.js`)

**Purpose**: Handles all communication with Google's Gemini API.

**Key Function:**

- **`queryGemini(apiKey, query)`**:
  - Constructs the API URL using the model from config
  - Makes a POST request to `https://generativelanguage.googleapis.com/v1/models/{model}:generateContent?key={apiKey}`
  - Sends query in the required JSON format:
    ```json
    {
      "contents": [{
        "parts": [{ "text": "query" }]
      }]
    }
    ```
  - Returns the full API response object
  - Handles errors and returns `null` on failure
  - Uses `axios` for HTTP requests

**Response Structure:**
The API returns data in this format:
```javascript
{
  candidates: [{
    content: {
      parts: [{
        text: "AI response text here"
      }]
    }
  }]
}
```

---

### 3. Display Module (`src/display.js`)

**Purpose**: Handles UI elements, banners, and help information.

**Key Functions:**

- **`displayBanner()`**: 
  - Generates ASCII art banner using `figlet` with "shellmancer" text
  - Applies gradient colors using `gradient-string`
  - Displays tagline and creator information
  - Handles figlet errors gracefully

- **`showHelp()`**: 
  - Displays formatted help menu with all available commands
  - Shows usage examples and options

- **`showVersion()`**: 
  - Fetches latest version from npm registry
  - Displays current version (has a bug - references undefined `latestVersion` variable)

- **`fetchLatestVersion()`**: 
  - Executes `npm show shellmancer version` command
  - Returns the version string from npm registry
  - Returns a promise that resolves with version or rejects on error

---

## Command Modules

### 1. Interactive Shell (`src/commands/interactiveShell.js`)

**Purpose**: Provides an interactive REPL-like experience where users can mix OS commands and AI queries.

**How It Works:**

1. **Initialization**:
   - Displays banner
   - Loads API key (prompts if needed)
   - Initializes conversation history array
   - Loads command history from `~/.shellmancer-history` (if exists) for current session
   - Creates readline interface with custom prompt: `shellmancer>`

2. **Command Processing Loop**:
   - Reads user input line by line
   - Handles special commands:
     - `exit` - Deletes history file and exits
     - `cd <directory>` - Changes working directory
     - `list files [directory]` - Lists files in directory
     - `automate <description>` - Generates and optionally executes automation script
     - `system-info` - Placeholder for system info (not fully implemented)

3. **OS Command Detection**:
   - Uses `isOSCommand()` to check if input is a system command
   - On Windows: uses `where` command
   - On Unix: uses `which` command
   - If detected, executes via `executeOSCommand()`

4. **AI Query Handling**:
   - If not an OS command, treats input as AI query
   - Maintains conversation history (context)
   - Sends full conversation history to Gemini API
   - Displays response and adds to conversation history

5. **History Management**:
   - **Session-Only History**: Command history is only available during the active session
   - History file (`~/.shellmancer-history`) is loaded at startup for arrow key navigation
   - History is maintained in memory during the session
   - **History file is automatically deleted when the session closes** (on `exit` command or Ctrl+C)
   - Each new session starts with a clean slate (no persistent history)
   - Uses readline's built-in history for arrow key navigation during the session
   - Maximum 1000 entries in memory during session

**Key Functions:**
- `isOSCommand(cmd)` - Checks if command exists in system PATH
- `executeOSCommand(cmd)` - Executes OS command and displays output
- `automateTask(taskDescription, apiKey)` - Generates automation script
- `loadHistory()` - Loads command history from file (for current session only)
- `deleteHistory()` - Deletes the history file when session closes

---

### 2. Chatbot (`src/commands/chatbot.js`)

**Purpose**: Simple interactive chatbot mode (alternative to interactive shell).

**How It Works:**

1. Displays banner with 700ms delay
2. Gets API key
3. Enters infinite loop:
   - Prompts user for message using `inquirer`
   - If user types "exit", breaks loop
   - Sends message to Gemini API
   - Removes markdown from response using `remove-markdown` package
   - Displays response
   - Repeats

**Key Difference from Interactive Shell:**
- Uses `inquirer` for prompts (not readline)
- No OS command execution
- No conversation history/context
- Simpler, more focused on pure chat

---

### 3. Explain Command (`src/commands/explain.js`)

**Purpose**: Explains shell commands in beginner-friendly terms.

**How It Works:**

1. Gets API key
2. Constructs a detailed prompt that:
   - Instructs AI to act as a CLI tool
   - Requests beginner-friendly explanation
   - Asks for no markdown formatting
   - Requests direct, monotone responses
3. Sends prompt to Gemini API
4. Extracts and displays explanation

**Prompt Structure:**
```
YOU ARE EMPLOYED AS CLI TOOL TO EXPLAIN ERRORS

Explain the shell command: "{command}" in simple, beginner friendly terms.
DO NOT INCLUDE SENTENCES LIKE "Okay, I understand..."
JUST JUMP STRAIGHT TO THE SOLUTION IN A MONOTONOUS TONE
ANSWER SHOULD NOT CONTAIN ANY MARKDOWN FORMATTING
```

---

### 4. Generate Script (`src/commands/generateScript.js`)

**Purpose**: Generates bash/zsh scripts from natural language descriptions.

**How It Works:**

1. Gets API key
2. Constructs prompt asking for script generation
3. Sends to Gemini API
4. Displays generated script

**Prompt Instructions:**
- Generate bash script for the description
- Don't include introductory text
- Add flags and severity level comments
- Keep tone monotonous

---

### 5. Automate Task (`src/commands/automate.js`)

**Purpose**: Generates and optionally executes shell commands to automate tasks.

**How It Works:**

1. Gets API key
2. Constructs detailed prompt that:
   - Requests list of shell commands (one per line)
   - Asks for pre-checks (verify Docker containers, directories, files exist)
   - Provides examples of pre-check patterns
3. Sends to Gemini API
4. Parses response:
   - Splits by newlines
   - Filters out empty lines, comments, and markdown code blocks
5. Displays commands
6. Prompts user if they want to execute commands
7. If yes, executes commands one by one:
   - Uses `spawn()` for proper shell execution
   - On Windows: uses PowerShell
   - On Unix: uses user's shell or `/bin/bash`
   - Inherits stdio for interactive commands
   - On error, asks user if they want to continue
   - Stops if user chooses not to continue

**Key Function:**
- `execCommand(command)` - Executes a single command using `spawn()` with proper shell handling

**Safety Features:**
- Pre-checks for resource existence
- User confirmation before execution
- Error handling with continue/stop options
- Platform-specific shell selection

---

### 6. Fix Error (`src/commands/fix.js`)

**Purpose**: Provides AI-powered suggestions for fixing terminal errors.

**How It Works:**

1. Gets API key
2. Constructs prompt with error message
3. Requests:
   - Possible fixes
   - Explanation of cause
   - Actionable steps
   - No markdown/XML/HTML formatting
4. Sends to Gemini API
5. Displays suggestions

---

### 7. System Info (`src/commands/systemInfo.js`)

**Purpose**: Displays system information.

**How It Works:**

1. Uses Node.js `os` module to gather:
   - OS type, platform, architecture, release
   - Total and free memory (in GB)
   - CPU model and count
2. Displays formatted information with colored output

---

### 8. Set Model (`src/commands/setModel.js`)

**Purpose**: Changes the default Gemini model.

**How It Works:**

1. Calls `setDefaultModel()` from config module
2. Updates and saves configuration

**Available Models:**
- `gemini-2.0-flash` (default)
- `gemini-2.0-pro`

---

### 9. Update Package (`src/commands/update.js`)

**Purpose**: Updates shellmancer to the latest version from npm.

**How It Works:**

1. Checks for latest version using `fetchLatestVersion()`
2. Removes API key (for security during update)
3. Executes `npm install -g shellmancer`
4. Displays update status

**Note**: Removing API key during update means users need to re-enter it after updating.

---

## Data Flow

### Typical Command Execution Flow:

```
User Input
    ↓
index.js (command router)
    ↓
Command Module (e.g., explain.js)
    ↓
config.js (getApiKey)
    ↓
    ├─→ If API key exists: Return from config
    └─→ If not: Prompt user → Save to config → Return
    ↓
api.js (queryGemini)
    ↓
    ├─→ config.js (getDefaultModel) → Get model name
    └─→ Construct URL with model and API key
    ↓
HTTP POST to Gemini API
    ↓
Parse Response
    ↓
Extract text from response.candidates[0].content.parts[0].text
    ↓
Display to User (with formatting)
```

### Interactive Shell Flow:

```
startInteractiveShell()
    ↓
Load History (if exists) → Initialize Readline
    ↓
User Input
    ↓
    ├─→ Special Command? (exit, cd, list files, automate)
    │   └─→ Execute Special Handler
    │       └─→ If "exit": Delete history file → Close
    │
    ├─→ OS Command? (isOSCommand)
    │   └─→ Execute OS Command
    │
    └─→ AI Query
        ↓
        Add to conversation history
        ↓
        Send full history to Gemini
        ↓
        Display response
        ↓
        Add response to history
        ↓
        Maintain history in memory (not saved to disk)
    ↓
On Session Close (exit or Ctrl+C)
    ↓
Delete history file
```

---

## Configuration Management

### Configuration File Location
- **Path**: `~/.shell-sage-config.json`
- **Format**: JSON
- **Permissions**: User-readable/writable only

### Configuration Structure
```json
{
  "apiKey": "base64iv:base64salt:base64tag:base64encrypteddata",
  "getDefaultModel": "gemini-2.0-flash",
  "packageVersion": "2.1.1"
}
```

**Note**: 
- The `apiKey` is stored in encrypted format (see [API Key Encryption](#api-key-encryption) section below)
- The `packageVersion` tracks the installed version for automatic API key cleanup on updates
- There's a naming inconsistency - the property is `getDefaultModel` but should probably be `defaultModel`.

### Automatic API Key Cleanup on Update

Shellmancer automatically detects when the package has been updated and removes the stored API key for security purposes. This ensures that:

1. **Security**: After updating via `npm install -g shellmancer`, users must re-enter their API key
2. **Fresh Start**: Prevents potential issues with encrypted keys from previous versions
3. **User Awareness**: Users are notified when an update is detected

**How It Works**:
- On every startup, Shellmancer compares the current package version (from `package.json`) with the stored version in the config file
- If versions differ, the API key is automatically removed
- The user is prompted to enter their API key again on the next command that requires it
- The new version is stored in the config file

**Version Detection**:
The system uses multiple strategies to find the package version:
1. Relative to the module location (local development)
2. Walking up the directory tree (global installs in node_modules)
3. Using npm global prefix (standard global installs)
4. Current working directory (development scenarios)

This ensures version detection works in both local development and global npm installations.

**Debugging Version Detection**:
- Use `shellmancer --check-version` to see detailed version information
- Shows current package version, stored version, and package.json location
- Useful for troubleshooting if version detection isn't working as expected

**Debugging Version Detection**:
- Use `shellmancer --check-version` to see detailed version information
- Shows current package version, stored version, and package.json location
- Useful for troubleshooting if version detection isn't working as expected

### API Key Encryption

Shellmancer uses **AES-256-GCM** encryption to securely store API keys on disk. The encryption implementation provides strong security while maintaining backward compatibility.

#### Encryption Algorithm

**Algorithm**: AES-256-GCM (Advanced Encryption Standard with Galois/Counter Mode)
- **Key Size**: 256 bits (32 bytes)
- **IV Length**: 16 bytes (128 bits)
- **Salt Length**: 64 bytes
- **Authentication Tag**: 16 bytes (GCM provides built-in authentication)
- **Key Derivation**: PBKDF2 with SHA-512, 100,000 iterations

#### How Encryption Works

1. **Key Derivation**:
   - A master encryption key is derived from system-specific information:
     - User's home directory
     - System hostname
     - Username
     - Operating system platform
     - System architecture
   - These values are combined and hashed to create a unique, system-specific seed
   - PBKDF2 (Password-Based Key Derivation Function 2) is used with 100,000 iterations to derive the encryption key
   - This ensures the key is unique to each user's system and cannot be easily replicated

2. **Encryption Process**:
   ```
   Plain Text API Key
        ↓
   Generate random IV (16 bytes)
   Generate random salt (64 bytes)
        ↓
   Derive encryption key using PBKDF2 (salt + master key)
        ↓
   Encrypt with AES-256-GCM
        ↓
   Get authentication tag (GCM provides integrity)
        ↓
   Format: base64(iv):base64(salt):base64(tag):base64(encrypted_data)
   ```

3. **Storage Format**:
   - The encrypted API key is stored as a colon-separated string:
     ```
     <base64_iv>:<base64_salt>:<base64_tag>:<base64_encrypted_data>
     ```
   - All components are Base64 encoded for safe JSON storage

4. **Decryption Process**:
   ```
   Encrypted String (from config file)
        ↓
   Split by ':' to get IV, salt, tag, encrypted_data
   Decode all from Base64
        ↓
   Derive same encryption key using PBKDF2 (salt + master key)
        ↓
   Decrypt with AES-256-GCM
   Verify authentication tag
        ↓
   Plain Text API Key
   ```

#### Security Features

1. **System-Specific Keys**: 
   - Encryption keys are derived from system-specific information
   - The same API key encrypted on different systems will produce different ciphertext
   - This prevents copying encrypted keys between systems

2. **Authenticated Encryption**:
   - GCM mode provides both confidentiality and authenticity
   - Any tampering with the encrypted data will be detected during decryption
   - Authentication tag ensures data integrity

3. **Strong Key Derivation**:
   - PBKDF2 with 100,000 iterations makes brute-force attacks computationally expensive
   - SHA-512 hash function provides strong cryptographic properties

4. **Random IVs and Salts**:
   - Each encryption uses a unique random IV (Initialization Vector)
   - Each encryption uses a unique random salt
   - This ensures the same plaintext produces different ciphertext each time

5. **File Permissions**:
   - Configuration file permissions are set to `600` (owner read/write only)
   - Prevents other users on the system from reading the encrypted key

6. **Password Input Masking**:
   - When entering the API key, input is masked with `*` characters
   - Prevents the key from being visible in terminal history or screen recordings

7. **Automatic Cleanup on Update**:
   - API keys are automatically removed when package version changes
   - Ensures users re-authenticate after updates
   - Prevents issues with encryption keys from previous versions

#### Backward Compatibility

- The system automatically detects if an API key is stored in plain text (legacy format)
- Plain text keys are automatically encrypted on the next save operation
- During decryption, if the format doesn't match encrypted format, it returns the value as-is (for legacy support)
- Version checking gracefully handles missing version information (first-time users)
- Version checking gracefully handles missing version information (first-time users)

#### Security Considerations

**What This Protects Against**:
- ✅ Unauthorized file access (if file permissions are set correctly)
- ✅ Accidental exposure in logs or backups
- ✅ Basic file system inspection
- ✅ Copying config files between systems

**What This Does NOT Protect Against**:
- ⚠️ Root/admin access to the system (they can read memory/processes)
- ⚠️ Malware with system-level access
- ⚠️ Physical access to an unlocked system
- ⚠️ Memory dumps (key exists in plain text in memory during use)

**Best Practices**:
- Keep your system secure and up-to-date
- Use strong system passwords
- Don't share your config file
- Consider using environment variables for additional security in shared environments
- Regularly rotate your API keys

#### Technical Implementation Details

**Encryption Functions** (in `src/config.js`):

- `deriveEncryptionKey()`: Creates a system-specific master key
- `encrypt(text)`: Encrypts plain text using AES-256-GCM
- `decrypt(encryptedData)`: Decrypts encrypted data

**Integration Points**:
- `getApiKey()`: Automatically decrypts when reading from config
- `saveConfig()`: Automatically encrypts before writing to disk
- Uses Node.js built-in `crypto` module (no external dependencies)

### History File
- **Path**: `~/.shellmancer-history`
- **Format**: Plain text, one command per line
- **Max Size**: 1000 entries (in-memory during session)
- **Purpose**: Provides command history for arrow key navigation during the active session
- **Lifetime**: **Temporary** - The history file is automatically deleted when the session closes
- **Behavior**: 
  - Loaded at session startup (if exists from previous session)
  - Maintained in memory during the session
  - Deleted on session exit (via `exit` command or Ctrl+C)
  - Each new session starts fresh (no persistent history between sessions)

---

## API Integration

### Gemini API Endpoint
```
https://generativelanguage.googleapis.com/v1/models/{model}:generateContent?key={apiKey}
```

### Request Format
```json
{
  "contents": [{
    "parts": [{
      "text": "User query here"
    }]
  }]
}
```

### Response Format
```json
{
  "candidates": [{
    "content": {
      "parts": [{
        "text": "AI response text"
      }]
    }
  }]
}
```

### Error Handling
- Network errors: Logged with chalk.red, returns null
- Invalid API key: Handled by API, error message displayed
- Missing response: Checks for null/undefined, displays error message

---

## Dependencies

### Core Dependencies
- **axios**: HTTP client for API requests
- **chalk**: Terminal string styling
- **chalk-animation**: Animated terminal text (not actively used)
- **figlet**: ASCII art banner generation
- **gradient-string**: Gradient text colors
- **inquirer**: Interactive CLI prompts
- **nanospinner**: CLI spinners (not actively used)
- **remove-markdown**: Removes markdown formatting from text

### Node.js Built-ins Used
- **fs**: File system operations
- **os**: System information
- **path**: Path manipulation
- **child_process**: Executing shell commands
- **readline**: Interactive input (for interactive shell)
- **crypto**: Cryptographic operations (API key encryption/decryption)

---

## Platform Support

### Windows
- Uses PowerShell (`powershell.exe`) for command execution
- Uses `where` command for command detection
- Config stored in `C:\Users\<username>\.shell-sage-config.json`

### Unix/Linux/macOS
- Uses user's shell or `/bin/bash` for command execution
- Uses `which` command for command detection
- Config stored in `~/.shell-sage-config.json`

---

## Known Issues / TODOs

1. **Config Bug**: `getDefaultModel()` checks `config.getDefaultModel` instead of `config.defaultModel`
2. **Version Display Bug**: `showVersion()` references undefined `latestVersion` variable
3. **Interactive Shell**: System-info command is not fully implemented in interactive mode
4. **Automate Command**: Execution stops on first error (TODO: continue to next command)

---

## Security Considerations

1. **API Key Storage**: 
   - ✅ Encrypted using AES-256-GCM before storage
   - ✅ System-specific encryption keys prevent cross-system copying
   - ✅ File permissions set to 600 (owner read/write only)
   - ✅ Password input masking prevents visibility during entry
   - ✅ Automatically removed on package updates
2. **Command Execution**: User confirmation required before executing generated commands
3. **No Input Sanitization**: Commands are executed as-is (user responsibility)
4. **History File**: 
   - ✅ Automatically deleted when session closes
   - ✅ Only exists during active session
   - ✅ No persistent storage of command history
   - ✅ History maintained only in memory during session

---

## Extension Points

The architecture allows for easy extension:

1. **New Commands**: Add new command file in `src/commands/` and add case in `index.js`
2. **New API Models**: Update `getDefaultModel()` and model validation
3. **New Display Features**: Extend `display.js` module
4. **New Configuration Options**: Add to config structure and accessors

---

## Summary

Shellmancer is a well-structured CLI tool that provides AI assistance in the terminal. It uses a modular architecture with clear separation of concerns:
- **Configuration**: Persistent storage management
- **API**: External service communication
- **Display**: UI and formatting
- **Commands**: Feature-specific modules

The tool balances simplicity with functionality, providing both interactive and command-based interfaces for different use cases.

