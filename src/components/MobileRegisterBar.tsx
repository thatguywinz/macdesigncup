import RegisterButton from "./RegisterButton";

/** Sticky bottom CTA — mobile only. */
export default function MobileRegisterBar() {
  return (
    <div className="fixed inset-x-0 bottom-0 z-50 border-t border-line bg-background/80 px-4 py-3 backdrop-blur-md md:hidden">
      <RegisterButton className="w-full py-3.5 text-xs">Enter the challenge</RegisterButton>
    </div>
  );
}
