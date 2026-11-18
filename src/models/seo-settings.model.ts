import { Schema, model, type InferSchemaType } from "mongoose";

// Single document holding every piece of shared copy on the SEO landing
// pages, the /seo-pages directory and the footer, so all of it is editable
// from Admin → SEO Management → Page Content Settings instead of living in
// code. Placeholders: {place} = location / city name, {name} = page name.
const titledTextSchema = new Schema({ title: { type: String, trim: true }, text: { type: String, trim: true } }, { _id: false });

const seoSettingsSchema = new Schema(
  {
    key: { type: String, default: "global", unique: true },
    landing: {
      bookButtonLabel: String,
      whatsappButtonLabel: String,
      whatsappMessage: String,
      servicesEyebrow: String,
      businessServicesEyebrow: String,
      servicesHeading: String,
      servicesHeadingNoPlace: String,
      coverageHeading: String,
      whyEyebrow: String,
      whyHeading: String,
      whyItems: { type: [titledTextSchema], default: undefined },
      stepsEyebrow: String,
      stepsHeading: String,
      steps: { type: [titledTextSchema], default: undefined },
      reviewsEyebrow: String,
      reviewsHeading: String,
      faqEyebrow: String,
      faqHeading: String,
      faqHeadingNoPlace: String,
      relatedHeadingHome: String,
      relatedHeadingBusiness: String,
      nearbyHeading: String,
      citiesHeading: String,
      finalCtaEyebrow: String,
      finalCtaHeading: String,
      finalCtaHeadingNoPlace: String,
      finalCtaText: String,
      cityFallbackHeading: String,
      cityFallbackIntro: String,
      cityFallbackMetaTitle: String,
      cityFallbackMetaDescription: String,
    },
    directory: {
      title: String,
      description: String,
      officeGroupTitle: String,
      servicesGroupTitle: String,
      poojasGroupTitle: String,
      emptyText: String,
    },
    footer: {
      blurb: String,
      bookButtonLabel: String,
      bookButtonUrl: String,
      newsletterTitle: String,
      newsletterText: String,
      trustBadges: { type: [String], default: undefined },
      copyright: String,
      showAllLocationsLink: { type: Boolean },
    },
  },
  { timestamps: true },
);

export type SeoSettingsDocument = InferSchemaType<typeof seoSettingsSchema>;
export const SeoSettingsModel = model("SeoSettings", seoSettingsSchema);
