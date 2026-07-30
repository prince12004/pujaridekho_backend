import { z } from "zod";

// Indian mobile numbers are 10 digits starting with 6-9 — a plain
// min-length check happily accepts junk like "1234567890". Enforced here
// too (not just client-side) since these are public, unauthenticated
// endpoints that must never trust client-side validation alone.
export const MOBILE_REGEX = /^[6-9]\d{9}$/;

export const mobileSchema = z.string().regex(MOBILE_REGEX, "Enter a valid 10-digit mobile number");
