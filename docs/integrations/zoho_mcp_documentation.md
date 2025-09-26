# Zoho MCP (Model Context Protocol) Documentation
## Complete Guide for LLM Integration with Zoho Ecosystem

---

## Table of Contents
1. [Executive Summary](#executive-summary)
2. [What is Zoho MCP?](#what-is-zoho-mcp)
3. [Core Architecture](#core-architecture)
4. [Supported Zoho Applications](#supported-zoho-applications)
5. [How Zoho MCP Works](#how-zoho-mcp-works)
6. [Integration Setup](#integration-setup)
7. [Available Tools and Actions](#available-tools-and-actions)
8. [Security and Authentication](#security-and-authentication)
9. [Use Cases and Examples](#use-cases-and-examples)
10. [Technical Implementation](#technical-implementation)
11. [Best Practices](#best-practices)
12. [Troubleshooting](#troubleshooting)

---

## Executive Summary

Zoho MCP is a product built around the Model Context Protocol (MCP), a standardized interface that allows AI agents to interact seamlessly with business software. It provides the infrastructure, configuration UI, security, and integrations needed to implement AI-powered automation quickly and securely within the Zoho ecosystem and third-party applications.

### Key Benefits:
- **Standardized Integration**: Works with any LLM (Claude, GPT, etc.) through a universal protocol
- **Cross-Platform Support**: Integrates with 15+ Zoho apps and 300+ third-party applications
- **No-Code Configuration**: Set up MCP servers and define tools through UI without extensive coding
- **Enterprise Security**: OAuth-based authentication with user-level permissions
- **Real-Time Execution**: Transform natural language into actual business actions

---

## What is Zoho MCP?

### Definition
Zoho MCP is the execution layer that enables AI agents to take real action within business applications. Unlike traditional chatbots or automation tools, it exposes your apps' tools, actions, and business context through a standardized protocol, allowing AI agents powered by any LLM to turn natural language into real outcomes.

### MCP vs Zoho MCP
- **MCP (Protocol)**: The open standard that defines how agents communicate with business systems
- **Zoho MCP (Product)**: The infrastructure that lets you create agent-ready endpoints, making Zoho apps executable by AI agents

### Key Differentiators:
- Not a chatbot builder or automation tool
- Provides the execution interface for AI agents
- Enables context-aware, intelligent task execution
- Works with existing LLMs without modification

---

## Core Architecture

### Three Essential Components

#### 1. Host
- The AI application or assistant (e.g., Claude, GPT)
- Interprets natural language and determines intent
- Examples: Chatbots, virtual assistants, AI agents

#### 2. Client
- Built into the host application
- "Speaks" the MCP language
- Handles connection and translation between host and server
- Manages request/response communication

#### 3. Server
- The external system being accessed (Zoho apps, databases, third-party tools)
- MCP-ready endpoints that expose specific functions
- Securely provides data and executes actions

### Communication Flow
```
User Request → AI Agent (Host) → MCP Client → MCP Server → Zoho Application
                                                    ↓
User Response ← AI Agent ← MCP Client ← Response ← Action Executed
```

---

## Supported Zoho Applications

### Core Zoho Applications (15+)

#### Customer Relationship Management
- **Zoho CRM**: Lead management, deal tracking, contact management
- **Bigin**: Simplified CRM for small businesses

#### Communication & Collaboration
- **Zoho Mail**: Email management and automation
- **Zoho Cliq**: Team messaging and notifications
- **Zoho Meeting**: Video conferencing and scheduling

#### Customer Support
- **Zoho Desk**: Ticket management, support automation
- **Zoho Assist**: Remote support and screen sharing

#### Project Management
- **Zoho Projects**: Task management, project tracking
- **Zoho Sprints**: Agile project management

#### Document Management
- **Zoho WorkDrive**: File storage and collaboration
- **Zoho Writer**: Document creation and editing
- **Zoho Sheet**: Spreadsheet management

#### Business Operations
- **Zoho Calendar**: Scheduling and event management
- **Zoho Books**: Accounting and invoicing
- **Zoho Analytics**: Data analysis and reporting
- **Zoho Sign**: Digital signature management

### Third-Party Integrations (300+)
Through Zoho Flow integration:
- **Google Workspace**: Gmail, Google Drive, Google Calendar
- **Microsoft**: Outlook, Teams, SharePoint
- **Communication**: Slack, Discord, WhatsApp
- **CRM**: Salesforce, HubSpot
- **Project Management**: Notion, Asana, Trello
- **Development**: GitHub, GitLab, Jira

---

## How Zoho MCP Works

### Step-by-Step Process

#### 1. User Request Processing
```
Example: "Create a new lead in Zoho CRM for emma@zylker.com"
```
- AI agent receives natural language request
- Interprets intent and identifies required action

#### 2. Context Gathering
- Agent fetches relevant information from available sources
- Retrieves user permissions and access levels
- Checks for related data across connected systems

#### 3. Tool Selection
- Agent identifies appropriate MCP tool
- Maps request to specific API endpoints
- Validates required parameters

#### 4. Action Execution
- MCP server executes the requested action
- Performs validation and error checking
- Returns success/failure response with details

### Request Example
```json
{
  "action": "create_lead",
  "app": "zoho_crm",
  "parameters": {
    "email": "emma@zylker.com",
    "layout": "standard",
    "primary_contact": "email"
  }
}
```

---

## Integration Setup

### Prerequisites
1. Zoho account with appropriate permissions
2. AI platform (Claude Desktop, Cursor, VS Code, etc.)
3. OAuth credentials from Zoho API Console

### Configuration Steps

#### 1. Zoho API Console Setup
```
1. Navigate to Zoho API Console
2. Create new "Server-based Application"
3. Configure redirect URI: http://localhost:8099/callback
4. Select required scopes (e.g., ZohoBooks.fullaccess.all)
5. Save Client ID, Client Secret, and Organization ID
```

#### 2. MCP Server Configuration

##### For Claude Desktop
```json
{
  "mcpServers": {
    "ZohoMCP": {
      "command": "docker",
      "args": [
        "run",
        "-e", "ZOHO_CLIENT_ID=<YOUR_CLIENT_ID>",
        "-e", "ZOHO_CLIENT_SECRET=<YOUR_CLIENT_SECRET>",
        "-e", "ZOHO_REFRESH_TOKEN=<YOUR_REFRESH_TOKEN>",
        "-e", "ZOHO_ORG_ID=<YOUR_ORG_ID>",
        "--network=host",
        "-i", "--rm",
        "zoho/mcp-server"
      ]
    }
  }
}
```

##### For Cursor IDE
```json
{
  "mcpServers": {
    "zoho": {
      "command": "npx",
      "args": ["@composio/cli", "add", "cursor", "--app", "zoho"]
    }
  }
}
```

#### 3. Generate Refresh Token
```bash
uvx zoho-mcp --setup-oauth
```

---

## Available Tools and Actions

### Zoho CRM Actions
```
- create_lead: Create new lead with contact information
- convert_lead: Convert lead to contact/account/deal
- create_record: Add records to any CRM module
- update_record: Modify existing records
- get_records: Retrieve records with filters
- create_tags: Add tags for organization
- associate_records: Link records across modules
- send_email: Send emails from CRM
- schedule_call: Set up calls and meetings
```

### Zoho Mail Actions
```
- send_email: Send emails with attachments
- create_draft: Save email drafts
- schedule_email: Schedule emails for later
- search_emails: Find emails with criteria
- organize_folders: Manage email folders
- set_filters: Create email filters
- manage_signatures: Update email signatures
```

### Zoho Desk Actions
```
- create_ticket: Create support tickets
- update_ticket_status: Change ticket status
- assign_ticket: Assign to agents
- add_comment: Add ticket comments
- escalate_ticket: Escalate priority tickets
- search_tickets: Find tickets by criteria
- generate_report: Create support reports
```

### Zoho Projects Actions
```
- create_project: Initialize new projects
- create_task: Add tasks to projects
- assign_task: Assign tasks to team members
- update_progress: Update task progress
- create_milestone: Set project milestones
- track_time: Log time entries
- generate_gantt: Create Gantt charts
```

### Zoho Calendar Actions
```
- create_event: Schedule meetings/events
- update_event: Modify event details
- send_invites: Send calendar invitations
- check_availability: Find free time slots
- set_reminders: Configure event reminders
- recurring_events: Set up recurring meetings
```

### Zoho WorkDrive Actions
```
- upload_file: Upload documents
- create_folder: Organize file structure
- share_file: Share with permissions
- search_files: Find documents
- version_control: Manage file versions
- set_permissions: Configure access rights
```

---

## Security and Authentication

### OAuth 2.0 Implementation
- Secure token-based authentication
- Refresh token mechanism for persistent access
- Scope-based permissions control

### User-Level Permissions
- Agents operate under user permissions
- Actions limited to authorized operations
- Role-based access control (RBAC)

### Data Security Features
- End-to-end encryption for data transmission
- Audit trails for all agent actions
- Compliance with enterprise security protocols
- GDPR and SOC 2 compliant infrastructure

### Best Practices
1. Use minimum required scopes
2. Rotate refresh tokens regularly
3. Implement IP restrictions where possible
4. Monitor agent activity through audit logs
5. Use environment variables for credentials

---

## Use Cases and Examples

### 1. Sales Automation
```
User: "Find all leads from last week, convert qualified ones to contacts, and schedule follow-up calls"

Actions:
- Search leads with date filter
- Evaluate lead scores
- Convert qualified leads
- Create calendar events for calls
```

### 2. Customer Support Workflow
```
User: "Check for urgent tickets, assign them to available agents, and send status updates to customers"

Actions:
- Query tickets by priority
- Check agent availability
- Assign tickets based on expertise
- Send automated email updates
```

### 3. Project Management
```
User: "Create a new project for Q1 campaign, add team members, and set up weekly status meetings"

Actions:
- Create project in Zoho Projects
- Add team members from Zoho People
- Create recurring calendar events
- Set up Cliq channel for updates
```

### 4. Financial Operations
```
User: "Generate invoices for all completed projects this month and send payment reminders"

Actions:
- Query completed projects
- Create invoices in Zoho Books
- Send invoices via Zoho Mail
- Schedule payment reminders
```

### 5. Cross-Platform Integration
```
User: "When a deal closes in Zoho CRM, create a project in Notion and notify the team on Slack"

Actions:
- Monitor CRM deal status
- Create Notion project via MCP
- Send Slack notification
- Update internal dashboards
```

---

## Technical Implementation

### Environment Variables
```bash
# Required Configuration
ZOHO_CLIENT_ID=your_client_id
ZOHO_CLIENT_SECRET=your_client_secret
ZOHO_REFRESH_TOKEN=your_refresh_token
ZOHO_ORGANIZATION_ID=your_org_id
ZOHO_REGION=US  # US, EU, IN, AU, CN

# Optional Settings
ACCOUNTS_SERVER_URL=https://accounts.zoho.com
ANALYTICS_SERVER_URL=https://analytics.zoho.com
MCP_DATA_DIR=/path/to/data
SLEEP_TIME=4  # Seconds between status polls
QUEUE_TIMEOUT=120  # Maximum queue wait time
EXECUTION_TIMEOUT=30  # Query execution timeout
```

### API Rate Limits
- Standard: 100 requests per minute
- Bulk operations: 10 requests per minute
- Search operations: 50 requests per minute

### Error Handling
```javascript
try {
  const response = await mcp.execute({
    tool: 'create_lead',
    params: leadData
  });
  
  if (response.success) {
    console.log('Lead created:', response.data);
  } else {
    console.error('Error:', response.error);
  }
} catch (error) {
  console.error('MCP Error:', error);
  // Implement retry logic
}
```

---

## Best Practices

### 1. Prompt Engineering
- Be specific with instructions
- Include context and constraints
- Specify output format requirements
- Use step-by-step instructions for complex tasks

### 2. Performance Optimization
- Batch similar operations
- Use appropriate filtering to reduce data transfer
- Cache frequently accessed data
- Implement pagination for large datasets

### 3. Error Recovery
- Implement retry mechanisms with exponential backoff
- Log all operations for debugging
- Provide fallback options for critical operations
- Monitor success rates and adjust accordingly

### 4. Security Considerations
- Never hardcode credentials
- Use environment-specific configurations
- Implement request validation
- Regular security audits

### 5. Integration Patterns
- Start with simple, single-app integrations
- Test thoroughly in development environment
- Gradually add complexity and cross-app workflows
- Document all custom configurations

---

## Troubleshooting

### Common Issues and Solutions

#### Authentication Errors
```
Error: Invalid refresh token
Solution: Regenerate token using: uvx zoho-mcp --setup-oauth
```

#### Permission Denied
```
Error: Insufficient permissions for operation
Solution: Check OAuth scopes and user role permissions
```

#### Rate Limiting
```
Error: API rate limit exceeded
Solution: Implement request queuing and backoff strategy
```

#### Connection Issues
```
Error: Cannot connect to MCP server
Solution: 
1. Verify Docker is running
2. Check network configuration
3. Confirm firewall settings
4. Validate server URLs for your region
```

#### Data Center Configuration
```
Error: Invalid server URL
Solution: Ensure URLs match your organization's data center:
- US: accounts.zoho.com
- EU: accounts.zoho.eu
- IN: accounts.zoho.in
- AU: accounts.zoho.com.au
```

---

## Conclusion

Zoho MCP represents a significant advancement in AI-business software integration, providing a standardized, secure, and scalable way to connect AI agents with the Zoho ecosystem and beyond. By implementing MCP, organizations can:

- Dramatically reduce time spent on routine tasks
- Enable natural language interaction with business systems
- Create sophisticated cross-platform workflows
- Maintain enterprise-grade security and compliance
- Scale AI capabilities across the organization

The future of business automation lies in the seamless integration of AI agents with existing business tools, and Zoho MCP provides the foundation for this transformation.

---

## Additional Resources

- [Zoho MCP Official Documentation](https://www.zoho.com/mcp/)
- [Zoho API Console](https://api-console.zoho.com/)
- [Model Context Protocol Specification](https://modelcontextprotocol.io/)
- [Zoho Developer Portal](https://www.zoho.com/developer/)
- [MCP GitHub Repository](https://github.com/zoho/mcp-servers)

---

*Last Updated: September 2025*
*Version: 1.0*