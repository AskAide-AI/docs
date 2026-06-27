# AskAide AI - Progress Tracker

**Last Updated:** 2026-02-16

---

## ✅ Completed

- [x] User authentication system with JWT (2024-01-15)
- [x] Role-based access control - Admin, Teacher, Student, Principal, Parent (2024-01-15)
- [x] Database schema setup with Mongoose (2024-01-10)
- [x] Classes, Subjects, Chapters CRUD APIs (2024-01-10)
- [x] PDF upload for chapter content (2024-02-01)
- [x] AI question generation integration (2024-02-01)
- [x] Non-blocking question generation polling endpoint with status checks (generating/failed/mastered)
- [x] Yield-based mastery detection (lowYieldStreak, LOW_YIELD_LIMIT, HARD_CAP)
- [x] Context rotation via AI Service random sampling from CANDIDATE_POOL
- [x] Dedup on insert (_dedupeNewQuestions)
- [x] Failed-job auto-recovery (2 min cooldown)
- [x] Structured logging for generation lifecycle
- [x] Prefetch when remaining pool drops below threshold
- [x] Practice session management (2024-01-20)
- [x] UserAnswer tracking with scoring (2024-01-20)
- [x] Leaderboard system (2024-02-15)
- [x] School management APIs (2024-03-01)
- [x] OTP-based login (2024-03-15)
- [x] Topic model and ChapterTopics linking (2025-12-20)
- [x] StudentTopicProgress model for mastery tracking (2025-12-21)
- [x] Topic mastery calculation with difficulty weighting (2025-12-21)
- [x] Chapter progress API with coverage/mastery separation (2025-12-21)
- [x] Subject progress API with aggregated chapter data (2025-12-21)
- [x] AI Insights API integration (2025-12-21)
- [x] Section model for class organization (2026-01-03)
- [x] TeacherStudent relationship management (2026-01-03)
- [x] Bulk chapter PDF upload script (2026-01-03)
- [x] Subject coverage calculation fix (2026-01-03)
- [x] Teacher Dashboard - Subject-centric analytics (2026-01-06)
- [x] DDM Migration Complete - All code in src/modules (2026-01-10)
- [x] Joi Validation Middleware for auth routes (2026-01-11)
- [x] Quiz Module - Async quiz system with auto-grading (2026-01-19)
- [x] Question Paper Module - generation, preview, PDF download, history (2026-02-11)
- [x] Chapter lifecycle upgrades - bulk delete + RAG status checks + `isStartable` flag (2026-02-13)

---

## 🚧 In Progress

- [ ] BullMQ for background job processing
- [ ] Social login (Google, GitHub OAuth)
- [ ] Two-factor authentication (2FA)

---

## 📋 Planned (Priority Order)

1. [ ] Bayesian Knowledge Tracing for mastery prediction
2. [ ] Memory decay tracking and review suggestions
3. [ ] Adaptive question selection algorithm
4. [ ] WebSockets for real-time notifications
5. [ ] Advanced analytics dashboard

---

## 🔮 Future Considerations

- Real-time notifications with WebSockets
- Advanced analytics dashboard
- Multi-language content support
- Mobile API optimizations
- GraphQL API layer
- Microservices architecture migration

---

## ⚠️ Known Issues

| Issue | Severity | Status |
|-------|----------|--------|
| Google JSON key may be in repo | 🔴 Critical | Needs verification |
| API logger writes to DB synchronously | 🟡 Medium | Performance concern |
| Coverage thresholds not configured in tests | 🟢 Low | Enhancement |
| BullMQ not yet adopted — background generation uses in-process fire-and-forget | 🟢 Low | Enhancement |

---

*See [CHANGELOG.md](./CHANGELOG.md) for detailed change history.*
