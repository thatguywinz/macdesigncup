/**
 * Move keyboard focus to the section a link just scrolled to, the way a
 * native in-page jump does. Without this, preventing the default click would
 * leave focus on the link, so the next Tab (after "Skip to content", say)
 * would start from the top of the page again. The target gets tabindex -1
 * only if it is not focusable already, and no outline: it is a landing
 * point, not a control. Shared by SectionLink and the hero's Enter button.
 */
export function focusTarget(target: HTMLElement) {
  if (!target.matches("a[href], button, input, select, textarea, summary, [tabindex]")) {
    target.setAttribute("tabindex", "-1");
    target.style.outline = "none";
  }
  target.focus({ preventScroll: true });
}

export default focusTarget;
