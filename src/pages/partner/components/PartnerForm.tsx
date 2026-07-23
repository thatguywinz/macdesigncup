import { useState } from "react";
import { useForm, FieldValues, UseFormSetValue } from "react-hook-form";

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
  // Section 6
  companyLogo: FileList | null;
  brandGuidelines: FileList | null;
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
      companyLogo: null,
      brandGuidelines: null,
      partnershipAnnouncementDate: "",
      mediaLogoPermissions: [],
      // Section 7
      dietaryRestrictions: "",
      additionalInfo: "",
      policyConfirmation: [],
    },
  });

  const numRepresentatives = watch("numRepresentatives");
  const [submitStatus, setSubmitStatus] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const onSubmit = async (data: FormValues) => {
    setSubmitStatus(null);
    try {
      const response = await fetch("/api/partner-register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Submission failed");
      }

      setSubmitStatus({
        type: "success",
        message: "Partner application submitted successfully!",
      });
      // Optionally reset form after a short delay
      setTimeout(() => {
        reset();
        setSubmitStatus(null);
      }, 5000);
    } catch (error) {
      setSubmitStatus({
        type: "error",
        message: error instanceof Error ? error.message : "An unexpected error occurred",
      });
    }
  };

  return (
    <>
      {submitStatus?.type === "success" ? (
        <div className="fixed inset-0 flex flex-col items-center justify-center bg-background/50 backdrop-blur-sm p-6">
          <div className="text-center">
            <div className="inline-block px-6 py-3 bg-concrete/20 rounded-lg border border-concrete/20 mb-6">
              <span className="font-mono text-2x">✓</span>
              <h3 className="mt-2 text-lg font-mono tracking-wider">Partner Application Submitted</h3>
              <p className="mt-4 text-concrete">
                Thank you for your partnership interest! We'll review your application and get back to you soon.
              </p>
            </div>
            <button
              onClick={() => {
                setSubmitStatus(null);
                reset();
              }}
              className="btn-portal"
            >
              Submit Another Application
            </button>
          </div>
        </div>
      ) : (
        <>
          {submitStatus?.type === "error" && (
            <div className="mb-4 px-4 py-2 rounded bg-ember/10 text-ember border border-ember/20">
              {submitStatus.message}
            </div>
          )}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Section 1: Organization & Primary Contact Information */}
            <section className="space-y-4">
              <div className="flex items-center gap-3">
                <span className="h-1.5 w-1.5 bg-emerald/20 rounded">01</span>
                <h2 className="font-mono text-xl uppercase tracking-wider">Organization & Primary Contact Information</h2>
              </div>
              <p className="text-concrete mb-6">
                Please provide your organization's details and primary contact information.
              </p>

              <div className="divide-y divide-concrete">
                {/* Organization / Company Name */}
                <div className="space-y-4 py-4">
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Organization / Company Name <span className="text-ember">*</span>
                  </label>
                  <input
                    type="text"
                    {...register("organizationName", {
                      required: "Organization name is required",
                    })}
                    className="block w-full rounded-md border border-concrete bg-background px-3 py-2 text-sm font-mono text-foreground placeholder-concrete focus:border-ember focus:ring-1 focus:ring-ember"
                  />
                  {errors.organizationName && (
                    <p className="text-sm text-ember">{errors.organizationName.message}</p>
                  )}
                </div>

                {/* Organization Type */}
                <div className="space-y-4 py-4">
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Organization Type <span className="text-ember">*</span>
                  </label>
                  <div className="space-y-2">
                    <fieldset className="space-y-1">
                      {[
                        "Industry / Company",
                        "Startup",
                        "University / College",
                        "Non-profit / Community Organization",
                        "Government / Public Sector",
                        "Other",
                      ].map((option) => (
                        <div key={option} className="flex items-center gap-2">
                          <input
                            type="radio"
                            value={option}
                            {...register("organizationType", {
                              required: "Please select an organization type",
                            })}
                            className="h-4 w-4 text-ember focus:ring-ember"
                          />
                          <label className="text-sm text-foreground">{option}</label>
                        </div>
                      ))}
                    </fieldset>
                  </div>
                  {errors.organizationType && (
                    <p className="text-sm text-ember">{errors.organizationType.message}</p>
                  )}
                </div>

                {/* Company Website */}
                <div className="space-y-4 py-4">
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Company Website
                  </label>
                  <input
                    type="url"
                    placeholder="https://example.com"
                    {...register("companyWebsite")}
                    className="block w-full rounded-md border border-concrete bg-background px-3 py-2 text-sm font-mono text-foreground placeholder-concrete focus:border-ember focus:ring-1 focus:ring-ember"
                  />
                  {errors.companyWebsite && (
                    <p className="text-sm text-ember">{errors.companyWebsite.message}</p>
                  )}
                </div>

                {/* Social Media Handles */}
                <div className="space-y-4 py-4">
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Social Media Handles
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., @mackdesigncup on Instagram, Twitter, LinkedIn"
                    {...register("socialMediaHandles")}
                    className="block w-full rounded-md border border-concrete bg-background px-3 py-2 text-sm font-mono text-foreground placeholder-concrete focus:border-ember focus:ring-1 focus:ring-ember"
                  />
                  {errors.socialMediaHandles && (
                    <p className="text-sm text-ember">{errors.socialMediaHandles.message}</p>
                  )}
                </div>

                {/* Industry / Sector */}
                <div className="space-y-4 py-4">
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Industry / Sector
                  </label>
                  <input
                    type="text"
                    placeholder="Aerospace, Mechanical Engineering, etc."
                    {...register("industrySector")}
                    className="block w-full rounded-md border border-concrete bg-background px-3 py-2 text-sm font-mono text-foreground placeholder-concrete focus:border-ember focus:ring-1 focus:ring-ember"
                  />
                  {errors.industrySector && (
                    <p className="text-sm text-ember">{errors.industrySector.message}</p>
                  )}
                </div>

                {/* Short Company Description */}
                <div className="space-y-4 py-4">
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Short Company Description
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Brief 2-3 sentence overview for website, program, and promotional materials"
                    {...register("companyDescription")}
                    className="block w-full rounded-md border border-concrete bg-background px-3 py-2 text-sm font-mono text-foreground placeholder-concrete focus:border-ember focus:ring-1 focus:ring-ember"
                  />
                  {errors.companyDescription && (
                    <p className="text-sm text-ember">{errors.companyDescription.message}</p>
                  )}
                </div>

                {/* Primary Contact Name */}
                <div className="space-y-4 py-4">
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Primary Contact Name <span className="text-ember">*</span>
                  </label>
                  <input
                    type="text"
                    {...register("primaryContactName", {
                      required: "Primary contact name is required",
                    })}
                    className="block w-full rounded-md border border-concrete bg-background px-3 py-2 text-sm font-mono text-foreground placeholder-concrete focus:border-ember focus:ring-1 focus:ring-ember"
                  />
                  {errors.primaryContactName && (
                    <p className="text-sm text-ember">{errors.primaryContactName.message}</p>
                  )}
                </div>

                {/* Primary Contact Email */}
                <div className="space-y-4 py-4">
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Primary Contact Email <span className="text-ember">*</span>
                  </label>
                  <input
                    type="email"
                    {...register("primaryContactEmail", {
                      required: "Email is required",
                      pattern: {
                        value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                        message: "Please enter a valid email address",
                      },
                    })}
                    className="block w-full rounded-md border border-concrete bg-background px-3 py-2 text-sm font-mono text-foreground placeholder-concrete focus:border-ember focus:ring-1 focus:ring-ember"
                  />
                  {errors.primaryContactEmail && (
                    <p className="text-sm text-ember">{errors.primaryContactEmail.message}</p>
                  )}
                </div>

                {/* Primary Contact Phone Number */}
                <div className="space-y-4 py-4">
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Primary Contact Phone Number
                  </label>
                  <input
                    type="tel"
                    placeholder="e.g., (416) 555-1234"
                    {...register("primaryContactPhone")}
                    className="block w-full rounded-md border border-concrete bg-background px-3 py-2 text-sm font-mono text-foreground placeholder-concrete focus:border-ember focus:ring-1 focus:ring-ember"
                  />
                  {errors.primaryContactPhone && (
                    <p className="text-sm text-ember">{errors.primaryContactPhone.message}</p>
                  )}
                </div>
              </div>
            </section>

            {/* Section 2: Partnership & Event Involvement */}
            <section className="space-y-4">
              <div className="flex items-center gap-3">
                <span className="h-1.5 w-1.5 bg-ember/20 rounded">02</span>
                <h2 className="font-mono text-xl uppercase tracking-wider">Partnership & Event Involvement</h2>
              </div>
              <p className="text-concrete mb-6">
                Tell us how you'd like to participate and contribute to the event.
              </p>

              <div className="divide-y divide-concrete">
                {/* What type of involvement is your organization interested in? */}
                <div className="space-y-4 py-4">
                  <label className="block text-sm font-medium text-foreground mb-1">
                    What type of involvement is your organization interested in? <span className="text-ember">*</span>
                  </label>
                  <div className="space-y-1">
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
                      <label key={option} className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          value={option}
                          {...register("involvementTypes", {
                            required: "Please select at least one involvement type",
                          })}
                          className="h-4 w-4 text-ember focus:ring-ember"
                        />
                        <span className="text-sm text-foreground">{option}</span>
                      </label>
                    ))}
                  </div>
                  {errors.involvementTypes && (
                    <p className="text-sm text-ember">{errors.involvementTypes.message}</p>
                  )}
                </div>

                {/* Would your organization be interested in leading a workshop or tutorial session? */}
                <div className="space-y-4 py-4">
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Would your organization be interested in leading a workshop or tutorial session?
                  </label>
                  <div className="space-y-1">
                    {[
                      "CAD Fundamentals",
                      "Advanced CAD Techniques",
                      "Additive Manufacturing / 3D Printing",
                      "Engineering Design Process",
                      "Industry Software Demonstration",
                      "Design Thinking & Prototyping",
                      "Other",
                    ].map((option) => (
                      <label key={option} className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          value={option}
                          {...register("workshopInterest")}
                          className="h-4 w-4 text-ember focus:ring-ember"
                        />
                        <span className="text-sm text-foreground">{option}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Preferred Duration of Involvement */}
                <div className="space-y-4 py-4">
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Preferred Duration of Involvement
                  </label>
                  <div className="space-y-2">
                    <fieldset className="space-y-1">
                      {[
                        "1–2 Hours",
                        "3–4 Hours",
                        "Entire Event Day",
                        "Flexible / To Be Determined",
                      ].map((option) => (
                        <div key={option} className="flex items-center gap-2">
                          <input
                            type="radio"
                            value={option}
                            {...register("preferredDuration")}
                            className="h-4 w-4 text-ember focus:ring-ember"
                          />
                          <label className="text-sm text-foreground">{option}</label>
                        </div>
                      ))}
                    </fieldset>
                  </div>
                </div>

                {/* Estimated Number of Representatives Attending */}
                <div className="space-y-4 py-4">
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Estimated Number of Representatives Attending <span className="text-ember">*</span>
                  </label>
                  <div className="space-y-2">
                    <fieldset className="space-y-1">
                      {[
                        "1 Representative",
                        "2 Representatives",
                        "3 Representatives",
                        "4+ Representatives",
                        "0 Representatives (Remote Support Only)",
                      ].map((option) => (
                        <div key={option} className="flex items-center gap-2">
                          <input
                            type="radio"
                            value={option}
                            {...register("numRepresentatives", {
                              required: "Please select the number of representatives",
                            })}
                            className="h-4 w-4 text-ember focus:ring-ember"
                          />
                          <label className="text-sm text-foreground">{option}</label>
                        </div>
                      ))}
                    </fieldset>
                  </div>
                  {errors.numRepresentatives && (
                    <p className="text-sm text-ember">{errors.numRepresentatives.message}</p>
                  )}
                </div>

                {/* Preferred Role(s) for Attending Representatives */}
                <div className="space-y-4 py-4">
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Preferred Role(s) for Attending Representatives
                  </label>
                  <div className="space-y-1">
                    {[
                      "Engineer / Designer Mentor",
                      "Guest Speaker",
                      "Competition Judge",
                      "Executive / Company Representative",
                      "Technical Specialist (Equipment / Demonstration)",
                      "Workshop Facilitator",
                      "Other",
                    ].map((option) => (
                      <label key={option} className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          value={option}
                          {...register("preferredRoles")}
                          className="h-4 w-4 text-ember focus:ring-ember"
                        />
                        <span className="text-sm text-foreground">{option}</span>
                      </label>
                    ))}
                  </div>
                </div>

{/* Student Interaction Preferences */}
                <div className="space-y-4 py-4">
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Student Interaction Preferences
                  </label>
                  <div className="space-y-1">
                    {[
                      "Informal Career Conversations",
                      "Student Portfolio / CAD Feedback",
                      "Q&A About Industry Software & Workflows",
                      "Educational Resource Sharing",
                      "Networking With Student Teams",
                    ].map((option) => (
                      <label key={option} className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          value={option}
                          {...register("studentInteraction")}
                          className="h-4 w-4 text-ember focus:ring-ember"
                        />
                        <span className="text-sm text-foreground">{option}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            {/* Section 3: Representative Details & Visitor Information */}
            <section className="space-y-4">
              <div className="flex items-center gap-3">
                <span className="h-1.5 w-1.5 bg-ember/20 rounded">03</span>
                <h2 className="font-mono text-xl uppercase tracking-wider">Representative Details & Visitor Information</h2>
              </div>
              <p className="text-concrete mb-6">
                Please provide details for each attending representative based on the number selected above.
              </p>

              <div className="divide-y divide-concrete">
                {/* Representative #1 */}
                {numRepresentatives === "1 Representative" ||
                  numRepresentatives === "2 Representatives" ||
                  numRepresentatives === "3 Representatives" ||
                  numRepresentatives === "4+ Representatives" ? (
                  <>
                    <div className="space-y-4 py-4">
                      <label className="block text-sm font-medium text-foreground mb-1">
                        Representative #1 – Full Name <span className="text-ember">*</span>
                      </label>
                      <input
                        type="text"
                        {...register("representative1Name", {
                          required: "Representative 1 name is required",
                        })}
                        className="block w-full rounded-md border border-concrete bg-background px-3 py-2 text-sm font-mono text-foreground placeholder-concrete focus:border-ember focus:ring-1 focus:ring-ember"
                      />
                      {errors.representative1Name && (
                        <p className="text-sm text-ember">{errors.representative1Name.message}</p>
                      )}
                    </div>

                    <div className="space-y-4 py-4">
                      <label className="block text-sm font-medium text-foreground mb-1">
                        Representative #1 – Job Title & Role <span className="text-ember">*</span>
                      </label>
                      <input
                        type="text"
                        {...register("representative1Title", {
                          required: "Representative 1 title is required",
                        })}
                        className="block w-full rounded-md border border-concrete bg-background px-3 py-2 text-sm font-mono text-foreground placeholder-concrete focus:border-ember focus:ring-1 focus:ring-ember"
                      />
                      {errors.representative1Title && (
                        <p className="text-sm text-ember">{errors.representative1Title.message}</p>
                      )}
                    </div>

                    <div className="space-y-4 py-4">
                      <label className="block text-sm font-medium text-foreground mb-1">
                        Representative #1 – Email Address <span className="text-ember">*</span>
                      </label>
                      <input
                        type="email"
                        {...register("representative1Email", {
                          required: "Representative 1 email is required",
                          pattern: {
                            value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                            message: "Please enter a valid email address",
                          },
                        })}
                        className="block w-full rounded-md border border-concrete bg-background px-3 py-2 text-sm font-mono text-foreground placeholder-concrete focus:border-ember focus:ring-1 focus:ring-ember"
                      />
                      {errors.representative1Email && (
                        <p className="text-sm text-ember">{errors.representative1Email.message}</p>
                      )}
                    </div>

                    <div className="space-y-4 py-4">
                      <label className="block text-sm font-medium text-foreground mb-1">
                        Representative #1 – Phone Number
                      </label>
                      <input
                        type="tel"
                        placeholder="e.g., (416) 555-1234"
                        {...register("representative1Phone")}
                        className="block w-full rounded-md border border-concrete bg-background px-3 py-2 text-sm font-mono text-foreground placeholder-concrete focus:border-ember focus:ring-1 focus:ring-ember"
                      />
                      {errors.representative1Phone && (
                        <p className="text-sm text-ember">{errors.representative1Phone.message}</p>
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
                      <label className="block text-sm font-medium text-foreground mb-1">
                        Representative #2 – Full Name <span className="text-ember">*</span>
                      </label>
                      <input
                        type="text"
                        {...register("representative2Name", {
                          required: "Representative 2 name is required",
                        })}
                        className="block w-full rounded-md border border-concrete bg-background px-3 py-2 text-sm font-mono text-foreground placeholder-concrete focus:border-ember focus:ring-1 focus:ring-ember"
                      />
                      {errors.representative2Name && (
                        <p className="text-sm text-ember">{errors.representative2Name.message}</p>
                      )}
                    </div>

                    <div className="space-y-4 py-4">
                      <label className="block text-sm font-medium text-foreground mb-1">
                        Representative #2 – Job Title & Role <span className="text-ember">*</span>
                      </label>
                      <input
                        type="text"
                        {...register("representative2Title", {
                          required: "Representative 2 title is required",
                        })}
                        className="block w-full rounded-md border border-concrete bg-background px-3 py-2 text-sm font-mono text-foreground placeholder-concrete focus:border-ember focus:ring-1 focus:ring-ember"
                      />
                      {errors.representative2Title && (
                        <p className="text-sm text-ember">{errors.representative2Title.message}</p>
                      )}
                    </div>

                    <div className="space-y-4 py-4">
                      <label className="block text-sm font-medium text-foreground mb-1">
                        Representative #2 – Email Address <span className="text-ember">*</span>
                      </label>
                      <input
                        type="email"
                        {...register("representative2Email", {
                          required: "Representative 2 email is required",
                          pattern: {
                            value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                            message: "Please enter a valid email address",
                          },
                        })}
                        className="block w-full rounded-md border border-concrete bg-background px-3 py-2 text-sm font-mono text-foreground placeholder-concrete focus:border-ember focus:ring-1 focus:ring-ember"
                      />
                      {errors.representative2Email && (
                        <p className="text-sm text-ember">{errors.representative2Email.message}</p>
                      )}
                    </div>

                    <div className="space-y-4 py-4">
                      <label className="block text-sm font-medium text-foreground mb-1">
                        Representative #2 – Phone Number
                      </label>
                      <input
                        type="tel"
                        placeholder="e.g., (416) 555-1234"
                        {...register("representative2Phone")}
                        className="block w-full rounded-md border border-concrete bg-background px-3 py-2 text-sm font-mono text-foreground placeholder-concrete focus:border-ember focus:ring-1 focus:ring-ember"
                      />
                      {errors.representative2Phone && (
                        <p className="text-sm text-ember">{errors.representative2Phone.message}</p>
                      )}
                    </div>
                  </>
                ) : null}

                {/* Representative #3 */}
                {numRepresentatives === "3 Representatives" ||
                  numRepresentatives === "4+ Representatives" ? (
                  <>
                    <div className="space-y-4 py-4">
                      <label className="block text-sm font-medium text-foreground mb-1">
                        Representative #3 – Full Name <span className="text-ember">*</span>
                      </label>
                      <input
                        type="text"
                        {...register("representative3Name", {
                          required: "Representative 3 name is required",
                        })}
                        className="block w-full rounded-md border border-concrete bg-background px-3 py-2 text-sm font-mono text-foreground placeholder-concrete focus:border-ember focus:ring-1 focus:ring-ember"
                      />
                      {errors.representative3Name && (
                        <p className="text-sm text-ember">{errors.representative3Name.message}</p>
                      )}
                    </div>

                    <div className="space-y-4 py-4">
                      <label className="block text-sm font-medium text-foreground mb-1">
                        Representative #3 – Job Title & Role <span className="text-ember">*</span>
                      </label>
                      <input
                        type="text"
                        {...register("representative3Title", {
                          required: "Representative 3 title is required",
                        })}
                        className="block w-full rounded-md border border-concrete bg-background px-3 py-2 text-sm font-mono text-foreground placeholder-concrete focus:border-ember focus:ring-1 focus:ring-ember"
                      />
                      {errors.representative3Title && (
                        <p className="text-sm text-ember">{errors.representative3Title.message}</p>
                      )}
                    </div>

                    <div className="space-y-4 py-4">
                      <label className="block text-sm font-medium text-foreground mb-1">
                        Representative #3 – Email Address <span className="text-ember">*</span>
                      </label>
                      <input
                        type="email"
                        {...register("representative3Email", {
                          required: "Representative 3 email is required",
                          pattern: {
                            value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                            message: "Please enter a valid email address",
                          },
                        })}
                        className="block w-full rounded-md border border-concrete bg-background px-3 py-2 text-sm font-mono text-foreground placeholder-concrete focus:border-ember focus:ring-1 focus:ring-ember"
                      />
                      {errors.representative3Email && (
                        <p className="text-sm text-ember">{errors.representative3Email.message}</p>
                      )}
                    </div>

                    <div className="space-y-4 py-4">
                      <label className="block text-sm font-medium text-foreground mb-1">
                        Representative #3 – Phone Number
                      </label>
                      <input
                        type="tel"
                        placeholder="e.g., (416) 555-1234"
                        {...register("representative3Phone")}
                        className="block w-full rounded-md border border-concrete bg-background px-3 py-2 text-sm font-mono text-foreground placeholder-concrete focus:border-ember focus:ring-1 focus:ring-ember"
                      />
                      {errors.representative3Phone && (
                        <p className="text-sm text-ember">{errors.representative3Phone.message}</p>
                      )}
                    </div>
                  </>
                ) : null}

                {/* Accessibility Accommodations */}
                <div className="space-y-4 py-4">
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Accessibility Accommodations Needed for Representatives
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Please let us know if any accommodations are required to ensure a comfortable and accessible experience."
                    {...register("accessibilityAccommodations")}
                    className="block w-full rounded-md border border-concrete bg-background px-3 py-2 text-sm font-mono text-foreground placeholder-concrete focus:border-ember focus:ring-1 focus:ring-ember"
                  />
                  {errors.accessibilityAccommodations && (
                    <p className="text-sm text-ember">{errors.accessibilityAccommodations.message}</p>
                  )}
                </div>
              </div>
            </section>

            {/* Section 4: Booth, Equipment & Logistics */}
            <section className="space-y-4">
              <div className="flex items-center gap-3">
                <span className="h-1.5 w-1.5 bg-ember/20 rounded">04</span>
                <h2 className="font-mono text-xl uppercase tracking-wider">Booth, Equipment & Logistics</h2>
              </div>
              <p className="text-concrete mb-6">
                Details about your booth setup, equipment, and logistical needs.
              </p>

              <div className="divide-y divide-concrete">
                {/* Do you require a company booth or exhibit space? */}
                <div className="space-y-4 py-4">
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Do you require a company booth or exhibit space? <span className="text-ember">*</span>
                  </label>
                  <div className="space-y-2">
                    <fieldset className="space-y-1">
                      {[
                        "Yes – Standard 6 ft Table",
                        "Yes – Multiple Tables / Larger Footprint",
                        "No Booth Space Required",
                      ].map((option) => (
                        <div key={option} className="flex items-center gap-2">
                          <input
                            type="radio"
                            value={option}
                            {...register("boothRequirement", {
                              required: "Please select a booth requirement option",
                            })}
                            className="h-4 w-4 text-ember focus:ring-ember"
                          />
                          <label className="text-sm text-foreground">{option}</label>
                        </div>
                      ))}
                    </fieldset>
                  </div>
                  {errors.boothRequirement && (
                    <p className="text-sm text-ember">{errors.boothRequirement.message}</p>
                  )}
                </div>

                {/* Booth Requirements (conditional) */}
                {["Yes – Standard 6 ft Table", "Yes – Multiple Tables / Larger Footprint"].includes(
                  watch("boothRequirement") || ""
                ) && (
                  <div className="space-y-4 py-4">
                    <label className="block text-sm font-medium text-foreground mb-1">
                      Booth Requirements
                    </label>
                    <div className="space-y-1">
                      {[
                        "Access to Power Outlet",
                        "Additional Chairs",
                        "Internet / Wi-Fi Access",
                        "Wall Space Nearby",
                        "Display Monitor / Screen",
                        "Additional Setup Area",
                        "Other",
                      ].map((option) => (
                        <label key={option} className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            value={option}
                            {...register("boothRequirements")}
                            className="h-4 w-4 text-ember focus:ring-ember"
                          />
                          <span className="text-sm text-foreground">{option}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {/* Will you bring display banners, backdrops, or pop-ups? */}
                <div className="space-y-4 py-4">
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Will you bring display banners, backdrops, or pop-ups?
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., one 3 ft pull-up banner, one 10 ft backdrop"
                    {...register("displayBanners")}
                    className="block w-full rounded-md border border-concrete bg-background px-3 py-2 text-sm font-mono text-foreground placeholder-concrete focus:border-ember focus:ring-1 focus:ring-ember"
                  />
                  {errors.displayBanners && (
                    <p className="text-sm text-ember">{errors.displayBanners.message}</p>
                  )}
                </div>

                {/* Equipment Being Brought */}
                <div className="space-y-4 py-4">
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Equipment Being Brought
                  </label>
                  <textarea
                    rows={3}
                    placeholder="List any equipment, demonstrations, prototypes, printers, scanners, workstations, VR systems, etc., including approximate quantities and dimensions."
                    {...register("equipmentBeingBrought")}
                    className="block w-full rounded-md border border-concrete bg-background px-3 py-2 text-sm font-mono text-foreground placeholder-concrete focus:border-ember focus:ring-1 focus:ring-ember"
                  />
                  {errors.equipmentBeingBrought && (
                    <p className="text-sm text-ember">{errors.equipmentBeingBrought.message}</p>
                  )}
                </div>

                {/* Technology & Facility Requirements */}
                <div className="space-y-4 py-4">
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Technology & Facility Requirements
                  </label>
                  <div className="space-y-1">
                    {[
                      "Standard 120V Power Outlets",
                      "High-Power Electrical Requirements",
                      "Wi-Fi Access",
                      "AV / Projector / Microphone",
                      "HDMI Display Hookup",
                      "Loading Dock Access",
                      "Parking Information Required",
                    ].map((option) => (
                      <label key={option} className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          value={option}
                          {...register("techFacilityRequirements")}
                          className="h-4 w-4 text-ember focus:ring-ember"
                        />
                        <span className="text-sm text-foreground">{option}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Setup & Arrival Timing */}
                <div className="space-y-4 py-4">
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Setup & Arrival Timing
                  </label>
                  <div className="space-y-2">
                    <fieldset className="space-y-1">
                      {[
                        "Standard Arrival (8:00 AM – 8:30 AM)",
                        "Early Access Required (Before 8:00 AM)",
                        "Mid-Day Arrival (Speaking / Judging Block Only)",
                      ].map((option) => (
                        <div key={option} className="flex items-center gap-2">
                          <input
                            type="radio"
                            value={option}
                            {...register("setupTiming")}
                            className="h-4 w-4 text-ember focus:ring-ember"
                          />
                          <label className="text-sm text-foreground">{option}</label>
                        </div>
                      ))}
                    </fieldset>
                  </div>
                </div>
              </div>
            </section>

            {/* Section 5: Sponsorship, In-Kind Support & Swag */}
            <section className="space-y-4">
              <div className="flex items-center gap-3">
                <span className="h-1.5 w-1.5 bg-ember/20 rounded">05</span>
                <h2 className="font-mono text-xl uppercase tracking-wider">Sponsorship, In-Kind Support & Swag</h2>
              </div>
              <p className="text-concrete mb-6">
                Details about your contribution and sponsorship preferences.
              </p>

              <div className="divide-y divide-concrete">
                {/* Type of Contribution */}
                <div className="space-y-4 py-4">
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Type of Contribution
                  </label>
                  <div className="space-y-1">
                    {[
                      "Monetary Sponsorship",
                      "Competition Prizes",
                      "Participant Swag",
                      "Equipment Loan",
                      "Software Licenses / Credits",
                      "Professional 3D Printing / Material Credits",
                    ].map((option) => (
                      <label key={option} className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          value={option}
                          {...register("contributionType")}
                          className="h-4 w-4 text-ember focus:ring-ember"
                        />
                        <span className="text-sm text-foreground">{option}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Estimated Value of Contribution */}
                <div className="space-y-4 py-4">
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Estimated Value of Contribution
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., $500, $1000, In-kind equipment valued at $2000"
                    {...register("estimatedValue")}
                    className="block w-full rounded-md border border-concrete bg-background px-3 py-2 text-sm font-mono text-foreground placeholder-concrete focus:border-ember focus:ring-1 focus:ring-ember"
                  />
                  {errors.estimatedValue && (
                    <p className="text-sm text-ember">{errors.estimatedValue.message}</p>
                  )}
                </div>

                {/* Sponsorship Recognition Preferences */}
                <div className="space-y-4 py-4">
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Sponsorship Recognition Preferences
                  </label>
                  <div className="space-y-1">
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
                      <label key={option} className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          value={option}
                          {...register("sponsorshipRecognition")}
                          className="h-4 w-4 text-ember focus:ring-ember"
                        />
                        <span className="text-sm text-foreground">{option}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Swag / Equipment Delivery Method */}
                <div className="space-y-4 py-4">
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Swag / Equipment Delivery Method
                  </label>
                  <div className="space-y-2">
                    <fieldset className="space-y-1">
                      {[
                        "Bringing In Person on Event Day",
                        "Shipping in Advance",
                        "Digital Fulfillment",
                        "Pickup Arrangement Required",
                      ].map((option) => (
                        <div key={option} className="flex items-center gap-2">
                          <input
                            type="radio"
                            value={option}
                            {...register("swagDeliveryMethod")}
                            className="h-4 w-4 text-ember focus:ring-ember"
                          />
                          <label className="text-sm text-foreground">{option}</label>
                        </div>
                      ))}
                    </fieldset>
                  </div>
                </div>
              </div>
            </section>

            {/* Section 6: Marketing, Logos & Media Permissions */}
            <section className="space-y-4">
              <div className="flex items-center gap-3">
                <span className="h-1.5 w-1.5 bg-ember/20 rounded">06</span>
                <h2 className="font-mono text-xl uppercase tracking-wider">Marketing, Logos & Media Permissions</h2>
              </div>
              <p className="text-concrete mb-6">
                Please provide your logo and brand guidelines, and confirm media permissions.
              </p>

<div className="divide-y divide-concrete">
                {/* Company Logo Upload */}
                <div className="space-y-4 py-4">
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Company Logo Upload
                  </label>
                  <input
                    type="file"
                    accept=".png,.svg,.pdf,.jpeg,.jpg"
                    {...register("companyLogo", {
                      validate: (files: FileList | null) => {
                        if (!files || files.length === 0) return true;
                        const file = files[0];
                        const isValidSize = file.size <= 10 * 1024 * 1024;
                        const isValidType = [
                          "image/png",
                          "image/svg+xml",
                          "application/pdf",
                          "image/jpeg",
                          "image/jpg",
                        ].includes(file.type);
                        return (
                          (isValidSize && isValidType) ||
                          "File must be PNG, SVG, PDF, or JPEG and under 10MB"
                        );
                      },
                    })}
                    className="block w-full text-sm text-foreground file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-ember file:text-background hover:file:bg-ember/80"
                  />
                  {errors.companyLogo && (
                    <p className="text-sm text-ember">{errors.companyLogo.message}</p>
                  )}
                </div>

                {/* Brand Guidelines Upload */}
                <div className="space-y-4 py-4">
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Brand Guidelines Upload
                  </label>
                  <input
                    type="file"
                    accept=".pdf,.zip"
                    {...register("brandGuidelines", {
                      validate: (files: FileList | null) => {
                        if (!files || files.length === 0) return true;
                        const file = files[0];
                        const isValidSize = file.size <= 10 * 1024 * 1024;
                        const isValidType = [
                          "application/pdf",
                          "application/zip",
                          "application/x-zip-compressed",
                        ].includes(file.type);
                        return (
                          (isValidSize && isValidType) ||
                          "File must be PDF or ZIP and under 10MB"
                        );
                      },
                    })}
                    className="block w-full text-sm text-foreground file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-ember file:text-background hover:file:bg-ember/80"
                  />
                  {errors.brandGuidelines && (
                    <p className="text-sm text-ember">{errors.brandGuidelines.message}</p>
                  )}
                </div>

                {/* Preferred Partnership Announcement Date */}
                <div className="space-y-4 py-4">
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Preferred Partnership Announcement Date
                  </label>
                  <input
                    type="date"
                    {...register("partnershipAnnouncementDate")}
                    className="block w-full rounded-md border border-concrete bg-background px-3 py-2 text-sm font-mono text-foreground placeholder-concrete focus:border-ember focus:ring-1 focus:ring-ember"
                  />
                  {errors.partnershipAnnouncementDate && (
                    <p className="text-sm text-ember">{errors.partnershipAnnouncementDate.message}</p>
                  )}
                </div>

                {/* Media & Logo Permissions */}
                <div className="space-y-4 py-4">
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Media & Logo Permissions <span className="text-ember">*</span>
                  </label>
                  <div className="space-y-1">
                    {[
                      "I grant permission to feature our organization’s logo on event materials, presentations, and website.",
                      "I grant permission to publicly announce our partnership on social media (@wlmac.3ddesign).",
                      "I grant permission to include attending representatives in event recap photos and videos.",
                    ].map((option) => (
                      <label key={option} className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          value={option}
                          {...register("mediaLogoPermissions", {
                            required: "Please agree to all media and logo permissions",
                          })}
                          className="h-4 w-4 text-ember focus:ring-ember"
                        />
                        <span className="text-sm text-foreground">{option}</span>
                      </label>
                    ))}
                  </div>
                  {errors.mediaLogoPermissions && (
                    <p className="text-sm text-ember">{errors.mediaLogoPermissions.message}</p>
                  )}
                </div>
              </div>
            </section>

            {/* Section 7: Final Details & Confirmations */}
            <section className="space-y-4">
              <div className="flex items-center gap-3">
                <span className="h-1.5 w-1.5 bg-ember/20 rounded">07</span>
                <h2 className="font-mono text-xl uppercase tracking-wider">Final Details & Confirmations</h2>
              </div>
              <p className="text-concrete mb-6">
                Please provide any final details and confirm your understanding of the policies.
              </p>

              <div className="divide-y divide-concrete">
                {/* Dietary Restrictions for Attending Representatives */}
                <div className="space-y-4 py-4">
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Dietary Restrictions for Attending Representatives
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., vegetarian, gluten-free, nut allergies"
                    {...register("dietaryRestrictions")}
                    className="block w-full rounded-md border border-concrete bg-background px-3 py-2 text-sm font-mono text-foreground placeholder-concrete focus:border-ember focus:ring-1 focus:ring-ember"
                  />
                  {errors.dietaryRestrictions && (
                    <p className="text-sm text-ember">{errors.dietaryRestrictions.message}</p>
                  )}
                </div>

                {/* Anything else we should know prior to our coordination call? */}
                <div className="space-y-4 py-4">
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Anything else we should know prior to our coordination call?
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Any additional information, constraints, or special requests?"
                    {...register("additionalInfo")}
                    className="block w-full rounded-md border border-concrete bg-background px-3 py-2 text-sm font-mono text-foreground placeholder-concrete focus:border-ember focus:ring-1 focus:ring-ember"
                  />
                  {errors.additionalInfo && (
                    <p className="text-sm text-ember">{errors.additionalInfo.message}</p>
                  )}
                </div>

                {/* Policy Confirmation */}
                <div className="space-y-4 py-4">
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Policy Confirmation <span className="text-ember">*</span>
                  </label>
                  <div className="space-y-1">
                    {[
                      "I confirm that the information provided is accurate to the best of my knowledge.",
                      "I understand that attending representatives must comply with George Brown College and Toronto District School Board (TDSB) visitor policies and event procedures.",
                    ].map((option) => (
                      <label key={option} className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          value={option}
                          {...register("policyConfirmation", {
                            required: "Please confirm both policy statements",
                          })}
                          className="h-4 w-4 text-ember focus:ring-ember"
                        />
                        <span className="text-sm text-foreground">{option}</span>
                      </label>
                    ))}
                  </div>
                  {errors.policyConfirmation && (
                    <p className="text-sm text-ember">{errors.policyConfirmation.message}</p>
                  )}
                </div>
              </div>
            </section>

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