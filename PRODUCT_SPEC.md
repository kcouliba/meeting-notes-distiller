# Meeting Notes Distiller - MVP Product Specification

> **Tagline:** "From chaotic notes to a professional meeting report in 10 seconds. Ready for Slack, Email, or Notion."

## 1. Product Overview

Meeting Notes Distiller is a web application that transforms raw, disorganized meeting notes or transcriptions into structured reports with summaries, decisions, action items, and clearly identified owners. Users paste their notes, and AI extracts a clean, shareable report in multiple output formats.

### Core Value Proposition

- **Zero setup** - No bots to install, no integrations to configure. Paste and go.
- **Multi-format output** - Markdown, Slack, Email, and Notion-ready formatting.
- **Smart extraction** - Identifies decisions, action items with assignees and deadlines, and open questions.
- **Privacy by design** - All data stays local in a SQLite database. Self-hosted, no cloud dependency.
- **Source-agnostic** - Works with any transcript: Zoom, Teams, Otter, manual notes, or any pasted text.

---

## 2. User Personas

| Persona | Segment | Description | Key Pain Points |
|---------|---------|-------------|-----------------|
| **Primary** | Managers / Team Leads (40%) | Run 5-10 meetings/week, need to share clear recaps with teams | Notes are messy, reformatting takes 15-30 min per meeting |
| **Secondary** | Executive Assistants (25%) | Produce formal meeting minutes for leadership | Must capture decisions accurately, formatting must be professional |
| **Tertiary** | Project Managers (35%) | Track action items and deadlines across multiple meetings | Action items get lost, no clear ownership tracking |

---

## 3. MVP User Stories

### US-1: Paste and process raw notes
**As a** manager, **I want to** paste my raw meeting notes into a text area and receive a structured report, **so that** I don't spend time manually reformatting.

**Acceptance Criteria:**
- Text area accepts plain text input (free-form, bullet points, or paragraphs)
- Supports pasting transcriptions from Zoom, Teams, or Otter
- Input supports up to 50,000 characters (~1 hour meeting transcript)
- A "Distill" button triggers processing
- Processing shows a loading/streaming indicator
- Result displays within 5 seconds for notes under 10,000 characters

### US-2: View structured output
**As a** user, **I want to** see my meeting notes organized into clear sections, **so that** I can quickly review the extracted information.

**Acceptance Criteria:**
- Output displays the following sections:
  - **Summary** - 2-3 key sentences
  - **Decisions** - List of decisions made, with who decided (if detectable)
  - **Action Items** - Tasks with assignee and deadline (if mentioned), with priority indicators
  - **Open Questions** - Unresolved points or items needing follow-up
  - **Participants** - Detected names from the notes
- Empty sections are hidden (not shown with "none" placeholders)
- Output renders Markdown formatting (bold, lists, etc.)

### US-3: Switch output format
**As a** user, **I want to** switch between output formats (Markdown, Slack, Email, Notion), **so that** I can paste the report directly into my preferred tool.

**Acceptance Criteria:**
- Format selector shows 4 options: Markdown, Slack, Email, Notion
- Switching formats re-renders the output instantly (< 100ms, no re-processing)
- Each format uses the appropriate syntax for its target platform
- Default format is Markdown

### US-4: Copy output to clipboard
**As a** user, **I want to** copy the formatted output with one click, **so that** I can quickly paste it into Slack, email, or a document.

**Acceptance Criteria:**
- "Copy" button is visible next to the output
- Click copies the currently selected format to clipboard
- Visual feedback confirms copy (e.g., button text changes to "Copied!" for 2 seconds)
- Copy completes in < 50ms

### US-5: Download as Markdown file
**As a** user, **I want to** download my meeting report as a `.md` file, **so that** I can archive or share it as a document.

**Acceptance Criteria:**
- "Download" button generates a `.md` file
- Filename format: `meeting-notes-YYYY-MM-DD.md`
- File contains the Markdown-formatted output

### US-6: Process another set of notes
**As a** user, **I want to** clear the current output and start over with new notes, **so that** I can process multiple meetings in one session.

**Acceptance Criteria:**
- A "New" or "Clear" button resets both input and output areas
- Confirmation prompt if input area contains text (to prevent accidental loss)

---

## 4. Feature Scope

### In Scope (MVP)

| Feature | Details |
|---------|---------|
| Text input area | Accepts raw notes/transcriptions, up to 50,000 chars |
| AI-powered extraction | Summary, decisions, actions, open items, participants |
| 4 output formats | Markdown, Slack, Email, Notion |
| One-click copy | Copy formatted output to clipboard |
| Download .md | Export as Markdown file |
| Responsive layout | Works on desktop and tablet |
| Loading state | Streaming indicator during processing |
| SQLite meeting history | Auto-save reports, browse/delete past meetings |
| Kanban task board | Drag-and-drop board for managing action items across statuses |
| Rate limiting | 3 reports per day (free tier), rate limiting per IP |
| Privacy notice | Clear messaging about local-only processing |

### Out of Scope (Deferred — see Roadmap in Section 12)

| Feature | Roadmap Step |
|---------|--------------|
| ~~Transcript file upload (VTT, SRT, TXT)~~ | ~~Step 1~~ ✅ Done |
| ~~SQLite-backed meeting history~~ | ~~Step 2~~ ✅ Done |
| ~~Open-source launch (README, community)~~ | ~~Step 3~~ ✅ Done |
| ~~Docker one-liner deployment~~ | ~~Step 4~~ ✅ Done |
| User auth + cloud hosted version | Step 5 |
| Search across meetings | Step 6 |
| Community-driven features (PM integrations, templates, etc.) | Step 7 |
| Audio upload / transcription | Unscheduled |
| Mobile-optimized layout | Unscheduled |

---

## 5. UI/UX Requirements

### Layout

The app uses a **single-page, two-panel layout**:

```
┌──────────────────────────────────────────────────────────────────┐
│  Header: Logo + "Meeting Notes Distiller" + Privacy Badge        │
├────────────────────────────┬─────────────────────────────────────┤
│                            │                                     │
│   INPUT PANEL              │   OUTPUT PANEL                      │
│                            │                                     │
│   ┌──────────────────┐     │   ┌─────────────────────────────┐   │
│   │                  │     │   │ [Markdown] [Slack] [Email]  │   │
│   │   Textarea       │     │   │ [Notion]                    │   │
│   │   (placeholder   │     │   ├─────────────────────────────┤   │
│   │    with example)  │     │   │                             │   │
│   │                  │     │   │   Rendered output            │   │
│   │                  │     │   │   (or empty state)           │   │
│   │                  │     │   │                             │   │
│   └──────────────────┘     │   └─────────────────────────────┘   │
│                            │                                     │
│   Character count: 0/50000  │   [Copy] [Download .md]             │
│   [Distill]  [Clear]       │                                     │
│                            │                                     │
├────────────────────────────┴─────────────────────────────────────┤
│  Footer: Privacy notice + "Notes are never stored"               │
└──────────────────────────────────────────────────────────────────┘
```

### Components

| Component | Description |
|-----------|-------------|
| **Header** | App name, logo, and a privacy badge ("Your notes are never stored") |
| **NotesInput** | Textarea with placeholder example text, character counter (0/50000), and "Distill" button |
| **FormatSelector** | Tab group or button group: Markdown / Slack / Email / Notion |
| **OutputDisplay** | Rendered report with sections. Shows empty state before first distillation |
| **CopyButton** | Copies current format to clipboard with "Copied!" feedback |
| **DownloadButton** | Downloads Markdown file |
| **ClearButton** | Resets input and output with confirmation |
| **LoadingState** | Skeleton or spinner shown while AI processes |
| **Footer** | Privacy notice, legal link, ephemeral processing disclaimer |

### Responsive Behavior

| Breakpoint | Layout |
|------------|--------|
| Desktop (>= 1024px) | Side-by-side two-panel layout |
| Tablet (768px - 1023px) | Stacked layout, input on top, output below |
| Mobile (< 768px) | Stacked layout, full-width panels, scrollable |

### Design System

- **Component library:** shadcn/ui
- **Styling:** Tailwind CSS
- **Typography:** System font stack (Inter or similar sans-serif)
- **Color scheme:** Light/dark mode via next-themes
- **Database:** SQLite via better-sqlite3 + Drizzle ORM
- **Drag and drop:** @dnd-kit (Kanban board)

### Empty States

- **Before first distillation:** Output panel shows instructional text: "Paste your meeting notes on the left and click Distill to get started."
- **Processing:** Skeleton loader or streaming text animation in the output panel.
- **Error:** Inline error message with retry option.

---

## 6. API Contracts

### POST /api/distill

Processes raw meeting notes and returns a structured report.

**Request:**
```json
{
  "notes": "string (1-50000 characters)",
  "language": "auto | fr | en"
}
```

**Response (200 OK):**
```json
{
  "summary": "2-3 sentence summary of the meeting",
  "decisions": [
    {
      "description": "Budget approved at 50k",
      "madeBy": "Sarah"
    }
  ],
  "actions": [
    {
      "task": "Prepare Q2 presentation",
      "assignee": "Pierre",
      "deadline": "Friday March 7",
      "priority": "high"
    }
  ],
  "pendingItems": [
    "Vendor selection still undecided"
  ],
  "participants": [
    "Sarah",
    "Pierre",
    "Marie"
  ]
}
```

**Error Responses:**

| Status | Body | Condition |
|--------|------|-----------|
| 400 | `{ "error": "Notes text is required" }` | Empty or missing `notes` field |
| 400 | `{ "error": "Notes exceed maximum length of 50000 characters" }` | Input too long |
| 429 | `{ "error": "Rate limit exceeded. Try again later." }` | More than 3 requests/day (free) or rate limit hit |
| 500 | `{ "error": "Processing failed. Please try again." }` | LLM API error |

**Implementation Notes:**
- Uses Google Gemini 2.5 Flash with `responseMimeType: application/json` for structured output
- System prompt passed via `systemInstruction` in model config
- Apply rate limiting per IP address (3 requests/day for free tier)

### Meeting History API

#### POST /api/meetings
Save a distilled meeting report.

**Request:** `{ "rawNotes": "string", "report": MeetingReport }`
**Response (201):** `{ "id": "uuid", "title": "string", "createdAt": "ISO date" }`

#### GET /api/meetings
List meetings with pagination.

**Query params:** `page` (default 1), `pageSize` (default 20, max 100)
**Response (200):** `{ "meetings": MeetingListItem[], "total": number, "page": number, "pageSize": number }`

#### GET /api/meetings/[id]
Get a single meeting with full report.

**Response (200):** `MeetingRecord` | **404** if not found

#### DELETE /api/meetings/[id]
Delete a meeting and its associated tasks (CASCADE).

**Response (200):** `{ "deleted": true }` | **404** if not found

### Tasks / Kanban API

#### GET /api/tasks
List all tasks, optionally filtered by status.

**Query params:** `status` (comma-separated: `todo,in_progress,in_review,done`)
**Response (200):** `{ "tasks": TaskRecord[] }`

#### PATCH /api/tasks/[id]
Update task fields (status, position, assignee, deadline).

**Request:** `{ "status?": TaskStatus, "position?": number, "assignee?": string|null, "deadline?": string|null }`
**Response (200):** `{ "success": true }` | **404** if not found

#### DELETE /api/tasks/[id]
Delete a single task.

**Response (200):** `{ "success": true }` | **404** if not found

#### POST /api/tasks/reorder
Batch update task statuses and positions (for drag-and-drop). Runs in a transaction.

**Request:** `{ "updates": [{ "id": "string", "status": TaskStatus, "position": number }] }`
**Response (200):** `{ "success": true }`

### POST /api/format

Converts a structured report into a specific output format. This is a **client-side only** operation for MVP (no API call needed). Included here for reference if server-side formatting is desired later.

**Request:**
```json
{
  "report": { /* MeetingReport object */ },
  "format": "markdown | slack | email | notion"
}
```

**Response (200 OK):**
```json
{
  "formatted": "string (formatted output text)"
}
```

---

## 7. TypeScript Types

```typescript
// types/meeting.ts

export interface Action {
  task: string;
  assignee: string | null;
  deadline: string | null;
}

export interface MeetingReport {
  summary: string[];
  decisions: string[];
  actions: Action[];
  pending: string[];
  participants: string[];
}

export type OutputFormat = "markdown" | "slack" | "email" | "notion";

// --- Meeting History Types ---

export interface MeetingRecord {
  id: string;
  title: string;
  rawNotes: string;
  report: MeetingReport;
  createdAt: string;
  updatedAt: string;
}

export interface MeetingListItem {
  id: string;
  title: string;
  createdAt: string;
  participantCount: number;
  actionCount: number;
}

export interface MeetingListResponse {
  meetings: MeetingListItem[];
  total: number;
  page: number;
  pageSize: number;
}

// --- Task / Kanban Types ---

export type TaskStatus = "todo" | "in_progress" | "in_review" | "done";

export interface TaskRecord {
  id: string;
  meetingId: string;
  meetingTitle: string;
  task: string;
  assignee: string | null;
  deadline: string | null;
  status: TaskStatus;
  position: number;
  createdAt: string;
  updatedAt: string;
}

export interface TaskListResponse {
  tasks: TaskRecord[];
}
```

---

## 8. Output Format Specifications

### Markdown Format

```markdown
# Meeting Report

## Summary
Team discussed Q2 roadmap priorities and budget allocation. Key decisions were made on
hiring timeline and vendor selection.

## Decisions
- **Budget approved at 50k** (Sarah)
- **Hire 2 frontend devs by end of March** (Pierre)

## Action Items
| Task | Assignee | Deadline | Priority |
|------|----------|----------|----------|
| Prepare Q2 presentation | Pierre | March 7 | High |
| Send vendor comparison doc | Marie | March 10 | Medium |
| Schedule design review | John | Next week | Low |

## Open Questions
- Which CI/CD provider to use?
- Remote work policy update timeline?

## Participants
Sarah, Pierre, Marie, John
```

### Slack Format

```
*Meeting Report*

*Summary*
Team discussed Q2 roadmap priorities and budget allocation. Key decisions were made on hiring timeline and vendor selection.

*Decisions*
- Budget approved at 50k (Sarah)
- Hire 2 frontend devs by end of March (Pierre)

*Action Items*
- Prepare Q2 presentation → *@Pierre* _(March 7)_ :red_circle:
- Send vendor comparison doc → *@Marie* _(March 10)_ :large_orange_circle:
- Schedule design review → *@John* _(Next week)_

*Open Questions*
- Which CI/CD provider to use?
- Remote work policy update timeline?

*Participants:* Sarah, Pierre, Marie, John
```

### Email Format

```
Subject: Meeting Report - [Date]

Hi all,

Here is the summary from our meeting:

SUMMARY
Team discussed Q2 roadmap priorities and budget allocation. Key decisions were made
on hiring timeline and vendor selection.

DECISIONS
1. Budget approved at 50k (Sarah)
2. Hire 2 frontend devs by end of March (Pierre)

ACTION ITEMS
1. Prepare Q2 presentation
   Owner: Pierre
   Deadline: March 7
   Priority: High

2. Send vendor comparison doc
   Owner: Marie
   Deadline: March 10

3. Schedule design review
   Owner: John
   Deadline: Next week

OPEN QUESTIONS
- Which CI/CD provider to use?
- Remote work policy update timeline?

Participants: Sarah, Pierre, Marie, John

Best regards
```

### Notion Format

```markdown
# Meeting Report

> Team discussed Q2 roadmap priorities and budget allocation. Key decisions were made on hiring timeline and vendor selection.

## Decisions
- [x] Budget approved at 50k — Sarah
- [x] Hire 2 frontend devs by end of March — Pierre

## Action Items
- [ ] Prepare Q2 presentation — @Pierre — March 7 — `High`
- [ ] Send vendor comparison doc — @Marie — March 10 — `Medium`
- [ ] Schedule design review — @John — Next week — `Low`

## Open Questions
- [ ] Which CI/CD provider to use?
- [ ] Remote work policy update timeline?

---
**Participants:** Sarah, Pierre, Marie, John
```

---

## 9. Non-Functional Requirements

### Performance

| Metric | Target |
|--------|--------|
| Time to process (< 2,000 chars) | < 3 seconds |
| Time to process (2,000-5,000 chars) | < 5 seconds |
| Time to process (5,000-20,000 chars) | < 15 seconds |
| Format switching (client-side) | < 100ms |
| Copy to clipboard | < 50ms |
| Initial page load (LCP) | < 2.5 seconds |
| Time to Interactive (TTI) | < 3.5 seconds |

### Character Limits

| Tier | Input Limit | Reports per Day |
|------|-------------|-----------------|
| Free | 50,000 characters (~1 hour transcript) | 3 |
| Pro (future) | Unlimited | Unlimited |

### Accessibility

- All interactive elements are keyboard navigable
- Form inputs have proper labels and ARIA attributes
- Color contrast meets WCAG 2.1 AA standards (minimum 4.5:1 for text)
- Loading states are announced to screen readers
- Copy/download success is announced to screen readers via live regions
- Textarea has visible focus indicator

### Security & Privacy

| Requirement | Implementation |
|-------------|----------------|
| No permanent storage | Notes are not saved to any database in MVP |
| HTTPS only | All traffic over TLS |
| Rate limiting | Per-IP, 3 requests/day (free tier) |
| No logging of note content | Server logs must not contain user note text |
| Privacy notice | Visible on page, explains ephemeral processing |
| Input sanitization | Sanitize input before sending to LLM |
| CORS | Restrict API to same-origin |

### Browser Support

| Browser | Minimum Version |
|---------|-----------------|
| Chrome | Last 2 versions |
| Firefox | Last 2 versions |
| Safari | Last 2 versions |
| Edge | Last 2 versions |

### Error Handling

- Network errors show a user-friendly message with retry option
- LLM timeout (> 30s) shows timeout message with retry
- Rate limit errors show remaining time until reset
- Malformed LLM responses trigger a retry (up to 2 retries) before showing error

---

## 10. AI Prompt Engineering Notes

### Extraction Rules

The system prompt must instruct the LLM to:

1. **Assignee detection:**
   - `@Name` or `Name:` format = assignee
   - "I will..." / "Je vais..." = speaker is the assignee
   - "We" / "On" = flag as unassigned action
   - Action verbs: do, prepare, send, verify, review, check, create, update

2. **Decision vs. Discussion:**
   - Clearly decided items go under "Decisions"
   - Discussed-but-not-decided items go under "Open Questions"
   - If ambiguous, prefer "Open Questions" (safer)

3. **Priority detection:**
   - High: "urgent", "ASAP", "before [near date]", "blocking", "critical", "P0/P1"
   - Low: "eventually", "when possible", "nice to have", "low priority"
   - Medium: default if no priority indicator

4. **Language handling:**
   - Detect input language automatically
   - Output in the same language as the input
   - Support French and English natively

### Model Selection

| Model | Rationale |
|-------|-----------|
| Gemini 2.5 Flash | Fast, cost-effective, 1M token context window supports transcripts of any length. JSON response mode eliminates parsing issues. |

---

## 11. Success Metrics (MVP)

| Metric | Target (2 weeks post-launch) |
|--------|------------------------------|
| Reports generated | 1,000 total |
| Unique visitors | 3,000 |
| Copy-to-clipboard usage | > 60% of generated reports |
| Format distribution | At least 2 formats used by > 20% of users |
| Error rate | < 5% of distill requests |
| Average processing time | < 5 seconds |
| User return rate (D7) | > 15% |

---

## 12. Licensing

### License: AGPLv3

The project is licensed under the **GNU Affero General Public License v3.0 (AGPLv3)**.

### Why AGPLv3

AGPLv3 is the standard license for open-core SaaS products. It allows anyone to self-host, modify, and contribute, while protecting against competitors hosting a copy as a competing service without open-sourcing their changes.

| Scenario | Permitted? |
|----------|------------|
| Self-host internally for your team | Yes |
| Modify the code for your own use | Yes |
| Contribute back to the project | Yes |
| Fork and redistribute (with same license) | Yes |
| Host as a SaaS without open-sourcing changes | No — must release modifications under AGPLv3 |
| Use in proprietary/closed-source product | No — requires commercial license |

### Precedent

This is the same licensing model used by:
- **Plausible Analytics** — AGPLv3, open-core, paid cloud hosting
- **Cal.com** — AGPLv3, open-core, paid cloud + enterprise
- **Leantime** — AGPLv3, open-core, paid cloud + enterprise
- **Grafana** — AGPLv3, open-core, paid cloud + enterprise

### Commercial License

For organizations that cannot use AGPLv3 (common in enterprise, finance, defense), a **commercial license** is available. This provides:
- Permission to use without AGPL obligations
- Proprietary modifications allowed
- Priority support and SLA
- Custom deployment assistance

The commercial license serves as an additional revenue stream alongside the hosted cloud offering.

### Contributor License Agreement (CLA)

Contributors must sign a CLA granting the project maintainer dual-licensing rights. This ensures:
- Community contributions can be included in both the AGPLv3 and commercial editions
- The maintainer retains the ability to offer commercial licenses
- Contributors retain copyright of their contributions

---

## 13. Roadmap

### Vision

> Open-source, self-hostable meeting intelligence that works with any transcript source.

Position as the privacy-first, source-agnostic alternative in a market dominated by closed SaaS (Otter.ai, Fireflies, tl;dv). Similar positioning to Plausible vs Google Analytics or Cal.com vs Calendly.

### Target Market

- Companies with data sovereignty requirements (defense, healthcare, legal, finance)
- Open-source-friendly engineering teams
- Organizations using self-hosted tools (Nextcloud, Leantime, GitLab)
- Teams with existing transcripts from various sources who need structured output

### Competitive Advantage

Existing tools (Otter, Fireflies, tl;dv) own the recording pipeline — they join calls, record, transcribe, then extract. They don't serve:
- Pasted transcripts from external or legacy sources
- Self-hosted / air-gapped environments
- Teams that want tool-agnostic, vendor-neutral processing

### Pricing Model (Open Core)

| Tier | Price | Features |
|------|-------|----------|
| Self-hosted | Free | Full functionality, bring your own API key |
| Cloud | ~$8/mo | Hosted version, history, search |
| Enterprise | Custom | SSO, audit trail, SLA, on-prem support |

### Step 1 — File Upload (remove friction) ✅ COMPLETED

Accept transcript files directly instead of paste-only.

- Upload support for Zoom VTT, SRT subtitle files, plain text (.txt)
- Drag-and-drop + file picker
- Auto-detect file format and extract text content
- **Why:** Most users have a file, not clipboard text. This removes the biggest UX friction.

### Step 2 — SQLite-Backed Meeting History (immediate value) ✅ COMPLETED

Add persistence without the complexity of auth or external databases.

- SQLite database — zero config, ships with the app
- Auto-save every distilled report with timestamp and title
- Browse past reports in a sidebar or list view
- Delete individual reports
- No auth required — single-user / local-first by default
- **Why:** Gives the app memory. Users come back because their history is there. Minimal complexity.

### Step 3 — Open-Source Launch (community building) ✅ COMPLETED

Ship it publicly and let the community validate the product.

- Clean up repo, write a solid README with screenshots and demo GIF
- Add LICENSE file (AGPLv3 — see Section 12)
- Post on Hacker News, Reddit (r/selfhosted, r/productivity), relevant communities
- Set up GitHub Issues for feature requests
- **Why:** Real users give real feedback. Community traction is the best signal for what to build next.

### Step 4 — Docker One-Liner Deployment (self-hosted) ✅ COMPLETED

Make it trivially easy for anyone to run.

- Single Dockerfile, multi-stage build
- `docker run -e GOOGLE_API_KEY=... -p 3000:3000 meetdistill`
- SQLite volume mount for persistence
- Bring-your-own API key (Gemini, OpenAI, or local models via OpenAI-compatible API)
- **Why:** The self-hosted crowd is the target market. If deployment is hard, they won't bother.

### Step 5 — Auth + Cloud Hosted Version (first revenue)

Offer a hosted version for people who don't want to self-host.

- User authentication (email/password, OAuth with Google/GitHub)
- Per-user meeting libraries in the cloud
- Free tier (limited reports/month) + paid tier (~$8/mo)
- **Why:** First dollar. Some people will always prefer hosted. This funds continued development.

### Step 6 — Search Across Meetings (sticky feature)

The feature that makes the tool indispensable.

- Full-text search across all past reports
- "What did we decide about X?" across your entire meeting history
- Filter by date range, participants, keywords
- **Why:** This is the moment the app becomes hard to leave. Your meeting memory lives here.

### Step 7 — Community-Driven (let users decide)

Stop guessing. Build what people ask for.

- Track GitHub Issues and feature request votes
- Likely candidates based on market analysis:
  - PM tool integrations (Jira, Linear, Trello) — if users ask for it
  - Custom output templates (standup, retro, board report)
  - Team workspaces with shared libraries
  - API access for third-party integrations
  - Two-way sync with PM tools (status updates back into meeting context)
- **Why:** Product-market fit comes from real users, not speculation. Build the integration people actually request.

### Build Order Summary

| Step | What | Outcome |
|------|------|---------|
| 1 | File upload | ✅ Usable — removes friction |
| 2 | SQLite history | ✅ Valuable — users come back |
| 3 | Open-source launch | ✅ Validated — real user feedback |
| 4 | Docker deployment | ✅ Accessible — self-hosted market |
| 5 | Auth + cloud hosted | Revenue — first paying users |
| 6 | Cross-meeting search | Sticky — hard to leave |
| 7 | Community-driven features | Sustainable — build what's needed |
