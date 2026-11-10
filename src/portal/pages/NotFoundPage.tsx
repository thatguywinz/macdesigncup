import Shell, { TextLink } from "../components/Shell";

export default function NotFoundPage() {
  return (
    <Shell section="Submissions">
      <div className="py-24">
        <h1 className="display-scene">Nothing here</h1>
        <p className="mt-4 max-w-[36rem] font-body text-lg text-foreground/75">
          This link doesn't lead anywhere. If someone shared a design with you, check the link is complete.
        </p>
        <p className="mt-8 flex flex-wrap gap-6 font-body text-[15px]">
          <TextLink to="/submit">Submit a design</TextLink>
          <a href="/" className="p-link focus-ember">
            Mackenzie Design Cup
          </a>
        </p>
      </div>
    </Shell>
  );
}
