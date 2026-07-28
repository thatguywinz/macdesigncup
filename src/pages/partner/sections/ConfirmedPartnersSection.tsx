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
                <h3 className="font-display text-lg3 className="font-display text-lg uppercase tracking-[0.01em] text-foreground">On-Site Perks & Hospitality</h3>
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
              <span className="text-ember text-sm font-mono">⚠︠</span>
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