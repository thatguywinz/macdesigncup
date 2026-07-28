# Mackenzie Design Cup 2026 Partner Portal Update - Design Specification

## Overview
Update the Industry Partner Portal webpage for the Mackenzie Design Cup 2026 (MDC 2026) to optimize conversion for prospective sponsors, provide clear actionable logistics for confirmed partners, and fix inaccurate/placeholder text based on the official Partner Information Package.

## Key Changes

### 1. Hero & Header Fixes
- Remove `T-minus MDC_2026 Date drops soon.` badge
- Implement functional Live Countdown Timer targeting Monday, November 16, 2026, at 8:00 AM EST
- Use existing Countdown component foundation

### 2. Expanded "Why Partner with MDC?" Section
Replace current 4-bullet list with expanded sponsorship pitch:

#### Heading
`## Why Partner with MDC 2026? • Fuel the Next Generation of Innovators`

#### Narrative Pitch Box
> "The Mackenzie Design Cup (MDC 2026) is Toronto's premier student-led 3D designathon[cite: 1]. Hosted at George Brown College's Waterfront Campus, MDC brings together 80+ of the most passionate high school CAD competitors across the TDSB[cite: 1]. As an industry partner, you aren't just placing a logo on a banner—you are directly bridging the gap between classroom CAD skills and real-world engineering careers[cite: 1]."

#### Value Pillars (4-Card Grid Layout)
1. **Direct Youth & STEM Impact**
   - Expose ambitious high schoolers (Grades 9–12) to real-world design, engineering, and product development workflows[cite: 1].
   - Help students see 3D design as a viable post-secondary path and career choice, not just a high school elective[cite: 1].
2. **Technology & Hardware Showcase**
   - Put your tools directly into the hands of future power-users[cite: 1].
   - Set up dedicated exhibit tables or run live hardware demos—including 3D printers, scanners, VR gear, or CAD software—right in the main hall[cite: 1].
3. **Brand & Community Visibility**
   - Position your organization as a leader in educational outreach and STEM innovation.
   - Gain prominent exposure across event signage, presentation slides, student award certificates, and our official Instagram (`@wlmac.3ddesign`)[cite: 1].
4. **Flexible, High-Value Involvement**
   - We respect your team's busy calendar[cite: 1]. Attendance for the full day is never required—we tailor custom time slots for guest speaking, design feedback, or judging to fit your availability[cite: 1].
   - Key roles include guest speaking, mentoring during design sprints, evaluating final presentations, or donating hardware/swag[cite: 1].

#### Key Metrics Bar
4-column statistic bar below the cards:
- **80+** | Hand-picked TDSB CAD competitors (Grades 9–12)[cite: 1]
- **1 Day** | High-intensity CAD design sprint at George Brown College[cite: 1]
- **100% Free** | Zero cost barrier for participating students[cite: 1]
- **Student-Led** | Organized by the WLMAC 3D Design Club executive team[cite: 1]

#### In-Kind & Flexible Support Callout
> "💡 **Flexible Ways to Support:** Cash sponsorship isn't the only way to help! We strongly welcome **in-kind hardware support** (loaning 3D printers or scanners), **software licenses/credits**, company swag (stickers, lanyards, tech accessories), or prize donations for top design winners[cite: 1]."

### 3. Dedicated "Confirmed Partner Portal & Logistics" Section
New section specifically for partners who have already agreed to support the event.

#### Heading
`## For Confirmed Partners • Onboarding & Next Steps`

#### Confirmed Partner Checklist Box
1. **Representative Info (Action Required by August):**
   - To process TDSB and venue security clearances, please submit the names, roles, contact emails, and phone numbers of all attending representatives via the onboarding form[cite: 1].
2. **Fall Briefing Package (Coming September 2026):**
   - Registered contacts will receive a complete briefing containing arrival schedules, parking passes, AV/projector specs, Wi-Fi access, and on-site emergency contact numbers[cite: 1].
3. **On-Site Perks & Hospitality:**
   - Complimentary lunch and refreshments are provided on-site for all guest speakers, mentors, and judges[cite: 1].
4. **Swag & Equipment Drops:**
   - Shipping and drop-off instructions for company swag and display equipment will be emailed directly to your primary contact[cite: 1].

### 4. Compliance & Policy Notice
Enhanced compliance copy under Logistics section:
- **TDSB & Venue Clearance:** Visitor details for all attending representatives must be submitted prior to the event for board and college approval[cite: 1].
- **Student Privacy & Recruitment Policy:** Because participants are high school minors, direct recruitment or resume collection is strictly prohibited in accordance with school board policy[cite: 1].

### 5. Contact Section Updates
Updated contact area with explicit organizer names and details:
- **Akhilan Saravanan** — Club President & Lead Organizer (Primary Contact): `344875471@tdsb.ca` | `(647) 222-6008`[cite: 1]
- **Rudra Garg** — Club President & Lead Organizer (Secondary Contact): `345791529@tdsb.ca` | `(437) 227-7186`[cite: 1]
- **Staff Advisor:** Mr. Andrew Archer (`andrew.archer@tdsb.on.ca`)[cite: 1]
- **Social:** Instagram `@wlmac.3ddesign`[cite: 1]

## Implementation Approach

### Files to Modify
1. `src/pages/partner/index.tsx` - Update hero section badge and integrate countdown
2. `src/pages/partner/sections/WhyPartnerSection.tsx` - Complete rewrite with expanded content
3. `src/pages/partner/sections/LogisticsComplianceSection.tsx` - Enhance with confirmed partners section and enhanced compliance
4. `src/config/site.ts` - Update EVENT_DATE constant with actual event date
5. Create new section: `src/pages/partner/sections/ConfirmedPartnersSection.tsx`

### Design Considerations
- Maintain existing visual language and motion patterns from framer-motion
- Use existing component styles and spacing conventions
- Ensure responsive design works across mobile and desktop
- Preserve accessibility features (ARIA labels, semantic HTML)
- Follow existing motion patterns for reveal animations