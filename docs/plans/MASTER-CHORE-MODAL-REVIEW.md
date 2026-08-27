# Master Chore Modal — Backend Field Verification

**Date:** 2026-08-27
**Purpose:** Verify mockup fields against backend model and identify gaps

---

## 1. Field Comparison: Mockup vs Backend

### Mockup Fields (master-chore-modal.html)

| Field | Mockup | Backend Model | Status |
|-------|--------|---------------|--------|
| Name | ✅ Text input | `name: str` | ✅ Match |
| Category | ✅ Combobox | `category_id: UUID` | ✅ Match (needs ID mapping) |
| Tags | ✅ Tag input | `tag_ids: list[UUID]` | ✅ Match (needs ID mapping) |
| Difficulty | ✅ Slider 1-5 | `difficulty: int (1-5)` | ✅ Match |
| Recurrence Pattern | ⚠️ Partial | `recurrence_rule: dict` | ️ See below |
| Time | ✅ HH:MM input | `recurrence_rule.time: str` | ✅ Match |
| Estimated Minutes | ✅ Number input | `estimated_minutes: int` | ✅ Match |
| Due Time | ✅ HH:MM input | `due_time: str` | ✅ Match |
| Due Date | ❌ Missing | `due_date: date` |  **MISSING** |
| When Overdue | ✅ Dropdown | `expiration_behavior: str` | ✅ Match |
| End Date | ✅ Date picker | `end_date: date` | ✅ Match |
| Max Occurrences | ✅ Number input | `max_occurrences: int` | ✅ Match |
| Collaborative | ✅ Toggle | `is_collaborative: bool` | ✅ Match |
| Conditions | ✅ "Coming soon" | `conditions: dict` | ✅ Deferred |

---

## 2. Recurrence Pattern — Critical Gap

### Backend RecurrenceRule Schema

```python
class RecurrenceRule(BaseModel):
    frequency: Literal["once", "daily", "weekly", "monthly", "yearly"]
    time: str  # HH:MM 24-hour format (required for all frequencies)
    
    day_of_week: int | None = None      # 0=Monday, 6=Sunday
    day_of_month: int | None = None     # 1-31
    week_of_month: int | None = None    # 1-5
    month: int | None = None            # 1-12
```

### Validation Rules (from backend)

| Frequency | Required Fields | Example |
|-----------|----------------|---------|
| `once` | None | `{"frequency": "once", "time": "18:00"}` |
| `daily` | None | `{"frequency": "daily", "time": "08:00"}` |
| `weekly` | `day_of_week` | `{"frequency": "weekly", "day_of_week": 0, "time": "09:00"}` |
| `monthly` | `day_of_month` OR (`day_of_week` + `week_of_month`) | `{"frequency": "monthly", "day_of_month": 15, "time": "10:00"}` |
| `yearly` | `month` + (`day_of_month` OR (`day_of_week` + `week_of_month`)) | `{"frequency": "yearly", "month": 11, "day_of_week": 3, "week_of_month": 4, "time": "12:00"}` |

### Mockup Gap Analysis

**Current mockup shows:**
- Frequency dropdown (Once/Daily/Weekly/Monthly/Yearly)
- Time input (HH:MM)
- Conditional day-of-week picker (hidden, shown for Weekly)

**Missing conditional fields:**

| Frequency | Missing UI Fields |
|-----------|------------------|
| **Daily** |  Start date (when does daily begin?) |
| **Weekly** | ✅ Day of week picker (exists but hidden) |
| **Monthly** | ❌ Day of month picker (1-31) |
| **Monthly** | ❌ "Nth weekday" option (e.g., "First Monday") |
| **Yearly** | ❌ Month picker (Jan-Dec) |
| **Yearly** | ❌ Day of month OR "Nth weekday" option |

### Start Date Issue

**User's question:** "How can someone set Daily frequency, but daily every monday, or every tuesday, or every wednesday, or at a specific date for example September 3rd, 2027 as the beginning of the daily occurrence?"

**Backend answer:** The backend does NOT have a `start_date` field in `RecurrenceRule`. Instead:

1. **Daily frequency** generates instances for EVERY day starting from when the master is created/activated
2. **Weekly frequency** generates instances for the specified day_of_week (e.g., every Monday)
3. **Monthly frequency** generates instances for the specified day (e.g., 15th of every month)
4. **Yearly frequency** generates instances for the specified date (e.g., Nov 15 every year)

**The "start date" is implicit** — it's when the master chore is created or activated. The backend uses `reference_date` (usually today) to calculate the next occurrence.

**Example:**
- Create "Wipe Counter" with `frequency: "daily", time: "18:00"` on Aug 27, 2026
- Backend generates instance for Aug 27 at 18:00
- Next instance: Aug 28 at 18:00
- Next: Aug 29 at 18:00, etc.

**If user wants to start on Sept 3, 2027:**
- Option 1: Create the master on Sept 3, 2027 (not practical)
- Option 2: Use `end_date` to limit occurrences (but this doesn't set start)
- Option 3: **Backend needs a `start_date` field** (currently missing)

**Decision:** Defer to future feature. Backend gap documented. For v1, chores start immediately upon creation/activation.

---

## 3. Due Time vs Due Date

### Backend Fields

```python
due_time: str | None = None      # Time-of-day deadline (e.g., "18:00")
due_date: date | None = None     # Specific due date (e.g., "2026-09-03")
```

### Purpose

- **`due_time`**: "This chore must be completed by 6:00 PM today"
- **`due_date`**: "This chore must be completed by Sept 3, 2026" (for one-time or specific-date chores)

### Mockup Gap

**Current mockup shows:**
- Due Time (HH:MM input) ✅
- Due Date ❌ **MISSING**

**Recommendation:** Add Due Date field to mockup.

---

## 4. "When Overdue" — Backend Logic Walkthrough

### Backend Enum

```python
class ExpirationBehavior(StrEnum):
    DISAPPEAR = "disappear"          # Instance is removed entirely
    CARRY_OVER = "carry_over"        # New instance generated for next period
    STAY_VISIBLE = "stay_visible"    # Instance remains, marked as missed
    CONVERT_TO_OPEN = "convert_to_open"  # Instance moves to open pool
```

### User-Facing Translation

| Mockup Label | Backend Value | Behavior |
|--------------|---------------|----------|
| "Disappear" | `disappear` | Instance is deleted when period ends without completion |
| "Carry Over" | `carry_over` | A new instance is automatically created for the next period |
| "Stay Visible" | `stay_visible` | Instance stays on the board, status changes to "missed" |
| "Convert to Open Pool" | `convert_to_open` | Instance moves from member's column to Open Pool (anyone can claim) |

### Example Scenarios

**Scenario 1: "Wipe Counter" (Daily at 6 PM, Disappear)**
- Monday 6 PM: Instance created for Monday
- Tuesday 6 PM: Monday's instance not completed → **deleted**
- Tuesday 6 PM: New instance created for Tuesday

**Scenario 2: "Cook Dinner" (Daily at 6 PM, Carry Over)**
- Monday 6 PM: Instance created for Monday
- Tuesday 6 PM: Monday's instance not completed → **new instance created for Tuesday**
- Result: Two instances exist (Monday's carried over + Tuesday's new)

**Scenario 3: "Vacuum Living Room" (Weekly Monday, Stay Visible)**
- Monday 10 AM: Instance created for this week
- Next Monday 10 AM: Previous week's instance not completed → **stays on board, marked "missed"**
- New instance created for this week
- Result: User sees both missed and current instances

**Scenario 4: "Take Out Trash" (Daily at 7 PM, Convert to Open Pool)**
- Monday 7 PM: Instance assigned to Faiyaz
- Tuesday 7 PM: Faiyaz didn't complete → **moves to Open Pool**
- Any family member can now claim it

### Mockup Status

**Current mockup dropdown options:**
- ✅ "Carry Over"
- ✅ "Disappear"
- ✅ "Stay Visible"
- ✅ "Convert to Open Pool"

**All 4 options match backend. No changes needed.**

---

## 5. Recommended Mockup Updates

### Critical (Must Fix) — ✅ COMPLETED

1. **Add conditional fields for Recurrence Pattern:**
   - **Weekly:** Show day-of-week picker ✅ Added (visible in mockup)
   - **Monthly:** Show "Day of month" (1-31) OR "Nth weekday" picker ✅ Added (hidden, shown when Monthly selected)
   - **Yearly:** Show month picker (Jan-Dec) + day-of-month ✅ Added (hidden, shown when Yearly selected)

2. **Add Due Date field** (next to Due Time) ✅ Added

### Important (Deferred)

3. **Start Date field** — Backend gap, deferred to future feature
   - Field: `start_date: date | None`
   - Purpose: "First occurrence on [date]"
   - For v1: Chores start immediately upon creation/activation

### Nice to Have (Deferred)

4. **Helper text** for each frequency explaining what it does
   - Can be added during implementation phase

---

## 6. Updated Mockup Field List

### Complete Field List (Backend-Aligned)

| Section | Field | Type | Required | Backend Field |
|---------|-------|------|----------|---------------|
| **Basic Info** | Name | Text input | ✅ | `name` |
| **Basic Info** | Category | Combobox | ✅ | `category_id` |
| **Basic Info** | Tags | Tag input |  | `tag_ids` |
| **Basic Info** | Difficulty | Slider 1-5 | ✅ (default 1) | `difficulty` |
| **Recurrence** | Frequency | Dropdown | ✅ | `recurrence_rule.frequency` |
| **Recurrence** | Time | HH:MM input | ✅ | `recurrence_rule.time` |
| **Recurrence** | Day of Week | Multi-select | ⚠️ (weekly only) | `recurrence_rule.day_of_week` |
| **Recurrence** | Day of Month | Number 1-31 | ⚠️ (monthly/yearly) | `recurrence_rule.day_of_month` |
| **Recurrence** | Week of Month | Dropdown 1-5 | ⚠️ (monthly/yearly) | `recurrence_rule.week_of_month` |
| **Recurrence** | Month | Dropdown Jan-Dec | ⚠️ (yearly only) | `recurrence_rule.month` |
| **Recurrence** | Start Date | Date picker | ❌ | **MISSING FROM BACKEND** |
| **Timing** | Estimated Minutes | Number input | ❌ | `estimated_minutes` |
| **Timing** | Due Time | HH:MM input | ❌ | `due_time` |
| **Timing** | Due Date | Date picker | ❌ | `due_date` |
| **Expiration** | When Overdue | Dropdown | ✅ (default disappear) | `expiration_behavior` |
| **Limits** | End Date | Date picker | ❌ | `end_date` |
| **Limits** | Max Occurrences | Number input | ❌ | `max_occurrences` |
| **Advanced** | Collaborative | Toggle | ❌ (default false) | `is_collaborative` |
| **Advanced** | Conditions | Deferred | N/A | `conditions` |

---

## 7. Next Steps

1. ✅ **Mockup updated** with conditional recurrence fields (Weekly, Monthly, Yearly)
2. ✅ **Due Date field** added to mockup
3. ✅ **Start Date** deferred to future feature (backend gap documented)
4. **Review updated mockup** with user — `mockups/master-chore-modal.html`

### Backend Gap (Future Feature)

**Missing field:** `start_date` in `RecurrenceRule`

**Architecture clarification:**
- Master chore template is just a definition — no instances generated until association
- Association triggers recurrence start — first instance generated based on `reference_date` (today)
- Master can sit unassociated indefinitely without generating anything

**When `start_date` would be useful:**
- "I want to create a master today, but don't associate it until next month"
- Currently: If you associate today, first instance is based on today's date
- With `start_date`: "Associate today, but first instance should be Sept 15"

**Impact:** Low for v1. Users can simply wait to associate until they want instances to start.

**Proposed solution (future):**
- Add `start_date: date | None = None` to `RecurrenceRule` schema
- Update `calculate_period()` to use `start_date` instead of `reference_date` when provided
- Add `start_date` field to frontend modal

**Priority:** Low for v1. Can be added in future release.
