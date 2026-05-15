# Rooted in Worth — Accounts & Community Feed Roadmap

The goal: let founding families and aligned folks **create an account**,
**shape a profile**, and **post into a shared feed** — where everyone sees
everyone (no friend graph), but can filter by person or tag.

This is a planning doc, not code. It's broken into phases that each ship
something usable on their own.

---

## Where we are today

- ✅ Supabase project + `schema.sql` (has `profiles`, `subscribers`, `campaigns`)
- ✅ `profiles` table already exists, linked to `auth.users`, with an
  `is_admin` flag and an auto-create trigger on signup
- ✅ Service-role admin client (`lib/supabase/admin.ts`)
- ✅ Newsletter signup + unsubscribe (server actions, Resend)
- ❌ No user-facing auth (sign up / sign in / session)
- ❌ No profile editing
- ❌ No posts / feed

So the `profiles` plumbing is partly done. What's missing is everything a
*logged-in human* touches.

---

## Decisions (locked)

1. **Auth method:** **email + password** *and* **Google OAuth**, both
   available on the sign-in screen. Implies also building: email
   confirmation handling, password reset, and Google provider setup
   (Google Cloud OAuth client + Supabase provider config).
2. **Feed visibility:** **public read, members write.** Anyone can browse
   the feed and profiles without an account; only signed-in users can post.
   Drives RLS (`select` open to all, `insert/update/delete` gated) and
   routing (`/feed` is public; the composer is auth-gated).
3. **Moderation:** admins can edit/remove any post (recommended default,
   honored via the existing `is_admin()` helper). Flag if you disagree.

---

## Phase 1 — Auth foundation

Get people in and out, with sessions that survive refreshes.

**Schema:** none — `profiles` + the `handle_new_user` trigger already cover it.

**External setup (do first):**
- In Google Cloud Console: create an OAuth 2.0 client, add the Supabase
  callback (`https://<ref>.supabase.co/auth/v1/callback`) as an authorized
  redirect URI
- In Supabase dashboard: enable the Google provider, paste in the client
  ID/secret; confirm email provider settings (confirmation on/off)
- Decide email-confirmation policy: on = users verify before posting
  (recommended); off = faster but lets typo'd emails in

**Build:**
- Browser + server Supabase clients using `@supabase/ssr` (already installed).
  Note env naming: client needs `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
  (currently `SUPABASE_PUBLISHABLE_KEY` in `.env.local` — rename + add the
  `NEXT_PUBLIC_` copy for the browser).
- **Session refresh proxy.** ⚠️ Gotcha: this is Next.js 16. Supabase's docs
  say `middleware.ts`; this project uses **`proxy.ts`** instead. Same idea
  (refresh the auth cookie on every request), different filename/API. Read
  `node_modules/next/dist/docs` before writing it.
- `/signin` page — email+password form **and** a "Continue with Google"
  button
- `/signup` page — email+password registration (or combined with `/signin`)
- Password reset flow — request page + `/auth/reset` page
- `/auth/callback` route handler — exchanges the OAuth/confirmation code,
  sets the session
- Sign-out server action
- **Account lifecycle:** change email, change password, and **delete
  account** (cascade-deletes the profile; decide whether the user's posts
  are removed or anonymized). Easy to defer mentally, but deletion is the
  hardest to retrofit and is effectively required once you store PII.
- **Abuse protection on auth + the existing newsletter form:** rate-limit
  signup / login / password-reset and the public subscribe action. Vercel
  BotID (in this stack) or a simple per-IP limiter — public unauthenticated
  POST endpoints get hit by bots fast.
- Wire the existing **Header "Sign in" button** to real auth instead of the
  "coming soon" modal — keep the modal component around for logged-out CTAs
  if useful
- Auth state in the header: show avatar/name + menu when logged in

**Done when:** you can register with email+password, confirm, sign in;
sign in with Google; reset a password; change/delete your account; refresh
and stay logged in; sign out.

---

## Phase 2 — Profiles & customization

Everything optional. A bare account is valid; a rich one is encouraged.

**Schema additions** (append to `schema.sql`):

```sql
alter table public.profiles
  add column if not exists avatar_url text,
  add column if not exists bio text,
  add column if not exists skills text[] not null default '{}',
  add column if not exists family_size smallint,
  add column if not exists location_preference text,
  add column if not exists updated_at timestamptz not null default now();

create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function public.touch_updated_at();

-- name search for the feed filter later
create index if not exists profiles_display_name_idx
  on public.profiles (lower(display_name));
```

Field intent:
- `avatar_url` — points at Supabase Storage (see below); null = use initials
- `bio` — free text, short
- `skills` — tag array ("carpentry", "permaculture", "childcare"…), powers
  feed filtering and finding each other
- `family_size` — nullable smallint; UI can phrase it warmly ("just me" → 1)
- `location_preference` — free text for now ("Pacific NW, open to relocating");
  structured location is a future nicety, not worth the complexity yet

**Supabase Storage:**
- Create a public-read `avatars` bucket
- Storage RLS: a user may write only to a path prefixed with their own
  `auth.uid()` (e.g. `avatars/<uid>/...`); anyone may read
- Client-side image resize/crop before upload (keep avatars small)
- **Constrain uploads:** accept only jpeg/png/webp, cap dimensions and
  bytes server-side (not just in the picker). A public-read bucket means
  whatever lands there is internet-visible — see image-safety note in the
  Safety section; don't ship avatar upload without deciding how a bad
  image gets reported and removed.

**Build:**
- `/profile` (own, editable) and `/u/[id]` (public view)
- Edit form: avatar uploader, bio, skills tag input, family size, location —
  each independently skippable
- RLS: `profiles` are **publicly readable** (feed is public, so profile
  cards must render for logged-out visitors); users update only their own
  row (policy already partly there — extend it). Don't expose `email` to
  anon — either drop it from public selects or add a column-safe view.

**Done when:** a logged-in user can fill in as much or as little as they
want and see it render on their public profile.

---

## Phase 3 — The community feed

Facebook-shaped, but no friend graph: **everyone sees all posts**, newest
first, filterable.

**Schema additions:**

```sql
create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 5000),
  tags text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists posts_created_at_idx
  on public.posts (created_at desc);
create index if not exists posts_tags_gin_idx
  on public.posts using gin (tags);

create trigger posts_updated_at
  before update on public.posts
  for each row execute function public.touch_updated_at();

alter table public.posts enable row level security;

-- public read (feed is open to non-members):
create policy "posts: anyone can read"
  on public.posts for select
  using (true);

-- only signed-in users can create, and only as themselves:
create policy "posts: members can create own"
  on public.posts for insert
  with check (auth.uid() = author_id);

-- authors edit/delete their own; admins manage anything:
create policy "posts: author or admin can modify"
  on public.posts for update using (auth.uid() = author_id or public.is_admin())
  with check (auth.uid() = author_id or public.is_admin());
create policy "posts: author or admin can delete"
  on public.posts for delete
  using (auth.uid() = author_id or public.is_admin());
```

**Build:**
- `/feed` — reverse-chron list of posts (author avatar/name, body, tags,
  relative time)
- Composer — body + tag input; insert via server action
- **Filters:**
  - by **tag** — `tags @> '{tagname}'` (uses the GIN index)
  - by **person** — match `profiles.display_name` (uses the lower() index);
    a typeahead is nicer than free text but free text ships faster
- Pagination — keyset on `created_at` (cleaner than offset at scale)
- Empty/loading states in the established brand style (motion, lucide)
- **Reporting + moderation (ships *with* the feed, not after):** a "report"
  action on every post, a `post_reports` table, and an admin moderation
  view to review/remove. A public-read feed written by members, seen by a
  vulnerable audience, cannot launch without a removal path. Consider
  **soft delete** (`deleted_at`) over hard delete so reported content can
  be reviewed rather than vanishing.
- **Rate-limit posting** (per user, per minute) so one account can't flood
  the shared feed.

**Explicitly out of scope for v1** (name them so they don't sneak in):
likes, comments, images in posts, notifications, edit history. Each is its
own phase once the core feed feels good. *Reporting/moderation is **not**
on this list — it's launch-blocking, see above.*

**Done when:** a logged-in user can post, the post shows up in everyone's
feed, and both filters work.

---

## Safety, legal & trust (don't skip)

This isn't a generic SaaS. The audience includes **foster youth (some
minors)** and families in hard situations, and the feed/profiles are
**publicly readable**. These items are launch-blocking for the
accounts+feed work, not "nice to have."

- **Age / COPPA decision.** Foster youth can be under 18, possibly under
  13. Decide and enforce a minimum age (a date-of-birth or age-gate at
  signup, or an explicit "no under-13 accounts" policy). Collecting PII
  from under-13s in the US triggers COPPA obligations — far cheaper to
  scope out now than to retrofit.
- **Privacy policy + terms.** Now mandatory, not optional: you're storing
  accounts, PII, and (already, today) a newsletter list. Also needed for
  Google OAuth verification and CAN-SPAM compliance on the newsletter.
- **Data export + deletion.** Pairs with account deletion in Phase 1. A
  user should be able to get their data and erase it. Document what
  "delete" does to their posts (remove vs anonymize) and say so in the
  privacy policy.
- **PII exposure through the public feed.** Already flagged for `email` on
  `profiles`; widen the lens — be deliberate about every field a logged-out
  visitor (or scraper) can read. Default new profile fields to *not*
  publicly exposed unless intended.
- **Image-upload safety.**
  - [x] Type/size limits (client + bucket-enforced).
  - [x] **Automated pre-publish moderation** — avatar uploads route
        through `/api/avatar`, screened by OpenAI omni-moderation
        *before* anything is written to public storage. Fails **closed**
        (a moderation outage rejects the upload rather than letting it
        through). Stricter-than-default category blocking given the
        audience.
  - [ ] **Report path + admin removal queue** — still open. Best built
        alongside the Phase 3 feed (same moderation surface; avatars are
        the only public images today). Tracked with the feed's
        reporting/moderation item.
  - [ ] **CSAM is a SEPARATE track — not covered by the above.** The
        omni-moderation classifier is not CSAM hash-matching. A platform
        serving foster youth/minors that hosts user images has potential
        legal obligations (US: NCMEC reporting). Needs a vetted provider
        (e.g. PhotoDNA), a reporting workflow, and legal counsel. Do not
        treat the classifier as sufficient for this.
- **Content moderation posture.** Decide the stance (pre-moderate vs
  reactive-removal) and who holds the admin role. The `is_admin()` helper
  exists; the *people and process* don't yet. (Images are now
  pre-moderated; text/posts posture is still undecided.)

---

## Phase 4+ — later, not now

- Direct messages (the original "message individuals" goal)
- Comments + reactions on posts
- Images/attachments in posts (Supabase Storage, same pattern as avatars)
- Notifications
- Richer location matching for the agrihood planning

---

## Cross-cutting notes

- **Keep server actions the spine.** Same pattern as `subscribe` /
  `unsubscribe`: validate → mutate via Supabase → typed result. No client
  writes straight to the DB.
- **RLS is the real security boundary**, not the UI. Every table that users
  touch gets policies before it ships.
- **The `is_admin()` helper already exists** — reuse it for moderation
  instead of inventing a second mechanism.
- **Brand consistency:** reuse the cream/bark/sage/moss palette, IM Fell
  headings, motion animations, and lucide icons so the logged-in app feels
  like the same place as the landing page.
- **Accessibility is a requirement, not polish.** The founding brief calls
  it a "Must" and the audience includes people navigating hard things:
  real focus states, labelled inputs, adequate contrast (watch bark-on-sage
  and the muted `/60` text), keyboard-operable menus/modals, reduced-motion
  fallbacks for the heavier animations.
- **Schema & migration discipline.** `schema.sql` is hand-run and about to
  grow a lot (profile columns, posts, reports). Keep every statement
  idempotent (`if not exists`, `drop policy if exists`), apply additively
  in order, and note in the file which sections have already been run in
  prod so a re-run is always safe.

---

## Pre-launch checklist (branding, polish & ops)

Things that aren't a "phase" but should be true before this is something
you point real, vulnerable users at. Grouped by area.

### Branding & polish

- [ ] **Supabase auth email templates.** Default templates (confirm
      signup, reset password, magic link, email change, invite) are plain
      and Supabase-flavored. Rebrand them in Authentication → Email
      Templates to match the welcome/newsletter look (cream, bark, logo,
      serif). A password-reset that looks like a different company erodes
      trust — especially for this audience.
- [ ] **Favicon + app icons.** Currently the Next.js default
      `app/favicon.ico`. Replace with the Rooted in Worth mark.
- [ ] **Open Graph / social share.** Add OG + Twitter metadata and a
      branded share image so links shared anywhere render as "a real
      thing" (the founding brief's words), not a blank card. The site is
      meant to be the durable "door" — the preview is part of the door.
- [ ] **Branded 404 / error pages.** Replace default Next.js not-found
      and error pages with the cream/bark treatment.
- [ ] **Mobile QA on real devices.** The brief says mobile-first, most
      users on phones. Test the actual flows on a real phone, not just a
      resized window.
- [ ] **Accessibility pass.** Concrete audit, not vibes: contrast on
      bark-on-sage and the muted `/60` text, focus states, keyboard nav
      through the modal/menus, `prefers-reduced-motion` for the heavier
      animations.

### Auth & email finish

- [x] SMTP via Resend (auth emails send branded, at volume)
- [x] URL Configuration (Site URL = prod, localhost in Redirect URLs)
- [x] Supabase Auth hardening (password length fixed, leaked-password
      check on, secure password change, OTP tightened)
- [ ] **Capture the above as an auditable config record.** These were set
      by hand in the dashboard; nothing in the repo proves what they are.
      Document the exact intended values (here or a `docs/auth-config.md`)
      so a fresh project or an audit is reproducible.
- [ ] **Email reply path — now LAUNCH-BLOCKING.** The published
      Privacy Policy and Terms list `privacy@rootedinworth.info` and
      `hello@rootedinworth.info` as contact addresses. A legal doc that
      names an unreachable contact is itself a compliance problem, so this
      is no longer "decide later." Set up free forwarding (ImprovMX: one
      MX record in Vercel DNS → your inbox) so both addresses actually
      reach a human.
- [ ] **DMARC record.** Confirm a DMARC policy exists alongside the
      Resend SPF/DKIM records (deliverability + anti-spoofing). `.info`
      domains start with weaker reputation, so this matters more here.

### Legal & trust (gates real signups)

- [x] **Privacy policy + terms drafted & published** at `/privacy` and
      `/terms`, linked in the footer. Tailored to actual data practices,
      not boilerplate. **Still open under this:**
  - [ ] Lawyer review before launch (children/COPPA, liability, content
        license especially — drafted by a non-lawyer for a platform
        serving minors).
  - [x] Placeholders filled: legal entity = **Xtremery LLC**, governing
        law = **Florida** (2026-05-15). Lawyer review of the final text
        is still the open sub-item above.
  - [ ] Add the two URLs to Google OAuth branding
        (`/privacy`, `/terms`) — unblocks publishing/verification.
- [x] **Age / COPPA stance decided: 13+** (COPPA threshold, no
      verifiable-parental-consent system needed, includes teen foster
      youth). Encoded in the legal pages; still needs enforcement in the
      Phase 1 signup form (age affirmation/gate).

### Ops & deploy

- [ ] **All secrets set in Vercel prod, not just `.env.local`.** Audit:
      `ADMIN_PASSWORD`, `NEXT_PUBLIC_SITE_URL`, Supabase keys, Resend key,
      and (for Phase 1) the Google OAuth client id/secret. `.env.local`
      does not deploy.
- [ ] **Rate-limit the live newsletter endpoint.** This is already in
      production and is an unauthenticated public POST — it's exposed
      *now*, ahead of Phase 1. Treat as near-term, not Phase 1.
- [ ] **Lightweight analytics.** Vercel Analytics / Speed Insights are on
      your plan — enough to see signups and traffic without adding a
      heavy third-party tracker (which would also drag in cookie-consent
      obligations).
