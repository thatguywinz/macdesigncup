/** "8:00 AM" never splits across lines: a no-break space before AM / PM. */
export const keepTimes = (s: string) => s.replace(/(\d) (AM|PM)\b/g, "$1 $2");
