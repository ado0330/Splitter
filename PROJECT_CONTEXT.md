# AI-Expense-Splitter: Project Context

## Product Vision
A modern, mobile-first, and Apple-like expense tracking and bill-splitting application designed to eliminate the pain of dividing shared costs. It focuses on a sleek user experience, smart text parsing for rapid input, and an optimized settlement algorithm to minimize transactions between group members.

## Current Features
- **Cloud Sync:** Seamless background synchronization using Supabase. Data is backed up to the cloud and restored across devices.
- **Authentication:** Google OAuth and Email Magic Link login via Supabase Auth.
- **Group Management:** Create, switch between, rename, duplicate, and delete expense groups.
- **Expense Tracking:** Add, edit, and remove expenses within a group.
- **Smart Input:** Parse plain text (e.g., "Dinner - 51 Jason", "除3") to automatically generate expense entries. 
- **Live Balances:** Real-time horizontal scrollable view of net balances for all members.
- **Settlement Optimization:** Automatically calculates the minimum number of transactions needed to settle all debts.
- **Offline-First:** State is persisted locally using Zustand persist, allowing use without an internet connection, then auto-syncing when online.

## Supported Workflows
- **Group Initialization:** Users create a group and add participant names.
- **Expense Logging:** Users manually log expenses or use the Smart Input to bulk-import expenses from chat messages or receipts.
- **Advanced Splitting:** Users choose how to split a specific expense (Equally or Custom), handling complex scenarios like tax and service charges.
- **Settlement & Sharing:** Users view the optimized settlement plan and can copy or share it directly via the Web Share API.
- **Cross-Device Sync:** Users sign in with Google or Email. Their local data is pushed to the cloud, and any updates are synced seamlessly in the background across their devices.

## Settlement Algorithm
The algorithm calculates the minimum number of transactions to settle debts:
1. Calculates the net balance for each member (`Paid - Owed`).
2. Separates members into Debtors (net < 0) and Creditors (net > 0).
3. Sorts Debtors (most negative first) and Creditors (most positive first).
4. Iteratively matches the highest Debtor with the highest Creditor, recording the transfer, and updating their net balances until all balances converge to zero.

## Split Types
- **EQUAL:** The total amount is divided evenly among selected participants.
- **CUSTOM:** Participants are assigned custom base amounts (pro-rata). The application supports complex calculations for additional charges applied to the subtotal:
  - **PERCENT:** Automatically calculates and distributes Service Charge (%) and Tax (%).
  - **RM:** Distributes a fixed extra charge amount (RM).
  - Built-in validation ensures the custom subtotal + extra charges matches the total paid amount.

## Group Management
- Groups contain an ID, name, members list, and expenses array.
- The app maintains an `activeGroupId` to switch contexts.
- Users can duplicate an existing group (copying members only, not expenses) for recurring events or trips.

## Sharing Features
- **Web Share API Integration:** Users can click "Share" on the settlement view to directly share the generated text (who owes whom) via native mobile share sheets.
- **Clipboard Fallback:** A "Copy" button provides a fallback to copy the plain text settlement summary.

## Technical Stack
- **Framework:** Next.js 16 (App Router)
- **UI Library:** React 19
- **Backend/DB:** Supabase (PostgreSQL, Realtime, Row-Level Security, Auth)
- **Styling:** Tailwind CSS v4, custom CSS variables for color themes.
- **State Management:** Zustand (with `persist` middleware for LocalStorage).
- **Components:** Shadcn UI (Radix primitives), Vaul (for mobile bottom drawers), Base UI.
- **Icons:** Lucide React.
- **Animations:** `tw-animate-css` for micro-interactions and smooth transitions.

## Design Philosophy
- **Mobile-First & Responsive:** Heavily utilizes bottom drawers (Vaul) on mobile and dialogs on desktop.
- **Apple-like Aesthetics:** Sleek, modern design with rounded corners (`rounded-2xl`), subtle shadows, and a clean white/zinc color palette.
- **Vibrant Accents:** Uses semantic colors (Emerald for positive/creditors, Red for negative/debtors) to provide immediate visual feedback.
- **Frictionless UX:** Features like Smart Input and quick "Select All/Deselect All" toggles reduce the time spent logging expenses.

## Current Implementation Status
The core application is fully functional. The state is managed locally and persists across reloads, backed up by a robust Supabase Cloud Sync engine that handles real-time cross-device synchronization. The UI is polished with responsive layouts, and the underlying mathematical algorithms (balances, custom splitting logic, settlement) are fully implemented and active. Deployment is configured for Vercel.
