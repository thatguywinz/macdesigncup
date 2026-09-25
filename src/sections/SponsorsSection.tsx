import Sheet from "@/components/blueprint/Sheet";
import DisplayHeading from "@/components/motion/DisplayHeading";
import { SECTIONS } from "@/content/copy";
import SponsorMarquee from "./sponsors/SponsorMarquee";

const s = SECTIONS.sponsors;

/**
 * 03 · Sponsors. The heading, then the wall: two rows of logos gliding at
 * one calm, constant pace, with the open partner slot always in view beside
 * (or, on phones, under) them. Every logo links to its sponsor.
 */
export default function SponsorsSection() {
  return (
    // `sheet-content`: reader-mode and AI extractors (Readability) drop any
    // element whose id or class contains "sponsor" unless a class also says
    // "content", which kept this whole sheet out of extracted text.
    <Sheet id="sponsors" eyebrow={s.eyebrow} className="sheet-content">
      <DisplayHeading lines={s.lines} outline={s.outline} />

      {/* Full bleed on phones and tablets: the rows run off both edges. */}
      <SponsorMarquee className="-mx-5 mt-6 md:-mx-10 md:mt-10 lg:mx-0" />
    </Sheet>
  );
}
