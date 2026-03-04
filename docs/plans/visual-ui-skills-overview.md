# Visual UI/UX Intelligence: AI Skills & Tools

To give an AI "visual tools" to understand UI layout and its impact on UX/CX conversion, we utilize a combination of the **Stitch ecosystem**, **browser-based verification**, and **heuristic audit skills**.

## 1. Local Skills for Visual Intelligence

### [high-agency-design-architect](file:///root/.agent/skills/high-agency-design-architect/SKILL.md)
This is the most powerful "visual brain" currently in your environment. It handles the end-to-end bridge between visual inspiration and functional code.
- **Visual DNA Extraction**: Analyzes screenshots to extract specific design tokens (hex codes, spacing, border-radius, typography).
- **Heuristic Evaluation**: Performs Mode 2 "Heuristic Evaluation" where it audits layout for hierarchy, contrast, and alignment.
- **Visual Verification**: Uses the `browser_subagent` to visit live local routes, take screenshots, and compare them against the "Design DNA" to fix alignment or styling bugs dynamically.

### [web-design-guidelines](file:///home/circletel/.agents/skills/web-design-guidelines/SKILL.md)
A rule-based audit engine that pulls the latest industry standards.
- **Automated Audits**: Checks UI code for accessibility compliance and general UX best practices.
- **External Intel**: Regularly fetches fresh guidelines from Vercel's `web-interface-guidelines` repository to stay current with modern conversion patterns.

### [image-prompt-generator](file:///home/circletel/.agents/skills/image-prompt-generator/SKILL.md)
Specializes in the "Subject + Action + Lighting" formula for high-conversion visual assets.
- **Atmospheric Assets**: Generates prompts for hero images and product shots that use "Golden Hour" or "Studio Lighting" to evoke specific emotional responses (Vibrant/Positive).
- **Text-Heavy Rendering**: Includes specific instructions for rendering text on posters or billboards, crucial for CX-driven marketing pages.

### [compound-learnings](file:///home/circletel/.agents/skills/compound-learnings/SKILL.md)
The mechanism for "Visual Evolution" and Recursive Self-Improvement.
- **Pattern Extraction**: Automatically detects when a design change improves conversion or when a "Friction Point" is resolved, storing these as reusable "Winning Patterns."
- **Correction Loop**: Learns from user feedback (e.g., "That layout is too cluttered") and synthesizes new rules to avoid those patterns in the future.

### [frontend-design](file:///home/circletel/.agents/skills/frontend-design/SKILL.md)
Focuses on the "Design Thinking" layer that impacts **CX (Customer Experience)**.
- **Tone & Purpose**: Forces the AI to commit to a specific aesthetic "Tone" (e.g., Luxury/Refined vs. Industrial/Utilitarian) to ensure the UI resonates with the target audience.
- **Spatial Composition**: Guides the AI to use unexpected layouts and grid-breaking elements that increase brand memorability and engagement.

---

## 2. External Ecosystems (Recommended)

### [Skills.sh](https://skills.sh/)
An open-source library for standardizing AI agent behaviors.
- **Standardized Tools**: Provides the building blocks for agents to interact with professional tools (Figma, GitHub, Vercel).
- **Reusable Workflows**: You can find or create "Audit Skills" here that specifically target conversion metrics or SEO-friendly layouts.

### [Playbook.com](https://playbook.com/)
A visual-first collaboration space that gives AI "visual context."
- **AI-Assisted Conversion**: Tools for converting screenshots into editable wireframes or generating context-aware image assets directly within the design workflow.
- **Visual Asset Management**: Helps organize the raw visual DNA that informs the AI's understanding of "what looks good" for a specific brand.

---

## 3. The Visual Toolset

The AI uses these specific tools to "see" and "think" visually:

| Tool | Purpose | Impact on Conversion |
| :--- | :--- | :--- |
| **browser_subagent** | Live visual verification and interaction testing. | Ensures "Perfect Pixel" fidelity and catches breaking UI bugs before users see them. |
| **mcp_StitchMCP** | Screen generation, editing, and variant creation. | Enables rapid A/B layout testing and variant generation to optimize for CX. |
| **generate_image** | Dynamic asset creation (hero images, icons). | Creates high-quality, relevant visual cues that guide the user toward the conversion goal. |
| **Design Memory** | Persistence of "Winning Patterns" and "Avoidance Rules". | Prevents the AI from repeating bad UX patterns and doubles down on what works for *your* users. |

## Next Steps for Enhanced Conversion
1. **Activate the Heuristic Audit**: Run `high-agency-design-architect` Mode 2 on your primary landing pages.
2. **Implement Stitch Variants**: Use `generate_variants` to create 3-4 layout alternatives and evaluate them against the [web-design-guidelines](file:///home/circletel/.agent/skills/web-design-guidelines).
3. **Establish Design Memory**: Start documenting "Winning Patterns" to ensure the AI's visual intelligence evolves with your specific project.
