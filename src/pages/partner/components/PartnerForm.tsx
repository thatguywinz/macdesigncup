import { useEffect, useRef, useState } from "react";
import { useForm, FieldValues } from "react-hook-form";
import { CONTACT_EMAIL, VENUE_INSTITUTION } from "@/config/site";

/** Text inputs, textareas and the date field: a drafted box, ember when active. */
const FIELD =
  "block w-full border border-foreground/20 bg-background/70 px-3 py-2.5 font-mono text-sm text-foreground placeholder:text-concrete/70 transition-colors focus:border-ember focus:outline-none focus-visible:ring-1 focus-visible:ring-ember";
/** One radio or checkbox row: the whole row is the label (a 44px target on phones). */
const OPTION = "flex cursor-pointer items-start gap-3 py-3 md:py-1.5";
const CHOICE = "mt-0.5 size-4 shrink-0 accent-[hsl(var(--ember))] focus-ember";
/** Inline mailto links on the dark plate. */
const MAIL_LINK = "focus-ember break-words text-ember underline underline-offset-4 transition-colors hover:text-foreground";

/** The id of a field's error message; its control points at it with aria-describedby. */
const errId = (name: string) => `pf-${name}-error`;

// Status and upload copy (COPY-13). The partner form keeps its copy local like
// the rest of /partner; the email comes from site.ts.
const COPY = {
  successTitle: "Application received",
  successBody: "We have your details. We'll email you about next steps.",
  errorLead: "We couldn't send the form. Email us at",
  errorTail: "and we'll take it from there.",
  errorSubject: "Partner application",
  assetsLabel: "Logo and brand guidelines",
  assetsLead: "Email your logo and brand guidelines to",
  assetsSubject: "Partner logo and brand guidelines",
} as const;

type FormValues = FieldValues & {
  // Section 1
  organizationName: string;
  organizationType: string;
  companyWebsite: string;
  socialMediaHandles: string;
  industrySector: string;
  companyDescription: string;
  primaryContactName: string;
  primaryContactEmail: string;
  primaryContactPhone: string;
  // Section 2
  involvementTypes: string[];
  workshopInterest: string[];
  preferredDuration: string;
  numRepresentatives: string;
  preferredRoles: string[];
  studentInteraction: string[];
  // Section 3
  representative1Name: string;
  representative1Title: string;
  representative1Email: string;
  representative1Phone: string;
  representative2Name: string;
  representative2Title: string;
  representative2Email: string;
  representative2Phone: string;
  representative3Name: string;
  representative3Title: string;
  representative3Email: string;
  representative3Phone: string;
  accessibilityAccommodations: string;
  // Section 4
  boothRequirement: string;
  boothRequirements: string[];
  displayBanners: string;
  equipmentBeingBrought: string;
  techFacilityRequirements: string[];
  setupTiming: string;
  // Section 5
  contributionType: string[];
  estimatedValue: string;
  sponsorshipRecognition: string[];
  swagDeliveryMethod: string;
  // Section 6 (the logo and brand guidelines arrive by email, not upload)
  partnershipAnnouncementDate: string;
  mediaLogoPermissions: string[];
  // Section 7
  dietaryRestrictions: string;
  additionalInfo: string;
  policyConfirmation: string[];
};

export default function PartnerForm() {
  const {
    register,
    handleSubmit,
    watch,
    formState: { isSubmitting, errors },
    reset,
  } = useForm<FormValues>({
    // Focus moves to the first invalid control after React has rendered its
    // aria-invalid / aria-describedby (see the effect below), so a screen
    // reader hears the error along with the field. RHF's own focus runs
    // before that render.
    shouldFocusError: false,
    defaultValues: {
      // Section 1
      organizationName: "",
      organizationType: "",
      companyWebsite: "",
      socialMediaHandles: "",
      industrySector: "",
      companyDescription: "",
      primaryContactName: "",
      primaryContactEmail: "",
      primaryContactPhone: "",
      // Section 2
      involvementTypes: [],
      workshopInterest: [],
      preferredDuration: "",
      numRepresentatives: "",
      preferredRoles: [],
      studentInteraction: [],
      // Section 3
      representative1Name: "",
      representative1Title: "",
      representative1Email: "",
      representative1Phone: "",
      representative2Name: "",
      representative2Title: "",
      representative2Email: "",
      representative2Phone: "",
      representative3Name: "",
      representative3Title: "",
      representative3Email: "",
      representative3Phone: "",
      accessibilityAccommodations: "",
      // Section 4
      boothRequirement: "",
      boothRequirements: [],
      displayBanners: "",
      equipmentBeingBrought: "",
      techFacilityRequirements: [],
      setupTiming: "",
      // Section 5
      contributionType: [],
      estimatedValue: "",
      sponsorshipRecognition: [],
      swagDeliveryMethod: "",
      // Section 6
      partnershipAnnouncementDate: "",
      mediaLogoPermissions: [],
      // Section 7
      dietaryRestrictions: "",
      additionalInfo: "",
      policyConfirmation: [],
    },
  });

  const numRepresentatives = watch("numRepresentatives");
  const [submitStatus, setSubmitStatus] = useState<"success" | "error" | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const successRef = useRef<HTMLHeadingElement>(null);
  const [invalidTick, setInvalidTick] = useState(0);

  // After a failed submit: focus the first invalid control in reading order,
  // centred so the fixed nav never covers it.
  useEffect(() => {
    if (!invalidTick) return;
    const first = formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]');
    if (!first) return;
    first.focus({ preventScroll: true });
    first.scrollIntoView({ block: "center" });
  }, [invalidTick]);

  // The form unmounts on success; put focus on the confirmation instead of the body.
  useEffect(() => {
    const heading = successRef.current;
    if (submitStatus !== "success" || !heading) return;
    heading.focus({ preventScroll: true });
    heading.scrollIntoView({ block: "center" });
  }, [submitStatus]);

  /** A text control: invalid and described by its error while it has one. */
  const describe = (name: string) =>
    errors[name] ? { "aria-invalid": true as const, "aria-describedby": errId(name) } : {};
  /** A radio or checkbox group: the group is described by the error... */
  const describeGroup = (name: string) => (errors[name] ? { "aria-describedby": errId(name) } : {});
  /** ...and each of its options is marked invalid. */
  const invalidOption = (name: string) => (errors[name] ? { "aria-invalid": true as const } : {});

  const onSubmit = async (data: FormValues) => {
    setSubmitStatus(null);
    try {
      const response = await fetch("/api/partner-register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error(`partner-register: HTTP ${response.status}`);
      // The confirmation stays up until the partner chooses to start again.
      setSubmitStatus("success");
    } catch (error) {
      console.error(error);
      // Whatever broke, the partner gets the same way through: email us.
      setSubmitStatus("error");
    }
  };

  return (
    <>
      {submitStatus === "success" ? (
        // In the plate, where the form was. (A fixed overlay here sat inside
        // main's stacking context, so the footer painted over it.)
        <div role="status" className="py-12 text-center md:py-16">
          <span aria-hidden="true" className="font-mono text-2xl text-ember">✓</span>
          <h2
            ref={successRef}
            tabIndex={-1}
            className="mt-3 font-display text-[1.7rem] uppercase leading-none tracking-[0.01em] text-foreground focus:outline-none md:text-[2.25rem]"
          >
            {COPY.successTitle}
          </h2>
          <p className="mx-auto mt-4 max-w-md font-body text-base font-light leading-relaxed text-concrete">
            {COPY.successBody}
          </p>
          <button
            type="button"
            onClick={() => {
              setSubmitStatus(null);
              reset();
            }}
            className="btn-portal focus-ember mt-8 px-8 py-4"
          >
            Submit Another Application
          </button>
        </div>
      ) : (
        <>
          <form
            ref={formRef}
            onSubmit={handleSubmit(onSubmit, () => setInvalidTick((n) => n + 1))}
            className="space-y-12 [&>section:first-of-type]:border-t-0 [&>section:first-of-type]:pt-4"
          >
            {/* Section 1: Organization & Primary Contact Information */}
            <section className="space-y-4 border-t border-foreground/10 pt-8">
              <div className="flex items-baseline gap-3">
                <span aria-hidden="true" className="font-mono text-[11px] font-bold tracking-[0.2em] text-ember">01</span>
                <h2 className="font-display text-2xl uppercase leading-none tracking-[0.01em] text-foreground md:text-3xl">Organization & Primary Contact Information</h2>
              </div>
              <p className="text-concrete mb-6">
                Please provide your organization's details and primary contact information.
              </p>

              <div className="divide-y divide-line">
                {/* Organization / Company Name */}
                <div className="space-y-4 py-4">
                  <label htmlFor="pf-organizationName" className="block text-sm font-medium text-foreground mb-1">
                    Organization / Company Name <span className="text-ember">*</span>
                  </label>
                  <input
                    type="text"
                    id="pf-organizationName"
                    {...describe("organizationName")}
                    {...register("organizationName", {
                      required: "Organization name is required",
                    })}
                    className={FIELD}
                  />
                  {errors.organizationName && (
                    <p id={errId("organizationName")} className="text-sm text-ember">{errors.organizationName.message}</p>
                  )}
                </div>

                {/* Organization Type */}
                <div className="space-y-4 py-4">
                  <p id="pf-organizationType-label" className="block text-sm font-medium text-foreground mb-1">
                    Organization Type <span className="text-ember">*</span>
                  </p>
                  <div className="space-y-2">
                    <fieldset aria-labelledby="pf-organizationType-label" {...describeGroup("organizationType")} className="space-y-0 md:space-y-0.5">
                      {[
                        "Industry / Company",
                        "Startup",
                        "University / College",
                        "Non-profit / Community Organization",
                        "Government / Public Sector",
                        "Other",
                      ].map((option) => (
                        <label key={option} className={OPTION}>
                          <input
                            type="radio"
                            value={option}
                            {...invalidOption("organizationType")}
                            {...register("organizationType", {
                              required: "Please select an organization type",
                            })}
                            className={CHOICE}
                          />
                          <span className="text-sm text-foreground">{option}</span>
                        </label>
                      ))}
                    </fieldset>
                  </div>
                  {errors.organizationType && (
                    <p id={errId("organizationType")} className="text-sm text-ember">{errors.organizationType.message}</p>
                  )}
                </div>

                {/* Company Website */}
                <div className="space-y-4 py-4">
                  <label htmlFor="pf-companyWebsite" className="block text-sm font-medium text-foreground mb-1">
                    Company Website
                  </label>
                  <input
                    type="url"
                    placeholder="https://example.com"
                    id="pf-companyWebsite"
                    {...describe("companyWebsite")}
                    {...register("companyWebsite")}
                    className={FIELD}
                  />
                  {errors.companyWebsite && (
                    <p id={errId("companyWebsite")} className="text-sm text-ember">{errors.companyWebsite.message}</p>
                  )}
                </div>

                {/* Social Media Handles */}
                <div className="space-y-4 py-4">
                  <label htmlFor="pf-socialMediaHandles" className="block text-sm font-medium text-foreground mb-1">
                    Social Media Handles
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., @yourcompany on Instagram, LinkedIn"
                    id="pf-socialMediaHandles"
                    {...describe("socialMediaHandles")}
                    {...register("socialMediaHandles")}
                    className={FIELD}
                  />
                  {errors.socialMediaHandles && (
                    <p id={errId("socialMediaHandles")} className="text-sm text-ember">{errors.socialMediaHandles.message}</p>
                  )}
                </div>

                {/* Industry / Sector */}
                <div className="space-y-4 py-4">
                  <label htmlFor="pf-industrySector" className="block text-sm font-medium text-foreground mb-1">
                    Industry / Sector
                  </label>
                  <input
                    type="text"
                    placeholder="Aerospace, Mechanical Engineering, etc."
                    id="pf-industrySector"
                    {...describe("industrySector")}
                    {...register("industrySector")}
                    className={FIELD}
                  />
                  {errors.industrySector && (
                    <p id={errId("industrySector")} className="text-sm text-ember">{errors.industrySector.message}</p>
                  )}
                </div>

                {/* Short Company Description */}
                <div className="space-y-4 py-4">
                  <label htmlFor="pf-companyDescription" className="block text-sm font-medium text-foreground mb-1">
                    Short Company Description
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Brief 2-3 sentence overview for website, program, and promotional materials"
                    id="pf-companyDescription"
                    {...describe("companyDescription")}
                    {...register("companyDescription")}
                    className={FIELD}
                  />
                  {errors.companyDescription && (
                    <p id={errId("companyDescription")} className="text-sm text-ember">{errors.companyDescription.message}</p>
                  )}
                </div>

                {/* Primary Contact Name */}
                <div className="space-y-4 py-4">
                  <label htmlFor="pf-primaryContactName" className="block text-sm font-medium text-foreground mb-1">
                    Primary Contact Name <span className="text-ember">*</span>
                  </label>
                  <input
                    type="text"
                    id="pf-primaryContactName"
                    {...describe("primaryContactName")}
                    {...register("primaryContactName", {
                      required: "Primary contact name is required",
                    })}
                    className={FIELD}
                  />
                  {errors.primaryContactName && (
                    <p id={errId("primaryContactName")} className="text-sm text-ember">{errors.primaryContactName.message}</p>
                  )}
                </div>

                {/* Primary Contact Email */}
                <div className="space-y-4 py-4">
                  <label htmlFor="pf-primaryContactEmail" className="block text-sm font-medium text-foreground mb-1">
                    Primary Contact Email <span className="text-ember">*</span>
                  </label>
                  <input
                    type="email"
                    id="pf-primaryContactEmail"
                    {...describe("primaryContactEmail")}
                    {...register("primaryContactEmail", {
                      required: "Email is required",
                      pattern: {
                        value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                        message: "Please enter a valid email address",
                      },
                    })}
                    className={FIELD}
                  />
                  {errors.primaryContactEmail && (
                    <p id={errId("primaryContactEmail")} className="text-sm text-ember">{errors.primaryContactEmail.message}</p>
                  )}
                </div>

                {/* Primary Contact Phone Number */}
                <div className="space-y-4 py-4">
                  <label htmlFor="pf-primaryContactPhone" className="block text-sm font-medium text-foreground mb-1">
                    Primary Contact Phone Number
                  </label>
                  <input
                    type="tel"
                    placeholder="e.g., (416) 555-1234"
                    id="pf-primaryContactPhone"
                    {...describe("primaryContactPhone")}
                    {...register("primaryContactPhone")}
                    className={FIELD}
                  />
                  {errors.primaryContactPhone && (
                    <p id={errId("primaryContactPhone")} className="text-sm text-ember">{errors.primaryContactPhone.message}</p>
                  )}
                </div>
              </div>
            </section>

            {/* Section 2: Partnership & Event Involvement */}
            <section className="space-y-4 border-t border-foreground/10 pt-8">
              <div className="flex items-baseline gap-3">
                <span aria-hidden="true" className="font-mono text-[11px] font-bold tracking-[0.2em] text-ember">02</span>
                <h2 className="font-display text-2xl uppercase leading-none tracking-[0.01em] text-foreground md:text-3xl">Partnership & Event Involvement</h2>
              </div>
              <p className="text-concrete mb-6">
                Tell us how you'd like to participate and contribute to the event.
              </p>

              <div className="divide-y divide-line">
                {/* What type of involvement is your organization interested in? */}
                <div className="space-y-4 py-4">
                  <p id="pf-involvementTypes-label" className="block text-sm font-medium text-foreground mb-1">
                    What type of involvement is your organization interested in? <span className="text-ember">*</span>
                  </p>
                  <div role="group" aria-labelledby="pf-involvementTypes-label" {...describeGroup("involvementTypes")} className="space-y-0 md:space-y-0.5">
                    {[
                      "Guest Speaking (Opening or Closing Ceremony)",
                      "Technical Demonstration / CAD Showcase",
                      "Career / Industry Insight Presentation",
                      "Mentoring Students During Design Sprint Sessions",
                      "Judging Final Presentations",
                      "Company Booth / Exhibit Table",
                      "Providing Swag & Prizes",
                      "Equipment Loan / In-Kind Hardware Support",
                      "Financial / Monetary Sponsorship",
                    ].map((option) => (
                      <label key={option} className={OPTION}>
                        <input
                          type="checkbox"
                          value={option}
                          {...invalidOption("involvementTypes")}
                          {...register("involvementTypes", {
                            required: "Please select at least one involvement type",
                          })}
                          className={CHOICE}
                        />
                        <span className="text-sm text-foreground">{option}</span>
                      </label>
                    ))}
                  </div>
                  {errors.involvementTypes && (
                    <p id={errId("involvementTypes")} className="text-sm text-ember">{errors.involvementTypes.message}</p>
                  )}
                </div>

                {/* Would your organization be interested in leading a workshop or tutorial session? */}
                <div className="space-y-4 py-4">
                  <p id="pf-workshopInterest-label" className="block text-sm font-medium text-foreground mb-1">
                    Would your organization be interested in leading a workshop or tutorial session?
                  </p>
                  <div role="group" aria-labelledby="pf-workshopInterest-label" {...describeGroup("workshopInterest")} className="space-y-0 md:space-y-0.5">
                    {[
                      "CAD Fundamentals",
                      "Advanced CAD Techniques",
                      "Additive Manufacturing / 3D Printing",
                      "Engineering Design Process",
                      "Industry Software Demonstration",
                      "Design Thinking & Prototyping",
                      "Other",
                    ].map((option) => (
                      <label key={option} className={OPTION}>
                        <input
                          type="checkbox"
                          value={option}
                          {...invalidOption("workshopInterest")}
                          {...register("workshopInterest")}
                          className={CHOICE}
                        />
                        <span className="text-sm text-foreground">{option}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Preferred Duration of Involvement */}
                <div className="space-y-4 py-4">
                  <p id="pf-preferredDuration-label" className="block text-sm font-medium text-foreground mb-1">
                    Preferred Duration of Involvement
                  </p>
                  <div className="space-y-2">
                    <fieldset aria-labelledby="pf-preferredDuration-label" {...describeGroup("preferredDuration")} className="space-y-0 md:space-y-0.5">
                      {[
                        "1–2 Hours",
                        "3–4 Hours",
                        "Entire Event Day",
                        "Flexible / To Be Determined",
                      ].map((option) => (
                        <label key={option} className={OPTION}>
                          <input
                            type="radio"
                            value={option}
                            {...invalidOption("preferredDuration")}
                            {...register("preferredDuration")}
                            className={CHOICE}
                          />
                          <span className="text-sm text-foreground">{option}</span>
                        </label>
                      ))}
                    </fieldset>
                  </div>
                </div>

                {/* Estimated Number of Representatives Attending */}
                <div className="space-y-4 py-4">
                  <p id="pf-numRepresentatives-label" className="block text-sm font-medium text-foreground mb-1">
                    Estimated Number of Representatives Attending <span className="text-ember">*</span>
                  </p>
                  <div className="space-y-2">
                    <fieldset aria-labelledby="pf-numRepresentatives-label" {...describeGroup("numRepresentatives")} className="space-y-0 md:space-y-0.5">
                      {[
                        "1 Representative",
                        "2 Representatives",
                        "3 Representatives",
                        "4+ Representatives",
                        "0 Representatives (Remote Support Only)",
                      ].map((option) => (
                        <label key={option} className={OPTION}>
                          <input
                            type="radio"
                            value={option}
                            {...invalidOption("numRepresentatives")}
                            {...register("numRepresentatives", {
                              required: "Please select the number of representatives",
                            })}
                            className={CHOICE}
                          />
                          <span className="text-sm text-foreground">{option}</span>
                        </label>
                      ))}
                    </fieldset>
                  </div>
                  {errors.numRepresentatives && (
                    <p id={errId("numRepresentatives")} className="text-sm text-ember">{errors.numRepresentatives.message}</p>
                  )}
                </div>

                {/* Preferred Role(s) for Attending Representatives */}
                <div className="space-y-4 py-4">
                  <p id="pf-preferredRoles-label" className="block text-sm font-medium text-foreground mb-1">
                    Preferred Role(s) for Attending Representatives
                  </p>
                  <div role="group" aria-labelledby="pf-preferredRoles-label" {...describeGroup("preferredRoles")} className="space-y-0 md:space-y-0.5">
                    {[
                      "Engineer / Designer Mentor",
                      "Guest Speaker",
                      "Competition Judge",
                      "Executive / Company Representative",
                      "Technical Specialist (Equipment / Demonstration)",
                      "Workshop Facilitator",
                      "Other",
                    ].map((option) => (
                      <label key={option} className={OPTION}>
                        <input
                          type="checkbox"
                          value={option}
                          {...invalidOption("preferredRoles")}
                          {...register("preferredRoles")}
                          className={CHOICE}
                        />
                        <span className="text-sm text-foreground">{option}</span>
                      </label>
                    ))}
                  </div>
                </div>

{/* Student Interaction Preferences */}
                <div className="space-y-4 py-4">
                  <p id="pf-studentInteraction-label" className="block text-sm font-medium text-foreground mb-1">
                    Student Interaction Preferences
                  </p>
                  <div role="group" aria-labelledby="pf-studentInteraction-label" {...describeGroup("studentInteraction")} className="space-y-0 md:space-y-0.5">
                    {[
                      "Informal Career Conversations",
                      "Student Portfolio / CAD Feedback",
                      "Q&A About Industry Software & Workflows",
                      "Educational Resource Sharing",
                      "Networking With Students",
                    ].map((option) => (
                      <label key={option} className={OPTION}>
                        <input
                          type="checkbox"
                          value={option}
                          {...invalidOption("studentInteraction")}
                          {...register("studentInteraction")}
                          className={CHOICE}
                        />
                        <span className="text-sm text-foreground">{option}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            {/* Section 3: Representative Details & Visitor Information */}
            <section className="space-y-4 border-t border-foreground/10 pt-8">
              <div className="flex items-baseline gap-3">
                <span aria-hidden="true" className="font-mono text-[11px] font-bold tracking-[0.2em] text-ember">03</span>
                <h2 className="font-display text-2xl uppercase leading-none tracking-[0.01em] text-foreground md:text-3xl">Representative Details & Visitor Information</h2>
              </div>
              <p className="text-concrete mb-6">
                Please provide details for each attending representative based on the number selected above.
              </p>

              <div className="divide-y divide-line">
                {/* Representative #1 */}
                {numRepresentatives === "1 Representative" ||
                  numRepresentatives === "2 Representatives" ||
                  numRepresentatives === "3 Representatives" ||
                  numRepresentatives === "4+ Representatives" ? (
                  <>
                    <div className="space-y-4 py-4">
                      <label htmlFor="pf-representative1Name" className="block text-sm font-medium text-foreground mb-1">
                        Representative #1: Full Name <span className="text-ember">*</span>
                      </label>
                      <input
                        type="text"
                        id="pf-representative1Name"
                        {...describe("representative1Name")}
                        {...register("representative1Name", {
                          required: "Representative 1 name is required",
                        })}
                        className={FIELD}
                      />
                      {errors.representative1Name && (
                        <p id={errId("representative1Name")} className="text-sm text-ember">{errors.representative1Name.message}</p>
                      )}
                    </div>

                    <div className="space-y-4 py-4">
                      <label htmlFor="pf-representative1Title" className="block text-sm font-medium text-foreground mb-1">
                        Representative #1: Job Title & Role <span className="text-ember">*</span>
                      </label>
                      <input
                        type="text"
                        id="pf-representative1Title"
                        {...describe("representative1Title")}
                        {...register("representative1Title", {
                          required: "Representative 1 title is required",
                        })}
                        className={FIELD}
                      />
                      {errors.representative1Title && (
                        <p id={errId("representative1Title")} className="text-sm text-ember">{errors.representative1Title.message}</p>
                      )}
                    </div>

                    <div className="space-y-4 py-4">
                      <label htmlFor="pf-representative1Email" className="block text-sm font-medium text-foreground mb-1">
                        Representative #1: Email Address <span className="text-ember">*</span>
                      </label>
                      <input
                        type="email"
                        id="pf-representative1Email"
                        {...describe("representative1Email")}
                        {...register("representative1Email", {
                          required: "Representative 1 email is required",
                          pattern: {
                            value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                            message: "Please enter a valid email address",
                          },
                        })}
                        className={FIELD}
                      />
                      {errors.representative1Email && (
                        <p id={errId("representative1Email")} className="text-sm text-ember">{errors.representative1Email.message}</p>
                      )}
                    </div>

                    <div className="space-y-4 py-4">
                      <label htmlFor="pf-representative1Phone" className="block text-sm font-medium text-foreground mb-1">
                        Representative #1: Phone Number
                      </label>
                      <input
                        type="tel"
                        placeholder="e.g., (416) 555-1234"
                        id="pf-representative1Phone"
                        {...describe("representative1Phone")}
                        {...register("representative1Phone")}
                        className={FIELD}
                      />
                      {errors.representative1Phone && (
                        <p id={errId("representative1Phone")} className="text-sm text-ember">{errors.representative1Phone.message}</p>
                      )}
                    </div>
                  </>
                ) : null}

                {/* Representative #2 */}
                {numRepresentatives === "2 Representatives" ||
                  numRepresentatives === "3 Representatives" ||
                  numRepresentatives === "4+ Representatives" ? (
                  <>
                    <div className="space-y-4 py-4">
                      <label htmlFor="pf-representative2Name" className="block text-sm font-medium text-foreground mb-1">
                        Representative #2: Full Name <span className="text-ember">*</span>
                      </label>
                      <input
                        type="text"
                        id="pf-representative2Name"
                        {...describe("representative2Name")}
                        {...register("representative2Name", {
                          required: "Representative 2 name is required",
                        })}
                        className={FIELD}
                      />
                      {errors.representative2Name && (
                        <p id={errId("representative2Name")} className="text-sm text-ember">{errors.representative2Name.message}</p>
                      )}
                    </div>

                    <div className="space-y-4 py-4">
                      <label htmlFor="pf-representative2Title" className="block text-sm font-medium text-foreground mb-1">
                        Representative #2: Job Title & Role <span className="text-ember">*</span>
                      </label>
                      <input
                        type="text"
                        id="pf-representative2Title"
                        {...describe("representative2Title")}
                        {...register("representative2Title", {
                          required: "Representative 2 title is required",
                        })}
                        className={FIELD}
                      />
                      {errors.representative2Title && (
                        <p id={errId("representative2Title")} className="text-sm text-ember">{errors.representative2Title.message}</p>
                      )}
                    </div>

                    <div className="space-y-4 py-4">
                      <label htmlFor="pf-representative2Email" className="block text-sm font-medium text-foreground mb-1">
                        Representative #2: Email Address <span className="text-ember">*</span>
                      </label>
                      <input
                        type="email"
                        id="pf-representative2Email"
                        {...describe("representative2Email")}
                        {...register("representative2Email", {
                          required: "Representative 2 email is required",
                          pattern: {
                            value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                            message: "Please enter a valid email address",
                          },
                        })}
                        className={FIELD}
                      />
                      {errors.representative2Email && (
                        <p id={errId("representative2Email")} className="text-sm text-ember">{errors.representative2Email.message}</p>
                      )}
                    </div>

                    <div className="space-y-4 py-4">
                      <label htmlFor="pf-representative2Phone" className="block text-sm font-medium text-foreground mb-1">
                        Representative #2: Phone Number
                      </label>
                      <input
                        type="tel"
                        placeholder="e.g., (416) 555-1234"
                        id="pf-representative2Phone"
                        {...describe("representative2Phone")}
                        {...register("representative2Phone")}
                        className={FIELD}
                      />
                      {errors.representative2Phone && (
                        <p id={errId("representative2Phone")} className="text-sm text-ember">{errors.representative2Phone.message}</p>
                      )}
                    </div>
                  </>
                ) : null}

                {/* Representative #3 */}
                {numRepresentatives === "3 Representatives" ||
                  numRepresentatives === "4+ Representatives" ? (
                  <>
                    <div className="space-y-4 py-4">
                      <label htmlFor="pf-representative3Name" className="block text-sm font-medium text-foreground mb-1">
                        Representative #3: Full Name <span className="text-ember">*</span>
                      </label>
                      <input
                        type="text"
                        id="pf-representative3Name"
                        {...describe("representative3Name")}
                        {...register("representative3Name", {
                          required: "Representative 3 name is required",
                        })}
                        className={FIELD}
                      />
                      {errors.representative3Name && (
                        <p id={errId("representative3Name")} className="text-sm text-ember">{errors.representative3Name.message}</p>
                      )}
                    </div>

                    <div className="space-y-4 py-4">
                      <label htmlFor="pf-representative3Title" className="block text-sm font-medium text-foreground mb-1">
                        Representative #3: Job Title & Role <span className="text-ember">*</span>
                      </label>
                      <input
                        type="text"
                        id="pf-representative3Title"
                        {...describe("representative3Title")}
                        {...register("representative3Title", {
                          required: "Representative 3 title is required",
                        })}
                        className={FIELD}
                      />
                      {errors.representative3Title && (
                        <p id={errId("representative3Title")} className="text-sm text-ember">{errors.representative3Title.message}</p>
                      )}
                    </div>

                    <div className="space-y-4 py-4">
                      <label htmlFor="pf-representative3Email" className="block text-sm font-medium text-foreground mb-1">
                        Representative #3: Email Address <span className="text-ember">*</span>
                      </label>
                      <input
                        type="email"
                        id="pf-representative3Email"
                        {...describe("representative3Email")}
                        {...register("representative3Email", {
                          required: "Representative 3 email is required",
                          pattern: {
                            value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                            message: "Please enter a valid email address",
                          },
                        })}
                        className={FIELD}
                      />
                      {errors.representative3Email && (
                        <p id={errId("representative3Email")} className="text-sm text-ember">{errors.representative3Email.message}</p>
                      )}
                    </div>

                    <div className="space-y-4 py-4">
                      <label htmlFor="pf-representative3Phone" className="block text-sm font-medium text-foreground mb-1">
                        Representative #3: Phone Number
                      </label>
                      <input
                        type="tel"
                        placeholder="e.g., (416) 555-1234"
                        id="pf-representative3Phone"
                        {...describe("representative3Phone")}
                        {...register("representative3Phone")}
                        className={FIELD}
                      />
                      {errors.representative3Phone && (
                        <p id={errId("representative3Phone")} className="text-sm text-ember">{errors.representative3Phone.message}</p>
                      )}
                    </div>
                  </>
                ) : null}

                {/* Accessibility Accommodations */}
                <div className="space-y-4 py-4">
                  <label htmlFor="pf-accessibilityAccommodations" className="block text-sm font-medium text-foreground mb-1">
                    Accessibility Accommodations Needed for Representatives
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Please let us know if any accommodations are required to ensure a comfortable and accessible experience."
                    id="pf-accessibilityAccommodations"
                    {...describe("accessibilityAccommodations")}
                    {...register("accessibilityAccommodations")}
                    className={FIELD}
                  />
                  {errors.accessibilityAccommodations && (
                    <p id={errId("accessibilityAccommodations")} className="text-sm text-ember">{errors.accessibilityAccommodations.message}</p>
                  )}
                </div>
              </div>
            </section>

            {/* Section 4: Booth, Equipment & Logistics */}
            <section className="space-y-4 border-t border-foreground/10 pt-8">
              <div className="flex items-baseline gap-3">
                <span aria-hidden="true" className="font-mono text-[11px] font-bold tracking-[0.2em] text-ember">04</span>
                <h2 className="font-display text-2xl uppercase leading-none tracking-[0.01em] text-foreground md:text-3xl">Booth, Equipment & Logistics</h2>
              </div>
              <p className="text-concrete mb-6">
                Details about your booth setup, equipment, and logistical needs.
              </p>

              <div className="divide-y divide-line">
                {/* Do you require a company booth or exhibit space? */}
                <div className="space-y-4 py-4">
                  <p id="pf-boothRequirement-label" className="block text-sm font-medium text-foreground mb-1">
                    Do you require a company booth or exhibit space? <span className="text-ember">*</span>
                  </p>
                  <div className="space-y-2">
                    <fieldset aria-labelledby="pf-boothRequirement-label" {...describeGroup("boothRequirement")} className="space-y-0 md:space-y-0.5">
                      {[
                        "Yes: Standard 6 ft Table",
                        "Yes: Multiple Tables / Larger Footprint",
                        "No Booth Space Required",
                      ].map((option) => (
                        <label key={option} className={OPTION}>
                          <input
                            type="radio"
                            value={option}
                            {...invalidOption("boothRequirement")}
                            {...register("boothRequirement", {
                              required: "Please select a booth requirement option",
                            })}
                            className={CHOICE}
                          />
                          <span className="text-sm text-foreground">{option}</span>
                        </label>
                      ))}
                    </fieldset>
                  </div>
                  {errors.boothRequirement && (
                    <p id={errId("boothRequirement")} className="text-sm text-ember">{errors.boothRequirement.message}</p>
                  )}
                </div>

                {/* Booth Requirements (conditional) */}
                {["Yes: Standard 6 ft Table", "Yes: Multiple Tables / Larger Footprint"].includes(
                  watch("boothRequirement") || ""
                ) && (
                  <div className="space-y-4 py-4">
                    <p id="pf-boothRequirements-label" className="block text-sm font-medium text-foreground mb-1">
                      Booth Requirements
                    </p>
                    <div role="group" aria-labelledby="pf-boothRequirements-label" {...describeGroup("boothRequirements")} className="space-y-0 md:space-y-0.5">
                      {[
                        "Access to Power Outlet",
                        "Additional Chairs",
                        "Internet / Wi-Fi Access",
                        "Wall Space Nearby",
                        "Display Monitor / Screen",
                        "Additional Setup Area",
                        "Other",
                      ].map((option) => (
                        <label key={option} className={OPTION}>
                          <input
                            type="checkbox"
                            value={option}
                            {...invalidOption("boothRequirements")}
                            {...register("boothRequirements")}
                            className={CHOICE}
                          />
                          <span className="text-sm text-foreground">{option}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {/* Will you bring display banners, backdrops, or pop-ups? */}
                <div className="space-y-4 py-4">
                  <label htmlFor="pf-displayBanners" className="block text-sm font-medium text-foreground mb-1">
                    Will you bring display banners, backdrops, or pop-ups?
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., one 3 ft pull-up banner, one 10 ft backdrop"
                    id="pf-displayBanners"
                    {...describe("displayBanners")}
                    {...register("displayBanners")}
                    className={FIELD}
                  />
                  {errors.displayBanners && (
                    <p id={errId("displayBanners")} className="text-sm text-ember">{errors.displayBanners.message}</p>
                  )}
                </div>

                {/* Equipment Being Brought */}
                <div className="space-y-4 py-4">
                  <label htmlFor="pf-equipmentBeingBrought" className="block text-sm font-medium text-foreground mb-1">
                    Equipment Being Brought
                  </label>
                  <textarea
                    rows={3}
                    placeholder="List any equipment, demonstrations, prototypes, printers, scanners, workstations, VR systems, etc., including approximate quantities and dimensions."
                    id="pf-equipmentBeingBrought"
                    {...describe("equipmentBeingBrought")}
                    {...register("equipmentBeingBrought")}
                    className={FIELD}
                  />
                  {errors.equipmentBeingBrought && (
                    <p id={errId("equipmentBeingBrought")} className="text-sm text-ember">{errors.equipmentBeingBrought.message}</p>
                  )}
                </div>

                {/* Technology & Facility Requirements */}
                <div className="space-y-4 py-4">
                  <p id="pf-techFacilityRequirements-label" className="block text-sm font-medium text-foreground mb-1">
                    Technology & Facility Requirements
                  </p>
                  <div role="group" aria-labelledby="pf-techFacilityRequirements-label" {...describeGroup("techFacilityRequirements")} className="space-y-0 md:space-y-0.5">
                    {[
                      "Standard 120V Power Outlets",
                      "High-Power Electrical Requirements",
                      "Wi-Fi Access",
                      "AV / Projector / Microphone",
                      "HDMI Display Hookup",
                      "Loading Dock Access",
                      "Parking Information Required",
                    ].map((option) => (
                      <label key={option} className={OPTION}>
                        <input
                          type="checkbox"
                          value={option}
                          {...invalidOption("techFacilityRequirements")}
                          {...register("techFacilityRequirements")}
                          className={CHOICE}
                        />
                        <span className="text-sm text-foreground">{option}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Setup & Arrival Timing */}
                <div className="space-y-4 py-4">
                  <p id="pf-setupTiming-label" className="block text-sm font-medium text-foreground mb-1">
                    Setup & Arrival Timing
                  </p>
                  <div className="space-y-2">
                    <fieldset aria-labelledby="pf-setupTiming-label" {...describeGroup("setupTiming")} className="space-y-0 md:space-y-0.5">
                      {[
                        "Standard Arrival (8:00 AM – 8:30 AM)",
                        "Early Access Required (Before 8:00 AM)",
                        "Mid-Day Arrival (Speaking / Judging Block Only)",
                      ].map((option) => (
                        <label key={option} className={OPTION}>
                          <input
                            type="radio"
                            value={option}
                            {...invalidOption("setupTiming")}
                            {...register("setupTiming")}
                            className={CHOICE}
                          />
                          <span className="text-sm text-foreground">{option}</span>
                        </label>
                      ))}
                    </fieldset>
                  </div>
                </div>
              </div>
            </section>

            {/* Section 5: Sponsorship, In-Kind Support & Swag */}
            <section className="space-y-4 border-t border-foreground/10 pt-8">
              <div className="flex items-baseline gap-3">
                <span aria-hidden="true" className="font-mono text-[11px] font-bold tracking-[0.2em] text-ember">05</span>
                <h2 className="font-display text-2xl uppercase leading-none tracking-[0.01em] text-foreground md:text-3xl">Sponsorship, In-Kind Support & Swag</h2>
              </div>
              <p className="text-concrete mb-6">
                Details about your contribution and sponsorship preferences.
              </p>

              <div className="divide-y divide-line">
                {/* Type of Contribution */}
                <div className="space-y-4 py-4">
                  <p id="pf-contributionType-label" className="block text-sm font-medium text-foreground mb-1">
                    Type of Contribution
                  </p>
                  <div role="group" aria-labelledby="pf-contributionType-label" {...describeGroup("contributionType")} className="space-y-0 md:space-y-0.5">
                    {[
                      "Monetary Sponsorship",
                      "Competition Prizes",
                      "Participant Swag",
                      "Equipment Loan",
                      "Software Licences / Credits",
                      "Professional 3D Printing / Material Credits",
                    ].map((option) => (
                      <label key={option} className={OPTION}>
                        <input
                          type="checkbox"
                          value={option}
                          {...invalidOption("contributionType")}
                          {...register("contributionType")}
                          className={CHOICE}
                        />
                        <span className="text-sm text-foreground">{option}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Estimated Value of Contribution */}
                <div className="space-y-4 py-4">
                  <label htmlFor="pf-estimatedValue" className="block text-sm font-medium text-foreground mb-1">
                    Estimated Value of Contribution
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., $500, $1000, In-kind equipment valued at $2000"
                    id="pf-estimatedValue"
                    {...describe("estimatedValue")}
                    {...register("estimatedValue")}
                    className={FIELD}
                  />
                  {errors.estimatedValue && (
                    <p id={errId("estimatedValue")} className="text-sm text-ember">{errors.estimatedValue.message}</p>
                  )}
                </div>

                {/* Sponsorship Recognition Preferences */}
                <div className="space-y-4 py-4">
                  <p id="pf-sponsorshipRecognition-label" className="block text-sm font-medium text-foreground mb-1">
                    Sponsorship Recognition Preferences
                  </p>
                  <div role="group" aria-labelledby="pf-sponsorshipRecognition-label" {...describeGroup("sponsorshipRecognition")} className="space-y-0 md:space-y-0.5">
                    {[
                      "Website Recognition",
                      "Social Media Recognition",
                      "Logo on Event Slides",
                      "Printed Event Materials",
                      "Verbal Recognition During Ceremony",
                      "Booth Presence",
                      "Speaking Opportunity",
                      "Prize Presentation Opportunity",
                    ].map((option) => (
                      <label key={option} className={OPTION}>
                        <input
                          type="checkbox"
                          value={option}
                          {...invalidOption("sponsorshipRecognition")}
                          {...register("sponsorshipRecognition")}
                          className={CHOICE}
                        />
                        <span className="text-sm text-foreground">{option}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Swag / Equipment Delivery Method */}
                <div className="space-y-4 py-4">
                  <p id="pf-swagDeliveryMethod-label" className="block text-sm font-medium text-foreground mb-1">
                    Swag / Equipment Delivery Method
                  </p>
                  <div className="space-y-2">
                    <fieldset aria-labelledby="pf-swagDeliveryMethod-label" {...describeGroup("swagDeliveryMethod")} className="space-y-0 md:space-y-0.5">
                      {[
                        "Bringing In Person on Event Day",
                        "Shipping in Advance",
                        "Digital Fulfillment",
                        "Pickup Arrangement Required",
                      ].map((option) => (
                        <label key={option} className={OPTION}>
                          <input
                            type="radio"
                            value={option}
                            {...invalidOption("swagDeliveryMethod")}
                            {...register("swagDeliveryMethod")}
                            className={CHOICE}
                          />
                          <span className="text-sm text-foreground">{option}</span>
                        </label>
                      ))}
                    </fieldset>
                  </div>
                </div>
              </div>
            </section>

            {/* Section 6: Marketing, Logos & Media Permissions */}
            <section className="space-y-4 border-t border-foreground/10 pt-8">
              <div className="flex items-baseline gap-3">
                <span aria-hidden="true" className="font-mono text-[11px] font-bold tracking-[0.2em] text-ember">06</span>
                <h2 className="font-display text-2xl uppercase leading-none tracking-[0.01em] text-foreground md:text-3xl">Marketing, Logos & Media Permissions</h2>
              </div>
              <p className="text-concrete mb-6">
                Please provide your logo and brand guidelines, and confirm media permissions.
              </p>

<div className="divide-y divide-line">
                {/* Logo and brand guidelines: by email. The form posts JSON, which
                    cannot carry files, so an upload field here would drop them. */}
                <div className="space-y-2 py-4">
                  <p className="block text-sm font-medium text-foreground">{COPY.assetsLabel}</p>
                  <p className="text-sm leading-relaxed text-concrete">
                    {COPY.assetsLead}{" "}
                    <a href={`mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(COPY.assetsSubject)}`} className={MAIL_LINK}>
                      {CONTACT_EMAIL}
                    </a>
                    .
                  </p>
                </div>

                {/* Preferred Partnership Announcement Date */}
                <div className="space-y-4 py-4">
                  <label htmlFor="pf-partnershipAnnouncementDate" className="block text-sm font-medium text-foreground mb-1">
                    Preferred Partnership Announcement Date
                  </label>
                  <input
                    type="date"
                    id="pf-partnershipAnnouncementDate"
                    {...describe("partnershipAnnouncementDate")}
                    {...register("partnershipAnnouncementDate")}
                    className={FIELD}
                  />
                  {errors.partnershipAnnouncementDate && (
                    <p id={errId("partnershipAnnouncementDate")} className="text-sm text-ember">{errors.partnershipAnnouncementDate.message}</p>
                  )}
                </div>

                {/* Media & Logo Permissions */}
                <div className="space-y-4 py-4">
                  <p id="pf-mediaLogoPermissions-label" className="block text-sm font-medium text-foreground mb-1">
                    Media & Logo Permissions <span className="text-ember">*</span>
                  </p>
                  <div role="group" aria-labelledby="pf-mediaLogoPermissions-label" {...describeGroup("mediaLogoPermissions")} className="space-y-0 md:space-y-0.5">
                    {[
                      "I grant permission to feature our organization’s logo on event materials, presentations, and website.",
                      "I grant permission to publicly announce our partnership on social media (@wlmac.3ddesign).",
                      "I grant permission to include attending representatives in event recap photos and videos.",
                    ].map((option) => (
                      <label key={option} className={OPTION}>
                        <input
                          type="checkbox"
                          value={option}
                          {...invalidOption("mediaLogoPermissions")}
                          {...register("mediaLogoPermissions", {
                            required: "Please agree to all media and logo permissions",
                          })}
                          className={CHOICE}
                        />
                        <span className="text-sm text-foreground">{option}</span>
                      </label>
                    ))}
                  </div>
                  {errors.mediaLogoPermissions && (
                    <p id={errId("mediaLogoPermissions")} className="text-sm text-ember">{errors.mediaLogoPermissions.message}</p>
                  )}
                </div>
              </div>
            </section>

            {/* Section 7: Final Details & Confirmations */}
            <section className="space-y-4 border-t border-foreground/10 pt-8">
              <div className="flex items-baseline gap-3">
                <span aria-hidden="true" className="font-mono text-[11px] font-bold tracking-[0.2em] text-ember">07</span>
                <h2 className="font-display text-2xl uppercase leading-none tracking-[0.01em] text-foreground md:text-3xl">Final Details & Confirmations</h2>
              </div>
              <p className="text-concrete mb-6">
                Please provide any final details and confirm your understanding of the policies.
              </p>

              <div className="divide-y divide-line">
                {/* Dietary Restrictions for Attending Representatives */}
                <div className="space-y-4 py-4">
                  <label htmlFor="pf-dietaryRestrictions" className="block text-sm font-medium text-foreground mb-1">
                    Dietary Restrictions for Attending Representatives
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., vegetarian, gluten-free, nut allergies"
                    id="pf-dietaryRestrictions"
                    {...describe("dietaryRestrictions")}
                    {...register("dietaryRestrictions")}
                    className={FIELD}
                  />
                  {errors.dietaryRestrictions && (
                    <p id={errId("dietaryRestrictions")} className="text-sm text-ember">{errors.dietaryRestrictions.message}</p>
                  )}
                </div>

                {/* Anything else we should know prior to our coordination call? */}
                <div className="space-y-4 py-4">
                  <label htmlFor="pf-additionalInfo" className="block text-sm font-medium text-foreground mb-1">
                    Anything else we should know prior to our coordination call?
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Any additional information, constraints, or special requests?"
                    id="pf-additionalInfo"
                    {...describe("additionalInfo")}
                    {...register("additionalInfo")}
                    className={FIELD}
                  />
                  {errors.additionalInfo && (
                    <p id={errId("additionalInfo")} className="text-sm text-ember">{errors.additionalInfo.message}</p>
                  )}
                </div>

                {/* Policy Confirmation */}
                <div className="space-y-4 py-4">
                  <p id="pf-policyConfirmation-label" className="block text-sm font-medium text-foreground mb-1">
                    Policy Confirmation <span className="text-ember">*</span>
                  </p>
                  <div role="group" aria-labelledby="pf-policyConfirmation-label" {...describeGroup("policyConfirmation")} className="space-y-0 md:space-y-0.5">
                    {[
                      "I confirm that the information provided is accurate to the best of my knowledge.",
                      `I understand that attending representatives must comply with ${VENUE_INSTITUTION} and Toronto District School Board (TDSB) visitor policies and event procedures.`,
                    ].map((option) => (
                      <label key={option} className={OPTION}>
                        <input
                          type="checkbox"
                          value={option}
                          {...invalidOption("policyConfirmation")}
                          {...register("policyConfirmation", {
                            required: "Please confirm both policy statements",
                          })}
                          className={CHOICE}
                        />
                        <span className="text-sm text-foreground">{option}</span>
                      </label>
                    ))}
                  </div>
                  {errors.policyConfirmation && (
                    <p id={errId("policyConfirmation")} className="text-sm text-ember">{errors.policyConfirmation.message}</p>
                  )}
                </div>
              </div>
            </section>

            {submitStatus === "error" && (
              <div role="alert" className="border border-ember/40 bg-ember/10 px-4 py-3 text-sm leading-relaxed text-foreground">
                {COPY.errorLead}{" "}
                <a href={`mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(COPY.errorSubject)}`} className={MAIL_LINK}>
                  {CONTACT_EMAIL}
                </a>{" "}
                {COPY.errorTail}
              </div>
            )}

            {/* Submit Button */}
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isSubmitting}
                className="btn-portal px-8 py-4"
              >
                {isSubmitting ? "Submitting..." : "Submit Registration"}
              </button>
            </div>
          </form>
        </>
      )}
    </>
  );
}