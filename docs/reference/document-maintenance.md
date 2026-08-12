# Documentation maintenance

- `00-project.md` is the only universal context and must stay under 500 tokens.
- One owner per fact: formula/assumption → calculator feature doc; visual rule → design system; API payload → backend; schema → data model; security control → security.
- Other docs link to owners rather than restating details. Keep feature docs within their stated 200–550-token budgets.
- Update the owner document when changing a public route, API payload, persistent data shape, formula/assumption, visual token, or loading/deployment behavior.
- Do not document generic React, CSS, HTTP, or accessibility theory. Keep project decisions, paths, constraints, and non-obvious conventions only.
- At review, delete stale claims rather than preserving history. Git retains history; docs should reflect current behavior.
