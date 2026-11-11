# Money Manager — UI and UX

This document describes how the app **looks, feels and behaves** for the person using it. `SPEC.md` defines what the app does and `DESIGN.md` how it's built; when this document conflicts with the spec, the spec wins and this document is updated.

## 1. Design principles

Every screen, component and animation is checked against these principles. When two of them conflict, the one higher in the list wins.

### 1.1 Fast first

Adding an expense in under 5 seconds (Spec Rule 4) beats every other concern, including looks. Nothing decorative may slow down the Add flow: no blocking animations, no extra taps, no splash screens.

### 1.2 Numbers first

Amounts are the most important thing on any screen.

- An amount is always the largest, clearest text in its area.
- Amounts use **tabular figures**, so digits line up in lists and columns.
- Amounts are never truncated. If space runs out, the label next to the amount shrinks, not the amount.

### 1.3 Friendly, not childish

The app has a warm, playful personality, in the spirit of Monzo and Notion:

- Rounded shapes, soft colours and generous corner radius.
- Every category has an **emoji icon** (e.g. 🍔 Food, 🚌 Transport), chosen by me and changeable.
- Copy is warm and plain, never jargon (Section 9).
- **Small celebrations for good moments**: completing a savings goal, settling a lending record, paying a bill on time. Never for spending.

### 1.4 Calm about money

Money is stressful; the app is not.

- Facts are shown neutrally. Spending a lot is shown as a number, not as a warning.
- **Expenses** use normal text colour with no sign. **Income** is green with a `+` sign.
- **Negative figures** (a negative balance or "left over") use normal text colour with a minus sign (−₹2,000), never red (Spec Rule 14).
- Red is used **only** for things that are actually overdue (bills, lending records, goal deadlines), for delete actions, and for form error messages. Never for spending amounts or negative figures.
- The app never shames, scolds or judges.

### 1.5 Comfortable and one-handed

In the spirit of Apple Wallet and Material You:

- Comfortable density: fewer items per screen, generous spacing, large touch targets (at least 44×44px).
- On phones, the main actions sit in the bottom half of the screen, within thumb reach. The Add button, sheet actions and Save buttons are at the bottom.
- One clear focus per screen; secondary details are one tap away, not crammed in.

### 1.6 Consistent

The same thing always works the same way:

- Creating and editing always happens in a sheet (phone) or dialog (laptop).
- Destructive actions always ask for confirmation, or offer Undo when the action can be undone.
- The same component is used for the same job everywhere (one `MoneyInput`, one `CategoryPicker`, one empty-state pattern).

### 1.7 Accessible by default

A practical accessibility baseline (Section 8) is part of every screen from the start, not a later improvement. There is no formal WCAG target or audit in the first version.

## 2. User flows

Each flow lists the steps on a phone. Laptop flows are the same, with dialogs instead of sheets and mouse/keyboard instead of touch.

### 2.1 Add an expense (the most important flow)

1. Tap **Add** (floating button, bottom right). The Add sheet slides up.
2. The amount field is focused with the number keypad open. Type the amount.
3. Tap a category tile in the grid below the amount.
4. Tap **Save**.
5. The sheet closes; a toast shows "Expense saved · Undo".

**Taps:** Add, category, Save. Two taps after typing the amount, within Spec Rule 4's limit of three.

**Details:**

- At the top of the sheet, a segmented control switches **Expense | Income**. Expense is selected by default.
- The category grid shows emoji tiles, 4 per row, recently used first (Spec Rule 4). Only categories of the selected type appear.
- **Save** is disabled until the amount is valid and a category is selected. Pressing Enter on the keypad saves too, once a category is selected.
- **More** expands payee, note and date (default today). Most saves never open it.
- **Undo** in the toast moves the new transaction to the Trash.

### 2.2 Edit or delete a transaction

1. Tap a row in the transaction list. The edit sheet opens, prefilled.
2. Change fields and tap **Save**, or tap **Delete**.
3. Deleting closes the sheet and shows "Moved to Trash · Undo".

**Shortcuts:**

- **Touch:** swipe a row left to reveal **Delete**; a full swipe deletes immediately. Both show the same Undo toast.
- **Mouse:** hovering a row shows a **⋯** menu with Edit and Delete.
- Every shortcut is also reachable without gestures (through the edit sheet), for keyboard and screen reader users.

**Bill and lending transactions** can't be swiped. Tapping one opens a read-only sheet with a link to its bill or lending record (Spec Rule 9).

### 2.3 First run

1. **Sign in with Google** on `/sign-in`.
2. **Welcome** screen: "Hi Save", the detected timezone (changeable), opening balance (default ₹0) and its date. **Continue** or **Skip** (Spec Rule 13).
3. **Home** with a friendly empty state: an illustration, "Let's track your first expense", and a large **Add your first expense** button that opens the Add sheet.
4. After the first transaction, Home shows its normal content.

### 2.4 Pay a bill

1. On Home, the **Bills due** card lists upcoming and overdue bills. Tap **Pay** on one.
2. A dialog shows the amount, prefilled and editable (Spec Rule 7).
3. Tap **Pay bill**.
4. Toast: "Electricity paid · Undo". If it was paid on or before its due date, the small celebration plays (Section 6.4).

**Undo** undoes the cycle (Spec Rule 7, History and undo).

### 2.5 Record a repayment

1. **Plan → Lending**, tap a record.
2. Tap **Add repayment**. The amount defaults to the remaining amount.
3. Change it for a partial repayment, then tap **Save**.
4. If the record is now settled: a celebration and "All settled with Rahul".

### 2.6 Add money to a goal

1. **Plan → Goals**, tap a goal.
2. Tap **Add money**, type the amount, tap **Save**.
3. The progress bar animates to the new value. If the goal is now complete: a celebration and "Goa trip complete!"; the goal moves to Completed.

### 2.7 Check this month's spending

1. On Home, tap the top card (balance and **Spent in November**).
2. Reports opens for the current month (Spec Rule 12).

## 3. Wireframes

Low-fidelity layouts: they fix **what goes where**, not colours or exact sizes (Section 4). Phone sketches are about 375px wide. Cards that have nothing to show (e.g. no overdue bills) are hidden, not shown empty.

### 3.1 Home (phone)

```text
┌────────────────────────────────────┐
│ Hi Save                            │
│                                    │
│ ┌────────────────────────────────┐ │
│ │ Balance          ₹42,300       │ │  small line
│ │                                │ │
│ │ Spent in November              │ │
│ │ ₹18,450                        │ │  ← biggest number on screen
│ │ Income +₹55,000                │ │
│ └────────────────────────────────┘ │
│                                    │
│ Top categories                     │
│ ┌────────────────────────────────┐ │
│ │ 🍔 Food            ₹6,200  34% │ │
│ │ 🏠 Rent            ₹5,000  27% │ │
│ │ 🚌 Transport       ₹2,100  11% │ │
│ └────────────────────────────────┘ │
│                                    │
│ Recent                     See all │
│ ┌────────────────────────────────┐ │
│ │ 🍔 Swiggy      Today     ₹350  │ │
│ │ 💼 Salary      1 Nov  +₹55,000 │ │
│ │ …                              │ │
│ └────────────────────────────────┘ │
│                                    │
│ Bills due                          │
│ ┌────────────────────────────────┐ │
│ │ 🧾 Electricity  in 2 days [Pay]│ │
│ │ 🧾 Internet     overdue   [Pay]│ │  overdue in alert colour
│ └────────────────────────────────┘ │
│                                    │
│ Overdue lending                    │
│ ┌────────────────────────────────┐ │
│ │ 🤝 Rahul owes you      ₹2,000  │ │
│ └────────────────────────────────┘ │
│                                    │
│ ┌────────────────────────────────┐ │
│ │ ⤓ Time for a backup  [Download]│ │
│ └────────────────────────────────┘ │
│                               (＋) │  floating Add button
├────────────────────────────────────┤
│  Home   Txns   Reports  Plan   ⚙︎  │  bottom tab bar
└────────────────────────────────────┘
```

Tapping the top card opens Reports for this month (flow 2.7). Settings is reached from the tab bar, so Home has no separate settings button.

**Tab bar labels** are the full section names: Home, Transactions, Reports, Plan, Settings, each with a Lucide icon. The sketches shorten "Transactions" to "Txns" only to fit the text width.

### 3.2 Add sheet (phone)

```text
┌────────────────────────────────────┐
│              ───                   │  drag handle
│     [ Expense | Income ]           │
│                                    │
│            ₹ 350                   │  large, focused
│                                    │
│  ┌──────┐┌──────┐┌──────┐┌──────┐  │
│  │  🍔  ││  🚌  ││  🛍️  ││  🏠  │  │  recent first
│  │ Food ││Trans…││ Shop…││ Rent │  │
│  └──────┘└──────┘└──────┘└──────┘  │
│  ┌──────┐┌──────┐┌──────┐┌──────┐  │
│  │  🧾  ││  💊  ││  🎬  ││  📦  │  │
│  │Bills ││Health││Ente… ││Other │  │
│  └──────┘└──────┘└──────┘└──────┘  │
│                                    │
│  More: payee, note, date        ⌄  │
│                                    │
│  ┌──────────────────────────────┐  │
│  │            Save              │  │  disabled until valid
│  └──────────────────────────────┘  │
├────────────────────────────────────┤
│        number keypad               │
└────────────────────────────────────┘
```

### 3.3 Transactions (phone)

```text
┌────────────────────────────────────┐
│ Transactions            🔍  ⚲  ⋯   │  search, filters, menu (Trash)
│ [This month ▾] [All categories ▾]  │  active filters as chips
│                                    │
│ Today                      ₹1,250  │  daily spending total
│ ┌────────────────────────────────┐ │
│ │ 🍔 Swiggy               ₹350   │ │  ← swipe left: Delete
│ │ 🛍️ Amazon               ₹900   │ │
│ └────────────────────────────────┘ │
│ Yesterday                  ₹1,920  │
│ ┌────────────────────────────────┐ │
│ │ 🚌 Uber                 ₹120   │ │
│ │ 🧾 Electricity  [Bill]  ₹1,800 │ │  badge, not swipeable
│ └────────────────────────────────┘ │
│ …                    loads more ⟳  │
│                               (＋) │
├────────────────────────────────────┤
│  Home   Txns   Reports  Plan   ⚙︎  │
└────────────────────────────────────┘
```

Trash is reached from the **⋯** menu in the header.

### 3.4 Reports (phone)

```text
┌────────────────────────────────────┐
│ Reports        ‹ November 2026 ›   │  month picker
│                    Lending [on ●]  │  toggle
│                                    │
│ ┌────────────────────────────────┐ │
│ │ Spent ₹18,450   Income ₹55,000 │ │
│ │ Left over          +₹36,550    │ │
│ └────────────────────────────────┘ │
│                                    │
│          ◔ pie chart               │
│                                    │
│ By category                        │
│ 🍔 Food     ₹6,200  34%  ▲ ₹400   │  vs same days last month
│ 🏠 Rent     ₹5,000  27%  ─         │
│ 🚌 Transport ₹2,100 11%  ▼ ₹300   │
│ …                                  │
│                                    │
│ Last 6 months                      │
│   ▁ ▃ ▅ ▂ ▆ ▄   bar chart          │
│  Jun … Nov                         │
├────────────────────────────────────┤
│  Home   Txns   Reports  Plan   ⚙︎  │
└────────────────────────────────────┘
```

Comparison arrows are neutral grey: more spending is not shown as bad (Section 1.4).

The month picker's ‹ and › stop at the earliest month with data and at the current month (Spec Rule 5); at either end that arrow is disabled. Charts and numbers follow Section 4.10.

### 3.5 Plan (phone)

```text
┌────────────────────────────────────┐
│ Plan                               │
│ [ Bills | Goals | Lending ]        │  tabs
│                                    │
│ Bills tab:                ＋ New   │
│ ┌────────────────────────────────┐ │
│ │ 🧾 Internet  overdue    ₹999   │ │
│ │ 🧾 Electricity 12 Nov  ₹1,800  │ │
│ │ 🧾 Netflix   20 Nov      ₹649  │ │
│ │ 🧾 Insurance paused    ₹2,400  │ │  muted
│ └────────────────────────────────┘ │
│                                    │
│ Goals tab:                         │
│ ┌────────────────────────────────┐ │
│ │ 🏖️ Goa trip                    │ │
│ │ ███████░░░  ₹14,000 of ₹20,000 │ │
│ │ ₹6,000 to go · 45 days left    │ │
│ └────────────────────────────────┘ │
│                                    │
│ Lending tab:                       │
│ [Lent | Borrowed]  [Open | Settled]│
│ ┌────────────────────────────────┐ │
│ │ 🤝 Rahul owes you   ₹2,000     │ │
│ │ ██████░░░░  ₹3,000 of ₹5,000   │ │
│ └────────────────────────────────┘ │
│                               (＋) │  always adds a transaction
├────────────────────────────────────┤
│  Home   Txns   Reports  Plan   ⚙︎  │
└────────────────────────────────────┘
```

The floating button **always** adds a transaction, on every screen including Plan (Spec Rule 4). Each Plan tab has its own **＋ New** button in its header for adding a bill, goal or lending record.

### 3.6 Detail screens (phone)

Bill, goal and lending details share one layout:

```text
┌────────────────────────────────────┐
│ ‹ Back                  Edit  ⋯   │  ⋯: Pause, Delete
│                                    │
│ 🧾 Electricity                     │
│ ₹1,800 · monthly · next 12 Nov     │
│                                    │
│ ┌────────────┐ ┌────────────┐      │
│ │    Pay     │ │    Skip    │      │  main actions
│ └────────────┘ └────────────┘      │
│                                    │
│ History                    Undo    │  undo latest only
│ 12 Oct   Paid     ₹1,750           │
│ 12 Sep   Skipped                   │
│ …                                  │
└────────────────────────────────────┘
```

### 3.7 Settings (phone)

```text
┌────────────────────────────────────┐
│ Settings                           │
│                                    │
│ Money                              │
│   Opening balance    ₹10,000  ›    │
│   Categories                  ›    │
│ App                                │
│   Theme          Follow device ›   │
│   Timezone       Asia/Kolkata  ›   │
│ Data                               │
│   Download backup             ⤓    │
│ Account                            │
│   Log out                          │
│   Log out of all devices           │
│ Danger zone                        │
│   Delete account                   │  alert colour
│                                    │
│          Version 0.3.0             │  caption, text-muted
└────────────────────────────────────┘
```

### 3.8 Laptop layout

```text
┌──────────────┬──────────────────────────────────────────────────┐
│ Money Manager│  Hi Save                            [＋ Add]      │
│              │                                                  │
│ ⌂ Home       │  ┌──────────────────────┐ ┌──────────────────────┐│
│ ☰ Txns       │  │ Balance ₹42,300      │ │ Bills due            ││
│ ◔ Reports    │  │ Spent in November    │ │ Electricity  [Pay]   ││
│ ◫ Plan       │  │ ₹18,450              │ │ Internet     [Pay]   ││
│ ⚙︎ Settings   │  └──────────────────────┘ └──────────────────────┘│
│              │  ┌──────────────────────┐ ┌──────────────────────┐│
│              │  │ Top categories       │ │ Recent               ││
│              │  │ …                    │ │ …                    ││
│              │  └──────────────────────┘ └──────────────────────┘│
└──────────────┴──────────────────────────────────────────────────┘
```

This is the wide layout (`lg` and up, Section 4.8): a sidebar instead of tabs, the Add button in the top bar, and cards in two columns. Transactions becomes a table with columns for date, category, payee, note and amount. Between `md` and `lg` (tablets, small laptop windows) the sidebar is used with the phone's single-column cards and list.

### 3.9 Sign-in and welcome (phone)

```text
┌────────────────────────────────────┐   ┌────────────────────────────────────┐
│                                    │   │ Hi Save                            │
│            [app icon]              │   │ Let's set up your starting point.  │
│          Money Manager             │   │                                    │
│                                    │   │ Opening balance                    │
│   Know exactly where your          │   │ ┌────────────────────────────────┐ │
│   money goes.                      │   │ │ ₹ 0                            │ │
│                                    │   │ └────────────────────────────────┘ │
│        [ illustration ]            │   │ As of                              │
│                                    │   │ [Today] [Yesterday] [Pick a date]  │
│                                    │   │                                    │
│ ┌────────────────────────────────┐ │   │ Timezone: Asia/Kolkata    [Change] │
│ │  G  Continue with Google       │ │   │                                    │
│ └────────────────────────────────┘ │   │ ┌────────────────────────────────┐ │
│                                    │   │ │           Continue             │ │
│                                    │   │ └────────────────────────────────┘ │
│                                    │   │            Skip for now            │
└────────────────────────────────────┘   └────────────────────────────────────┘
          Sign-in                                     Welcome
```

### 3.10 Bill form (sheet)

```text
┌────────────────────────────────────┐
│              ───                   │
│ New bill                           │
│ Name          [ Electricity      ] │
│ Amount        [ ₹ 1,800          ] │
│ Category      [ 🧾 Bills       ▾ ] │  expense categories only
│ Repeats       [ Monthly | 3 months]│
│ Next due      [ 12 Nov 2026     📅]│
│ Note          [                  ] │
│ ┌────────────────────────────────┐ │
│ │             Save               │ │
│ └────────────────────────────────┘ │
└────────────────────────────────────┘
```

### 3.11 Goal form (sheet)

```text
┌────────────────────────────────────┐
│              ───                   │
│ New goal                           │
│ Icon          [ 🏖️ ]  tap to pick  │
│ Name          [ Goa trip         ] │
│ Target        [ ₹ 20,000         ] │
│ Deadline      [ optional        📅]│
│ ┌────────────────────────────────┐ │
│ │             Save               │ │
│ └────────────────────────────────┘ │
└────────────────────────────────────┘
```

### 3.12 Lending form (sheet)

```text
┌────────────────────────────────────┐
│              ───                   │
│ New lending record                 │
│ [ I lent | I borrowed ]            │
│ Person        [ Rahul            ] │  autocomplete
│ Amount        [ ₹ 5,000          ] │
│ Date          [Today] [Yesterday]  │
│ Due date      [ optional        📅]│
│ Note          [                  ] │
│ ┌────────────────────────────────┐ │
│ │             Save               │ │
│ └────────────────────────────────┘ │
└────────────────────────────────────┘
```

### 3.13 Trash (phone)

```text
┌────────────────────────────────────┐
│ ‹ Transactions        Trash        │
│ Items are deleted for good after   │
│ 30 days.                           │
│ ┌────────────────────────────────┐ │
│ │ 🍔 Swiggy      ₹350            │ │
│ │ Deleted today · 30 days left   │ │
│ │          [Restore] [Delete]    │ │  Delete asks to confirm
│ └────────────────────────────────┘ │
│ ┌────────────────────────────────┐ │
│ │ 🚌 Uber        ₹120            │ │
│ │ Deleted 3 Nov · 22 days left   │ │
│ │          [Restore] [Delete]    │ │
│ └────────────────────────────────┘ │
└────────────────────────────────────┘
```

### 3.14 Category settings (phone)

```text
┌────────────────────────────────────┐
│ ‹ Settings        Categories  ＋   │
│ Expense                            │
│ ┌────────────────────────────────┐ │
│ │ 🍔 Food                     ›  │ │  tap: rename, emoji, delete
│ │ 🚌 Transport                ›  │ │
│ │ …                              │ │
│ └────────────────────────────────┘ │
│ Income                             │
│ ┌────────────────────────────────┐ │
│ │ 💼 Salary                   ›  │ │
│ │ 💰 Other income             ›  │ │
│ └────────────────────────────────┘ │
│ Built-in                           │
│ ┌────────────────────────────────┐ │
│ │ 🤝 Lending           🔒         │ │  can't be edited
│ └────────────────────────────────┘ │
└────────────────────────────────────┘
```

### 3.15 Stale edit

When a save or delete is rejected because the record changed on another device (Spec Rule 9):

```text
┌────────────────────────────────────┐
│ This was changed on another device │
│ Reload to see the latest version.  │
│                          [Reload]  │
└────────────────────────────────────┘
```

Shown as an error toast that stays until dismissed. The form keeps what I typed until I reload, so I can copy anything I need.

## 4. Design tokens

Tokens are the only source of colours, sizes and shapes. They are defined once as CSS variables in the shadcn/ui theme (`apps/web/src/index.css`) and used through Tailwind classes. **Components never hard-code a hex value, pixel size or shadow.**

### 4.1 Colour

Semantic tokens: components use the meaning (`income`, `alert`), never the raw colour.

| Token              | Light     | Dark      | Used for                                         |
| ------------------ | --------- | --------- | ------------------------------------------------ |
| `background`       | `#FAF9FC` | `#17171C` | app background                                   |
| `surface`          | `#FFFFFF` | `#1F1F26` | cards, sheets, dialogs                           |
| `surface-muted`    | `#F3F1F8` | `#27272F` | inputs, unselected tiles, table stripes          |
| `border`           | `#E7E4EE` | `#33323C` | card and input borders, dividers                 |
| `text`             | `#1C1A22` | `#F4F3F7` | main text, **expense amounts**                   |
| `text-muted`       | `#6B6878` | `#A09DAD` | labels, dates, secondary text                    |
| `primary`          | `#7C3AED` | `#A78BFA` | main buttons, active tab, links, focus ring      |
| `primary-foreground` | `#FFFFFF` | `#1C1A22` | text on `primary`                              |
| `primary-soft`     | `#EDE9FE` | `#2E2547` | selected tile, "upcoming" badge, progress track  |
| `income`           | `#15803D` | `#4ADE80` | **income amounts only**, with a `+` sign         |
| `alert`            | `#DC2626` | `#F87171` | **overdue items**, delete actions, form error messages |
| `alert-soft`       | `#FEF2F2` | `#3A1F22` | background of overdue badges                     |

**Rules (Section 1.4):**

- Expense amounts use `text`. They are never red.
- `income` is used only for income amounts.
- `alert` is used only for overdue items, delete actions (Delete, Delete account) and form error messages.
- Negative figures (a negative balance or "left over") use `text` with a minus sign, never `alert` (Spec Rule 14).
- "Upcoming" is not a problem, so it uses `primary-soft`, not `alert`.

**Chart palette** (categories in charts, in this order): violet `#8B5CF6`, teal `#14B8A6`, amber `#F59E0B`, pink `#EC4899`, sky `#0EA5E9`, lime `#84CC16`, orange `#F97316`, slate `#64748B`. Red and green are deliberately left out so charts never look like "bad" and "good" money. Categories beyond the 8 largest are grouped into one slice called "Everything else" in the pie chart (not "Other", which is a real default category). The category list below the chart always shows every category.

**Contrast:** every text token meets WCAG AA (4.5:1) on `background` and `surface` in both themes; verified with a contrast checker when the theme is built (Section 8).

### 4.2 Typography

- **Font:** Inter (variable), self-hosted with `@fontsource-variable/inter`. Not loaded from Google Fonts, so no third-party requests (Spec Rule 10).
- **Amounts** always use tabular figures (Tailwind `tabular-nums`), so digits line up (Section 1.2).
- Sizes are in `rem`, so the app respects the device's text size setting.

| Style      | Size / line height | Weight   | Used for                                  |
| ---------- | ------------------ | -------- | ----------------------------------------- |
| `amount-xl`| 48 / 56            | Semibold | the amount being typed in the Add sheet   |
| `display`  | 40 / 44            | Semibold | the hero number on Home                   |
| `title`    | 24 / 32            | Semibold | screen titles                             |
| `heading`  | 18 / 26            | Semibold | card and section headings                 |
| `body`     | 16 / 24            | Regular  | body text, list rows, **all inputs**      |
| `label`    | 14 / 20            | Medium   | field labels, buttons, tabs               |
| `caption`  | 12 / 16            | Regular  | dates, hints, badges                      |

Inputs are never smaller than 16px; iOS zooms in on smaller inputs.

### 4.3 Spacing and layout

A 4px scale: `1` = 4px, `2` = 8, `3` = 12, `4` = 16, `5` = 20, `6` = 24, `8` = 32, `10` = 40, `12` = 48.

| Use                         | Phone | Laptop |
| --------------------------- | ----- | ------ |
| Screen side padding         | 16    | 24     |
| Card padding                | 16    | 20     |
| Gap between cards           | 16    | 24     |
| Minimum list row height     | 56    | 48     |
| Minimum touch target        | 44×44 | 44×44  |
| Maximum content width       | —     | 1120   |

### 4.4 Shape

| Token          | Radius | Used for                               |
| -------------- | ------ | -------------------------------------- |
| `radius-sm`    | 8px    | chips, badges, small inputs            |
| `radius-md`    | 12px   | buttons, inputs, category tiles        |
| `radius-lg`    | 16px   | cards, dialogs                         |
| `radius-sheet` | 24px   | top corners of bottom sheets           |
| `radius-full`  | pill   | floating Add button, avatars, toggles  |

### 4.5 Elevation

- **Light theme:** cards are flat with a `border` and a very soft shadow. The floating Add button has a larger shadow tinted with `primary`. Sheets and dialogs have the largest shadow over a 40% black backdrop.
- **Dark theme:** no shadows. Higher layers use a lighter surface (`surface` above `background`, `surface-muted` above `surface`).

### 4.6 Icons, emoji and illustrations

- **UI icons:** Lucide, 20px in content and buttons, 24px in navigation, 2px stroke. Icon-only buttons always have an accessible label.
- **Category emoji:** the device's native emoji. They look slightly different on Android, iOS and Windows; that's accepted.
- **Illustrations:** unDraw SVGs, recoloured to `primary`, stored in `apps/web/src/assets/illustrations/` and loaded only on the screens that use them. They're decorative (empty `alt`), always next to text that says the same thing.

Illustrations appear in:

| Where                                   | Message (exact text in Section 9.3)       |
| --------------------------------------- | ----------------------------------------- |
| Sign-in                                 | the sign-in tagline                       |
| Home, first run                         | first run                                 |
| Transactions, empty                     | transactions, empty                       |
| Search or filters with no results       | search, no results                        |
| Bills, Goals, Lending tabs, empty       | one invitation each                       |
| Trash, empty                            | trash, empty                              |
| Page failed to load                     | unexpected error                          |
| Page not found (404)                    | page not found                            |

### 4.7 App icon

- A white **₹** symbol, centred on a `primary` (`#7C3AED`) rounded square, drawn as one SVG (`apps/web/public/icon.svg`).
- The ₹ takes about 60% of the icon's height and sits inside the central safe zone, so Android's maskable crop (circle, squircle) never cuts it.
- Exported from the same SVG: the favicon, the 192px and 512px PWA icons, and a maskable 512px icon with extra padding (DESIGN 8.7).
- It's a placeholder that's good enough to ship; it can be replaced later without code changes.

### 4.8 Breakpoints and layouts

Tailwind's default breakpoints, with exactly three layouts:

| Width                | Layout   | Navigation                         | Content                                                        |
| -------------------- | -------- | ---------------------------------- | -------------------------------------------------------------- |
| below 768px          | Phone    | bottom tab bar, floating Add button | one column of cards; transaction list as rows (UI 3.1–3.7)    |
| 768–1023px (`md`)    | Medium   | sidebar, Add button in the top bar  | one column of cards, centred; transaction list as rows         |
| 1024px and up (`lg`) | Wide     | sidebar, Add button in the top bar  | two columns of cards; transactions as a table (UI 3.8)         |

- Content never grows wider than 1120px (Section 4.3); wider screens add space around it.
- Sheets become centred dialogs from `md` up (Section 5.3, `ResponsiveSheet`).
- Layout depends only on width, never on the device type.
- **Wording used across SPEC.md, DESIGN.md, this document and the issues:** "on phones" means the phone layout (below `md`) and "on laptops" means `md` and up, unless a sentence names the wide layout (`lg`). The exception is **input behaviour**, which follows the input method, not the width: swipe gestures and the number keypad apply to touch input, hover menus to a mouse.

### 4.9 Navigation icons

Lucide icons, the same in the tab bar and the sidebar:

| Section / action | Icon             |
| ---------------- | ---------------- |
| Home             | `house`          |
| Transactions     | `receipt`        |
| Reports          | `chart-pie`      |
| Plan             | `calendar-check` |
| Settings         | `settings`       |
| Add              | `plus`           |

The active section uses `primary` for its icon and label; the others use `text-muted`.

### 4.10 Charts and numbers in charts

- **Axis labels** use a compact Indian format, with at most one decimal and no trailing `.0`: ₹950, ₹18.5K, ₹1.2L (lakh), ₹1.5Cr (crore). Produced by `formatRupeesCompact` in `packages/shared/src/money.ts`.
- **Tooltips, labels next to slices and the category list** always use the full format from Spec Rule 14 (₹18,450).
- **Month labels** on the bar chart: `Nov`; when the 6 months span two years, `Nov '26`.
- **Pie chart:** slices in the chart palette order (Section 4.1), largest first; the category list next to it is the accessible text version (Section 8).
- **Bar chart:** one bar per month in `primary`; the current month is drawn the same as the others, never highlighted as "good" or "bad".
- **Dark theme:** the same palette, except slate becomes `#94A3B8` so it stays visible; every slice and bar keeps at least 3:1 contrast with `surface`, checked when the theme is built.
- **Empty data:** a chart with nothing to show is replaced by its `EmptyState`, never drawn as an empty circle or blank axes.

### 4.11 App identity

| Item | Value |
| --- | --- |
| Name | **Money Manager** (a working name; Spec Rule 1) |
| Short name | **MoneyMgr**, under the icon on a phone's home screen |
| Tagline | "Know exactly where your money goes." (Section 9.3) |
| App icon | Section 4.7 |
| Browser tab title | the page first, then the app: `Reports · Money Manager`, `Electricity · Money Manager` for a detail screen; Home is just `Money Manager` |
| Browser and status bar colour | matches the app background: `#FAF9FC` in light, `#17171C` in dark (Section 4.1). It follows the theme chosen in Settings, not only the device's setting |
| Splash screen (installed app) | the app icon on the light background colour, generated from the manifest; nothing extra |
| Version | shown at the bottom of Settings as "Version 0.3.0", from the release version (DESIGN 10.7) |

If the name changes, every row here, the manifest and the Google consent screen (DESIGN 7.5) change together.

## 5. Components and their states

All components live in `apps/web/src/components/` and are built on shadcn/ui (DESIGN 8.2). A screen never re-implements something a component below already does.

### 5.1 Screen states

Every screen and card that loads data handles all of these:

| State          | Shown as                                                                 |
| -------------- | ------------------------------------------------------------------------ |
| **Loading**    | skeleton placeholders shaped like the content, only if loading takes **more than 300ms** (no flicker on fast loads) |
| **Refreshing** | the current data stays on screen; no skeleton, no spinner                |
| **Empty**      | `EmptyState` with illustration, message and an action where one makes sense (Section 4.6) |
| **Error**      | `ErrorState` with **Retry** and the request id (DESIGN 9.5)              |
| **Offline**    | the offline banner on top of whatever was last shown (Spec Rule 3)       |

### 5.2 Interaction states

| State        | Look                                                                  |
| ------------ | --------------------------------------------------------------------- |
| Hover        | laptop only: slightly darker or lighter surface                       |
| Pressed      | scales to 97% (Section 6)                                             |
| Focus        | 2px `primary` ring with a 2px gap, shown for keyboard focus only      |
| Disabled     | 50% opacity, no hover or press effect, still readable by screen readers |
| Selected     | `primary-soft` background, `primary` border, a check mark             |
| Busy (action in progress) | the button shows a small spinner in place of its label and ignores further taps |

A spinner is used **only** inside a busy button. Everything else uses skeletons.

### 5.3 Component inventory

**Money and data**

- **`Amount`**: the only way an amount is displayed. Handles ₹ formatting and signs exactly as Spec Rule 14: `+` and the `income` colour for income; no sign for expenses and totals; `+` or `−` in normal colour for "left over"; `−` in normal colour for a negative balance. Tabular figures; sizes match the type styles (Section 4.2).
- **`MoneyInput`**: ₹ prefix, native decimal keyboard (`inputmode="decimal"`), Indian digit grouping shown live as you type, converts to paise (DESIGN 8.5). In the Add sheet it uses `amount-xl`.
- **`CategoryTile`** and **`CategoryPicker`**: emoji (28px) above the name; 4 per row on phones; at least 72px tall; selected state from 5.2. Names longer than the tile end with "…"; the full name is the tile's accessible label. The picker orders by recent use (Spec Rule 4).
- **`TransactionRow`**: category emoji, title (payee, or category name if no payee), subtitle (category · note), `Amount` on the right, an optional source badge. Swipe-to-delete with touch input (UI 2.2).
- **`ProgressBar`**: for goals and lending; `primary` fill on a `primary-soft` track, with the value as text next to it.
- **`Badge`**: `upcoming` (`primary-soft`), `overdue` (`alert-soft` with `alert` text), `paused` (`surface-muted`), source badges `Bill` / `Lending` (`surface-muted`).

**Inputs**

- **`TextField`** and **`TextArea`**: label above, error message below in `alert`, a character counter near the limit, using the limits in Spec Rule 9.
- **`DateField`**: quick chips **Today** and **Yesterday**, plus **Pick a date**, which opens a calendar. Future dates are disabled where the spec forbids them (Spec Rule 4).
- **`Autocomplete`**: for payee and person; built on shadcn/ui's Command; suggestions appear under the field.
- **`SegmentedControl`**: Expense / Income, and the Plan tabs.
- **`EmojiPicker`**: for category emoji and goal icons (Section 5.4).

**Containers**

- **`ResponsiveSheet`**: shadcn/ui **Drawer** (built on vaul; drag to dismiss) below the `md` breakpoint, centred **Dialog** from `md` up (Section 4.8). Every create and edit form uses it (Section 1.6).
- **`Card`**: `surface`, `radius-lg`, card padding (Section 4.3). A tappable card shows the pressed state.
- **`ConfirmDialog`**: a title saying what will happen, a sentence on the consequence, a destructive button labelled with the action ("Delete bill", never just "OK"), and **Cancel**, which has focus by default.

**Feedback**

- **`Toast`**: sonner. Above the tab bar on phones, bottom right on laptops. 4 seconds, or 6 seconds when it has an action (Undo, Retry).
- **`EmptyState`**, **`ErrorState`**, **`OfflineBanner`**, **`Skeleton`**.

**Buttons**

| Variant       | Look                                   | Used for                                  |
| ------------- | -------------------------------------- | ----------------------------------------- |
| `primary`     | `primary` background                   | the one main action on a screen or sheet  |
| `secondary`   | `surface-muted` background             | other actions                             |
| `ghost`       | no background                          | low-priority actions, icon buttons        |
| `destructive` | `alert` background                     | the final confirming button in `ConfirmDialog`, and Delete account |
| `danger-ghost` | no background, `alert` text           | buttons that start a delete: Delete in an edit sheet, Delete on a Trash row |
| `fab`         | `primary`, `radius-full`, 56px, shadow | the floating Add button                   |

A screen or sheet has **at most one** `primary` button.

### 5.4 Emoji picker

Used to choose a category's emoji and a goal's icon. No emoji picker library is used: they ship the full emoji data set, which is far more than this app needs and works against the performance budget (DESIGN 12). A curated list plus the device's own emoji keyboard covers every case.

- Opens in a `ResponsiveSheet`.
- **A curated grid** of about 80 emoji in labelled groups: Food & drink, Transport, Home & bills, Shopping, Health, Fun, Money & work, Travel & goals. Tiles are at least 44×44px.
- **"Use another emoji"**: a text field that accepts any single emoji typed from the device's emoji keyboard.
- Validation is the same as the server's: exactly one emoji (Spec Rule 5); anything else shows a field error.
- The current choice is shown selected (Section 5.2). The list lives in one file, `apps/web/src/components/emoji-picker/emoji-groups.ts`.

## 6. Motion

Motion is **subtle**: quick, small movements that explain what just happened (something appeared, moved, was removed or saved). Decoration is reserved for celebrations.

### 6.1 Libraries

- **Motion** (the `motion` package, formerly Framer Motion) for all animation in React: presence (enter/exit), layout changes in lists, drag (swipe to delete), springs.
  - Uses `LazyMotion` with `m` components, and loads its feature bundle asynchronously, so Motion is not part of the first page load.
- **vaul** (inside shadcn/ui's Drawer) animates bottom sheets, including drag to dismiss.
- **sonner** animates toasts.
- **canvas-confetti** for big celebrations, loaded only when a celebration plays.

### 6.2 Motion tokens

| Token        | Duration | Used for                                       |
| ------------ | -------- | ---------------------------------------------- |
| `instant`    | 100ms    | press feedback                                 |
| `fast`       | 150ms    | hover, fades, tab cross-fades                  |
| `base`       | 200ms    | dialogs, list insert/remove, badges            |
| `moderate`   | 250ms    | detail screen slide-in                         |
| `slow`       | 500ms    | progress bars, number count-ups                |

- **Entering:** ease-out, `cubic-bezier(0.2, 0, 0, 1)`.
- **Exiting:** ease-in, `cubic-bezier(0.4, 0, 1, 1)`, at 75% of the entering duration, so things leave faster than they arrive.
- **Springs** (selection pops, drag release): stiffness 400, damping 30. No visible bounce beyond a slight overshoot.
- Durations live in one file (`apps/web/src/lib/motion.ts`) and are never hard-coded in components.

### 6.3 What animates

| Element                     | Animation                                                              |
| --------------------------- | ---------------------------------------------------------------------- |
| Buttons, cards, tiles       | scale to 97% while pressed (`instant`)                                 |
| Switching tabs              | cross-fade (`fast`)                                                    |
| Opening a detail screen     | slide in 16px from the right with a fade (`moderate`); back reverses it |
| Bottom sheet                | vaul's slide up and drag to dismiss                                    |
| Dialog                      | fade and scale from 96% (`base`)                                       |
| Category tile selected      | small spring pop (100% → 106% → 100%) and the check mark fades in      |
| List item added             | fades in and expands into place (`base`)                               |
| List item removed           | collapses out (`base`); neighbours slide up smoothly                   |
| Swipe to delete             | follows the finger; releasing past 40% of the row width deletes, otherwise it springs back |
| Amount after an action      | counts to the new value (`slow`), **only after something I did**, never on page load |
| Progress bar                | fills to the new value (`slow`)                                        |
| Skeleton                    | gentle pulse, 1.5s per cycle                                           |
| Toast                       | sonner's slide and fade                                                |

### 6.4 Celebrations

| Moment                            | Celebration                                                   |
| --------------------------------- | ------------------------------------------------------------- |
| Savings goal completed            | **confetti burst** (~1.2s) in the chart palette, then the message |
| Lending record settled            | **confetti burst**, then the message                          |
| Bill paid on or before its due date | a **check mark** drawing itself in the toast (~400ms)       |

Celebrations play once, never block the screen, and can't be triggered by spending.

### 6.5 Rules

- **Never in the way:** an animation never delays input or data. Saving doesn't wait for the sheet to close; the toast appears while the sheet is still closing; I can tap during any animation.
- **The Add flow has no decorative motion** (Section 1.1): only the sheet opening and closing and the tile selection pop.
- **Performance:** only `transform` and `opacity` are animated (Motion's layout animations use transforms). Animations must stay smooth on a mid-range Android phone.
- **Reduced motion:** when the device's "reduce motion" setting is on (`prefers-reduced-motion`, applied globally with Motion's `MotionConfig reducedMotion="user"`):
  - movement is replaced by instant changes or short fades (at most `fast`)
  - no confetti: the celebration shows as a static check mark and message
  - no count-ups: numbers change instantly
  - skeletons don't pulse

## 7. Feedback

Every change I make gets visible feedback. There is **no vibration and no sound**: feedback is visual only.

### 7.1 Undo or confirm

**Undo when the action can be reversed; confirm only when it can't, or when it removes a lot at once.**

| Action                                           | Feedback                                   |
| ------------------------------------------------ | ------------------------------------------ |
| Save a new transaction                           | toast "Expense saved" / "Income saved" · **Undo** (moves it to the Trash) |
| Edit a transaction                               | toast "Expense updated" / "Income updated" |
| Delete a transaction (sheet or swipe)            | toast "Moved to Trash" · **Undo** (restores) |
| Restore from the Trash                           | toast "Restored"                           |
| Create or edit a category, bill, goal or lending record | toast "Food saved", "Electricity saved", "Goa trip saved", "Lending record saved" |
| Pay a bill                                       | toast "Electricity paid" · **Undo** (undoes the cycle) |
| Skip a bill cycle                                | toast "Electricity skipped this time" · **Undo** |
| Pause / resume a bill                            | toast "Electricity paused" / "Electricity resumed" |
| Add, edit or delete a repayment                  | toast "Repayment saved" / "Repayment updated" / "Repayment deleted" |
| Add, edit or delete a contribution               | toast "Added to Goa trip" / "Contribution updated" / "Contribution deleted" |
| Change a setting (opening balance, timezone, theme) | toast "Settings saved"                  |
| **Delete permanently** from the Trash            | **ConfirmDialog**                          |
| **Delete a bill, goal or lending record**        | **ConfirmDialog**, saying what else is removed or kept |
| **Delete a category** that is in use             | **ConfirmDialog** with the "move to" picker |
| **Undo the latest bill cycle** from its history  | **ConfirmDialog**                          |
| **Log out of all devices**                       | **ConfirmDialog**                          |
| **Delete account**                               | typed confirmation phrase (Spec Rule 10)   |
| Save or delete rejected as stale                 | error toast "This was changed on another device" · **Reload** (Section 3.15) |

### 7.2 Toasts

- One toast at a time; a new one replaces the old one.
- Short, past-tense messages naming the thing: "Electricity paid", not "Operation successful" (Section 9).
- 4 seconds, or 6 seconds when it has an action; hovering or touching it pauses the timer.
- Errors use the same toast with **Retry** where it applies (DESIGN 9.5), and stay until dismissed.

### 7.3 Inline feedback

- Field errors appear under the field as soon as I leave it, or when I tap Save (not while typing).
- Busy buttons show a spinner and ignore extra taps (Section 5.2), so nothing is submitted twice.
- After a change, the affected numbers update in place with the count-up from Section 6.3.

### 7.4 Celebrations

See Section 6.4. A celebration is always followed by a toast or message saying what happened, so it isn't only visual.

## 8. Accessibility baseline

No formal WCAG target or audit in the first version. Instead, every screen meets this baseline, checked manually as part of the definition of done:

| Area             | Rule                                                                         |
| ---------------- | ---------------------------------------------------------------------------- |
| Contrast         | text tokens meet 4.5:1 on their backgrounds (Section 4.1)                    |
| Colour alone     | never the only signal: income also has `+`, overdue also has the word "overdue" |
| Labels           | every input has a visible label; every icon-only button has an accessible name |
| Keyboard         | everything works with the keyboard; focus is visible (Section 5.2); sheets and dialogs trap focus and return it on close |
| Touch targets    | at least 44×44px (Section 4.3)                                               |
| Text size        | `rem` sizes; layouts still work at 200% text size                            |
| Gestures         | every gesture has a non-gesture alternative (Section 2.2)                    |
| Motion           | the reduced-motion rules in Section 6.5                                      |
| Charts           | every chart has the same numbers available as text (the category list next to it) |
| Structure        | one `h1` per screen, headings in order, lists marked up as lists             |

shadcn/ui's components (built on Radix) handle most of the focus and keyboard behaviour; custom components must match them.

## 9. Copy and tone

### 9.1 Voice

**Friendly and plain.** Short sentences, everyday words, talking to me as "you".

- Light humour only in empty states and celebrations. Never in errors, confirmations or anything about money owed.
- My first name only in the Home and welcome-screen greetings ("Hi Save").
- **No emoji in text.** Emoji appear only as category icons.
- Neutral about money (Section 1.4): describe, never judge. "You spent ₹18,450 this month", never "You overspent".

### 9.2 Rules

- **Buttons say what they do:** "Save", "Pay bill", "Delete goal", never "OK", "Submit" or "Yes".
- **Toasts name the thing in the past tense:** "Electricity paid", "Moved to Trash".
- **Errors say what happened and what to do next,** without blame or technical words: "Couldn't save. Check your connection and try again." Never "Error 500" or "Invalid input". Error messages are written once, in the error catalogue (DESIGN 9.6), and library error text is never shown.
- **Confirmations state the consequence:** "Delete Goa trip? Its 6 contributions will be deleted too. This can't be undone."
- **Sentence case** everywhere ("Bills due", not "Bills Due").
- **Glossary words** from SPEC.md: "lending record", never "loan" or "debt"; "Trash", never "bin".
- **Numbers and dates** follow Spec Rule 14. Relative dates where they're clearer: "Today", "Yesterday", "in 2 days", "3 days overdue".

### 9.3 Examples

| Situation                    | Text                                                    |
| ---------------------------- | ------------------------------------------------------- |
| Home greeting                | "Hi Save"                                               |
| First run                    | "Let's track your first expense"                        |
| Transactions, empty          | "Nothing here yet. Tap + to add your first expense."    |
| Search, no results           | "No matches. Try a different search."                   |
| Bills tab, empty             | "No bills yet. Add one and we'll remind you before it's due." |
| Goals tab, empty             | "Saving for something? Add a goal to track it."         |
| Lending tab, empty           | "No lending yet. Lent or borrowed money? Keep track here." |
| Trash, empty                 | "Trash is empty"                                        |
| Bill overdue badge           | "3 days overdue"                                        |
| Goal completed               | "Goa trip complete!"                                    |
| Lending record settled       | "All settled with Rahul"                                |
| Save failed                  | "Couldn't save. Check your connection and try again."   |
| Request timed out            | "That took too long. Check your connection and try again." |
| Unexpected error             | "Something went wrong. Try again in a moment."          |
| Page not found               | "This page doesn't exist."                              |
| Sign-in failed               | "Couldn't sign you in. Try again."                      |
| Update available             | "A new version is ready." · **Reload**                  |
| Offline banner               | "You're offline. Changes won't save until you're back." |
| Backup reminder              | "It's been a while since your last backup."             |
| Delete account confirmation  | "Type 'delete my account' to permanently delete your account and all your data." |
| Stale edit                   | "This was changed on another device. Reload to see the latest version." |
| Sign-in tagline              | "Know exactly where your money goes."                   |
