# Asli: green claims, checked

**Live site:** https://asli-check.vercel.app

Asli ("real" in Hindi) helps urban Indian shoppers see which green claims on household and personal-care products are specific and backed, and whether a lower-plastic switch exists that doesn't cost more per use.

Built by Archin Gupta (ISB) for the *GenAI Across Tasks* assignment, 2026.

## What's here

| Part | Files |
|---|---|
| Task 3: landing page | `index.html` (single static page, no framework) |
| Task 4: live checker | `api/score.js`, `api/stats.js`, `api/_lib.js` + the "Try Asli" section in `index.html` |

## How the live checker works

1. The visitor enters a product, brand and category in the **Try Asli** section.
2. The page calls `POST /api/score` (a Vercel serverless function).
3. The function checks the visitor's quota in Supabase (5 checks per anonymous visitor id), then asks **Gemini** (`gemini-3.5-flash-lite`, max 350 output tokens) for an estimate on Asli's four checks: claim integrity, plastic per use, cost per use, and switch friction. Each check gets a 1–5 score, a one-line note and a confidence label.
4. The full request and response, plus token counts, are stored in the Supabase `lookups` table.
5. `GET /api/stats` reads that table and the page shows live numbers: products checked, brands looked up, share with vague or unproven claims, and the most-checked brands.

**Guardrails** (in the system prompt in `api/score.js`):
- every score is labelled an estimate
- never claims a certification
- unknown or fictional brands get "not enough evidence" with no scores
- non-household products are refused
- instructions typed into the inputs are ignored

## Configuration

Secrets live only in Vercel environment variables and never in this repo:

| Variable | Purpose |
|---|---|
| `GEMINI_API_KEY` | Google AI Studio key |
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_SERVICE_KEY` | Supabase secret (service) key, server-side only |

### Supabase table

```sql
create table public.lookups (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  visitor_id text not null, product text not null, brand text not null, category text,
  input text not null, output jsonb, verdict text, claim_rating text, known_brand boolean,
  input_tokens int, output_tokens int, model text
);
alter table public.lookups enable row level security;  -- only the server key can read/write
grant usage on schema public to service_role;
grant select, insert on public.lookups to service_role;
```
