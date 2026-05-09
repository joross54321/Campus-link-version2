# CampusLink Security Specification

## Data Invariants
1. A Student cannot enroll in a subject if they haven't passed the prerequisites.
2. A Student cannot enroll in more than 30 units.
3. Grades are only visible to students after the Registrar marks them as `posted`.
4. The `Drop` functionality is locked one week before the midterm date.
5. Users cannot self-register; accounts must be provisioned by the Registrar.

## The "Dirty Dozen" Payloads (Unauthorized Attempts)
1. **Identity Spoofing**: Student tries to create a user document with `role: 'registrar'`.
2. **Privilege Escalation**: Student tries to update their own `role` to `registrar`.
3. **Data Poisoning**: Student tries to inject a 1MB string into the `address` field.
4. **Prerequisite Bypass**: Student tries to create an enrollment for "Advanced Web Dev" without "Intro to Web Dev".
5. **Capacity Overload**: Student tries to enroll in a subject that is `status: 'full'`.
6. **Unit Cap Violation**: Student tries to enroll in subjects exceeding 30 units.
7. **Grade Tampering**: Student tries to update their own `grade` document.
8. **Unauthorized Grade Posting**: Professor tries to set `status: 'posted'` on a grade (only Registrar can post).
9. **Late Drop**: Student tries to drop a course after the midterm lockout date.
10. **Shadow Field Injection**: Student tries to add `isVerified: true` to their user profile.
11. **PII Leak**: Authenticated user tries to `get` another user's PII (address/contact) without being the Registrar.
12. **Orphaned Writes**: Student tries to enroll in a non-existent `subjectId`.

## Test Runner (Planned)
- Verify `PERMISSION_DENIED` for all above payloads.
- Verify `SUCCESS` for valid enrollment flow.
