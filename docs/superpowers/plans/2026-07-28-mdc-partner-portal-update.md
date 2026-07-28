# MDC 2026 Partner Portal Update Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Update the Industry Partner Portal webpage for Mackenzie Design Cup 2026 to optimize conversion for prospective sponsors, provide clear actionable logistics for confirmed partners, and fix inaccurate/placeholder text based on the official Partner Information Package.

**Architecture:** Modular React component updates using existing patterns. Will modify existing sections and create new components following the established codebase structure with framer-motion animations and Tailwind CSS styling.

**Tech Stack:** React, TypeScript, Framer Motion, Tailwind CSS

## Global Constraints
- Maintain existing codebase patterns and conventions
- Use existing framer-motion animation patterns
- Follow Tailwind CSS utility class conventions from existing code
- Keep all existing functionality intact while updating content
- Use the existing Countdown component foundation
- EVENT_DATE must be set to "2026-11-16T08:00:00-05:00" (EST)
- Update section ordering to place Confirmed Partners section appropriately
- Preserve accessibility features and semantic HTML

---
### Task 1: Update site configuration with event date

**Files:**
- Modify: `src/config/site.ts:14-16`

**Interfaces:**
- Consumes: None
- Produces: Updated EVENT_DATE constant

- [ ] **Step 1: Write the failing test**

Actually, this is a configuration update that doesn't require unit testing in this codebase context. We'll verify by checking the value renders correctly.

- [ ] **Step 2: Update EVENT_DATE constant**

```typescript
// TODO: set the real event date (ISO string, e.g. "2026-03-07T09:00:00-05:00").
// While null, the countdown renders its "date announced soon" state.
export const EVENT_DATE: string | null = "2026-11-16T08:00:00-05:00";
```

- [ ] **Step 3: Verify the change**

Check that the file was updated correctly by viewing the content.

- [ ] **Step 4: Commit**

```bash
git add src/config/site.ts
git commit -m "feat: set EVENT_DATE for MDC 2026 countdown timer"
```

### Task 2: Remove conflicting hero badge and ensure countdown works

**Files:**
- Modify: `src/pages/partner/index.tsx:28-31`

**Interfaces:**
- Consumes: None
- Produces: Updated hero section without conflicting badge

- [ ] **Step 1: Write the failing test**

This is a UI change that will be verified visually/manualy. No automated test needed.

- [ ] **Step 2: Remove the conflicting badge**

Remove lines 28-31:
```typescript
{/* Tagline Badge */}
<span className="flex items-center gap-2 rounded-md bg-ember/20 px-3 py-1 text-xs font-mono uppercase tracking-[0.3em] text-ember">
  MDC 2026 • INDUSTRY PARTNER PORTAL
</span>
```

Replace with empty space or remove entirely. Looking at the design, we want to remove this badge completely.

- [ ] **Step 3: Verify the hero section renders without the badge**

Check that the hero section now starts directly with the headline.

- [ ] **Step 4: Commit**

```bash
git add src/pages/partner/index.tsx
git commit -m "fix: remove conflicting hero badge from partner page"
```

### Task 3: Create expanded WhyPartnerSection with new content

**Files:**
- Create: `src/pages/partner/sections/WhyPartnerSection.tsx` (complete replacement)

**Interfaces:**
- Consumes: None (standalone section)
- Produces: Enhanced Why Partner section with narrative pitch, value pillars, metrics bar, and support callout

- [ ] **Step 1: Write the failing test**

This is a UI component change verified through visual inspection.

- [ ] **Step 2: Implement the new WhyPartnerSection component**

```typescript
import { motion, useReducedMotion } from "framer-motion";

const EASE = [0.22, 1, 0.36, 1];

export default function WhyPartnerSection() {
  const reduce = useReducedMotion();

  const reveal = (delay = 0) => ({
    initial: reduce ? false : ({ opacity: 0, y: 22 } as const),
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, margin: "-80px" } as const,
    transition: { duration: 0.8, ease: EASE, delay },
  });

  return (
    <section id="why" className="relative z-10 border-t border-line px-5 py-24 md:px-10 md:py-32">
      <div className="mx-auto max-w-[1300px]">
        {/* header */}
        <div className="mb-6 flex items-baseline gap-4">
          <span className="mono-label whitespace-nowrap !text-foreground/70">[  · ]</span>
          <span className="ember-rule flex-1 opacity-40" aria-hidden="true" />
        </div>

        <motion.h2 {...reveal()} className="display-scene mb-8">
          <span className="block">Why Partner with MDC 2026?</span>
          <span className="wire-text block">• Fuel the Next Generation of Innovators</span>
        </motion.h2>

        {/* Narrative Pitch Box */}
        <motion.p {...reveal(0.1)} className="max-w-xl font-body text-base font-light leading-relaxed text-concrete">
          The Mackenzie Design Cup (MDC 2026) is Toronto’s premier student-led 3D designathon. Hosted at George Brown College's Waterfront Campus, MDC brings together 80+ of the most passionate high school CAD competitors across the TDSB. As an industry partner, you aren't just placing a logo on a banner—you are directly bridging the gap between classroom CAD skills and real-world engineering careers.
        </motion.p>

        {/* Value Pillars Grid */}
        <motion.div {...reveal(0.2)} className="mt-12 grid gap-6 sm:grid-cols-1 lg:grid-cols-4">
          {/* Direct Youth & STEM Impact */}
          <div className="flex min-h-[150px] flex-col items-center justify-center gap-3 border border-dashed border-line bg-background/40 p-6">
            <div className="text-center space-y-2">
              <div className="flex items-center justify-center w-8 h-8 bg-ember/20 rounded-full">
                <span className="text-ember text-sm font-mono">•</span>
              </div>
              <h3 className="font-display text-lg uppercase tracking-[0.01em] text-foreground">Direct Youth & STEM Impact</h3>
              <p className="text-concrete text-center">
                Expose ambitious high schoolers (Grades 9–12) to real-world design, engineering, and product development workflows.
                Help students see 3D design as a viable post-secondary path and career choice, not just a high school elective.
              </p>
            </div>
          </div>
          
          {/* Technology & Hardware Showcase */}
          <div className="flex min-h-[150px] flex-col items-center justify-center gap-3 border border-dashed border-line bg-background/40 p-6">
            <div className="text-center space-y-2">
              <div className="flex items-center justify-center w-8 h-8 bg-ember/20 rounded-full">
                <span className="text-ember text-sm font-mono">•</span>
              </div>
              <h3 className="font-display text-lg uppercase tracking-[0.01em] text-foreground">Technology & Hardware Showcase</h3>
              <p className="text-concrete text-center">
                Put your tools directly into the hands of future power-users.
                Set up dedicated exhibit tables or run live hardware demos—including 3D printers, scanners, VR gear, or CAD software—right in the main hall.
              </p>
            </div>
          </div>
          
          {/* Brand & Community Visibility */}
          <div className="flex min-h-[150px] flex-col items-center justify-center gap-3 border border-dashed border-line bg-background/40 p-6">
            <div className="text-center space-y-2">
              <div className="flex items-center justify-center w-8 h-8 bg-ember/20 rounded-full">
                <span className="text-ember text-sm font-mono">•</span>
              </div>
              <h3 className="font-display text-lg uppercase tracking-[0.01em] text-foreground">Brand & Community Visibility</h3>
              <p className="text-concrete text-center">
                Position your organization as a leader in educational outreach and STEM innovation.
                Gain prominent exposure across event signage, presentation slides, student award certificates, and our official Instagram (@wlmac.3ddesign).
              </p>
            </div>
          </div>
          
          {/* Flexible, High-Value Involvement */}
          <div className="flex min-h-[150px] flex-col items-center justify-center gap-3 border border-dashed border-line bg-background/40 p-6">
            <div className="text-center space-y-2">
              <div className="flex items-center justify-center w-8 h-8 bg-ember/20 rounded-full">
                <span className="text-ember text-sm font-mono">•</span>
              </div>
              <h3 className="font-display text-lg uppercase tracking-[0.01em] text-foreground">Flexible, High-Value Involvement</h3>
              <p className="text-concrete text-center">
                We respect your team's busy calendar. Attendance for the full day is never required—we tailor custom time slots for guest speaking, design feedback, or judging to fit your availability.
                Key roles include guest speaking, mentoring during design sprints, evaluating final presentations, or donating hardware/swag.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Key Metrics Bar */}
        <motion.div {...reveal(0.3)} className="mt-12 grid grid-cols-2 gap-x-4 gap-y-4 text-[11px] font-mono uppercase tracking-[0.28em] text-concrete md:grid-cols-4">
          <div className="flex flex-col gap-1">
            <span>80+</span>
            <span className="text-foreground">Hand-picked TDSB CAD competitors (Grades 9–12)</span>
          </div>
          <div className="flex flex-col gap-1">
            <span>1 Day</span>
            <span className="text-foreground">High-intensity CAD design sprint at George Brown College</span>
          </div>
          <div className="flex flex-col gap-1">
            <span>100% Free</span>
            <span className="text-foreground">Zero cost barrier for participating students</span>
          </div>
          <div className="flex flex-col gap-1">
            <span>Student-Led</span>
            <span className="text-foreground">Organized by the WLMAC 3D Design Club executive team</span>
          </div>
        </motion.div>

        {/* In-Kind & Flexible Support Callout */}
        <motion.div {...reveal(0.4)} className="mt-12 flex flex-col items-center gap-4 border border-dashed border-ember/50 bg-background/40 p-6">
          <div className="text-center space-y-2">
            <div className="flex items-center justify-center w-8 h-8 bg-ember/20 rounded-full">
              <span className="text-ember text-sm font-mono">💡</span>
            </div>
            <p className="text-concrete text-center">
              Flexible Ways to Support: Cash sponsorship isn't the only way to help! We strongly welcome in-kind hardware support (loaning 3D printers or scanners), software licenses/credits, company swag (stickers, lanyards, tech accessories), or prize donations for top design winners.
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
```

- [ ] **Step 3: Verify the component renders correctly**

Check that all sections display properly with correct styling and animations.

- [ ] **Step 4: Commit**

```bash
git add src/pages/partner/sections/WhyPartnerSection.tsx
git commit -m "feat: implement expanded WhyPartnerSection with narrative pitch and value pillars"
```

### Task 4: Create Confirmed Partners Section

**Files:**
- Create: `src/pages/partner/sections/ConfirmedPartnersSection.tsx`

**Interfaces:**
- Consumes: None (standalone section)
- Produces: New section for confirmed partners with checklist and logistics info

- [ ] **Step 1: Write the failing test**

UI component change verified visually.

- [ ] **Step 2: Implement the ConfirmedPartnersSection component**

```typescript
import { motion, useReducedMotion } from "framer-motion";

const EASE = [0.22, 1, 0.36, 1];

export default function ConfirmedPartnersSection() {
  const reduce = useReducedMotion();

  const reveal = (delay = 0) => ({
    initial: reduce ? false : ({ opacity: 0, y: 22 } as const),
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, margin: "-80px" } as const,
    transition: { duration: 0.8, ease: EASE, delay },
  });

  return (
    <section id="confirmed-partners" className="relative z-10 border-t border-line px-5 py-24 md:px-10 md:py-32">
      <div className="mx-auto max-w-[1300px]">
        {/* header */}
        <div className="mb-6 flex items-baseline gap-4">
          <span className="mono-label whitespace-nowrap !text-foreground/70">[  · ]</span>
          <span className="ember-rule flex-1 opacity-40" aria-hidden="true" />
        </div>

        <motion.h2 {...reveal()} className="display-scene mb-8">
          <span className="block">For Confirmed Partners</span>
          <span className="wire-text block">• Onboarding & Next Steps</span>
        </motion.h2>

        {/* Confirmed Partner Checklist Box */}
        <motion.div {...reveal(0.1)} className="mt-12 space-y-8">
          {/* Representative Info */}
          <div className="flex flex-col gap-3">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center w-8 h-8 bg-ember/20 rounded-full">
                  <span className="text-ember text-sm font-mono">•</span>
                </div>
              </div>
              <div>
                <h3 className="font-display text-lg uppercase tracking-[0.01em] text-foreground">Representative Info (Action Required by August)</h3>
                <p className="text-concrete">
                  To process TDSB and venue security clearances, please submit the names, roles, contact emails, and phone numbers of all attending representatives via the onboarding form.
                </p>
              </div>
            </div>
          </div>
          
          {/* Fall Briefing Package */}
          <div className="flex flex-col gap-3">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center w-8 h-8 bg-ember/20 rounded-full">
                  <span className="text-ember text-sm font-mono">•</span>
                </div>
              </div>
              <div>
                <h3 className="font-display text-lg uppercase tracking-[0.01em] text-foreground">Fall Briefing Package (Coming September 2026)</h3>
                <p className="text-concrete">
                  Registered contacts will receive a complete briefing containing arrival schedules, parking passes, AV/projector specs, Wi-Fi access, and on-site emergency contact numbers.
                </p>
              </div>
            </div>
          </div>
          
          {/* On-Site Perks & Hospitality */}
          <div className="flex flex-col gap-3">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center w-8 h-8 bg-ember/20 rounded-full">
                  <span className="text-ember text-sm font-mono">•</span>
                </div>
              </div>
              <div>
                <h3 className="font-display text-lg uppercase tracking-[0.01em] text-foreground">On-Site Perks & Hospitality</h3>
                <p className="text-concrete">
                  Complimentary lunch and refreshments are provided on-site for all guest speakers, mentors, and judges.
                </p>
              </div>
            </div>
          </div>
          
          {/* Swag & Equipment Drops */}
          <div className="flex flex-col gap-3">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center w-8 h-8 bg-ember/20 rounded-full">
                  <span className="text-ember text-sm font-mono">•</span>
                </div>
              </div>
              <div>
                <h3 className="font-display text-lg uppercase tracking-[0.01em] text-foreground">Swag & Equipment Drops</h3>
                <p className="text-concrete">
                  Shipping and drop-off instructions for company swag and display equipment will be emailed directly to your primary contact.
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Enhanced Compliance Notice */}
        <motion.div {...reveal(0.2)} className="mt-12 flex flex-col items-center gap-4 border border-dashed border-ember/50 bg-background/40 p-6">
          <div className="text-center space-y-2">
            <div className="flex items-center justify-center w-8 h-8 bg-ember/20 rounded-full">
              <span className="text-ember text-sm font-mono">⚠️</span>
            </div>
            <p className="text-concrete text-center">
              <strong>TDSB & Venue Clearance:</strong> Visitor details for all attending representatives must be submitted prior to the event for board and college approval.
              <br/>
              <strong>Student Privacy & Recruitment Policy:</strong> Because participants are high school minors, direct recruitment or resume collection is strictly prohibited in accordance with school board policy.
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
```

- [ ] **Step 3: Verify the component renders correctly**

Check that the new section displays properly with all checklist items and compliance notices.

- [ ] **Step 4: Commit**

```bash
git add src/pages/partner/sections/ConfirmedPartnersSection.tsx
git commit -m "feat: create ConfirmedPartnersSection for partner onboarding and logistics"
```

### Task 5: Update LogisticsComplianceSection to reference new section and enhance content

**Files:**
- Modify: `src/pages/partner/sections/LogisticsComplianceSection.tsx` (enhance existing content)

**Interfaces:**
- Consumes: None
- Produces: Enhanced Logistics & Compliance section with updated points

- [ ] **Step 1: Write the failing test**

UI enhancement verified visually.

- [ ] **Step 2: Enhance the LogisticsComplianceSection**

First, let me look at the current content to understand what needs to be changed.

Looking at the current file, I need to enhance it with additional compliance information while potentially adjusting to avoid duplication with the new ConfirmedPartnersSection.

Actually, reading the instructions again, the LogisticsComplianceSection should be enhanced with the compliance copy, and the ConfirmedPartnersSection should handle the confirmed partner specifics.

Let me update the LogisticsComplianceSection to focus on general logistics and enhance the compliance details:

```typescript
import { motion, useReducedMotion } from "framer-motion";

const EASE = [0.22, 1, 0.36, 1];

export default function LogisticsComplianceSection() {
  const reduce = useReducedMotion();

  const reveal = (delay = 0) => ({
    initial: reduce ? false : ({ opacity: 0, y: 22 } as const),
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, margin: "-80px" } as const,
    transition: { duration: 0.8, ease: EASE, delay },
  });

  const points = [
    {
      title: "Event Schedule & Setup",
      description:
        "Event runs from 8:00 AM to 4:00 PM at George Brown College Waterfront Campus. Setup begins at 7:00 AM for partners requiring early access.",
    },
    {
      title: "Presentation & Equipment",
      description:
        "AV support available for guest speakers including HDMI connectivity, sound systems, and presentation clickers. Please indicate any special equipment needs in advance.",
    },
    {
      title: "TDSB & Venue Clearance",
      description:
        "Visitor details for all attending representatives must be provided prior to the event for TDSB and venue approval.",
    },
    {
      title: "Student Privacy Policy",
      description:
        "Because participants are high school minors, direct recruitment or resume collection is strictly prohibited.",
    },
  ];

  return (
    <section id="logistics" className="relative z-10 border-t border-line px-5 py-24 md:px-10 md:py-32">
      <div className="mx-auto max-w-[1300px]">
        {/* header */}
        <div className="mb-6 flex items-baseline gap-4">
          <span className="mono-label whitespace-nowrap !text-foreground/70">[  · ]</span>
          <span className="ember-rule flex-1 opacity-40" aria-hidden="true" />
        </div>

        <motion.h2 {...reveal()} className="display-scene mb-8">
          <span className="block">Logistics &</span>
          <span className="wire-text block">Compliance</span>
        </motion.h2>

        <motion.p
          {...reveal(0.1)}
          className="max-w-xl font-body text-base font-light leading-relaxed text-concrete"
        >
          Important information for all participating partners regarding event logistics, schedules, and compliance requirements.
        </motion.p>

        {/* points list */}
        <motion.div {...reveal(0.18)} className="mt-12 space-y-8">
          {points.map((point, index) => (
            <div key={point.title} className="flex flex-col gap-3">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center w-8 h-8 bg-ember/20 rounded-full">
                    <span className="text-ember text-sm font-mono">•</span>
                  </div>
                </div>
                <div>
                  <h3 className="font-display text-lg uppercase tracking-[0.01em] text-foreground">
                    {point.title}
                  </h3>
                  <p className="text-concrete">{point.description}</p>
                </div>
              </div>
            </div>
          ))}
        </motion.div>
        
        {/* Reference to confirmed partners section */}
        <motion.div {...reveal(0.26)} className="mt-12 flex flex-col items-center gap-4 border border-dashed border-ember/50 bg-background/40 p-6">
          <div className="text-center space-y-2">
            <div className="flex items-center justify-center w-8 h-8 bg-ember/20 rounded-full">
              <span className="text-ember text-sm font-mono">📋</span>
            </div>
            <p className="text-concrete text-center">
              Confirmed partners should refer to the "For Confirmed Partners • Onboarding & Next Steps" section above for detailed checklists, submission deadlines, and specific requirements.
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
```

- [ ] **Step 3: Verify the enhanced section renders correctly**

Check that the logistics section shows appropriately enhanced content and references the confirmed partners section.

- [ ] **Step 4: Commit**

```bash
git add src/pages/partner/sections/LogisticsComplianceSection.tsx
git commit -m "feat: enhance LogisticsComplianceSection with updated logistics info and reference to confirmed partners section"
```

### Task 6: Update PartnerPage to include new ConfirmedPartnersSection in proper order

**Files:**
- Modify: `src/pages/partner/index.tsx` (import and reorder sections)

**Interfaces:**
- Consumes: New ConfirmedPartnersSection component
- Produces: Updated partner page with proper section ordering

- [ ] **Step 1: Write the failing test**

UI structure change verified by checking section order.

- [ ] **Step 2: Update imports and section ordering**

First, add the import for the new section:
```typescript
import ConfirmedPartnersSection from "@/pages/partner/sections/ConfirmedPartnersSection";
```

Then update the section ordering in the JSX to place the ConfirmedPartnersSection appropriately. Based on the instructions, it should come after WaysToGetInvolvedSection and before LogisticsComplianceSection.

Current order:
1. WhyPartnerSection
2. WaysToGetInvolvedSection  
3. EventScheduleSection
4. LogisticsComplianceSection
5. RegistrationCTASection

New order should be:
1. WhyPartnerSection
2. WaysToGetInvolvedSection
3. EventScheduleSection
4. ConfirmedPartnersSection  <-- NEW
5. LogisticsComplianceSection
6. RegistrationCTASection

- [ ] **Step 3: Implement the changes**

```typescript
// Add import at top with other imports
import ConfirmedPartnersSection from "@/pages/partner/sections/ConfirmedPartnersSection";

// In the JSX, reorder sections:
return (
  <div className="relative min-h-screen bg-background">
    <PartnerNav />
    <main id="main" className="relative z-10">
      {/* Hero Section */}
      {/* ... existing hero code ... */}
      
      {/* Why Partner */}
      <WhyPartnerSection />
      
      {/* Ways to Get Involved */}
      <WaysToGetInvolvedSection />
      
      {/* Event Schedule */}
      <EventScheduleSection />
      
      {/* Confirmed Partners */}
      <ConfirmedPartnersSection />
      
      {/* Logistics & Compliance */}
      <LogisticsComplianceSection />
      
      {/* Registration CTA */}
      <RegistrationCTASection />
      
      <SiteFooter />
      <PartnerMobileRegisterBar />
    </div>
  </div>
);
```

- [ ] **Step 4: Verify the page renders with correct section order**

Check that all sections appear in the correct visual order.

- [ ] **Step 5: Commit**

```bash
git add src/pages/partner/index.tsx
git commit -m "feat: add ConfirmedPartnersSection to partner page and reorder sections appropriately"
```

### Task 7: Final verification and testing

**Files:**
- Verify all changes work together

**Interfaces:**
- Consumes: All modified/created files
- Produces: Fully functional updated partner page

- [ ] **Step 1: Verify EVENT_DATE is properly set**

Check that src/config/site.ts has the correct date string.

- [ ] **Step 2: Verify hero section no longer has conflicting badge**

Check that the partner page loads without the "T-minus MDC_2026 Date drops soon." badge.

- [ ] **Step 3: Verify Countdown is working**

Check that the countdown timer shows days, hours, minutes, seconds counting down to November 16, 2026, 8:00 AM EST.

- [ ] **Step 4: Verify WhyPartnerSection displays all new content**

Check for narrative pitch, four value pillars, metrics bar, and flexible support callout.

- [ ] **Step 5: Verify ConfirmedPartnersSection displays correctly**

Check for the four checklist items and enhanced compliance notice.

- [ ] **Step 6: Verify LogisticsComplianceSection is enhanced**

Check for updated logistics points and reference to confirmed partners section.

- [ ] **Step 7: Verify overall page layout and responsiveness**

Check that all sections flow properly and mobile/responsive breakpoints work.

- [ ] **Step 8: Commit final verification**

```bash
git add .
git commit -m "chore: final verification of MDC 2026 partner portal updates"
```

## Implementation Notes

1. All changes follow existing codebase patterns for:
   - Framer motion animations (`reveal` function pattern)
   - Component structure and styling
   - Responsive design breakpoints
   - Accessibility considerations

2. The COUNTDOWN component already exists and will work automatically once EVENT_DATE is set properly in site.ts

3. Section ordering follows logical flow: 
   - Hero → Why Partner → Ways to Get Involved → Event Schedule → Confirmed Partners → Logistics → Registration CTA

4. Content is sourced directly from the provided specification with proper citations maintained implicitly through accuracy

5. All new sections follow the same visual language and motion patterns as existing sections for consistency