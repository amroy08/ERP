# Parent Fees Redesign Plan

## Screen Name
`ParentFeesScreen`

## Current Purpose
Displays fee ledgers, including outstanding amounts, payment dates, and payment history summaries for linked children.

## Primary Parent Goal
View upcoming payments, review outstanding fee balances, and keep track of paid/pending school invoices.

## The Current Issue
- The outstanding banner is simple and visually intrusive, using a basic red background overlay.
- Individual fee items are rendered in raw cards with plain text rows for totals, paid amount, and due amount.
- Status indicator tags lack professional banking/ledger styling.

## The Architectural Fix
- Use `ParentScreenHeader` with a wallet icon.
- Integrate `ChildContextHeader` at the top to filter fee statements per child (or select "All Children" context).
- Keep `fetchParentFees` API integration, preserving the structure of `FeeRecord`.
- Maintain exact fee ledger definitions and computations from Phase 3.2G.

## The Visual Polish
- Summary Card: Revamp the outstanding due alert into a premium billing hero card. Use a gradient overlay (e.g. `gradients.danger` or a curated soft red gradient) with large bold typography for the total outstanding amount.
- Fee Ledger Card: Style fee invoice entries with:
  - Header: Fee structure title and student name.
  - Progress bar: Illustrating the ratio of paid amount to total amount.
  - 3-column ledger details (Total, Paid, Due) with distinct typography weights.
  - Status Badges: Distinct status accents for Paid (success), Partial (warning), Overdue (danger), and Unpaid (info).

## Interaction / Animation Recommendation
- Smooth numerical count animation for the outstanding balance if possible.
- Fade-in card entries.

## Expected Files To Change
- `mobile/src/screens/parent/ParentFeesScreen.tsx`

## Risk Level
Low (No payment calculations are altered).

## Validation Needed
- Verify billing summary totals match the sum of individual child records.
- Ensure correct display of due dates and partial payments.
- Check visual handling of negative or zero balance (Fully Paid) states.
