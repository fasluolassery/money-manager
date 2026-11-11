# Money Manager — Spec

## Rule 1: Purpose

**Name:** Money Manager.

**Primary goal:** Know exactly where my money goes.

The app must make it easy to record every expense and see clearly how much I spent in each category.

**Secondary goals** (supported, but never at the cost of the primary goal):

- Save toward goals (e.g. a trip, an emergency fund)
- Remember recurring bills and subscriptions
- Track money I lent to or borrowed from people

**Success criteria:** After one month of use, I can tell exactly how much I spent per category.

## Rule 2: Users

**Who:** Only me for now. Family or friends may use it later, so the design must not assume a single user forever.

- Every piece of data (transactions, categories, goals, bills, lending records) belongs to a user.
- Sharing data between users is **not** part of the first version.

**Devices:** I use the app on multiple devices (e.g. phone and laptop). My data must stay in sync across them.

**Login:** Sign in with Google only. Email and password login is **not** part of the first version, so no email-sending service is needed. A user can only ever see their own data.

## Rule 3: Platform

**Type:** A web app that can be installed on a phone like a native app (PWA). One codebase serves both phone and laptop.

**Usage:** I log expenses on my phone and my laptop about equally, so both must be first-class:

- The phone layout must make adding an expense fast with one hand.
- The laptop layout can show more detail (tables, summaries) at once.

**Supported devices and browsers:**

- **Primary devices:** an Android phone with Chrome, and a laptop. Every feature is checked on these first.
- **Supported browsers:** the last 2 versions of Chrome, Edge, Firefox, Safari and Brave, on desktop and mobile.
- **Installing as an app:** supported on Android (Chrome, Edge, Brave) and desktop Chrome/Edge. On iPhone the app works in Safari; installing it to the home screen is best effort.

**Connectivity:** The app requires an internet connection. Offline entry is **not** part of the first version. When the device is offline, the app shows a clear "You're offline" banner.

## Rule 4: Data entry

**Method:** All transactions are entered manually. Bank imports and SMS reading are **not** part of the first version.

**Transaction types:**

- **Expense:** money I spent
- **Income:** money I received

Transfers between my own accounts are **not** part of the first version.

Manual transactions can't use the built-in Lending category; Lending transactions are created only by lending records (Rule 8).

**Fields:**

| Field    | Required | Default |
| -------- | -------- | ------- |
| Type     | Yes      | Expense |
| Amount   | Yes      | —       |
| Category | Yes      | —       |
| Date     | Yes      | Today   |
| Payee    | No       | Empty   |
| Note     | No       | Empty   |

**Speed:** Adding an expense must take under 5 seconds. Concretely:

- An **Add** button is visible on every screen.
- Opening the form focuses the amount field and shows the number keypad on phones.
- The category picker only shows categories matching the selected type, with the most recently used ones first.
- Amount + one category tap + Save is enough. Saving an expense with defaults takes at most 3 taps after typing the amount.

**Validation:**

- Amount must be greater than 0, have at most 2 decimal places, and be at most ₹1,00,00,000 (one crore).
- Date cannot be in the future.
- Payee and note are at most 100 and 500 characters.

**Payee autocomplete:** The payee field suggests payees I've used before.

**Failed saves:** If saving fails (e.g. the network drops), the form keeps everything I typed, shows an error and offers **Retry**. Entered data is never silently lost, and retrying never creates a duplicate transaction.

## Rule 5: Core features (first version)

The first version includes:

1. **Transactions:** add, edit and delete income and expenses (see Rule 4).
2. **Categories:** single level, no subcategories.
   - Every category is either an **expense** or an **income** category (except the built-in Lending category, see Rule 8).
   - Every category has an emoji icon, which I can change.
   - New users start with a default set:
     - Expense: 🍔 Food, 🚌 Transport, 🏠 Rent, 🧾 Bills, 🛍️ Shopping, 💊 Health, 🎬 Entertainment, 📦 Other
     - Income: 💼 Salary, 💰 Other income
     - Built-in: 🤝 Lending
   - I can add, rename and delete categories.
   - Category names are unique per user, ignoring upper/lower case.
   - A category's type cannot be changed once it has transactions.
   - Deleting a category that has transactions or bills requires choosing another category of the same type to move them to.
3. **Views:** all views work on calendar months (Rule 14).
   - **Transaction list:** filter by date range and category, search by note or payee.
   - **Monthly summary:** total spent per category for a chosen month.
   - **Income vs expense:** totals for the chosen month and the difference between them.
   - **Charts:**
     - Pie chart of spending by category for the chosen month.
     - Bar chart of total spending per month for the last 6 months.
   - **Month comparison:** spending per category, chosen month against the month before, over the **same date range**. If today is 10 November, it compares 1–10 November with 1–10 October. Past months are compared in full. If the earlier month is shorter, its range stops at its last day.
4. **Savings goals:** see Rule 6.
5. **Recurring bills and subscriptions:** see Rule 7.
6. **Lending and borrowing:** see Rule 8.

**Priority:** Items 1–3 (expense tracking) are built first. Items 4–6 are built only after expense tracking works end to end (Rule 15).

## Rule 6: Savings goals

**A goal has:**

| Field          | Required | Default        |
| -------------- | -------- | -------------- |
| Name           | Yes      | —              |
| Target amount  | Yes      | —              |
| Deadline       | No       | None           |
| Icon (emoji)   | No       | 🎯             |

**Contributions:**

- I add money to a goal manually (e.g. "added ₹2,000 today"). Each contribution has an amount and a date, with the same validation as transactions (Rule 4).
- Contributions are tracked only inside the goal. They do **not** create transactions and do **not** appear in spending views.
- Withdrawals from a goal are **not** allowed.
- I can edit or delete a contribution to fix mistakes.

**Progress:** Each goal shows the amount saved, the amount remaining and the percentage reached. If it has a deadline, it also shows the time left.

**Statuses:**

- **Active:** saved amount is below the target.
- **Overdue:** active, and the deadline has passed. It stays open; I can keep contributing or change the deadline.
- **Completed:** saved amount has reached the target. The goal moves to a "Completed" list, where it stays visible.

**Status rules:**

- The contribution that reaches the target may exceed it. Completed goals accept no new contributions.
- If I lower the target to or below the saved amount, the goal becomes completed.
- If editing or deleting contributions brings the saved amount back below the target, the goal becomes active again.
- Deleting a goal deletes it and its contributions permanently, after confirmation.

## Rule 7: Recurring bills and subscriptions

**A bill has:**

| Field         | Required | Default                    |
| ------------- | -------- | -------------------------- |
| Name          | Yes      | —                          |
| Amount        | Yes      | —                          |
| Category      | Yes      | Bills, if it exists        |
| Frequency     | Yes      | Monthly                    |
| Next due date | Yes      | —                          |
| Note          | No       | Empty                      |

If the Bills category has been deleted, I must pick an expense category myself.

**Frequency:** Monthly or every 3 months.

**Due dates:**

- A bill remembers the **day of the month** from its first due date (e.g. the 31st).
- Each next due date is one or three months later, on that same day. If the month is shorter, it falls on the month's last day: a bill due on the 31st is due on 28 or 29 February, then 31 March again.
- The next due date always moves forward from the **due date**, never from the date I paid. Paying late does not shift the schedule.

**Reminders:**

- Reminders appear inside the app only. Push notifications and emails are **not** part of the first version.
- A bill shows as "upcoming" from 3 days before its due date.
- A bill past its due date that hasn't been paid or skipped shows as "overdue".
- "Today" is calculated in my timezone (Rule 9).

**Marking as paid:**

1. I can pay a bill at any time, including early or late.
2. The amount is pre-filled with the bill's amount and can be changed before confirming (for bills that vary, like electricity).
3. On confirming, the app creates an expense transaction with that amount, the bill's category, today's date, and the bill's name as the note.
4. The bill's next due date moves forward by its frequency.

**Other actions:**

- **Skip this cycle:** moves the next due date forward without creating a transaction (e.g. a subscription I didn't use this month).
- **Pause:** a paused bill shows no reminders and never becomes overdue. When I resume it, I choose its next due date.
- **Delete:** deletes the bill permanently, after confirmation. Its past payment transactions are kept and become regular transactions I can edit directly.

**History and undo:**

- Each bill shows a history of its cycles: each due date, whether it was paid or skipped, and the amount paid.
- I can **undo the most recent cycle only**. Undoing a payment permanently removes its transaction and moves the next due date back. Undoing a skip moves the next due date back.

## Rule 8: Lending and borrowing

**A record has:**

| Field     | Required | Default |
| --------- | -------- | ------- |
| Person    | Yes      | —       |
| Direction | Yes      | I lent  |
| Amount    | Yes      | —       |
| Date      | Yes      | Today   |
| Due date  | No       | None    |
| Note      | No       | Empty   |

Direction is either **I lent** (they owe me) or **I borrowed** (I owe them). The person field suggests names I've used before.

**Repayments:**

- Partial repayments are allowed. Each repayment has an amount and a date.
- A repayment cannot be larger than the amount remaining.
- A record shows the original amount, the total repaid and the amount remaining.
- When the remaining amount reaches zero, the record is marked settled. If editing a repayment brings it back above zero, it becomes open again.
- A record with a due date that is past and not settled shows as "overdue".

**Effect on income and expenses:** Every money movement creates a transaction in a built-in **Lending** category, dated on the record's date or the repayment's date:

| Event                         | Transaction created |
| ----------------------------- | ------------------- |
| I lend money                  | Expense             |
| Someone repays me             | Income              |
| I borrow money                | Income              |
| I repay money I borrowed      | Expense             |

The Lending category cannot be renamed or deleted.

**Editing and deleting:**

- Editing a record or repayment updates its linked transaction.
- The original amount cannot be lowered below the total already repaid.
- The direction (lent or borrowed) can be changed only while the record has no repayments.
- Deleting a repayment removes its transaction.
- Deleting a record permanently deletes it, its repayments and all their transactions, after confirmation.

**In spending views:** The monthly summary, income vs expense, charts and month comparison include Lending transactions by default. Each of these views has a toggle to hide them.

**View:** A single list of records, filterable by direction and by open or settled. A per-person summary is **not** part of the first version.

## Rule 9: Data model

### General rules

- **Money** is stored as an integer number of the smallest unit (paise), never as a floating-point number. ₹125.50 is stored as `12550`.
- **Amounts:** every amount (transactions, bills, goal targets, contributions, lending records, repayments) follows Rule 4's amount validation: greater than 0, at most 2 decimal places, at most ₹1,00,00,000. The **opening balance** is the one exception: it can be zero or negative (e.g. starting in debt), down to −₹1,00,00,000.
- **Dates of money events** (transactions, contributions, lending records, repayments, the opening balance date) can't be in the future.
- **Due dates and deadlines** can be in the future, with these limits:
  - A bill's next due date can be any date; if it's already past, the bill shows as overdue.
  - A lending record's due date can't be before the record's own date.
  - A goal's deadline can't be in the past at the moment I set or change it.
- **Text limits:**

  | Field                     | Length        |
  | ------------------------- | ------------- |
  | Category name             | 1–40          |
  | Bill name, goal name      | 1–60          |
  | Person (lending)          | 1–60          |
  | Payee                     | up to 100     |
  | Note                      | up to 500     |

  Leading and trailing spaces are trimmed before checking.
- **Currency:** Every amount is stored with a currency code. The first version only supports `INR`. Contributions, repayments and bill cycles use the currency of the goal, record or bill they belong to.
- **Dates:** Transaction, contribution, repayment and due dates are calendar dates (no time of day), in the user's timezone. This keeps a late-night expense in the correct day and month.
- **Timezone:** Each user has a timezone (default `Asia/Kolkata`). The server uses it to decide what "today" is, for date defaults, upcoming and overdue bills, and overdue goals and lending. Changing my timezone only changes what "today" is from then on; dates already saved never change.
- **Ownership:** Every record belongs to exactly one user (Rule 2).
- **Editing on two devices:** if a record was changed on another device after I opened it, my save or delete is rejected with "This was changed on another device" and a **Reload** option. An edit is never silently overwritten.
- **Timestamps:** Every record has `createdAt` and `updatedAt`.

### Entities

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

> balance = opening balance + income − expenses, counting only transactions dated on or after the opening balance date

- The opening balance and its date are set at signup (Rule 13) and can be edited later.
- Transactions dated before the opening balance date still appear in every view, but not in the balance.
- The balance can be negative.
- Trashed transactions do not count.
- Savings goal contributions do not change the balance (Rule 6), so the balance includes money set aside for goals.

### Counting money

Every screen counts money the same way. These definitions are the single source; Home, Reports, the transaction list and the balance all use them.

| Figure                       | Counts                                                                 |
| ---------------------------- | ---------------------------------------------------------------------- |
| **Spent** (a day, a month)   | expense transactions dated in that period, including bill payments and Lending expenses (money I lent or repaid) |
| **Income** (a month)         | income transactions dated in that period, including Lending income (money I borrowed or was repaid) |
| **Left over** (a month)      | income − spent; can be negative                                       |
| **Top categories**           | categories ranked by spent; Lending can appear like any other         |
| **Balance**                  | Rule 9's formula: every transaction on or after the opening balance date, including Lending |

- **Always excluded:** trashed transactions and savings goal contributions.
- **Transactions before the opening balance date** count in day and month figures, but not in the balance.
- **The Lending toggle** exists only in Reports (Rule 8). When off, Reports' spent, income, left over, categories and charts leave out Lending transactions. The balance, Home and the transaction list always include them.
- **Month comparison** uses the same "spent" definition, over the date ranges in Rule 5.
- **Percentages** (a category's share of spending) are rounded to whole numbers, so they may not add up to exactly 100%.

### Deleting

- Deleting a manual transaction moves it to a **Trash** (it sets `deletedAt`). Trashed transactions don't appear in any view or total.
- From the Trash, I can restore a transaction or delete it permanently.
- Transactions in the Trash for more than 30 days are deleted permanently.
- Goals, bills and lending records have no Trash. Deleting them is permanent and always asks for confirmation.

## Rule 10: Storage, backup and privacy

**Storage:** All data is stored in a cloud database, so it syncs across my devices (Rule 2).

**Hosting cost:** The app server runs on a paid managed platform, at most ₹500/month. Everything else (database, Google sign-in) uses free tiers.

**Backups:**

- Server-side backups rely on whatever the hosting provider offers automatically. Free database tiers may offer none (check MongoDB Atlas's current free-tier limits), so the JSON download is treated as the real backup.
- The app has a **Download backup** button that downloads all my data as one JSON file.
- The file includes a format version number and the export date, so a restore feature can be added later.
- If I haven't downloaded a backup in 30 days, the Home screen shows a reminder.
- Restoring from a backup file is **not** part of the first version. CSV export is **not** part of the first version.

**Privacy and security:**

- All traffic uses HTTPS.
- Access rules are enforced on the server: a user can only read or change their own data, whatever the client sends.
- Sessions are stored in `httpOnly`, `Secure`, `SameSite` cookies, never in `localStorage`. A session expires after 30 days without use; using the app keeps it alive.
- I can **log out of all devices**, which ends every session.
- The API is rate limited per user and per IP address.
- No third-party analytics or tracking.

**Account deletion:** I can delete my account. This permanently deletes the account and all its data, after I confirm by typing a confirmation phrase.

## Rule 11: Tech stack

Learning is part of the goal, so I build the backend myself rather than using a backend-as-a-service.

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

- Money is stored as integers in paise (Rule 9).
- Actions that write more than one record (paying, skipping or undoing a bill cycle, recording or changing a lending record or repayment, reassigning a category) must succeed or fail as a whole, using database transactions.
- The API checks on every request that the data belongs to the logged-in user (Rule 10).
- The frontend and the API must be served from the **same site**. Otherwise browsers treat the session cookie as a third-party cookie and may block it.
- The server must stay always on. A host that sleeps when idle is ruled out, because a slow first load breaks the 5-second rule (Rule 4).

## Rule 12: Screens and navigation

**Navigation:** a bottom tab bar on phones and a sidebar on laptops, with these sections:

1. **Home**
2. **Transactions**
3. **Reports**
4. **Plan:** Bills, Goals and Lending, as three tabs
5. **Settings**

The **Add** button (Rule 4) is a floating button on phones and a button in the top bar on laptops, visible on every screen.

**Home:**

- Overall balance (Rule 9)
- This month's spending and income; this month's spending is the most prominent number on the screen
- Top 3 spending categories this month
- The 5 most recent transactions, with "See all"
- Upcoming and overdue bills
- Overdue lending records
- Backup reminder, when due (Rule 10)

**Transactions:** the transaction list (Rule 5), grouped by date with a daily total, plus a link to the Trash.

**Reports:** a month picker, the monthly summary, income vs expense, charts and month comparison (Rule 5), with the Lending toggle (Rule 8).

**Plan:** the bills (Rule 7), goals (Rule 6) and lending (Rule 8) lists, each with its own add button.

**Settings:** categories, opening balance and date, timezone, theme (follow device, light or dark; remembered per device), download backup, log out, log out of all devices, delete account.

## Rule 13: Signup flow

1. I sign in with Google.
2. On first sign-in, my account is created with the default categories (Rule 5), the built-in Lending category, and the timezone `Asia/Kolkata`.
3. The welcome screen shows the timezone detected from my device (I can change it) and asks for an opening balance (default ₹0) and its date (default today).
4. **Continue** saves all three. **Skip** saves only the timezone; I can set the opening balance later in Settings.
5. I land on the Home screen. The welcome screen never appears again.

## Rule 14: Formatting and calendar

- **Money** is shown with the ₹ symbol and Indian digit grouping: ₹1,00,000. Paise are shown only when non-zero: ₹1,250 and ₹1,250.50.
- **Negative figures** (only the balance, the opening balance and "left over" can be negative) are shown with a minus sign, in the normal text colour, never red: −₹2,000. Expenses are never shown with a minus sign; they are positive amounts of a different type.
- **Signs:** income amounts get a `+` (in the income colour). "Left over" is a difference, so it gets `+` when positive and `−` when negative, both in the normal text colour. Every other figure (expenses, totals, the balance when positive) has no sign.
- **Dates** are shown as `10 Nov 2026` in lists and `10/11/2026` (DD/MM/YYYY) in forms.
- **Month** means the calendar month, from the 1st to the last day, in my timezone.
- The app's language is English.

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

**API tests are required for:**

- **Data isolation:** for every endpoint, one user can never read or change another user's data (Rule 10).
- Multi-record actions roll back completely when one step fails (Rule 11).
- Stale edits are rejected (Rule 9).

**End-to-end browser tests are required for the critical flows**, on a phone-sized and a laptop-sized screen:

- Adding, editing and deleting an expense (Rule 4)
- Paying a bill (Rule 7)

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

## Glossary

One word per idea, used the same way in the docs, the code, the API and the UI.

| Term | Meaning |
| --- | --- |
| **Transaction** | One expense or income entry. The only thing that affects totals. |
| **Manual transaction** | A transaction I entered myself. The only kind I can edit or trash directly. |
| **Category** | A label on a transaction, with an emoji and a type (expense or income). |
| **Lending (category)** | The built-in category for transactions created by lending records. |
| **Bill** | A recurring payment I want to be reminded about. |
| **Bill cycle** | One due date of a bill, closed by paying or skipping it. |
| **Lending record** | Money I lent to or borrowed from one person, once. |
| **Repayment** | A partial or full payment back on a lending record. |
| **Settled** | A lending record with nothing remaining. |
| **Goal** | A savings target. |
| **Contribution** | Money I put toward a goal. It's not a transaction. |
| **Opening balance** | My starting balance, on a date I choose. |
| **Balance** | Opening balance plus income minus spent, from the opening balance date (Rule 9). |
| **Spent / Income / Left over** | The month figures defined in Rule 9, Counting money. |
| **Trash** | Where deleted manual transactions wait 30 days before being removed for good. |
| **Calendar date** | A date with no time of day, stored as `YYYY-MM-DD`. |
| **Paise** | The unit every amount is stored in; ₹1 = 100 paise. |
| **Version** | A record's change counter, used to reject stale edits (Rule 9). |
| **Idempotency key** | A one-time id a form sends with a create, so retrying never creates a duplicate. |
