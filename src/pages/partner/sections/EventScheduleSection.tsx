import { motion, useReducedMotion } from "framer-motion";

const EASE = [0.22, 1, 0.36, 1];

export default function EventScheduleSection() {
  const reduce = useReducedMotion();

  const reveal = (delay = 0) => ({
    initial: reduce ? false : ({ y: 16 } as const),
    whileInView: { y: 0 },
    viewport: { once: true, margin: "-80px" } as const,
    transition: { duration: 0.8, ease: EASE, delay },
  });

  const schedule = [
    { time: "8:00 AM – 9:00 AM", activity: "Partner check-in, setup, and coffee" },
    { time: "9:00 AM – 9:30 AM", activity: "Opening Ceremony" },
    { time: "9:30 AM – 12:00 PM", activity: "Design Session I" },
    { time: "12:00 PM – 1:00 PM", activity: "Lunch for speakers, mentors, and judges" },
    { time: "1:00 PM – 2:30 PM", activity: "Design Session II" },
    { time: "2:30 PM – 3:30 PM", activity: "Competition Judging & Student Presentations" },
    { time: "3:30 PM – 4:00 PM", activity: "Closing Ceremony & Awards" },
  ];

  return (
    <section id="schedule" className="relative z-10 border-t border-line px-5 py-24 md:px-10 md:py-32">
      <div className="mx-auto max-w-[1300px]">
        {/* header */}
        <div className="mb-6 flex items-baseline gap-4">
          <span className="mono-label whitespace-nowrap !text-foreground/70">The day</span>
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
          A working schedule for Monday, November 16. Final arrival details go to every confirmed partner.
        </motion.p>

        {/* table */}
        <motion.div {...reveal(0.18)} className="mt-12 overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <caption className="sr-only">Partner schedule for Mackenzie Design Cup 2026</caption>
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
              {schedule.map((row) => (
                <tr key={row.time} className="transition-colors hover:bg-white/[0.02]">
                  <td className="whitespace-nowrap px-4 py-4 font-mono text-[11px] uppercase tracking-[0.16em] text-concrete">
                    {row.time}
                  </td>
                  <td className="px-4 py-4 text-sm text-foreground md:text-base">
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
