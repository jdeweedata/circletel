# Memory tool

The memory tool enables Claude to store and retrieve information across conversations through a memory file directory. Claude can create, read, update, and delete files that persist between sessions, allowing it to build knowledge over time without keeping everything in the context window.

The memory tool operates client-side—you control where and how the data is stored through your own infrastructure.

<Note>
  The memory tool is currently in beta. To enable it, use the beta header `context-management-2025-06-27` in your API requests.

  Please reach out through our [feedback form](https://forms.gle/YXC2EKGMhjN1c4L88) to share your feedback on this feature.
</Note>

## Use cases

* Maintain project context across multiple agent executions
* Learn from past interactions, decisions, and feedback
* Build knowledge bases over time
* Enable cross-conversation learning where Claude improves at recurring workflows

## How it works

When enabled, Claude automatically checks its memory directory before starting tasks. Claude can create, read, update, and delete files in the `/memories` directory to store what it learns while working, then reference those memories in future conversations to handle similar tasks more effectively or pick up where it left off.

Since this is a client-side tool, Claude makes tool calls to perform memory operations, and your application executes those operations locally. This gives you complete control over where and how the memory is stored. For security, you should restrict all memory operations to the `/memories` directory.

### Example: How memory tool calls work

When you ask Claude to help with a task, Claude automatically checks its memory directory first. Here's what a typical interaction looks like:

**1. User request:**

```
"Help me respond to this customer service ticket."
```

**2. Claude checks the memory directory:**

```
"I'll help you respond to the customer service ticket. Let me check my memory for any previous context."
```

Claude calls the memory tool:

```json
{
  "type": "tool_use",
  "id": "toolu_01C4D5E6F7G8H9I0J1K2L3M4",
  "name": "memory",
  "input": {
    "command": "view",
    "path": "/memories"
  }
}
```

**3. Your application returns the directory contents:**

```json
{
  "type": "tool_result",
  "tool_use_id": "toolu_01C4D5E6F7G8H9I0J1K2L3M4",
  "content": "Directory: /memories\n- customer_service_guidelines.xml\n- refund_policies.xml"
}
```

**4. Claude reads relevant files:**

```json
{
  "type": "tool_use",
  "id": "toolu_01D5E6F7G8H9I0J1K2L3M4N5",
  "name": "memory",
  "input": {
    "command": "view",
    "path": "/memories/customer_service_guidelines.xml"
  }
}
```

**5. Your application returns the file contents:**

```json
{
  "type": "tool_result",
  "tool_use_id": "toolu_01D5E6F7G8H9I0J1K2L3M4N5",
  "content": "<guidelines>\n<addressing_customers>\n- Always address customers by their first name\n- Use empathetic language\n..."
}
```

**6. Claude uses the memory to help:**

```
"Based on your customer service guidelines, I can help you craft a response. Please share the ticket details..."
```

## Supported models

The memory tool is available on:

* Claude Sonnet 4.5 (`claude-sonnet-4-5-20250929`)
* Claude Sonnet 4 (`claude-sonnet-4-20250514`)
* Claude Opus 4.1 (`claude-opus-4-1-20250805`)
* Claude Opus 4 (`claude-opus-4-20250514`)

## Getting started

To use the memory tool:

1. Include the beta header `context-management-2025-06-27` in your API requests
2. Add the memory tool to your request
3. Implement client-side handlers for memory operations

<Note>
  To handle memory tool operations in your application, you need to implement handlers for each memory command. Our SDKs provide memory tool helpers that handle the tool interface—you can subclass `BetaAbstractMemoryTool` (Python) or use `betaMemoryTool` (TypeScript) to implement your own memory backend (file-based, database, cloud storage, encrypted files, etc.).

  For working examples, see:

  * Python: [examples/memory/basic.py](https://github.com/anthropics/anthropic-sdk-python/blob/main/examples/memory/basic.py)
  * TypeScript: [examples/tools-helpers-memory.ts](https://github.com/anthropics/anthropic-sdk-typescript/blob/main/examples/tools-helpers-memory.ts)
</Note>

## Basic usage

<CodeGroup>
  ````bash cURL
  curl https://api.anthropic.com/v1/messages \
      --header "x-api-key: $ANTHROPIC_API_KEY" \
      --header "anthropic-version: 2023-06-01" \
      --header "content-type: application/json" \
      --header "anthropic-beta: context-management-2025-06-27" \
      --data '{
          "model": "claude-sonnet-4-5",
          "max_tokens": 2048,
          "messages": [
              {
                  "role": "user",
                  "content": "I'\''m working on a Python web scraper that keeps crashing with a timeout error. Here'\''s the problematic function:\n\n```python\ndef fetch_page(url, retries=3):\n    for i in range(retries):\n        try:\n            response = requests.get(url, timeout=5)\n            return response.text\n        except requests.exceptions.Timeout:\n            if i == retries - 1:\n                raise\n            time.sleep(1)\n```\n\nPlease help me debug this."
              }
          ],
          "tools": [{
              "type": "memory_20250818",
              "name": "memory"
          }]
      }'
  ````

  ````python Python
  import anthropic

  client = anthropic.Anthropic()

  message = client.beta.messages.create(
      model="claude-sonnet-4-5",
      max_tokens=2048,
      messages=[
          {
              "role": "user",
              "content": "I'm working on a Python web scraper that keeps crashing with a timeout error. Here's the problematic function:\n\n```python\ndef fetch_page(url, retries=3):\n    for i in range(retries):\n        try:\n            response = requests.get(url, timeout=5)\n            return response.text\n        except requests.exceptions.Timeout:\n            if i == retries - 1:\n                raise\n            time.sleep(1)\n```\n\nPlease help me debug this."
          }
      ],
      tools=[{
          "type": "memory_20250818",
          "name": "memory"
      }],
      betas=["context-management-2025-06-27"]
  )
  ````

  ````typescript TypeScript
  import Anthropic from '@anthropic-ai/sdk';

  const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
  });

  const message = await anthropic.beta.messages.create({
    model: "claude-sonnet-4-5",
    max_tokens: 2048,
    messages: [
      {
        role: "user",
        content: "I'm working on a Python web scraper that keeps crashing with a timeout error. Here's the problematic function:\n\n```python\ndef fetch_page(url, retries=3):\n    for i in range(retries):\n        try:\n            response = requests.get(url, timeout=5)\n            return response.text\n        except requests.exceptions.Timeout:\n            if i == retries - 1:\n                raise\n            time.sleep(1)\n```\n\nPlease help me debug this."
      }
    ],
    tools: [{
      type: "memory_20250818",
      name: "memory"
    }],
    betas: ["context-management-2025-06-27"]
  });
  ````
</CodeGroup>

## Tool commands

Your client-side implementation needs to handle these memory tool commands:

### view

Shows directory contents or file contents with optional line ranges:

```json
{
  "command": "view",
  "path": "/memories",
  "view_range": [1, 10]  // Optional: view specific lines
}
```

### create

Create or overwrite a file:

```json
{
  "command": "create",
  "path": "/memories/notes.txt",
  "file_text": "Meeting notes:\n- Discussed project timeline\n- Next steps defined\n"
}
```

### str\_replace

Replace text in a file:

```json
{
  "command": "str_replace",
  "path": "/memories/preferences.txt",
  "old_str": "Favorite color: blue",
  "new_str": "Favorite color: green"
}
```

### insert

Insert text at a specific line:

```json
{
  "command": "insert",
  "path": "/memories/todo.txt",
  "insert_line": 2,
  "insert_text": "- Review memory tool documentation\n"
}
```

### delete

Delete a file or directory:

```json
{
  "command": "delete",
  "path": "/memories/old_file.txt"
}
```

### rename

Rename or move a file/directory:

```json
{
  "command": "rename",
  "old_path": "/memories/draft.txt",
  "new_path": "/memories/final.txt"
}
```

## Prompting guidance

We automatically include this instruction to the system prompt when the memory tool is included:

```
IMPORTANT: ALWAYS VIEW YOUR MEMORY DIRECTORY BEFORE DOING ANYTHING ELSE.
MEMORY PROTOCOL:
1. Use the `view` command of your `memory` tool to check for earlier progress.
2. ... (work on the task) ...
     - As you make progress, record status / progress / thoughts etc in your memory.
ASSUME INTERRUPTION: Your context window might be reset at any moment, so you risk losing any progress that is not recorded in your memory directory.
```

If you observe Claude creating cluttered memory files, you can include this instruction:

> Note: when editing your memory folder, always try to keep its content up-to-date, coherent and organized. You can rename or delete files that are no longer relevant. Do not create new files unless necessary.

You can also guide what Claude writes to memory, e.g., "Only write down information relevant to \<topic> in your memory system."

## Security considerations

Here are important security concerns when implementing your memory store:

### Sensitive information

Claude will usually refuse to write down sensitive information in memory files. However, you may want to implement stricter validation that strips out potentially sensitive information.

### File storage size

Consider tracking memory file sizes and preventing files from growing too large. Consider adding a maximum number of characters the memory read command can return, and let Claude paginate through contents.

### Memory expiration

Consider clearing out memory files periodically that haven't been accessed in an extended time.

### Path traversal protection

<Warning>
  Malicious path inputs could attempt to access files outside the `/memories` directory. Your implementation **MUST** validate all paths to prevent directory traversal attacks.
</Warning>

Consider these safeguards:

* Validate that all paths start with `/memories`
* Resolve paths to their canonical form and verify they remain within the memory directory
* Reject paths containing sequences like `../`, `..\\`, or other traversal patterns
* Watch for URL-encoded traversal sequences (`%2e%2e%2f`)
* Use your language's built-in path security utilities (e.g., Python's `pathlib.Path.resolve()` and `relative_to()`)

## Error handling

The memory tool uses the same error handling patterns as the [text editor tool](/en/docs/agents-and-tools/tool-use/text-editor-tool#handle-errors). Common errors include file not found, permission errors, and invalid paths.
