import { motion, useReducedMotion } from "framer-motion";

const EASE = [0.22, 1, 0.36, 1];

export default function EventScheduleSection() {
  const reduce = useReducedMotion();

  const reveal = (delay = 0) => ({
    initial: reduce ? false : ({ opacity: 0, y: 22 } as const),
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, margin: "-80px" } as const,
    transition: { duration: 0.8, ease: EASE, delay },
  });

  const schedule = [
    { time: "8:00 AM – 9:00 AM", activity: "Partner Check-In, Setup & Coffee" },
    { time: "9:00 AM – 9:30 AM", activity: "Opening Ceremony" },
    { time: "9:30 AM – 12:00 PM", activity: "Design Session I" },
    { time: "12:00 PM – 1:00 PM", activity: "Partner Lunch *(Provided on-site for speakers, mentors, and judges)*" },
    { time: "1:00 PM – 2:30 PM", activity: "Design Session II" },
    { time: "2:30 PM – 3:30 PM", activity: "Competition Judging & Student Presentations" },
    { time: "3:30 PM – 4:00 PM", activity: "Closing Ceremony & Awards" },
  ];

  return (
    <section id="schedule" className="relative z-10 border-t border-line px-5 py-24 md:px-10 md:py-32">
      <div className="mx-auto max-w-[1300px]">
        {/* header */}
        <div className="mb-6 flex items-baseline gap-4">
          <span className="mono-label whitespace-nowrap !text-foreground/70">[  · ]</span>
          <span className="ember-rule flex-1 opacity-40" aria-hidden="true" />
        </div>

        <motion.h2 {...reveal()} className="display-scene mb-8">
          <span className="block">Event</span>
          <span className="wire-text block">schedule.</span>
        </motion.h2>

        <motion.p
          {...reveal(0.1)}
          className="max-w-xl font-body text-base font-light leading-relaxed text-concrete"
        >
          *Tentative Schedule — Subject to Change*
        </motion.p>

        {/* table */}
        <motion.div {...reveal(0.18)} className="mt-12 overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr>
                <th className="px-4 py-3 text-[11px] font-mono uppercase tracking-[0.22em] text-concrete/70">
                  Time
                </th>
                <th className="px-4 py-3 text-[11px] font-mono uppercase tracking-[0.22em] text-concrete/70">
                  Activity
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {schedule.map((row, index) => (
                <tr key={index} className="hover:bg-background/50">
                  <td className="px-4 py-3 text-[11px] font-mono uppercase tracking-[0.22em] text-concrete">
                    {row.time}
                  </td>
                  <td className="px-4 py-3 text-[11px] font-mono uppercase tracking-[0.22em] text-foreground">
                    {row.activity}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </motion.div>
      </div>
    </section>
  );
}