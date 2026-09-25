import type { CSSProperties, MouseEvent } from "react";
import { ArrowDown } from "lucide-react";
import { CTA } from "@/content/copy";
import { DOOR_LIT } from "./doorLight";

const lit = (on: boolean) => () => {
  DOOR_LIT.on = on;
};

/**
 * The hero's Enter button is the lit door itself: a link the size of the
 * door's glowing opening, laid exactly over it (on a still of the hall by
 * hero.css, on the live scene by GalleryScene), with "Enter" set in ink on
 * its face. Hover and focus warm the door; focus draws a ring round it.
 */
export default function EnterDoor({
  onEnter,
  style,
}: {
  onEnter: (event: MouseEvent<HTMLAnchorElement>) => void;
  style?: CSSProperties;
}) {
  return (
    <a
      href="#glance"
      onClick={onEnter}
      aria-label={CTA.enter}
      className="hall-enter__door"
      style={style}
      onPointerEnter={lit(true)}
      onPointerLeave={lit(false)}
      onFocus={lit(true)}
      onBlur={lit(false)}
    >
      <span aria-hidden="true" className="hall-enter__light" />
      <span className="hall-enter__label">
        <span>{CTA.door}</span>
        <ArrowDown aria-hidden="true" className="hall-enter__arrow" strokeWidth={1.75} />
      </span>
    </a>
  );
}
