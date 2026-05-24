<img src="https://r2cdn.perplexity.ai/pplx-full-logo-primary-dark%402x.png" style="height:64px;margin-right:32px"/>

# what about [https://github.com/obra/superpowers](https://github.com/obra/superpowers) and [https://github.com/github/spec-kit](https://github.com/github/spec-kit) being used together? Would this possible and what do you think about [https://github.com/garrytan/gbrain](https://github.com/garrytan/gbrain) and [https://github.com/mattpocock/skills](https://github.com/mattpocock/skills)

Yes — using **Superpowers + Spec Kit together is not only possible, it’s probably the strongest combination** for this project. Spec Kit gives you the product and implementation scaffolding through spec-driven phases like constitution, specification, planning, task generation, and implementation, while Superpowers adds workflow discipline around brainstorming, plan writing, execution, parallel agents, code review, and development branch hygiene.[^1][^2][^3][^4]

## Best pairing

The cleanest way to think about it is:


| Tool | Best role | Why it fits |
| :-- | :-- | :-- |
| **Spec Kit** | Product/engineering specification system | Strong for `/speckit.constitution`, `/speckit.specify`, `/speckit.plan`, `/speckit.tasks`, `/speckit.implement`. [^3][^4] |
| **Superpowers** | Agent workflow operating system | Strong for brainstorming, structured plans, execution checkpoints, code review, and parallel worktrees/agents. [^1][^5][^2] |

That means Spec Kit should own the **artifact lifecycle**, while Superpowers should own the **working style** of the coding agent. In practice, that is a very complementary setup.[^2][^4]

## How to use them together

A practical stack for your platform would be:

1. Use **Spec Kit** to create the governing constitution and the formal feature specs for modules like captive portal, venue inventory, advertiser self-serve, revenue engine, and hardware profiles.[^3][^4]
2. Use **Superpowers** to run the actual implementation workflow inside Claude Code: brainstorm, write plan, execute in small steps, request review, then finalize branch.[^5][^1][^2]
3. Keep Spec Kit artifacts as the source of truth, and let Superpowers consume them during execution rather than inventing process on the fly.[^4][^2]

So yes: **Spec Kit for “what and why,” Superpowers for “how the agent behaves while building.”**

## My view on GBrain

**GBrain is interesting, but it solves a different problem.** It is much more of a persistent personal/team knowledge brain with markdown import, search, embeddings, background jobs, skillpacks, routing evaluation, and an MCP-style memory/knowledge substrate than a product-spec workflow tool.[^6][^7]

For your use case, GBrain would be useful if you want a long-lived engineering memory system for:

- architecture decisions,
- venue rollout notes,
- hardware certifications,
- SOPs,
- integration quirks,
- experiment logs,
- ad-sales playbooks.[^7]

I would **not** start with GBrain as the core build methodology. I would treat it as an optional second-layer memory and operational knowledge system once the platform repo and workflows are stable. The risk is introducing too much framework/process overhead too early.[^7]

## My view on Matt Pocock’s skills

Matt Pocock’s `skills` repo looks most useful as a **practical skills library** for real engineering tasks, especially development patterns like TDD, refactoring, and code quality guidance. The repo presents itself as “Agent Skills for real engineers,” with a README emphasizing development skills such as test-driven development.[^8][^9]

My take:

- Good as a **selective import source** for specific engineering habits.
- Not a replacement for Spec Kit.
- Not a replacement for Superpowers.
- Better used as a **small tactical layer**, not a primary operating model.[^9][^8]


## Recommended stack for your project

For the CircleTel platform, my recommendation would be:

- **Primary**: Spec Kit
- **Execution workflow**: Superpowers
- **Optional later**: GBrain
- **Selective cherry-picks**: Matt Pocock skills

That gives you:

- rigorous specs,
- controlled implementation,
- better review discipline,
- and optional long-term memory once the repo becomes large and operationally complex.[^1][^2][^4][^7]


## Recommendation summary

If this were my stack choice for your platform, I would do it like this:

- Use **Spec Kit** as the formal backbone for feature specs and implementation planning.[^3][^4]
- Layer **Superpowers** on top inside Claude Code for day-to-day execution discipline.[^2][^1]
- Add **GBrain** only after you start accumulating a lot of deployment, hardware, and operational knowledge that needs durable retrieval.[^7]
- Pull in **Matt Pocock’s skills** only where they concretely improve coding quality, like TDD or refactor workflows, instead of adopting the whole repo blindly.[^9]

Yes — this combined approach is very possible, and for a multi-module platform like yours, it is actually one of the better ways to avoid both unstructured vibe coding and overly rigid enterprise process.
<span style="display:none">[^10][^11][^12][^13][^14][^15][^16][^17]</span>

<div align="center">⁂</div>

[^1]: https://github.com/obra/superpowers

[^2]: https://github.com/wln/obra-superpowers/blob/main/README.md

[^3]: https://github.github.com/spec-kit/

[^4]: https://github.com/github/spec-kit/blob/main/README.md

[^5]: https://www.claudepluginhub.com/plugins/obra-superpowers-2

[^6]: https://x.com/garrytan/status/2042369335419945338

[^7]: https://hermesatlas.com/projects/garrytan/gbrain

[^8]: https://github.com/mattpocock/skills/issues

[^9]: https://github.com/mattpocock/skills/blob/main/README.md

[^10]: https://www.c-sharpcorner.com/article/superpowers-by-obra-what-it-is-and-how-to-use-it-to-improve-ai-coding/

[^11]: https://www.instagram.com/reel/DWb4fyjE-4n/

[^12]: https://github.com/mattpocock/skills/blob/main/scaffold-exercises/SKILL.md

[^13]: https://www.reddit.com/r/ClaudeAI/comments/1qj1zjg/using_claude_code_obrasuperpowers_how_do_you/

[^14]: https://aimap.link/x/garrytan/2044291663213015491.html

[^15]: https://github.com/obra/superpowers-marketplace

[^16]: https://www.facebook.com/groups/claudeaicommunity/posts/1249304760570022/

[^17]: https://www.youtube.com/watch?v=Hsi1hr2zI9I

