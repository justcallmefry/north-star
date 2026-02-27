# Premium UX suggestions

Concrete ideas to make the app feel more polished and premium, without a full redesign.

---

## High impact, low effort

1. **Skeleton loaders instead of spinner**
   - **Where:** App home (today card + sections), history list, quiz/agreement when loading.
   - **Why:** Reduces perceived wait and feels more intentional. Show a skeleton that matches the Today card / history card layout.
   - **How:** Add a `TodayCardSkeleton` and use it in the app loading state or while `relationshipId` is resolving; same idea for history and quiz.

2. **Brief success feedback after actions**
   - **Where:** After submitting today’s answer, after reveal, after saving a reflection, after quiz/agreement submit.
   - **Why:** Right now the only feedback is “Done!” or a full refresh. A short toast (e.g. “Saved” or “Answer saved”) makes the app feel responsive and confirms the action.
   - **How:** Add a lightweight toast (e.g. `sonner` or a small custom toast) and call it after successful server actions.

3. **Reveal moment**
   - **Where:** The line “You showed up for each other today.” after reveal.
   - **Why:** This is a key moment; giving it a bit more visual weight (slightly larger type, soft background, or a short delay before it appears) makes it feel like a moment, not just another line of text.
   - **How:** Wrap in a small “moment” block (e.g. subtle gradient or border, `text-lg` / `font-medium`), optionally with a 200–300 ms delay before showing.

4. **Button active/press state**
   - **Where:** Primary and secondary buttons (`.ns-btn-primary`, `.ns-btn-secondary`).
   - **Why:** A subtle scale or opacity change on press (and maybe hover on desktop) makes taps feel more responsive and polished.
   - **How:** Add `active:scale-[0.98]` or `active:opacity-90` and optionally `transition-transform` in `globals.css` for the button classes.

---

## Medium impact

5. **Today CTA emphasis**
   - When the primary action is “Answer today’s question,” add a very subtle emphasis (e.g. soft pulse or glow) so it’s clearly the main action. Keep it calm so it doesn’t feel pushy.

6. **Error presentation**
   - Show errors in a small card or inline block with an icon (e.g. alert circle) instead of plain red text. Makes errors feel part of the design and easier to notice.

7. **History: “Back to top”**
   - After “Load more” and a long list, a small “Back to top” or scroll-to-top control improves navigation and feels considerate.

8. **Sidebar nav hover**
   - On desktop, a very subtle background or shadow change on sidebar links on hover (you already have `hover:bg-white/80`) — could add a tiny `transition-colors` so it’s smooth.

---

## Nice to have

9. **Short route transition**
   - A 100–150 ms fade or opacity transition when navigating between app routes (e.g. Today → Session → History) so transitions don’t feel abrupt. Can be done with a layout-level wrapper and CSS or View Transitions when supported.

10. **Empty state copy**
   - Add one short, encouraging line to empty states (e.g. “Answer today’s question to see your first entry here”) so the next step is obvious.

11. **Input focus ring**
   - Ensure all inputs and buttons have a consistent, visible focus ring (for keyboard and a11y). You may already have this; worth a quick pass.

12. **Form validation feedback**
   - Optional: on blur, show a small checkmark or green border when a required field is valid. Reduces doubt and feels polished.

---

## Implementation order

- **Quick wins:** 4 (button active state), 8 (sidebar transition). Can do in a few minutes.
- **High value:** 1 (skeletons), 2 (toasts), 3 (reveal moment). Each is a small, scoped change.
- **When you have time:** 5, 6, 7, then 9–12 as needed.

If you tell me which numbers you want first, I can implement them in the aligned app (and optionally mirror to parent-teen/friends).
