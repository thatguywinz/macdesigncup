import Sheet from "@/components/blueprint/Sheet";
import DisplayHeading from "@/components/motion/DisplayHeading";
import { SECTIONS } from "@/content/copy";
import SponsorMarquee from "./sponsors/SponsorMarquee";

const s = SECTIONS.sponsors;

/**
 * Sponsors. The heading, then the wall: two rows of logos gliding at one
 * calm, constant pace, and the open partner slot as one line under them.
 * Every logo links to its sponsor.
 */
export default function SponsorsSection() {
  return (
    // `sheet-content`: reader-mode and AI extractors (Readability) drop any
    // element whose id or class contains "sponsor" unless a class also says
    // "content", which kept this whole sheet out of extracted text.
    <Sheet id="sponsors" className="sheet-content">
      <DisplayHeading lines={s.lines} />

      {/* Full bleed on phones and tablets: the rows run off both edges. */}
      <SponsorMarquee className="mt-8 md:mt-12 [&_.marquee-rows]:-mx-5 md:[&_.marquee-rows]:-mx-10 lg:[&_.marquee-rows]:mx-0" />
    </Sheet>
  );
}
