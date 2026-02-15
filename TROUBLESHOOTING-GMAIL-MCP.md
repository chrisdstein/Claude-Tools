# Gmail MCP Server Troubleshooting Guide

## Problem: credentials.json Not Found

If you're seeing this error when the Gmail MCP server starts:

```
[Gmail MCP] Failed to initialize Gmail client: Error: credentials.json not found.
Please create OAuth2 credentials in Google Cloud Console and save to credentials.json
```

This guide will help you resolve it.

## Common Causes

1. **credentials.json file doesn't exist** in the project root
2. **File is in the wrong location** (e.g., in `src/` instead of project root)
3. **Path resolution issues** on Windows vs. Linux/Mac
4. **TypeScript not compiled** after code changes (dist/ folder has old code)

## Step-by-Step Solution

### 1. Create credentials.json File

First, ensure you have OAuth2 credentials from Google Cloud Console:

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create or select a project
3. Enable Gmail API
4. Create OAuth 2.0 credentials (Desktop app)
5. Download the credentials JSON

Create `credentials.json` in the **project root directory** (same level as `package.json`):

```json
{
  "installed": {
    "client_id": "YOUR_CLIENT_ID.apps.googleusercontent.com",
    "project_id": "your-project-id",
    "auth_uri": "https://accounts.google.com/o/oauth2/auth",
    "token_uri": "https://oauth2.googleapis.com/token",
    "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
    "client_secret": "YOUR_CLIENT_SECRET",
    "redirect_uris": ["http://localhost"]
  }
}
```

**Important:** The file must be named exactly `credentials.json` (case-sensitive on Linux/Mac).

### 2. Verify File Location

On **Windows** (PowerShell):
```powershell
# Navigate to project root
cd C:\Users\YourName\Claude-Tools

# Check if credentials.json exists
Test-Path .\credentials.json

# Should return: True
```

On **Linux/Mac** (Bash):
```bash
# Navigate to project root
cd ~/Claude-Tools

# Check if credentials.json exists
ls -la credentials.json

# Should show the file
```

### 3. Rebuild the Project (CRITICAL)

After any code changes or git pull, you **must** rebuild the TypeScript project:

```bash
npm run build
```

This compiles `src/*.ts` files into `dist/*.js` files. The MCP server runs from the `dist/` folder, so if you don't rebuild, it will use old code.

### 4. Restart Claude Desktop

After rebuilding:

1. **Completely quit** Claude Desktop (don't just close the window)
2. **Restart** Claude Desktop
3. Check the logs for the Gmail MCP server

### 5. Enable Debug Logging

If it's still not working, check the debug output in the logs. You should see:

```
[Gmail MCP] Initializing Gmail client...
[Gmail MCP] Project root is: /path/to/Claude-Tools
[Gmail MCP] Looking for credentials at: /path/to/Claude-Tools/credentials.json
```

If you don't see these debug lines, the dist folder still has old code - run `npm run build` again.

## Windows-Specific Issues

### Path Separators

Windows uses backslashes (`\`) while Linux/Mac use forward slashes (`/`). Node.js's `path.join()` handles this automatically, but manual string concatenation can cause issues.

### Case Sensitivity

Windows is case-insensitive for filenames, but the code might still be case-sensitive. Use exactly:
- `credentials.json` (not `Credentials.json` or `CREDENTIALS.JSON`)

### PowerShell Execution Policy

If you get execution policy errors running scripts:

```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

## Verification Checklist

- [ ] `credentials.json` exists in project root (same folder as `package.json`)
- [ ] File contains valid OAuth2 credentials from Google Cloud Console
- [ ] Ran `npm run build` to compile TypeScript
- [ ] Completely quit and restarted Claude Desktop
- [ ] Checked MCP logs for debug output showing correct path
- [ ] No permission errors reading the file

## Common Mistakes

1. **Placing credentials.json in src/ folder** - It must be in project root
2. **Forgetting to rebuild after git pull** - Always run `npm run build`
3. **Not fully restarting Claude Desktop** - Must quit completely, not just close window
4. **Using wrong credentials format** - Must have `"installed"` key structure

## Debugging Commands

### Check where Node.js thinks the project root is:

Create a test file `test-path.js`:

```javascript
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

console.log('Current file:', __filename);
console.log('Current directory:', __dirname);
console.log('Project root:', projectRoot);
console.log('Credentials path:', join(projectRoot, 'credentials.json'));
```

Run it:
```bash
node dist/test-path.js
```

### View MCP Server Logs

**Windows:**
```powershell
# Claude Desktop logs are typically in:
%APPDATA%\Claude\logs
```

**Mac:**
```bash
# Check logs at:
~/Library/Logs/Claude/
```

**Linux:**
```bash
# Check logs at:
~/.config/Claude/logs/
```

## Still Not Working?

If you've tried everything above:

1. **Check file permissions:**
   ```bash
   # On Linux/Mac:
   chmod 644 credentials.json

   # On Windows (PowerShell):
   icacls credentials.json
   ```

2. **Verify JSON is valid:**
   ```bash
   node -e "console.log(JSON.parse(require('fs').readFileSync('credentials.json')))"
   ```

3. **Check Node.js version:**
   ```bash
   node --version
   # Should be v18 or higher
   ```

4. **Reinstall dependencies:**
   ```bash
   npm ci
   npm run build
   ```

## Success Indicators

When everything is working, you should see:

```
[Gmail MCP] Initializing Gmail client...
[Gmail MCP] Project root is: /path/to/Claude-Tools
[Gmail MCP] Looking for credentials at: /path/to/Claude-Tools/credentials.json
[Gmail MCP] Starting OAuth flow...
```

Then a browser window will open for OAuth authentication.

## Related Files

- `src/gmail-client.ts` - Main Gmail client logic
- `dist/gmail-client.js` - Compiled version (this is what runs!)
- `credentials.json` - OAuth2 credentials (project root)
- `token.json` - OAuth2 token (created after first auth)
- `claude_desktop_config.json` - MCP server configuration

## Additional Resources

- [Google OAuth2 Setup Guide](https://developers.google.com/identity/protocols/oauth2)
- [MCP Debugging Documentation](https://modelcontextprotocol.io/docs/tools/debugging)
- [Node.js Path Documentation](https://nodejs.org/api/path.html)
