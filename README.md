# Domain Selector — Write-up

## Stack Choice

I chose Next.js, TypeScript, Prisma, and PostgreSQL because the tool needs server-side workflows, database persistence, CSV processing, export routes, and a UI that can be deployed quickly.

Next.js App Router keeps the UI and API routes in one project. Prisma makes the database schema clear and maintainable.

## UX Decisions

### Dashboard-first workflow

I used a dashboard-first workflow instead of a strict wizard. This allows returning users to quickly reopen campaigns, review results, upload new vendors, or export shortlists.

### Separate qualified and disqualified domains

Disqualified domains are shown separately so users can trust why domains were rejected without mixing them into the shortlist.

### Visible reasoning

Each domain shows a total score, key metrics, reasoning summary, and score breakdown. This keeps the scoring understandable for non-technical users.

### Config-driven scoring

The scoring configuration is stored in the database and loaded at runtime. This allows the team to update weights and rules without redeploying.

## What I Cut

Given the time limit, I focused on the core repeatable workflow. Some polish items could be improved further:

- Full spreadsheet template parity
- More advanced filtering
- Background scoring jobs
- LLM-based niche matching

## What I Would Improve Next

- Add async scoring progress
- Add better upload validation messages
- Add full XLSX template matching
- Add audit logs for config changes
- Add richer admin editing for scoring config