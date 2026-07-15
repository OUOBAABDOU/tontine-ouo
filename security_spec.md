# Security Specification: Tontine Platform

This security specification implements attribute-based access control (ABAC) and zero-trust policies for the Tontine platform.

## 1. Data Invariants
1. **User Identity Invariant**: A user's profile can only be created or modified by the user themselves, except for system status or roles which are restricted.
2. **PII Isolation Invariant**: Sensitive fields like `phone` are isolated in `/users/{userId}/private/info` and only accessible by the owner or an admin.
3. **Transaction Integrity Invariant**: Transactions cannot be modified or deleted once written. Only the user or system can log a new transaction.
4. **Tontine Safety Invariant**: Tontine groups can only be created by an Admin/Super Admin, and users cannot self-assign themselves as participants without authorization.
5. **System Log Traceability**: Actions logged in `systemLogs` are append-only. No updates or deletions are allowed under any circumstances.
6. **Immutable Fields**: `createdAt`, `userId`, `ownerId`, and similar tracking keys must remain identical on updates.

## 2. The "Dirty Dozen" Malicious Payloads (TDD Cases)
We describe 12 malicious payload attempts that MUST return `PERMISSION_DENIED` under Firestore rules:

1. **Self-Promotion Attack (Privilege Escalation)**: A regular user tries to set their role to `'Admin'` or `'Super Admin'` during signup or profile update.
2. **Identity Spoofing (Impersonation)**: Authenticated user `user_A` tries to write a post claiming `memberId: "user_B"`.
3. **Ghost Transaction Logging**: User tries to log a deposit transaction into another user's private collection (`/users/user_B/transactions/tx_1`).
4. **Unauthenticated Read of Private PII**: A logged-in user tries to query another user's telephone number at `/users/user_B/private/info`.
5. **Post-Draw Hijack**: A user attempts to update a completed tontine status back to `'Recrutement'` to trigger a malicious re-draw.
6. **Chat Thread Injection**: A user tries to create messages in a chat thread they do not belong to.
7. **Bypassing Regex/Size Guard**: A user attempts to create a post with content exceeding 2000 characters or with a malicious 1MB document ID.
8. **Self-Verification of Seller Status**: A regular user tries to set `isVerifiedVendeuse` to `true` on their member profile.
9. **Tampering with Audit Logs**: A user attempts to delete a tracing log from `/systemLogs/log_1` to cover up unauthorized activity.
10. **Financial Wallet Injection**: A user attempts to directly increment their own `walletBalance` by 1,000,000 FCFA.
11. **Altering Past Winners**: A user attempts to update `drawHistory` in a tontine to insert their own ID as a winner of previous rounds.
12. **Tampering with Draw Certificates**: A user attempts to write a forged `DrawCertificate` claiming they won a pool of 500,000 FCFA.

## 3. Security Tests Overview
These malicious payloads are programmatically rejected by our rules using strict typing, key limits, and value check functions.
