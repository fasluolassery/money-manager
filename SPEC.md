# Money Manager — Spec

## How these documents fit together

| Document | Its one job | Wins when |
| --- | --- | --- |
| `SPEC.md` (this file) | What the app does and why: requirements (`FR-…`), product decisions (`D-01`–`D-27`), assumptions (`A-…`), open questions (`Q-…`), scope, vocabulary | it disagrees with anything else |
| `DESIGN.md` | How it's built: technical decisions (`D-28` onward), architecture, module map, data, API, security, quality gates | it disagrees with UI.md on engineering, or with an issue |
| `UI.md` | How it looks, feels, moves and reads | it disagrees with DESIGN.md on appearance, behaviour or copy, or with an issue |
| `TRACEABILITY.md` | Generated map: requirement → issues → module → tests. **Never edited by hand** | — |
| GitHub issues | Units of work; generated from `tools/backlog/issues.md` and checked against the docs | never; an issue that disagrees with the docs is wrong |

- If DESIGN.md and UI.md disagree on something that belongs to neither alone, it becomes an open question (below) and SPEC.md decides.
- When code and docs disagree: if the code is right, the docs change **in the same pull request**; otherwise the code is fixed.
- **IDs never change meaning.** A removed requirement or decision keeps its ID, marked *withdrawn*, so references never silently point at something else.

**Requirement IDs:** `FR-<rule>.<n>`, for example FR-7.4. Every requirement is **Must** unless marked **(Should)**. Every Must is implemented by at least one issue and, once built, proven by at least one test whose name contains its ID (DESIGN 10.8).

## Assumptions

If any of these turns out to be wrong, planning stops and the listed rules are revisited before more is built.

| ID | Assumption | If it's wrong, revisit |
| --- | --- | --- |
| A-01 | One user now, a few family members later; each has a small amount of data (well under 50,000 transactions over the app's life). | indexes, pagination and aggregations (DESIGN 5.4, 6.3) |
| A-02 | All money is in Indian rupees, and users live in India (timezone usually `Asia/Kolkata`). | D-16, Rule 14 |
| A-03 | My main phone is Android with Chrome; my laptop uses a current desktop browser. | Rule 3, DESIGN 8.9 |
| A-04 | I have an internet connection whenever I log an expense. | D-05 (offline), Rule 3 |
| A-05 | MongoDB Atlas's free tier supports multi-document transactions, `$jsonSchema` validators and TTL indexes, and stays free. | D-31, DESIGN 5 |
| A-06 | Railway's Hobby plan keeps one always-on server within ₹500 a month. | D-28, Rule 10 |
| A-07 | Google sign-in in Testing mode is acceptable for personal and family use. | D-03, D-48 |
| A-08 | Better Auth's MongoDB adapter, Google provider and session settings work with Express 5 as documented. | D-30, DESIGN 7 |
| A-09 | Entering expenses by hand, in under 5 seconds each, is something I'll keep doing every day. | Rule 1, Rule 4 |
| A-10 | One developer (me), working with AI agents, in limited time. | Rule 15, milestone sizes |

## Open questions

Two kinds: **needs a fact** (look it up or try it) and **needs a decision** (I choose). Each has a deadline: the issue that can't proceed without it. When settled, it gets a date and usually becomes a decision.

| ID | Question | Kind | Needed by | Status |
| --- | --- | --- | --- | --- |
| Q-01 | Final app name (Rule 1) | needs a decision | #15 | open |
| Q-02 | Branch protection on a private repo: GitHub Pro, public repo, or convention only (DESIGN 10.3) | needs a decision | #6 | settled 2026-11-11: the repo becomes public after a pre-publication audit; protection is then enforced (#6) |
| Q-03 | Railway Hobby's current price and limits | needs a fact | #15 | open |
| Q-04 | Atlas free tier's current limits: connections, storage, backups, transactions (A-05) | needs a fact | #10, #15 | open |
| Q-05 | Which of the Biome rules in DESIGN 10.4 exist in the installed Biome 2 version | needs a fact | #3 | settled 2026-11-11: all exist in Biome 2.6.6; two are in the nursery group (DESIGN 10.4) |
| Q-06 | Better Auth details: MongoDB adapter with Express 5, the after-sign-up hook, sliding-session settings (A-08) | needs a fact | #16 | open |
| Q-07 | Whether the issue generator stays in the repo long-term (`tools/backlog/`) | needs a decision | — | settled 2026-11-11: it lives in `tools/backlog/` and runs in CI (D-49) |

## Rule 1: Purpose

**Name:** Money Manager, short name **MoneyMgr** (for the phone's home screen). This is a working name: the final name is confirmed before the first production deployment (issue #15, Q-01), because after that it also appears on Google's sign-in screen, in installed apps and in the app's web address. The rest of the app identity is in UI.md 4.11.

**Primary goal:** Know exactly where my money goes.

**FR-1.1** The app must make it easy to record every expense and see clearly how much I spent in each category.

**Secondary goals** (supported, but never at the cost of the primary goal):

- Save toward goals (e.g. a trip, an emergency fund) — Rule 6
- Remember recurring bills and subscriptions — Rule 7
- Track money I lent to or borrowed from people — Rule 8

**Success criteria:** After one month of use, I can tell exactly how much I spent per category.

## Rule 2: Users

**Who:** Only me for now. Family or friends may use it later, so the design must not assume a single user forever.

- **FR-2.1** Every piece of data (transactions, categories, goals, bills, lending records) belongs to a user.
- Sharing data between users is **not** part of the first version.

**FR-2.2** **Devices:** I use the app on multiple devices (e.g. phone and laptop). My data must stay in sync across them.

**FR-2.3** **Login:** Sign in with Google only. Email and password login is **not** part of the first version, so no email-sending service is needed.

**FR-2.4** A user can only ever see their own data.

## Rule 3: Platform

**FR-3.1** **Type:** A web app that can be installed on a phone like a native app (PWA). One codebase serves both phone and laptop.

**Usage:** I log expenses on my phone and my laptop about equally, so both must be first-class:

- **FR-3.2** The phone layout must make adding an expense fast with one hand.
- **FR-3.3** The laptop layout can show more detail (tables, summaries) at once.

**Supported devices and browsers:**

- **FR-3.4** **Primary devices:** an Android phone with Chrome, and a laptop. Every feature is checked on these first.
- **FR-3.5** **Supported browsers:** the last 2 versions of Chrome, Edge, Firefox, Safari and Brave, on desktop and mobile.
- **FR-3.6** **Installing as an app:** supported on Android (Chrome, Edge, Brave) and desktop Chrome/Edge.
- **FR-3.7** **(Should)** On iPhone the app works in Safari; installing it to the home screen is best effort.

**FR-3.8** **Connectivity:** The app requires an internet connection. Offline entry is **not** part of the first version. When the device is offline, the app shows a clear "You're offline" banner.

## Rule 4: Data entry

**FR-4.1** **Method:** All transactions are entered manually. Bank imports and SMS reading are **not** part of the first version.

**FR-4.2** **Transaction types:**

- **Expense:** money I spent
- **Income:** money I received

Transfers between my own accounts are **not** part of the first version.

**FR-4.3** Manual transactions can't use the built-in Lending category; Lending transactions are created only by lending records (Rule 8).

**FR-4.4** When I edit a manual transaction I can switch its type between expense and income; I then have to pick a category of the new type.

**FR-4.5** **Fields:**

| Field    | Required | Default |
| -------- | -------- | ------- |
| Type     | Yes      | Expense |
| Amount   | Yes      | —       |
| Category | Yes      | —       |
| Date     | Yes      | Today   |
| Payee    | No       | Empty   |
| Note     | No       | Empty   |

**Speed:** Adding an expense must take under 5 seconds. Concretely:

- **FR-4.6** An **Add** button is visible on every screen.
- **FR-4.7** Opening the form focuses the amount field and shows the number keypad on phones.
- **FR-4.8** The category picker only shows categories matching the selected type, with the most recently used ones first.
- **FR-4.9** Amount + one category tap + Save is enough. Saving an expense with defaults takes at most 3 taps after typing the amount, and under 5 seconds in total.

**Validation:**

- **FR-4.10** Amount must be greater than 0, have at most 2 decimal places, and be at most ₹1,00,00,000 (one crore).
- **FR-4.11** Date cannot be in the future.
- **FR-4.12** Payee and note are at most 100 and 500 characters.

**FR-4.13** **Payee autocomplete:** The payee field suggests payees I've used before.

**FR-4.14** **Failed saves:** If saving fails (e.g. the network drops), the form keeps everything I typed, shows an error and offers **Retry**. Entered data is never silently lost, and retrying never creates a duplicate transaction.

## Rule 5: Core features (first version)

The first version includes:

1. **FR-5.1** **Transactions:** add, edit and delete income and expenses (see Rule 4).
2. **Categories:** single level, no subcategories.
   - **FR-5.2** Every category is either an **expense** or an **income** category (except the built-in Lending category, see Rule 8).
   - **FR-5.3** Every category has an emoji icon, which I can change.
   - **FR-5.4** New users start with a default set:
     - Expense: 🍔 Food, 🚌 Transport, 🏠 Rent, 🧾 Bills, 🛍️ Shopping, 💊 Health, 🎬 Entertainment, 📦 Other
     - Income: 💼 Salary, 💰 Other income
     - Built-in: 🤝 Lending
   - **FR-5.5** I can add, rename and delete categories.
   - **FR-5.6** Category names are unique per user, ignoring upper/lower case.
   - **FR-5.7** A category's type cannot be changed once it has transactions.
   - **FR-5.8** Deleting a category that has transactions or bills requires choosing another category of the same type to move them to.
3. **Views:** **FR-5.9** all views work on calendar months (Rule 14).
   - **FR-5.10** **Transaction list:** filter by date range and category, search by note or payee.
   - **FR-5.11** **Monthly summary:** total spent per category for a chosen month.
   - **FR-5.12** **Spent, income and left over:** the chosen month's totals, as defined in Rule 9, Counting money.
   - **FR-5.13** **Which months:** Reports can show any month from the earliest month with data (the month of my first transaction or of my opening balance date, whichever is earlier) up to the current month.
   - **Charts:**
     - **FR-5.14** Pie chart of spending by category for the chosen month.
     - **FR-5.15** Bar chart of total spending per month for the last 6 months.
   - **FR-5.16** **Month comparison:** spending per category, chosen month against the month before, over the **same date range**. If today is 10 November, it compares 1–10 November with 1–10 October. Past months are compared in full. If the earlier month is shorter, its range stops at its last day.
4. **Savings goals:** see Rule 6.
5. **Recurring bills and subscriptions:** see Rule 7.
6. **Lending and borrowing:** see Rule 8.

**Priority:** Items 1–3 (expense tracking) are built first. Items 4–6 are built only after expense tracking works end to end (Rule 15).

## Rule 6: Savings goals

**FR-6.1** **A goal has:**

| Field          | Required | Default        |
| -------------- | -------- | -------------- |
| Name           | Yes      | —              |
| Target amount  | Yes      | —              |
| Deadline       | No       | None           |
| Icon (emoji)   | No       | 🎯             |

**Contributions:**

- **FR-6.2** I add money to a goal manually (e.g. "added ₹2,000 today"). Each contribution has an amount and a date, with the same validation as transactions (Rule 4).
- **FR-6.3** Contributions are tracked only inside the goal. They do **not** create transactions and do **not** appear in spending views.
- **FR-6.4** Withdrawals from a goal are **not** allowed.
- **FR-6.5** I can edit or delete a contribution to fix mistakes.

**FR-6.6** **Progress:** Each goal shows the amount saved, the amount remaining and the percentage reached. If it has a deadline, it also shows the time left.

**FR-6.7** **Statuses:**

- **Active:** saved amount is below the target.
- **Overdue:** active, and the deadline has passed. It stays open; I can keep contributing or change the deadline.
- **Completed:** saved amount has reached the target. The goal moves to a "Completed" list, where it stays visible.

**Status rules:**

- **FR-6.8** The contribution that reaches the target may exceed it. Completed goals accept no new contributions.
- **FR-6.9** If I lower the target to or below the saved amount, the goal becomes completed.
- **FR-6.10** If editing or deleting contributions brings the saved amount back below the target, the goal becomes active again.
- **FR-6.11** If I raise the target of a completed goal above the saved amount, it becomes active again. Completed goals can be edited like any other goal.
- **FR-6.12** Deleting a goal deletes it and its contributions permanently, after confirmation.

## Rule 7: Recurring bills and subscriptions

**FR-7.1** **A bill has:**

| Field         | Required | Default                    |
| ------------- | -------- | -------------------------- |
| Name          | Yes      | —                          |
| Amount        | Yes      | —                          |
| Category      | Yes      | Bills, if it exists        |
| Frequency     | Yes      | Monthly                    |
| Next due date | Yes      | —                          |
| Note          | No       | Empty                      |

If the Bills category has been deleted, I must pick an expense category myself.

**FR-7.2** **Frequency:** Monthly or every 3 months.

**Due dates:**

- **FR-7.3** A bill remembers the **day of the month** from its first due date (e.g. the 31st).
- **FR-7.4** Each next due date is one or three months later, on that same day. If the month is shorter, it falls on the month's last day: a bill due on the 31st is due on 28 or 29 February, then 31 March again.
- **FR-7.5** The next due date always moves forward from the **due date**, never from the date I paid. Paying late does not shift the schedule.
- **FR-7.6** If I change a bill's next due date by hand (when editing or resuming it), the remembered day of the month becomes that date's day.

**Reminders:**

- **FR-7.7** Reminders appear inside the app only. Push notifications and emails are **not** part of the first version.
- **FR-7.8** A bill shows as "upcoming" from 3 days before its due date.
- **FR-7.9** A bill past its due date that hasn't been paid or skipped shows as "overdue".
- **FR-7.10** "Today" is calculated in my timezone (Rule 9).

**Marking as paid:**

1. **FR-7.11** I can pay a bill at any time, including early or late.
2. **FR-7.12** The amount is pre-filled with the bill's amount and can be changed before confirming (for bills that vary, like electricity).
3. **FR-7.13** On confirming, the app creates an expense transaction with that amount, the bill's category, today's date, and the bill's name as the note.
4. **FR-7.14** The bill's next due date moves forward by its frequency.

**Other actions:**

- **FR-7.15** **Skip this cycle:** moves the next due date forward without creating a transaction (e.g. a subscription I didn't use this month).
- **FR-7.16** **Pause:** a paused bill shows no reminders and never becomes overdue. When I resume it, I choose its next due date.
- **FR-7.17** **Delete:** deletes the bill permanently, after confirmation. Its past payment transactions are kept and become regular transactions I can edit directly.

**History and undo:**

- **FR-7.18** Each bill shows a history of its cycles: each due date, whether it was paid or skipped, and the amount paid.
- **FR-7.19** I can **undo the most recent cycle only**. Undoing a payment permanently removes its transaction and moves the next due date back. Undoing a skip moves the next due date back.

## Rule 8: Lending and borrowing

**FR-8.1** **A record has:**

| Field     | Required | Default |
| --------- | -------- | ------- |
| Person    | Yes      | —       |
| Direction | Yes      | I lent  |
| Amount    | Yes      | —       |
| Date      | Yes      | Today   |
| Due date  | No       | None    |
| Note      | No       | Empty   |

Direction is either **I lent** (they owe me) or **I borrowed** (I owe them). **FR-8.2** The person field suggests names I've used before.

**Repayments:**

- **FR-8.3** Partial repayments are allowed. Each repayment has an amount and a date.
- **FR-8.4** A repayment cannot be larger than the amount remaining.
- **FR-8.5** A record shows the original amount, the total repaid and the amount remaining.
- **FR-8.6** When the remaining amount reaches zero, the record is marked settled. If editing a repayment brings it back above zero, it becomes open again.
- **FR-8.7** A record with a due date that is past and not settled shows as "overdue".

**FR-8.8** **Effect on income and expenses:** Every money movement creates a transaction in a built-in **Lending** category, dated on the record's date or the repayment's date:

| Event                         | Transaction created |
| ----------------------------- | ------------------- |
| I lend money                  | Expense             |
| Someone repays me             | Income              |
| I borrow money                | Income              |
| I repay money I borrowed      | Expense             |

**FR-8.9** The Lending category cannot be renamed or deleted.

**Editing and deleting:**

- **FR-8.10** Editing a record or repayment updates its linked transaction.
- **FR-8.11** The original amount cannot be lowered below the total already repaid.
- **FR-8.12** The direction (lent or borrowed) can be changed only while the record has no repayments.
- **FR-8.13** Deleting a repayment removes its transaction.
- **FR-8.14** Deleting a record permanently deletes it, its repayments and all their transactions, after confirmation.

**FR-8.15** **In spending views:** The monthly summary, spent, income and left over, charts and month comparison include Lending transactions by default. Each of these views has a toggle to hide them.

**FR-8.16** **View:** A single list of records, filterable by direction and by open or settled. A per-person summary is **not** part of the first version.

## Rule 9: Data model

### General rules

- **FR-9.1** **Money** is stored as an integer number of the smallest unit (paise), never as a floating-point number. ₹125.50 is stored as `12550`.
- **FR-9.2** **Amounts:** every amount (transactions, bills, goal targets, contributions, lending records, repayments) follows Rule 4's amount validation: greater than 0, at most 2 decimal places, at most ₹1,00,00,000. The **opening balance** is the one exception: it can be zero or negative (e.g. starting in debt), down to −₹1,00,00,000.
- **FR-9.3** **Dates of money events** (transactions, contributions, lending records, repayments, the opening balance date) can't be in the future.
- **FR-9.4** **Due dates and deadlines** can be in the future, with these limits:
  - A bill's next due date can be any date; if it's already past, the bill shows as overdue.
  - A lending record's due date can't be before the record's own date.
  - A goal's deadline can't be in the past at the moment I set or change it.
- **FR-9.5** **Text limits:**

  | Field                     | Length        |
  | ------------------------- | ------------- |
  | Category name             | 1–40          |
  | Bill name, goal name      | 1–60          |
  | Person (lending)          | 1–60          |
  | Payee                     | up to 100     |
  | Note                      | up to 500     |

  Leading and trailing spaces are trimmed, and text is Unicode-normalized, before checking, comparing or storing, so the same name typed two different ways (for example "Café") counts as one name.
- **FR-9.6** **Currency:** Every amount is stored with a currency code. The first version only supports `INR`. Contributions, repayments and bill cycles use the currency of the goal, record or bill they belong to.
- **FR-9.7** **Dates:** Transaction, contribution, repayment and due dates are calendar dates (no time of day), in the user's timezone. This keeps a late-night expense in the correct day and month.
- **FR-9.8** **Timezone:** Each user has a timezone (default `Asia/Kolkata`). The server uses it to decide what "today" is, for date defaults, upcoming and overdue bills, and overdue goals and lending. Changing my timezone only changes what "today" is from then on; dates already saved never change.
- **FR-9.9** **Ownership:** Every record belongs to exactly one user (Rule 2).
- **FR-9.10** **Editing on two devices:** if a record was changed on another device after I opened it, my save or delete is rejected with "This was changed on another device" and a **Reload** option. An edit is never silently overwritten.
- **FR-9.11** **Timestamps:** Every record has `createdAt` and `updatedAt`.

### Entities

**FR-9.12** The app stores exactly these entities; DESIGN 5 defines their fields and storage.

**User:** id, Google account id, name, email, timezone, opening balance, opening balance date, last backup date.

**Category:** id, user, name, emoji, type (expense, income or both), built-in flag.
- Built-in categories (Lending) cannot be renamed or deleted. Lending has type "both", since it holds both expenses and income (Rule 8). User-created categories are expense or income.

**Transaction:** id, user, type (expense or income), amount, currency, category, date, payee, note, source, source id, deletedAt.
- `source` says where it came from: manual, bill or lending. `source id` points to the bill cycle, lending record or repayment that created it.
- Transactions created by a bill or a lending record are edited and deleted from that bill or record, not directly, and never go to the Trash.

**SavingsGoal:** id, user, name, target amount, currency, deadline, icon (emoji), completedAt.

**GoalContribution:** id, goal, amount, date.

**Bill:** id, user, name, amount, currency, category, frequency (monthly or quarterly), due day of month, next due date, paused flag, note.

**BillCycle:** id, bill, due date, status (paid or skipped), transaction (if paid).

**LendingRecord:** id, user, person, direction (lent or borrowed), amount, currency, date, due date, note, settledAt.

**Repayment:** id, lending record, amount, date.

### Overall balance

There are no accounts. The app shows one overall balance:

> **FR-9.13** balance = opening balance + income − expenses, counting only transactions dated on or after the opening balance date

- **FR-9.14** The opening balance and its date are set at signup (Rule 13) and can be edited later.
- **FR-9.15** Transactions dated before the opening balance date still appear in every view, but not in the balance.
- **FR-9.16** The balance can be negative.
- **FR-9.17** Trashed transactions do not count.
- **FR-9.18** Savings goal contributions do not change the balance (Rule 6), so the balance includes money set aside for goals.

### Counting money

**FR-9.19** Every screen counts money the same way. These definitions are the single source; Home, Reports, the transaction list and the balance all use them.

| Figure                       | Counts                                                                 |
| ---------------------------- | ---------------------------------------------------------------------- |
| **Spent** (a day, a month)   | expense transactions dated in that period, including bill payments and Lending expenses (money I lent or repaid) |
| **Income** (a month)         | income transactions dated in that period, including Lending income (money I borrowed or was repaid) |
| **Left over** (a month)      | income − spent; can be negative                                       |
| **Top categories**           | categories ranked by spent; Lending can appear like any other         |
| **Balance**                  | Rule 9's formula: every transaction on or after the opening balance date, including Lending |

- **FR-9.20** **Always excluded:** trashed transactions and savings goal contributions.
- **FR-9.21** **Transactions before the opening balance date** count in day and month figures, but not in the balance.
- **FR-9.22** **The Lending toggle** exists only in Reports (Rule 8). When off, Reports' spent, income, left over, categories and charts leave out Lending transactions. The balance, Home and the transaction list always include them.
- **FR-9.23** **Month comparison** uses the same "spent" definition, over the date ranges in Rule 5.
- **FR-9.24** **Percentages** (a category's share of spending) are rounded to whole numbers, so they may not add up to exactly 100%.

### Deleting

- **FR-9.25** Deleting a manual transaction moves it to a **Trash** (it sets `deletedAt`). Trashed transactions don't appear in any view or total.
- **FR-9.26** From the Trash, I can restore a transaction or delete it permanently.
- **FR-9.27** Transactions in the Trash for more than 30 days are deleted permanently.
- **FR-9.28** Goals, bills and lending records have no Trash. Deleting them is permanent and always asks for confirmation.

## Rule 10: Storage, backup and privacy

**FR-10.1** **Storage:** All data is stored in a cloud database, so it syncs across my devices (Rule 2).

**FR-10.2** **Hosting cost:** The app server runs on a paid managed platform, at most ₹500/month. Everything else (database, Google sign-in) uses free tiers.

**Backups:**

- Server-side backups rely on whatever the hosting provider offers automatically. Free database tiers may offer none (check MongoDB Atlas's current free-tier limits, Q-04), so the JSON download is treated as the real backup.
- **FR-10.3** The app has a **Download backup** button that downloads all my data as one JSON file.
- **FR-10.4** The file includes a format version number and the export date and time, so a restore feature can be added later.
- **FR-10.5** If I haven't downloaded a backup in 30 days, the Home screen shows a reminder.
- Restoring from a backup file is **not** part of the first version. CSV export is **not** part of the first version.

**Privacy and security:**

- **FR-10.6** All traffic uses HTTPS.
- **FR-10.7** Access rules are enforced on the server: a user can only read or change their own data, whatever the client sends.
- **FR-10.8** Sessions are stored in `httpOnly`, `Secure`, `SameSite` cookies, never in `localStorage`. A session expires after 30 days without use; using the app keeps it alive.
- **FR-10.9** I can **log out of all devices**, which ends every session.
- **FR-10.10** The API is rate limited per user and per IP address, with tighter limits on expensive or dangerous actions (downloading a backup, deleting the account).
- **FR-10.11** No third-party analytics or tracking.

**FR-10.12** **Account deletion:** I can delete my account. This permanently deletes the account and all its data, after I confirm by typing a confirmation phrase.

## Rule 11: Tech stack

Learning is part of the goal, so I build the backend myself rather than using a backend-as-a-service. The decisions behind each choice, with what was rejected, are in DESIGN 1.

| Layer            | Choice                                                                   |
| ---------------- | ------------------------------------------------------------------------ |
| Language         | TypeScript on both frontend and backend                                  |
| Frontend         | React + Vite, installable as a PWA (Rule 3)                              |
| Backend          | Node.js + Express REST API                                               |
| Database         | MongoDB on MongoDB Atlas's free tier, official driver + Zod              |
| Auth             | Better Auth with Google sign-in                                          |
| Hosting          | One always-on server on Railway (Hobby plan, Singapore region)           |
| Monorepo         | pnpm workspaces                                                          |

The Express server also serves the built frontend, so the app and the API share one domain. See `DESIGN.md` for the reasons behind these choices.

**Constraints from earlier rules:**

- Money is stored as integers in paise (FR-9.1).
- **FR-11.1** Actions that write more than one record (paying, skipping or undoing a bill cycle, recording or changing a lending record or repayment, reassigning a category) must succeed or fail as a whole, using database transactions.
- The API checks on every request that the data belongs to the logged-in user (FR-10.7).
- **FR-11.2** The frontend and the API must be served from the **same site**. Otherwise browsers treat the session cookie as a third-party cookie and may block it.
- **FR-11.3** The server must stay always on. A host that sleeps when idle is ruled out, because a slow first load breaks the 5-second rule (Rule 4).

## Rule 12: Screens and navigation

**FR-12.1** **Navigation:** a bottom tab bar on phones and a sidebar on laptops, with these sections:

1. **Home**
2. **Transactions**
3. **Reports**
4. **Plan:** Bills, Goals and Lending, as three tabs
5. **Settings**

**FR-12.2** The **Add** button (Rule 4) is a floating button on phones and a button in the top bar on laptops, visible on every screen.

**FR-12.3** **Home:**

- Overall balance (Rule 9)
- This month's spending and income; this month's spending is the most prominent number on the screen
- Top 3 spending categories this month
- The 5 most recent transactions, with "See all"
- Upcoming and overdue bills
- Overdue lending records
- Backup reminder, when due (Rule 10)

**FR-12.4** **Transactions:** the transaction list (Rule 5), grouped by date with a daily total, plus a link to the Trash.

**FR-12.5** **Reports:** a month picker, the monthly summary, spent, income and left over, charts and month comparison (Rule 5), with the Lending toggle (Rule 8).

**FR-12.6** **Plan:** the bills (Rule 7), goals (Rule 6) and lending (Rule 8) lists, each with its own add button.

**FR-12.7** **Settings:** categories, opening balance and date, timezone, theme (follow device, light or dark; remembered per device), download backup, log out, log out of all devices, delete account, and the app version.

## Rule 13: Signup flow

1. I sign in with Google (FR-2.3).
2. **FR-13.1** On first sign-in, my account is created with the default categories (Rule 5), the built-in Lending category, and the timezone `Asia/Kolkata`.
3. **FR-13.2** The welcome screen shows the timezone detected from my device (I can change it) and asks for an opening balance (default ₹0) and its date (default today).
4. **FR-13.3** **Continue** saves all three. **Skip** saves only the timezone; I can set the opening balance later in Settings.
5. **FR-13.4** I land on the Home screen. The welcome screen never appears again.

## Rule 14: Formatting and calendar

- **FR-14.1** **Money** is shown with the ₹ symbol and Indian digit grouping: ₹1,00,000. Paise are shown only when non-zero: ₹1,250 and ₹1,250.50.
- **FR-14.2** **Negative figures** (only the balance, the opening balance and "left over" can be negative) are shown with a minus sign, in the normal text colour, never red: −₹2,000. Expenses are never shown with a minus sign; they are positive amounts of a different type.
- **FR-14.3** **Signs:** income amounts get a `+` (in the income colour). "Left over" is a difference, so it gets `+` when positive and `−` when negative, both in the normal text colour. Every other figure (expenses, totals, the balance when positive) has no sign.
- **FR-14.4** **Dates** are shown as `10 Nov 2026` in lists and `10/11/2026` (DD/MM/YYYY) in forms.
- **FR-14.5** **Month** means the calendar month, from the 1st to the last day, in my timezone.
- **FR-14.6** The app's language is English.

## Rule 15: Build milestones

Each milestone is finished only when its "done when" check passes and its tests (Rule 16) pass.

1. **Setup and login:** project setup, Google sign-in, signup flow (Rule 13), deployed to production.
   - Done when: I can sign in on my phone and my laptop and see an empty Home screen.
2. **Transactions and categories:** add, edit, delete, Trash, categories, overall balance.
   - Done when: I can add an expense on my phone in under 5 seconds, and it appears on my laptop.
3. **Views:** transaction list filters and search, Reports, Home summaries.
   - Done when: totals for a month of sample data match my own manual calculation.
4. **Bills** (Rule 7).
   - Done when: paying, skipping, pausing and undoing work, including a bill due on the 31st.
5. **Lending** (Rule 8).
   - Done when: lending, partial repayments and settling produce the correct transactions and remaining amounts.
6. **Savings goals** (Rule 6).
   - Done when: contributions, editing and completion follow the status rules.
7. **Backup and account:** download backup, backup reminder, log out of all devices, delete account.
   - Done when: the backup file contains all my data and deleting my account leaves nothing behind.

After milestone 3, I use the app daily for two weeks before starting milestone 4, and update this spec with anything I learn.

## Rule 16: Testing

**Unit tests are required for:**

- Converting between typed amounts and paise, and formatting money (Rule 14)
- The overall balance: opening balance date, Trash, negative balances (Rule 9)
- Bill due dates: the 29th–31st, February, leap years, quarterly bills, skip and undo (Rule 7)
- Lending: remaining amount, settling, reopening, repayment limits (Rule 8)
- Goal statuses (Rule 6)
- Month comparison date ranges (Rule 5)
- "Today" in the user's timezone around midnight (Rule 9)
- The money-counting definitions: spent, income, left over, top categories, percentages, with and without Lending (Rule 9, Counting money)

**API tests are required for:**

- **Data isolation:** for every endpoint, one user can never read or change another user's data (Rule 10).
- Multi-record actions roll back completely when one step fails (Rule 11).
- Stale edits are rejected (Rule 9).

**End-to-end browser tests are required for the critical flows**, on a phone-sized and a laptop-sized screen:

- Adding, editing and deleting an expense (Rule 4)
- Paying a bill (Rule 7)

**Evidence:** every Must requirement has at least one test whose name contains its ID, for example `it("[FR-7.4] moves a bill due on the 31st to 28 February")`. `TRACEABILITY.md` lists them, and CI checks it (DESIGN 10.2, 10.8).

**Tools:** a standard TypeScript test runner (e.g. Vitest), an HTTP testing library for the API (e.g. Supertest), and a browser automation tool for end-to-end tests (e.g. Playwright).

## Rule 17: Out of scope (first version)

These are deliberately **not** built in the first version. Any of them can be added later as a new rule.

- Email and password login (Rule 2)
- Sharing data between users, family accounts (Rule 2)
- Offline entry and sync (Rule 3)
- Bank statement import, SMS reading, automatic bank sync (Rule 4)
- Transfers between my own accounts (Rule 4)
- Future-dated transactions (Rule 4)
- Subcategories (Rule 5)
- Withdrawals from savings goals (Rule 6)
- Weekly, yearly and custom bill frequencies (Rule 7)
- Push notifications and email reminders (Rule 7)
- Per-person lending summary (Rule 8)
- Accounts and per-account balances (Rule 9)
- Multiple currencies (Rule 9)
- CSV export and restoring from a backup file (Rule 10)
- Payday-based months (Rule 14)
- Production publishing of the Google sign-in app; it stays in Testing mode (DESIGN 7.5)
- A list of signed-in devices; only "log out of all devices" (Rule 10)
- Optimistic updates in the UI (DESIGN 8.4)
- Vibration and sound feedback (UI.md 7)
- A formal WCAG target or audit; a practical baseline instead (UI.md 8)
- Error tracking and uptime monitoring services (DESIGN 9.4, 11.7)
- A staging environment and a custom domain (DESIGN 11.1, 11.6)

## Decisions (product)

Product decisions, `D-01` to `D-27`. Technical decisions continue from `D-28` in DESIGN 1. Each one **binds**: code, docs and issues must follow it until the decision itself is changed here, with a new date. A changed decision keeps its ID and records what it replaced.

### D-01 Expense tracking first
- **Decided:** 2026-11-10. **Chose:** the app's main job is showing where money goes; savings goals, bills and lending are secondary and built after it (Rule 1, Rule 15).
- **Refused:** budgeting first; net worth tracking; all features at once.
- **Why:** the one problem I actually have is not knowing where my money goes; secondary features don't help if logging isn't a habit.
- **Binds:** milestone order; nothing from milestones 4–6 starts before milestone 3 plus two weeks of use.

### D-02 Personal now, multi-user ready
- **Decided:** 2026-11-10. **Chose:** one user now, but every record carries its owner (FR-2.1, FR-9.9).
- **Refused:** a single-user design with no owner field; shared family data in the first version.
- **Why:** adding ownership later means rewriting every query; adding it now costs one field.
- **Binds:** every collection has `userId`; every query filters by it (DESIGN 4.5).

### D-03 Google sign-in only
- **Decided:** 2026-11-10. **Chose:** Google sign-in, nothing else (FR-2.3).
- **Refused:** email and password (needs an email service for verification and resets); hosted auth services.
- **Why:** no passwords to store, no email infrastructure, and I already use Google.
- **Binds:** no password fields or email flows anywhere; Better Auth configured with the Google provider only (D-30).

### D-04 One installable web app
- **Decided:** 2026-11-10. **Chose:** a PWA from one codebase for phone and laptop (FR-3.1).
- **Refused:** a native mobile app plus a web dashboard; mobile only; web only.
- **Why:** one codebase, installable on Android, no app-store process.
- **Binds:** every screen works at every width (UI.md 4.8); installability is a milestone 1 requirement.

### D-05 Online only
- **Decided:** 2026-11-10. **Chose:** the app needs a connection; offline shows a banner (FR-3.8).
- **Refused:** offline entry with background sync.
- **Why:** sync conflicts are the hardest part of offline apps, and I'm almost always online (A-04).
- **Binds:** the service worker never caches API responses (DESIGN 8.7); no local database in the browser.

### D-06 Manual entry only
- **Decided:** 2026-11-10. **Chose:** every transaction is typed in (FR-4.1).
- **Refused:** CSV statement import; reading bank SMS; bank sync services.
- **Why:** each import source is a project of its own; manual entry is enough to answer "where does my money go".
- **Binds:** the 5-second rule (FR-4.9) carries the whole product; the Add flow outranks everything in UI.md 1.1.

### D-07 Expense and income only
- **Decided:** 2026-11-10. **Chose:** two transaction types (FR-4.2).
- **Refused:** transfers between own accounts.
- **Why:** without accounts (D-08) a transfer has nothing to move between.
- **Binds:** `type` is `"expense"` or `"income"` everywhere; no transfer type in the schema, API or UI.

### D-08 One balance, no accounts
- **Decided:** 2026-11-10. **Chose:** one overall balance from an opening balance plus transactions (FR-9.13).
- **Refused:** separate accounts (bank, cash, UPI) with their own balances; an optional account field.
- **Why:** accounts add a decision to every entry and slow down the 5-second rule; one balance answers my question.
- **Binds:** no account field on transactions; the balance is calculated, never stored.

### D-09 Fast entry: amount, category, Save
- **Decided:** 2026-11-10. **Chose:** amount, category and date required; Save is a separate tap (FR-4.5, FR-4.9).
- **Refused:** tapping a category saves immediately; a full form every time.
- **Why:** three taps still fit in 5 seconds and prevent accidental saves.
- **Binds:** UI.md 2.1 and 3.2; Save stays disabled until amount and category are valid.

### D-10 Single-level, typed categories with emoji
- **Decided:** 2026-11-10. **Chose:** one level, each category expense or income, with an emoji, a default set, and reassignment on delete (FR-5.2 to FR-5.8).
- **Refused:** subcategories; deleted categories' transactions moving to "Other" automatically; blocking deletes.
- **Why:** one level keeps the picker fast; reassigning keeps reports honest.
- **Binds:** the category picker filters by type; deleting a used category requires a target (DESIGN 6.5).

### D-11 Calendar months
- **Decided:** 2026-11-10. **Chose:** every month figure uses the calendar month in my timezone (FR-14.5).
- **Refused:** a payday-to-payday cycle.
- **Why:** simpler to reason about and to compare with bank statements.
- **Binds:** all month ranges come from `packages/shared/src/dates.ts`.

### D-12 Goal contributions aren't transactions
- **Decided:** 2026-11-10. **Chose:** contributions live inside the goal, don't change the balance, and can't be withdrawn (FR-6.2 to FR-6.4).
- **Refused:** recording contributions as expense transactions; withdrawals.
- **Why:** saving isn't spending; counting it as spending would distort "where my money goes".
- **Binds:** contributions are embedded in goals (DESIGN 5.3) and excluded from every money figure (FR-9.20).

### D-13 Simple recurring bills
- **Decided:** 2026-11-10. **Chose:** monthly or quarterly bills with in-app reminders; paying creates an expense; only the latest cycle can be undone (Rule 7).
- **Refused:** weekly, yearly or custom frequencies; push and email reminders; undoing any past cycle.
- **Why:** covers rent, utilities and subscriptions without a scheduler or notification service.
- **Binds:** no background jobs (DESIGN 2); bill status is calculated on read.

### D-14 Lending counts as money in and out
- **Decided:** 2026-11-10; Home behaviour 2026-11-11. **Chose:** lending creates expense and income transactions in a built-in Lending category; Reports can hide them; Home always includes them (FR-8.8, FR-9.22).
- **Refused:** tracking lending separately from spending; Lending as an ordinary editable category; excluding Lending on Home.
- **Why:** money lent really leaves my balance; the toggle keeps Reports readable.
- **Binds:** the Lending category is built in and locked; reports take `includeLending`; Home ignores it.

### D-15 A Trash for manual transactions
- **Decided:** 2026-11-10. **Chose:** deleting a manual transaction moves it to a Trash that empties after 30 days (FR-9.25 to FR-9.27).
- **Refused:** permanent deletion straight away.
- **Why:** money data deserves an undo.
- **Binds:** `deletedAt` plus a TTL index (DESIGN 5.4); every query excludes trashed transactions.

### D-16 Integer paise, rupees only
- **Decided:** 2026-11-10. **Chose:** money as integer paise with a currency code that is always `INR` for now (FR-9.1, FR-9.6).
- **Refused:** floating-point numbers; decimal types; multiple currencies.
- **Why:** integers make every total exact; storing the code keeps multi-currency possible later.
- **Binds:** no float arithmetic on money outside `money.ts` (DESIGN 10.4); amounts in the API are integers.

### D-17 Stale edits are rejected
- **Decided:** 2026-11-11. **Chose:** an edit based on an old copy is refused with "changed on another device" (FR-9.10).
- **Refused:** last save wins.
- **Why:** silently losing a money edit is worse than asking me to reload.
- **Binds:** every record has a `version`; every changing request sends it (DESIGN 4.7, D-38).

### D-18 Backup by download
- **Decided:** 2026-11-10. **Chose:** a JSON download with a 30-day reminder; no restore in the first version (FR-10.3 to FR-10.5).
- **Refused:** relying on the hosting provider's backups; no export at all; CSV export now.
- **Why:** the free database tier may have no backups (A-05); a download is under my control.
- **Binds:** the backup file has a format version so restore can be added (DESIGN 6.6).

### D-19 The opening balance can be negative
- **Decided:** 2026-11-11. **Chose:** zero or negative opening balances are allowed (FR-9.2).
- **Refused:** zero or more only.
- **Why:** starting in debt is a real situation; the balance can already go negative.
- **Binds:** `openingBalance` is the only signed amount (DESIGN 5.1).

### D-20 Completed goals stay editable
- **Decided:** 2026-11-11. **Chose:** completed goals can be edited; raising the target above the saved amount reopens them (FR-6.11).
- **Refused:** locking completed goals.
- **Why:** mirrors the existing rule that lowering contributions reopens a goal.
- **Binds:** `goalStatus` recalculates on every target change (#47).

### D-21 A manual due date resets the bill's day
- **Decided:** 2026-11-11. **Chose:** setting a bill's next due date by hand makes that date's day the remembered day (FR-7.6).
- **Refused:** keeping the original day and moving only one cycle.
- **Why:** same behaviour as resuming a bill; one rule instead of two.
- **Binds:** any write of `nextDueDate` by the user also writes `dueDay` (#36).

### D-22 A transaction's type can change on edit
- **Decided:** 2026-11-11. **Chose:** switching expense ↔ income while editing is allowed, with a category of the new type (FR-4.4).
- **Refused:** deleting and re-adding instead.
- **Why:** a mistyped type is a common mistake; fixing it in place keeps the date and note.
- **Binds:** `PATCH /transactions/:id` validates type and category together (#20).

### D-23 Reports show only months with data
- **Decided:** 2026-11-11. **Chose:** the month picker runs from the earliest month with data to the current month (FR-5.13).
- **Refused:** any month.
- **Why:** empty months before my data started, or in the future, are noise.
- **Binds:** the summary endpoint returns the range and rejects months outside it (DESIGN 6.5).

### D-24 Friendly, calm design
- **Decided:** 2026-11-10; colour rules 2026-11-11. **Chose:** friendly and playful but calm about money: violet accent, emoji categories, celebrations for good moments, expenses never red (UI.md 1).
- **Refused:** a professional data-dense dashboard; a premium minimal style; red for expenses and green for income everywhere.
- **Why:** I'll open this app several times a day; it should feel encouraging, not alarming.
- **Binds:** UI.md 1 and 4.1 decide every visual judgement call; red only for overdue, delete actions and form errors.

### D-25 Visual feedback only
- **Decided:** 2026-11-10. **Chose:** no vibration and no sounds (UI.md 7).
- **Refused:** haptics on save and delete; celebration sounds.
- **Why:** finance apps get used in public, and iPhones don't support web vibration anyway.
- **Binds:** no vibration or audio APIs in the web app.

### D-26 A practical accessibility baseline
- **Decided:** 2026-11-10. **Chose:** the baseline in UI.md 8, checked at every sign-off.
- **Refused:** a formal WCAG 2.2 AA target and audits; no accessibility rules at all.
- **Why:** the baseline costs little and helps everyone; a formal audit isn't needed for a personal app.
- **Binds:** every UI issue's definition of done includes the baseline.

### D-27 A working name until the first deploy
- **Decided:** 2026-11-11. **Chose:** "Money Manager" (short name "MoneyMgr") as a working name, confirmed before issue #15 (Q-01).
- **Refused:** settling the final name now.
- **Why:** renaming is free until the name reaches Google's consent screen and installed apps.
- **Binds:** UI.md 4.11 lists every place the name appears; a rename updates all of them in one pull request.

## Risks

Known risks, what they would cause, and what we do about them. Reviewed at every milestone sign-off.

| Risk | Impact | Response |
| --- | --- | --- |
| MongoDB Atlas changes or removes its free tier | Database stops or starts costing money | The JSON backup (Rule 10) keeps the data portable; a small paid tier or another MongoDB host is the fallback |
| Atlas's free tier has no automatic backups | A mistake or outage could lose data | The Download backup button and its 30-day reminder (Rule 10) |
| Railway raises prices above ₹500/month | Over budget | The server is a plain Node.js process, so it can move to another always-on host (DESIGN 1.1) |
| Google changes sign-in rules or limits Testing-mode apps | Can't sign in | Better Auth supports other providers; email login is a known next step (Rule 17) |
| Scope creep from the secondary goals | Expense tracking ships late | Milestone order (Rule 15): bills, lending and goals only after expense tracking works |
| I stop logging expenses | The app fails its success criteria (Rule 1) | The 5-second rule (Rule 4), and two weeks of real use after milestone 3 |
| Solo developer, limited time | Long gaps between milestones | Small issues (size labels), each one shippable on its own |
| A bug corrupts money data | Wrong totals, lost trust | Integer paise (Rule 9), DB transactions (Rule 11), the required tests (Rule 16), database validators (DESIGN 5.6) and the Trash |
| Docs, issues and code drift apart | Rules silently stop being true | Requirement IDs, generated `TRACEABILITY.md` and drift checks in CI (DESIGN 10.2) |

## Glossary

One word per idea, used the same way in the docs, the code, the API and the UI. The "In code" column is the name the code must use.

| Term | Meaning | In code |
| --- | --- | --- |
| **Transaction** | One expense or income entry. The only thing that affects totals. | `Transaction`, collection `transactions`, `/transactions` |
| **Manual transaction** | A transaction I entered myself. The only kind I can edit or trash directly. | `source.kind: "manual"` |
| **Category** | A label on a transaction, with an emoji and a type (expense or income). | `Category`, `categories`, `/categories` |
| **Lending (category)** | The built-in category for transactions created by lending records. | `builtIn: true`, `type: "both"` |
| **Bill** | A recurring payment I want to be reminded about. | `Bill`, `bills`, `/bills` |
| **Bill cycle** | One due date of a bill, closed by paying or skipping it. | `BillCycle`, `billCycles` |
| **Lending record** | Money I lent to or borrowed from one person, once. | `LendingRecord`, `lendingRecords`, `/lending` |
| **Repayment** | A partial or full payment back on a lending record. | `Repayment`, embedded `repayments`, `/lending/:id/repayments` |
| **Settled** | A lending record with nothing remaining. | `settledAt` |
| **Goal** | A savings target. | `SavingsGoal`, `goals`, `/goals` |
| **Contribution** | Money I put toward a goal. It's not a transaction. | `GoalContribution`, embedded `contributions` |
| **Opening balance** | My starting balance, on a date I choose. | `openingBalance`, `openingBalanceDate` |
| **Balance** | Opening balance plus income minus spent, from the opening balance date (Rule 9). | `calculateBalance` |
| **Spent / Income / Left over** | The month figures defined in Rule 9, Counting money. | `spent`, `income`, `leftOver` |
| **Trash** | Where deleted manual transactions wait 30 days before being removed for good. | `deletedAt`, `/transactions/trash` |
| **Calendar date** | A date with no time of day, stored as `YYYY-MM-DD`. | `CalendarDate` |
| **Paise** | The unit every amount is stored in; ₹1 = 100 paise. | integer amounts, `MAX_AMOUNT_PAISE` |
| **Version** | A record's change counter, used to reject stale edits (Rule 9). | `version` |
| **Idempotency key** | A one-time id a form sends with a create, so retrying never creates a duplicate. | `idempotencyKey` |
| **Requirement ID** | `FR-<rule>.<n>`: one testable requirement in this spec. | `[FR-x.y]` in test names |
| **Decision ID** | `D-nn`: a binding product (here) or technical (DESIGN 1) decision. | — |
