

# Improve Airbnb Date Selection UX

The current booking dialog requires users to tap two dates on a small calendar, then optionally type a number of nights -- it's not intuitive. Here's the plan to make it friendlier and more Airbnb-like.

## What Changes

### 1. Quick Night Presets
Replace the manual "enter number of nights" input with quick-tap pill buttons: **1 night**, **2 nights**, **3 nights**, **5 nights**, **7 nights**. Tapping one auto-sets the end date based on the selected check-in date. Much faster than typing.

### 2. Clearer Check-in / Check-out Display
Add a visual header above the calendar showing the selected **Check-in** and **Check-out** dates in a two-column layout (like Airbnb). This gives users instant feedback on what they've picked, with placeholder text ("Select date") when nothing is chosen yet.

### 3. Better Guidance Text
Add helper text: "Tap your check-in date, then tap your check-out date" so users know exactly what to do. Update to "Now tap your check-out date" after check-in is selected.

### 4. Auto-advance to Payment
Once both dates are selected (nights > 0), show the booking summary immediately with a prominent "Continue to Payment" button -- keeping the flow smooth.

### 5. Clear Dates Button
Add a small "Clear dates" link so users can easily reset without closing the dialog.

---

## Technical Details

**File: `src/components/booking/BookingDialog.tsx`**

- Remove the `nightsInput` state and the number input + Apply button
- Add quick-select preset buttons (1, 2, 3, 5, 7 nights) that call `setDateRange({ from: dateRange.from, to: addDays(dateRange.from, n) })`
- Add a date display header with two columns (Check-in / Check-out) above the calendar
- Add dynamic helper text based on selection state
- Add a "Clear dates" reset button
- Keep the calendar with `mode="range"` and `pointer-events-auto`

No new dependencies or files needed -- this is a UI-only refactor of the existing BookingDialog component.
