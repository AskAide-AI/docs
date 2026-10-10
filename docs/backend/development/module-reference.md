# Backend Module Reference

There are 19 modules. All follow `src/modules/<name>/` with `controllers`, `services`, `validators`, `routes`, `models` and `tests` subfolders (not every module has all of them). Paths below are relative to `/api/v1`.

## Auth Module

**Path:** `src/modules/auth/`
**Purpose:** Authentication, authorization, token management

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/authenticate/login` | POST | Rate-limited | `{ userName, password }` → `{ user, tokens }` |
| `/authenticate/signup` | POST | Rate-limited | `{ userName, email, password, confirmPassword, name, accountType?, referralCode?, acquisition? }` → `{ user, tokens, referral }`. `accountType` is `Student` (default) or `Teacher`; any other value gets `400` (`INVALID_ACCOUNT_TYPE`) |
| `/authenticate/google` | POST | Rate-limited | `{ idToken, referralCode?, accountType?, acquisition? }` → `{ user, tokens, isNewUser, referral }`. `accountType` (`Student` or `Teacher`) is used only when this login creates the account |
| `/authenticate/refresh` | POST | - | Token refresh (each refresh token works once) |
| `/authenticate/logout` | POST | - | Revoke refresh token |
| `/authenticate/changepassword` | POST | auth | Password change |
| `/authenticate/reset-password-token` | POST | - | Send reset email |
| `/authenticate/reset-password` | POST | - | Reset with token |
| `/authenticate/verify-email` | POST | - | OTP verification |

**Token model:** accessToken (2h) + refreshToken (7d). Each refresh token is single-use: `/refresh` claims and revokes it in one atomic step, so two refreshes sent at the same moment cannot both succeed. Max 5 active refresh tokens per user.

**Signup attribution:** a valid `referralCode` credits the new account to its inviter (see Referral below). A bad or stale code never fails the signup. `acquisition` stores first-touch details (`source`, `ref`, UTM fields, landing path) on the user.

**Activity:** every request that passes `auth` records one daily-active row per user per IST day (`useractivitydays`) and updates `User.lastActiveAt`. Writes happen at most once per user every 15 minutes, are not awaited, and never fail the request.

## User Module

**Path:** `src/modules/user/`
**Purpose:** Own profile and school-managed student accounts

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/profile/details` | GET | auth | Own user and profile |
| `/profile/update` | PUT | auth | Update profile details |
| `/profile/name` | PUT | auth | `{ name }` (2–100 characters) |
| `/profile/email/request-change` | POST | auth, 10 per 15 min per IP | `{ email }` → emails a 6-digit code to the **new** address. The account is unchanged until the code is entered |
| `/profile/email/confirm-change` | POST | auth, 10 per 15 min per IP | `{ code }` → switches the login email and tells the old address |
| `/profile/display-picture` | PUT/DELETE | auth | Set or remove the picture |
| `/profile/delete` | DELETE | auth | Delete own account |
| `/profile/public/:userId` | GET | none | Public profile: `_id`, `name`, `image`, `accountType`, `createdAt`; for a Student also `streak` (`currentStreak`, `longestStreak`) and `stats` (`questionsAnswered`, `accuracy`, `subjectsCount`) |
| `/student/create`, `/student/get-all`, `/student/:id` | POST/GET/PUT/DELETE | teacher or principal | School-managed student accounts |

**Email change rules:** one pending request per user (`EmailChangeRequest`, expires after 10 minutes). The code is stored only as a SHA-256 hash, allows 5 wrong tries, and can be re-sent once a minute. The new address is compared case-insensitively and re-checked for uniqueness when the code is confirmed. Google sign-in matches by Google ID, so it keeps working after an email change.

## Content Module

**Path:** `src/modules/content/`
**Purpose:** Class, subject, chapter, topic management + PDF upload

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/classes` | GET | auth | List classes |
| `/subjects` | GET | auth | List subjects |
| `/subjects/class/:classId` | GET | auth | Subjects by class |
| `/chapters` | POST | teacher | Create chapter |
| `/chapters/create-with-pdf` | POST | teacher | Multipart PDF + metadata — triggers AI RAG |
| `/chapters/check-rag-status` | POST | auth | Check AI RAG data existence |
| `/chapters/class/:classId/subject/:subjectId` | GET | none | Chapters with topics |
| `/chapters` | DELETE | teacher | Delete chapters (also calls AI delete-document) |
| `/topic` | POST | teacher | Create topic |
| `/topic/get-topics-by-chapter/:chapterId` | GET | auth | Topics by chapter |

## Questions Module

**Path:** `src/modules/questions/`
**Purpose:** Question CRUD, batch fetching, AI generation trigger

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/questions` | POST | teacher | Create question |
| `/questions/chapter/:chapterId` | GET | auth | All questions for chapter |
| `/questions/batch/chapter/:chapterId/type/:questionType/difficulty/:difficulty/session/:sessionId` | GET | auth | Batched — calls AI if insufficient |
| `/questions/public-batch/chapter/:chapterId` | GET | none | Public (Try Now) |
| `/questions/public-preview/class/:classSlug/subject/:subjectSlug/chapter/:chapterSlug` | GET | none | Public SEO preview by slug (incl. explanations). Matching ignores a leading number ("3. ") and a Social Studies strand prefix ("Geography: "), and pools questions from every chapter that matches the slug |
| `/questions/generate/chapter/:chapterId` | POST | teacher | Admin fire-and-forget generation trigger |
| `/questions/counts` | POST | teacher | Batch question counts for admin chapter list |

**Batch response statuses:**
- `generating` — AI job in flight; poll again
- `failed` — last attempt errored; retry with `?retry=true`
- `mastered` — content exhausted; offer next chapter

The practice and free-trial batches shuffle both the question order and each question's answer options. Answers are checked by text, so option position does not matter.

## Quiz Module

**Path:** `src/modules/quiz/`
**Purpose:** Full quiz lifecycle management

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/quiz` | POST | auth | Create quiz |
| `/quiz/:quizId` | GET/PUT/DELETE | auth | CRUD. `GET` (full quiz, custom answers included) needs the quiz's teacher or a SuperAdmin |
| `/quiz/:quizId/publish` | POST | auth | Publish |
| `/quiz/:quizId/close` | POST | auth | Close |
| `/quiz/:quizId/clone` | POST | auth | Clone |
| `/quiz/:quizId/analytics` | GET | auth | Analytics, with per-question analysis |
| `/quiz/teacher/:teacherId` | GET | auth | The teacher's own quizzes (or any, for a SuperAdmin) |
| `/quiz/:quizId/questions` | POST | auth | Add question |
| `/quiz/:quizId/questions/:questionId` | DELETE | auth | Remove question |
| `/quiz/:quizId/questions/reorder` | PUT | auth | Reorder |
| `/quiz/questions/search` | GET | auth | Question bank search |
| `/quiz/student/available` | GET | auth | Available quizzes |
| `/quiz/student/history` | GET | auth | Completed attempts, newest first (`page`, `limit` up to 50) |
| `/quiz/:quizId/start` | POST | auth | Start an attempt or resume the one in progress → `{ attempt, questions, quiz }`. Needs a teacher–student link for the quiz's teacher, class and subject |
| `/quiz/attempt/:attemptId/answer` | POST | auth | Submit answer |
| `/quiz/attempt/:attemptId/submit` | POST | auth | Submit attempt |
| `/quiz/attempt/:attemptId/result` | GET | auth | Attempt result, with `attempt.canRetry` |

## Progress Module

**Path:** `src/modules/progress/`
**Purpose:** Topic progress tracking, AI insights, streaks, badges

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/topic-progress/progress/chapter/:chapterId` | GET | Chapter progress (signed-in user) |
| `/topic-progress/progress/subject/:subjectId` | GET | Subject progress (signed-in user) |
| `/topic-progress/ai-insights/{chapter,subject}/:id` | GET | AI learning insights |
| `/topic-progress/teacher/class-insights?subjectId=` | GET | AI class insights (Teacher) |
| `/topic-progress/mastery-summary` | GET | Mastery overview (signed-in user) |
| `/progress/user/:userId` | GET | Progress dashboard |
| `/streaks/:userId` | GET | Streak data |
| `/streaks/:userId/use-freeze` | POST | Use streak freeze |
| `/daily-challenge/:userId` | GET | Today's daily challenge |
| `/daily-challenge/:userId/complete`, `/daily-challenge/:userId/history` | POST, GET | Complete today's challenge; recent challenges |
| `/badges/:userId` | GET | User badges |
| `/badges/check` | POST | Trigger badge check |
| `/session-feedback/reaction` | POST | Session reaction |
| `/session-feedback/nps` | POST | NPS score |
| `/session-feedback/nps/check/:userId` | GET | Whether to show the NPS survey |

**Own data only:** every route above with `:userId` in the path, plus `/user-answers/user/:userId`, serves only the signed-in user or a SuperAdmin (`isSelfOrSuperAdmin`); anyone else gets `403` with `code: "NOT_YOUR_DATA"`. `/sessions/user/:userId` and `/sessions/last-incomplete/:userId` apply the same rule through `canAccessUser` (`403`). Teachers, parents and principals see a student's progress through their own dashboards.

**After each saved answer batch** (`POST /user-answers/batch`), the service updates the session totals, applies the new answers to topic progress, records today's practice for the streak, and checks whether a referred friend has now reached 10 answers (see Referral).

**Streak freezes:** one free freeze per week (`streakFreezes.total` / `used`, reset on Monday) plus earned bonus freezes (`streakFreezes.bonus`, from referral rewards). Bonus freezes never reset and are spent after the weekly one.

**Badges:** 21 badge rules (`badge.service.js`). Night Owl (midnight–5 AM) and Early Bird (5–7 AM) are judged in IST. Social badges: Challenger (a friend played your challenge), Challenge Champion (beat a friend's score), and Squad Starter / Squad Leader / Class Captain (1 / 3 / 5 invited friends practising). Each new badge also appears in the notification bell; badges found by `POST /badges/check` are stored as already read, because the result screen shows them.

## Referral Module

**Path:** `src/modules/referral/`
**Purpose:** Invite codes, signup attribution, two-sided rewards

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/referral/my-code` | GET | auth | Code, invite link, share text, friends list, rewards, milestones, and `referredBy` (who invited you and your progress to the gift) |
| `/referral/redeem/:code` | POST | auth | Apply a code after signup (new accounts only, same rules as signup) |
| `/referral/rewards/practice-paper` | POST | auth | `{ chapterId }` → spends one credit on a 20-question practice paper (8 easy, 8 medium, 4 hard, with answer key) (201). The credit is refunded if the paper cannot be made |

**Rules:**
- Codes are 6 random characters without look-alikes (no 0/O/1/I).
- A new account is credited to an inviter at signup (email or Google) through an invite link (`?ref=`) or a challenge it played. Only accounts less than 24 hours old can be credited, a user cannot refer themselves, and each user has one referrer (the first one wins).
- No reward at signup. When the friend has answered **10 questions** (practice answers plus answered questions in challenges played on their account), both sides get one practice-paper credit and one bonus streak freeze, exactly once.
- The check runs after every saved answer batch, when a challenge is played or claimed while signed in, and when the referral screen loads (it re-checks the user and up to 5 friends who joined in the last 14 days).
- A referrer is rewarded for at most 10 friends per calendar month. Over the cap, the friend still gets their gift.
- The referrer gets an email and a bell notification when a friend activates. Both sides see a bell notification for the gift.

## Challenge Module

**Path:** `src/modules/challenge/`
**Purpose:** Challenge-a-friend links (`/c/:code`) built from a finished practice session

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/challenges` | POST | auth | `{ sessionId }` → challenge summary with share link (201). One challenge per session; needs at least 3 multiple-choice answers, uses up to 10 |
| `/challenges/mine` | GET | auth | Your last 20 challenges with the top players |
| `/challenges/:code` | GET | optional auth, 120 per 10 min per IP | Public play page: questions **without** answers (options shuffled), top 5 scoreboard, and whether you are the owner or have already played |
| `/challenges/:code/attempts` | POST | optional auth, 20 per 10 min per IP | `{ answers, name? }` → scored on the server (201). Guests get a single-use `claimToken`; signed-in players are linked at once |
| `/challenges/attempts/:attemptId/claim` | POST | auth | `{ claimToken }` → links a guest attempt to the account the guest just signed up with |
| `/challenges/:code/review` | GET | auth | Answers, explanations and scoreboard, for the owner or a player who has played |

**Rules:** the owner cannot play their own challenge, and a signed-in player keeps their first score. Only the claim token's SHA-256 hash is stored. A brand-new account that plays or claims a challenge is credited to the owner as a referral (`source: 'challenge'`), and the response carries a `gift` block with the player's progress towards the referral gift. The owner is emailed for the first 10 plays only, and every play also goes to the owner's notification bell.

## Notification Module

**Path:** `src/modules/notification/`
**Purpose:** The in-app notification bell

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/notifications` | GET | auth | `?before=<cursor>&limit=` (max 50, default 20) → `{ items, hasMore, nextCursor, unread }`, newest first |
| `/notifications/unread-count` | GET | auth | `{ unread }` |
| `/notifications/read` | POST | auth | `{ ids }` (up to 100) or `{ all: true }` → `{ updated, unread }` |

**How it works:** other services call `notificationService.notify()`, which never throws. Events with the same type and target (`groupKey`) on the same IST day fold into one row with a count and the latest first names, so ten plays of one challenge read as one row ("Name and 9 others played your challenge"). One-time events (badges, milestones, gift reminders) are stored once. Text is worded when the list is read.

**Types:** `challenge_played`, `friend_joined`, `gift_unlocked`, `gift_reminder`, `badge_earned`, `class_joined`, `class_milestone`.

**Retention:** a row is removed 60 days after its last event (TTL index on `lastAt`).

**Daily job:** at 5 pm IST, `notificationScheduler.js` sends one gift reminder to each invited friend who joined 20 hours to 7 days ago and is still short of 10 answers, and tells teachers once when a class report or the certificate unlocks.

## Other Modules

### School (`src/modules/school/`)
`POST/GET /`, `GET/PUT /:id` — School CRUD. A principal may `PUT` only their own school (`403 NOT_YOUR_SCHOOL` otherwise)

### Sections (`src/modules/school/`, mounted at `/sections`)
`POST /`, `POST /bulk`, `GET /school/:schoolId`, `GET /:sectionId`, `PUT/DELETE /:sectionId`. For a principal, new sections always go into their own school, and another school's section is a 404 on `PUT`/`DELETE`

### Teacher (`src/modules/teacher/`)
`POST /` (one or an array), `GET /get-all`, `PUT/DELETE /:id` — Teacher CRUD (Principal only). A principal works only within their own school: new teachers always get that school, the list shows only its teachers, and another school's teacher is a 404. A principal with no school linked gets `403 NO_SCHOOL`. SuperAdmin has no limit

### Teacher Class Links (`src/modules/teacher/`, mounted at `/teacher-classes`)
A teacher makes a `/join/:code` link per class + subject (+ optional section) and shares it with the class. A student who joins gets an ordinary `TeacherStudent` row (`joinedVia` = the link), so every teacher dashboard view shows them with no extra setup.

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/` | POST | teacher | `{ classId, subjectId, sectionName?, expectedStudents? }` → link (201). Reuses the active link for the same class, subject and section |
| `/mine` | GET | teacher | Per link: joined, practised after joining, active this week, report unlocked; totals and milestones |
| `/certificate` | GET | teacher | Champion Teacher certificate data (403 until 25 students practised) |
| `/join/:code` | GET | none, 120 per 10 min per IP | Public join page data (no student names) |
| `/join/:code` | POST | auth | Join as a student. 410 when the link is turned off, 403 for non-student accounts. Joining twice is harmless |
| `/:id` | PATCH | teacher | `{ active }` — turn a link on or off |
| `/:id/report` | GET | teacher | Per-student class report (403 until 10 students practised) |

**Rules:** a teacher who signed up alone has no school, so the first link creates a private school (`kind: 'independent'`) and sets the teacher's `schoolId`. The student's `schoolId` is left unset, so their practice is not limited to one school's classes. Rewards count students who practised **after** joining: the class report unlocks at 10, the certificate at 25 (across all the teacher's links). Each join goes to the teacher's notification bell.

### Teacher Dashboard (`src/modules/teacher/`, mounted at `/teacher-dashboard`)
All require `auth, isTeacher`, and `:teacherId` must be the caller's own id (`isSelfOrSuperAdmin('teacherId')`; a SuperAdmin may use any). Otherwise `403` with `code: "NOT_YOUR_DATA"`:
- `/:teacherId/my-assignments`
- `/:teacherId/subject/:subjectId/dashboard`
- `/:teacherId/subject/:subjectId/students`
- `/:teacherId/subject/:subjectId/chapter/:chapterId/analytics`
- `/:teacherId/student/:studentId/subject/:subjectId/progress`
- `/:teacherId/subject/:subjectId/weak-topics`
- `/:teacherId/subject/:subjectId/activity`

### Question Paper (`src/modules/question-paper/`)
`POST /`, `POST /public/generate`, `GET /history`, `GET /:paperId/preview`, `GET /:paperId/pdf`, `DELETE /:paperId`

### AI Assistant (`src/modules/ai-assistant/`)
All require `auth, isTeacher`:
- `POST /` — process AI request → returns `generationId`
- `POST /continue` — continue clarification → returns `generationId`
- `GET /classes` — teacher's classes
- `GET /tasks` — available AI tasks
- `GET /health` — AI service health
- `GET /export/:generationId` — download as PDF

### Misc
| Module | Endpoints |
|--------|-----------|
| Leaderboard | `GET /` (top 10 of this week, from Monday 00:00 IST, with first names), `GET /subject/:subjectId` (all-time) |
| Feedback | `POST /` |
| Goals | `GET /`, `PUT /` |
| Stats | `GET /public` |
| Student | `POST /create`, `GET /get-all` |
