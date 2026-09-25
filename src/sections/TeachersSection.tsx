import Sheet from "@/components/blueprint/Sheet";
import DisplayHeading from "@/components/motion/DisplayHeading";
import Reveal from "@/components/motion/Reveal";
import RegisterBlock from "@/components/RegisterBlock";
import { SECTIONS } from "@/content/copy";
import FormSheet from "./teachers/FormSheet";
import TeacherSteps from "./teachers/TeacherSteps";

/**
 * 05 · For teachers. What a teacher needs in one scan: the heading, who
 * registers (the note by the button), and the three steps; phones get the
 * step titles only. Questions go to the FAQ's email line and the footer. The visual anchor is the registration form
 * itself, drawn as a drafting sheet with a pencil tracing into its first field.
 */
export default function TeachersSection() {
  const s = SECTIONS.teachers;
  return (
    <Sheet id="teachers" eyebrow={s.eyebrow} aria-labelledby="teachers-title">
      <div className="grid items-start gap-6 md:gap-12 lg:grid-cols-12 lg:gap-x-14 lg:gap-y-0 xl:gap-x-20">
        <div className="lg:col-span-7">
          {/* lg to xl: a hair smaller, so each line holds in the 7/12 column
              beside the form sheet instead of breaking into four. Phones
              under 390px: sized to the column (the longer line is 8.5 em
              wide), so the two lines stay two lines at 360 and 375. */}
          <DisplayHeading
            id="teachers-title"
            lines={s.lines}
            outline={s.outline}
            className="max-[389px]:text-[length:calc((100vw_-_2.5rem)/8.8)] lg:max-xl:text-[clamp(3.4rem,0.2rem+5vw,3.9rem)]"
          />
          {/* The Teachers / Students lines here say who registers; FAQ Q.04
              carries the detail for students signing up on their own. Phones
              skip the whole block: the sticky Register bar is on screen with
              the same two lines, and steps 01 and 03 say the teacher's part. */}
          <Reveal delay={0.16} className="hidden md:mt-8 md:block">
            <RegisterBlock mobileButton={false} />
          </Reveal>
        </div>

        <FormSheet className="w-full max-w-[270px] md:mx-auto md:max-w-[420px] lg:col-span-5 lg:col-start-8 lg:row-span-2 lg:row-start-1 lg:mt-2 lg:max-w-[440px]" />

        {/* From lg the steps sit under the heading, beside the form sheet. */}
        <TeacherSteps className="max-md:mt-0 lg:col-span-7 lg:row-start-2 lg:mt-14 lg:self-end" />
      </div>
    </Sheet>
  );
}
