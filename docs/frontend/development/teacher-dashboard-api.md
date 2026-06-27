# Teacher Dashboard - Frontend API Documentation

> **Base URL:** `http://localhost:4000/api/v1/teacher-dashboard`
> **Authentication:** Bearer Token required in header

---

## Quick Reference

| # | Endpoint | Method | Description |
|---|----------|--------|-------------|
| 1 | `/:teacherId/my-assignments` | GET | Get teacher's assigned subjects & classes |
| 2 | `/:teacherId/subject/:subjectId/dashboard` | GET | Subject overview dashboard |
| 3 | `/:teacherId/subject/:subjectId/students` | GET | List students with progress |
| 4 | `/:teacherId/subject/:subjectId/chapter/:chapterId/analytics` | GET | Chapter-level analytics |
| 5 | `/:teacherId/student/:studentId/subject/:subjectId/progress` | GET | Individual student progress |
| 6 | `/:teacherId/subject/:subjectId/weak-topics` | GET | Topics needing attention |
| 7 | `/:teacherId/subject/:subjectId/activity` | GET | Recent activity feed |

---

## 1. Get My Assignments

**Endpoint:** `GET /:teacherId/my-assignments`

**Use Case:** Landing page - show what subjects/classes teacher teaches

### Request
```javascript
const response = await fetch(`/api/v1/teacher-dashboard/${teacherId}/my-assignments`, {
  headers: { 'Authorization': `Bearer ${token}` }
});
```

### Response
```json
{
  "success": true,
  "data": {
    "teacher": {
      "_id": "6789...",
      "name": "Ramesh Kumar",
      "image": "https://..."
    },
    "schoolName": "Delhi Public School",
    "assignments": [
      {
        "subjectId": "sub123",
        "subjectName": "Mathematics",
        "classes": [
          {
            "classId": "cls9",
            "className": "Class 9",
            "sections": [
              { "sectionId": "sec1", "name": "A", "studentCount": 35 },
              { "sectionId": "sec2", "name": "B", "studentCount": 32 }
            ],
            "totalStudents": 67
          }
        ],
        "totalStudents": 67
      }
    ],
    "totalStudentsAcrossSubjects": 112
  }
}
```

### Frontend Usage
```jsx
// SubjectSelector.jsx
const { assignments } = data;
assignments.map(subject => (
  <SubjectCard 
    key={subject.subjectId}
    name={subject.subjectName}
    studentCount={subject.totalStudents}
    onClick={() => navigate(`/dashboard/subject/${subject.subjectId}`)}
  />
));
```

---

## 2. Subject Dashboard

**Endpoint:** `GET /:teacherId/subject/:subjectId/dashboard`

**Use Case:** Main dashboard view after selecting a subject

### Request
```javascript
const response = await fetch(
  `/api/v1/teacher-dashboard/${teacherId}/subject/${subjectId}/dashboard`,
  { headers: { 'Authorization': `Bearer ${token}` } }
);
```

### Response
```json
{
  "success": true,
  "data": {
    "subject": { "_id": "sub123", "name": "Mathematics" },
    "overview": {
      "totalStudents": 67,
      "activeThisWeek": 52,
      "avgSubjectMastery": 0.68,
      "avgSubjectCoverage": 72,
      "studentsNeedingHelp": 8
    },
    "chapterProgress": [
      {
        "chapterId": "ch1",
        "name": "Linear Equations",
        "order": 1,
        "classAvgMastery": 0.82,
        "studentsCompleted": 60,
        "studentsInProgress": 5,
        "studentsNotStarted": 2,
        "status": "STRONG"
      },
      {
        "chapterId": "ch2",
        "name": "Quadratic Equations",
        "order": 2,
        "classAvgMastery": 0.45,
        "studentsCompleted": 10,
        "studentsInProgress": 40,
        "studentsNotStarted": 17,
        "status": "NEEDS_ATTENTION"
      }
    ],
    "topWeakTopics": [
      { "topicId": "t1", "name": "Discriminant", "chapterName": "Quadratic Equations", "studentsWeak": 25 }
    ],
    "classSummary": [
      { "classId": "cls9", "className": "Class 9", "sectionName": "A", "avgMastery": 0.72, "studentCount": 35 }
    ]
  }
}
```

### Status Colors
| Status | Color | Meaning |
|--------|-------|---------|
| `STRONG` | 🟢 Green | Avg mastery >= 70% |
| `ON_TRACK` | 🟡 Yellow | Avg mastery >= 50% |
| `NEEDS_ATTENTION` | 🔴 Red | Avg mastery < 50% |
| `NOT_STARTED` | ⚪ Gray | No progress yet |

---

## 3. Students List

**Endpoint:** `GET /:teacherId/subject/:subjectId/students`

**Query Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| `classId` | string | Filter by class |
| `sectionId` | string | Filter by section |
| `status` | string | `struggling`, `top`, `inactive` |
| `sortBy` | string | `name`, `mastery`, `coverage`, `lastPracticed` |
| `order` | string | `asc`, `desc` |

### Request
```javascript
const response = await fetch(
  `/api/v1/teacher-dashboard/${teacherId}/subject/${subjectId}/students?status=struggling&sortBy=mastery&order=asc`,
  { headers: { 'Authorization': `Bearer ${token}` } }
);
```

### Response
```json
{
  "success": true,
  "data": {
    "totalCount": 8,
    "students": [
      {
        "studentId": "stu1",
        "name": "Priya Singh",
        "email": "priya@school.com",
        "image": "https://...",
        "class": "Class 9",
        "section": "A",
        "subjectMastery": 0.32,
        "subjectCoverage": 45,
        "chaptersCompleted": 1,
        "totalChapters": 5,
        "lastPracticed": "2026-01-01T10:30:00Z",
        "status": "NEEDS_HELP",
        "weakTopicsCount": 6,
        "daysInactive": 5
      }
    ]
  }
}
```

### Student Status
| Status | Criteria | Badge Color |
|--------|----------|-------------|
| `STRONG` | Mastery >= 70% | Green |
| `ON_TRACK` | Mastery >= 50% | Blue |
| `NEEDS_REVISION` | Mastery >= 30% | Yellow |
| `NEEDS_HELP` | Mastery < 30% | Red |
| `NOT_STARTED` | No progress | Gray |

---

## 4. Chapter Analytics

**Endpoint:** `GET /:teacherId/subject/:subjectId/chapter/:chapterId/analytics`

**Query Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| `classId` | string | Filter by class |
| `sectionId` | string | Filter by section |

### Response
```json
{
  "success": true,
  "data": {
    "chapter": { "_id": "ch2", "name": "Quadratic Equations", "order": 2 },
    "overview": {
      "totalTopics": 8,
      "classAvgCoverage": 65,
      "classAvgMastery": 0.48
    },
    "topics": [
      {
        "topicId": "t1",
        "name": "Discriminant",
        "classAvgMastery": 0.35,
        "masteryDistribution": {
          "MASTERED": 5,
          "PRACTICING": 15,
          "LEARNING": 22,
          "WEAK": 25
        },
        "studentsAttempted": 67,
        "studentsTotal": 67,
        "status": "CRITICAL"
      }
    ],
    "strugglingStudents": [
      { "studentId": "stu1", "name": "Rahul", "image": "...", "masteryScore": 0.2, "weakTopics": 4 }
    ]
  }
}
```

### Topic Status
| Status | Criteria |
|--------|----------|
| `CRITICAL` | >= 30% students are WEAK |
| `ON_TRACK` | Avg mastery >= 70% |
| `NEEDS_ATTENTION` | Everything else |

---

## 5. Individual Student Progress

**Endpoint:** `GET /:teacherId/student/:studentId/subject/:subjectId/progress`

### Response
```json
{
  "success": true,
  "data": {
    "student": {
      "_id": "stu1",
      "name": "Priya Singh",
      "email": "priya@school.com",
      "image": "...",
      "class": "Class 9-A"
    },
    "subjectSummary": {
      "subjectId": "sub1",
      "subjectName": "Mathematics",
      "overallMastery": 0.32,
      "overallCoverage": 45,
      "chaptersStarted": 2,
      "totalChapters": 5,
      "totalTimeSpent": 180,
      "lastActive": "2026-01-01T10:30:00Z"
    },
    "chapters": [
      {
        "chapterId": "ch1",
        "name": "Linear Equations",
        "order": 1,
        "status": "WEAK",
        "coverage": 80,
        "mastery": 0.4,
        "topics": [
          {
            "topicId": "t1",
            "name": "Solving for x",
            "masteryState": "LEARNING",
            "masteryScore": 0.55,
            "lastPracticedAt": "2026-01-01T10:30:00Z"
          }
        ]
      }
    ],
    "weakTopics": [
      { "topicId": "t2", "name": "Word Problems", "chapterName": "Linear Equations", "masteryScore": 0.25 }
    ],
    "recommendations": [
      "Focus on 5 weak topics across chapters",
      "Student has not started 3 chapters yet"
    ]
  }
}
```

### Mastery States
| State | Score Range | Icon |
|-------|-------------|------|
| `MASTERED` | >= 70% | ✅ |
| `PRACTICING` | >= 50% | 📈 |
| `LEARNING` | >= 30% | 📖 |
| `WEAK` | < 30% | ⚠️ |
| `NOT_ATTEMPTED` | 0% | ➖ |

---

## 6. Weak Topics Report

**Endpoint:** `GET /:teacherId/subject/:subjectId/weak-topics`

**Query Parameters:**
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `classId` | string | - | Filter by class |
| `sectionId` | string | - | Filter by section |
| `threshold` | number | 0.4 | Mastery threshold |

### Response
```json
{
  "success": true,
  "data": {
    "totalWeakTopics": 5,
    "topics": [
      {
        "topicId": "t1",
        "name": "Discriminant",
        "chapterName": "Quadratic Equations",
        "studentsWeak": 25,
        "totalStudents": 67,
        "weakPercentage": 37,
        "avgMastery": 0.28,
        "difficulty": {
          "easyAccuracy": 0.6,
          "mediumAccuracy": 0.3,
          "hardAccuracy": 0.1
        },
        "teacherAction": "HIGH_PRIORITY"
      }
    ],
    "classroomRecommendation": "Consider revisiting \"Quadratic Equations\" focusing on Discriminant concept."
  }
}
```

### Teacher Action Badges
| Action | Criteria | Color |
|--------|----------|-------|
| `HIGH_PRIORITY` | >= 40% weak | 🔴 Red |
| `MEDIUM_PRIORITY` | >= 25% weak | 🟡 Yellow |
| `MONITOR` | < 25% weak | 🟢 Green |

---

## 7. Activity Feed

**Endpoint:** `GET /:teacherId/subject/:subjectId/activity`

**Query Parameters:**
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `limit` | number | 20 | Max activities to return |

### Response
```json
{
  "success": true,
  "data": {
    "activities": [
      {
        "type": "SESSION_COMPLETED",
        "student": {
          "_id": "stu1",
          "name": "Aarav",
          "image": "https://..."
        },
        "timestamp": "2026-01-05T15:30:00Z",
        "chapter": "Quadratic Equations",
        "score": 0.8,
        "questionsAttempted": 10,
        "correctAnswers": 8
      }
    ]
  }
}
```

---

## Error Responses

All endpoints return errors in this format:

```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error message"
}
```

| Status Code | Meaning |
|-------------|---------|
| 400 | Bad Request |
| 403 | Not authorized (not assigned to this student/subject) |
| 404 | Resource not found |
| 500 | Server error |

---

## TypeScript Interfaces

```typescript
interface TeacherAssignment {
  subjectId: string;
  subjectName: string;
  classes: ClassInfo[];
  totalStudents: number;
}

interface StudentProgress {
  studentId: string;
  name: string;
  email: string;
  image: string;
  class: string;
  section: string;
  subjectMastery: number;
  subjectCoverage: number;
  chaptersCompleted: number;
  totalChapters: number;
  lastPracticed: string | null;
  status: 'STRONG' | 'ON_TRACK' | 'NEEDS_REVISION' | 'NEEDS_HELP' | 'NOT_STARTED';
  weakTopicsCount: number;
  daysInactive: number | null;
}

interface ChapterProgress {
  chapterId: string;
  name: string;
  order: number;
  classAvgMastery: number;
  studentsCompleted: number;
  studentsInProgress: number;
  studentsNotStarted: number;
  status: 'STRONG' | 'ON_TRACK' | 'NEEDS_ATTENTION' | 'NOT_STARTED';
}

interface WeakTopic {
  topicId: string;
  name: string;
  chapterName: string;
  studentsWeak: number;
  totalStudents: number;
  weakPercentage: number;
  avgMastery: number;
  teacherAction: 'HIGH_PRIORITY' | 'MEDIUM_PRIORITY' | 'MONITOR';
}
```

---

## Suggested UI Flow

```
1. Teacher Login
       ↓
2. My Assignments (API #1)
   - Show subject cards
       ↓
3. Click Subject → Subject Dashboard (API #2)
   - Overview stats cards
   - Chapter progress bars
   - Quick weak topics list
       ↓
4. Navigation Options:
   ├── "View Students" → Students List (API #3)
   │      └── Click student → Student Progress (API #5)
   ├── "Chapter X" → Chapter Analytics (API #4)
   ├── "Weak Topics" → Weak Topics Report (API #6)
   └── "Activity" → Activity Feed (API #7)
```
