# Firestore Security Specification (`security_spec.md`)

## 1. Data Invariants
1. **Default Deny:** Any collection or subcollection not explicitly matched is denied (`allow read, write: if false`).
2. **Verified Authentication:** All reads and writes require `request.auth != null && request.auth.token.email_verified == true`.
3. **Zero-Trust List Queries (No Blanket Reads & No O(n) Lookups):**
   - `allow list` never uses `get()` or `exists()`.
   - Every operational document carries `ownerUid` and bounded `allowedEmails` (`<= 50`), evaluated directly against `request.auth.token.email` (or `isBootstrappedAdmin()`).
4. **PII Split Collection:**
   - Public staff metadata (`maNhanVien`, `tenNhanVien`, `chucVu`, `boPhan`, `trangThai`, `allowedViews`) is stored in `/employees_public/{docId}` without email/phone/password.
   - Personal contact PII (`email`, `soDienThoai`) is isolated in `/employees_private/{docId}`, readable only by Admin or the matching verified email owner.
   - Plaintext passwords (`matKhau`) are never stored in Firestore.
5. **Temporal Integrity & Immutability:**
   - `createdAt == request.time` on create; `createdAt == existing().createdAt` on update; `updatedAt == request.time` on both create and update.
   - `ownerUid == existing().ownerUid` on update.
6. **Terminal State Locking:**
   - Tickets in terminal state (`'Hoàn thành'`, `'Hủy'`) cannot be modified by non-admin users.
7. **Strict Keys & Boundary Limits:**
   - Every `create` enforces `hasAll` and `hasOnly`.
   - Every `update` validates `isValidEntity(incoming())` first and partitions mutations using `affectedKeys().hasOnly(...)` with an `isAdmin()` escape hatch.
   - All document IDs match `^[a-zA-Z0-9_\-]+$` and are `1..128` chars.

## 2. The "Dirty Dozen" Red Team Payloads (Must Return `PERMISSION_DENIED`)
1. Unauthenticated read on `/equipment/HVAC-CH-01`.
2. Unverified email token (`email_verified: false`) attempting `get` or `create` even if email matches `khiemhuynhggs@gmail.com`.
3. Blanket `list` query on `/tickets` by a signed-in external Gmail user not in `allowedEmails`.
4. Shadow field injection (`isVerified: true` or `role: 'admin'`) on `/equipment` create (`hasOnly` rejects).
5. `ownerUid` spoofing on `/tickets` create by non-admin setting `ownerUid: 'other-uid'`.
6. Client-forged `createdAt` or `updatedAt` timestamp not equal to `request.time`.
7. Modifying `createdAt` or `ownerUid` on `update`.
8. Modifying a closed ticket (`trangThai == 'Hoàn thành'`) by a non-admin member.
9. Injecting >128 char or space-containing doc ID (`/tickets/bad id!`) on `get`/`create`/`update`/`delete`.
10. Reading `/employees_private/NV002` by another non-admin user (`NV003`).
11. Unbounded `allowedEmails` array (`size > 50`) on create/update.
12. Creating `/admins/{uid}` by a non-bootstrapped-admin user.
