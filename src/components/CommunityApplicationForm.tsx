"use client";

import { useState } from "react";
import { CheckCircle, Upload, X, Send, Loader2 } from "lucide-react";
import { malaysiaDistricts, initialStates } from "@/data/malaysia-districts";

const expertiseOptions = [
  "Bridal Makeup",
  "Fashion/Editorial",
  "Special Effects (SFX)",
  "Theater/Stage",
  "Commercial/TV/Film",
  "Other",
];

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
const MAX_FILE_SIZE = 10 * 1024 * 1024;

function validateEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function CommunityApplicationForm() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [state, setState] = useState("");
  const [city, setCity] = useState("");
  const [yearsOfExperience, setYearsOfExperience] = useState("");
  const [expertiseAreas, setExpertiseAreas] = useState<string[]>([]);
  const [portfolioImageUrl, setPortfolioImageUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [portfolioLinks, setPortfolioLinks] = useState("");
  const [certifications, setCertifications] = useState("");
  const [socialProfiles, setSocialProfiles] = useState("");
  const [availability, setAvailability] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const districts = state ? malaysiaDistricts[state] || [] : [];
  const stateOptions = initialStates;

  function toggleExpertise(area: string) {
    setExpertiseAreas((prev) =>
      prev.includes(area) ? prev.filter((a) => a !== area) : [...prev, area],
    );
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setError("");

    if (!ALLOWED_TYPES.includes(file.type)) {
      setError("Only JPEG, PNG, WebP images and PDF files are allowed.");
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setError("File is too large. Maximum size is 10MB.");
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/community/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Upload failed");
      }

      const data = await res.json();
      setPortfolioImageUrl(data.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  }

  function removeFile() {
    setPortfolioImageUrl("");
  }

  function validate(): boolean {
    const errors: Record<string, string> = {};

    if (!firstName.trim()) errors.firstName = "First name is required";
    if (!lastName.trim()) errors.lastName = "Last name is required";
    if (!email.trim()) errors.email = "Email is required";
    else if (!validateEmail(email)) errors.email = "Invalid email address";
    if (!phone.trim()) errors.phone = "Phone number is required";
    if (!state) errors.state = "State is required";
    if (!city) errors.city = "City is required";
    if (!yearsOfExperience.trim()) errors.yearsOfExperience = "This field is required";
    if (expertiseAreas.length === 0) errors.expertiseAreas = "Select at least one area";
    if (!availability.trim()) errors.availability = "Availability is required";

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/community/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          email: email.trim(),
          phone: phone.trim(),
          city,
          state,
          yearsOfExperience: yearsOfExperience.trim(),
          expertiseAreas,
          portfolioImageUrl,
          portfolioLinks: portfolioLinks.trim(),
          certifications: certifications.trim(),
          socialProfiles: socialProfiles.trim(),
          availability: availability.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.details) {
          setFieldErrors(
            Object.fromEntries(
              Object.entries(data.details).map(([key, msgs]) => [
                key,
                (msgs as string[])[0],
              ]),
            ),
          );
          throw new Error("Please fix the highlighted fields.");
        }
        throw new Error(data.error || "Failed to submit");
      }

      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="text-center py-12">
        <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
          Application Submitted!
        </h3>
        <p className="text-gray-500 dark:text-gray-400 text-sm max-w-md mx-auto">
          Thank you for your interest in our makeup artist community. We&apos;ll review your
          application and get back to you soon.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
            First Name *
          </label>
          <input
            type="text"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            className={`w-full px-4 py-3 rounded-xl border ${
              fieldErrors.firstName
                ? "border-red-400 dark:border-red-500"
                : "border-gray-200 dark:border-neutral-700"
            } bg-gray-50 dark:bg-neutral-800 text-gray-900 dark:text-white placeholder-gray-400 text-sm focus:ring-2 focus:ring-rose-500 focus:border-transparent outline-none`}
          />
          {fieldErrors.firstName && (
            <p className="text-xs text-red-500 mt-1">{fieldErrors.firstName}</p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
            Last Name *
          </label>
          <input
            type="text"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            className={`w-full px-4 py-3 rounded-xl border ${
              fieldErrors.lastName
                ? "border-red-400 dark:border-red-500"
                : "border-gray-200 dark:border-neutral-700"
            } bg-gray-50 dark:bg-neutral-800 text-gray-900 dark:text-white placeholder-gray-400 text-sm focus:ring-2 focus:ring-rose-500 focus:border-transparent outline-none`}
          />
          {fieldErrors.lastName && (
            <p className="text-xs text-red-500 mt-1">{fieldErrors.lastName}</p>
          )}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
          Email Address *
        </label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={`w-full px-4 py-3 rounded-xl border ${
            fieldErrors.email
              ? "border-red-400 dark:border-red-500"
              : "border-gray-200 dark:border-neutral-700"
          } bg-gray-50 dark:bg-neutral-800 text-gray-900 dark:text-white placeholder-gray-400 text-sm focus:ring-2 focus:ring-rose-500 focus:border-transparent outline-none`}
        />
        {fieldErrors.email && (
          <p className="text-xs text-red-500 mt-1">{fieldErrors.email}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
          Phone Number *
        </label>
        <input
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="(country code) 000 000-0000"
          className={`w-full px-4 py-3 rounded-xl border ${
            fieldErrors.phone
              ? "border-red-400 dark:border-red-500"
              : "border-gray-200 dark:border-neutral-700"
          } bg-gray-50 dark:bg-neutral-800 text-gray-900 dark:text-white placeholder-gray-400 text-sm focus:ring-2 focus:ring-rose-500 focus:border-transparent outline-none`}
        />
        {fieldErrors.phone && (
          <p className="text-xs text-red-500 mt-1">{fieldErrors.phone}</p>
        )}
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
            State *
          </label>
          <select
            value={state}
            onChange={(e) => {
              setState(e.target.value);
              setCity("");
            }}
            className={`w-full px-4 py-3 rounded-xl border ${
              fieldErrors.state
                ? "border-red-400 dark:border-red-500"
                : "border-gray-200 dark:border-neutral-700"
            } bg-gray-50 dark:bg-neutral-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-rose-500 focus:border-transparent outline-none appearance-none`}
          >
            <option value="">Select state</option>
            {stateOptions.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          {fieldErrors.state && (
            <p className="text-xs text-red-500 mt-1">{fieldErrors.state}</p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
            City/District *
          </label>
          <select
            value={city}
            onChange={(e) => setCity(e.target.value)}
            disabled={!state}
            className={`w-full px-4 py-3 rounded-xl border ${
              fieldErrors.city
                ? "border-red-400 dark:border-red-500"
                : "border-gray-200 dark:border-neutral-700"
            } bg-gray-50 dark:bg-neutral-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-rose-500 focus:border-transparent outline-none appearance-none disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            <option value="">{state ? "Select city/district" : "Select a state first"}</option>
            {districts.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
          {fieldErrors.city && (
            <p className="text-xs text-red-500 mt-1">{fieldErrors.city}</p>
          )}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
          Years of Professional Experience *
        </label>
        <textarea
          value={yearsOfExperience}
          onChange={(e) => setYearsOfExperience(e.target.value)}
          rows={3}
          placeholder="Tell us about your experience in the makeup industry..."
          className={`w-full px-4 py-3 rounded-xl border ${
            fieldErrors.yearsOfExperience
              ? "border-red-400 dark:border-red-500"
              : "border-gray-200 dark:border-neutral-700"
          } bg-gray-50 dark:bg-neutral-800 text-gray-900 dark:text-white placeholder-gray-400 text-sm focus:ring-2 focus:ring-rose-500 focus:border-transparent outline-none resize-none`}
        />
        {fieldErrors.yearsOfExperience && (
          <p className="text-xs text-red-500 mt-1">
            {fieldErrors.yearsOfExperience}
          </p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
          Areas of Expertise * (Select all that apply)
        </label>
        <div className="grid sm:grid-cols-2 gap-2">
          {expertiseOptions.map((area) => (
            <label
              key={area}
              className={`flex items-center gap-2.5 px-4 py-3 rounded-xl border cursor-pointer transition-all ${
                expertiseAreas.includes(area)
                  ? "bg-rose-50 dark:bg-rose-950/30 border-rose-300 dark:border-rose-700"
                  : "bg-gray-50 dark:bg-neutral-800 border-gray-200 dark:border-neutral-700 hover:border-rose-200 dark:hover:border-rose-800"
              }`}
            >
              <div
                onClick={() => toggleExpertise(area)}
                className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-all ${
                  expertiseAreas.includes(area)
                    ? "bg-rose-500 border-rose-500"
                    : "border-gray-300 dark:border-neutral-600"
                }`}
              >
                {expertiseAreas.includes(area) && (
                  <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300 select-none">
                {area}
              </span>
            </label>
          ))}
        </div>
        {fieldErrors.expertiseAreas && (
          <p className="text-xs text-red-500 mt-1">{fieldErrors.expertiseAreas}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
          Upload Portfolio
        </label>
        <p className="text-xs text-gray-400 dark:text-gray-500 mb-2">
          Upload an image or PDF, or provide links below. Max 10MB.
        </p>
        {portfolioImageUrl ? (
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800">
            <span className="text-sm text-gray-700 dark:text-gray-300 truncate flex-1">
              Portfolio uploaded
            </span>
            <button
              type="button"
              onClick={removeFile}
              className="p-1 hover:bg-rose-100 dark:hover:bg-rose-900/40 rounded-lg transition-colors"
            >
              <X className="w-4 h-4 text-rose-500" />
            </button>
          </div>
        ) : (
          <label className="flex flex-col items-center justify-center px-4 py-6 rounded-xl border-2 border-dashed border-gray-300 dark:border-neutral-600 bg-gray-50 dark:bg-neutral-800 cursor-pointer hover:border-rose-400 dark:hover:border-rose-500 transition-colors">
            {uploading ? (
              <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                <Loader2 className="w-5 h-5 animate-spin" />
                Uploading...
              </div>
            ) : (
              <div className="flex flex-col items-center gap-1">
                <Upload className="w-6 h-6 text-gray-400" />
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  Click to upload
                </span>
                <span className="text-xs text-gray-400 dark:text-gray-500">
                  JPEG, PNG, WebP, or PDF
                </span>
              </div>
            )}
            <input
              type="file"
              accept=".jpg,.jpeg,.png,.webp,.pdf"
              onChange={handleFileUpload}
              disabled={uploading}
              className="hidden"
            />
          </label>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
          Portfolio Links
        </label>
        <p className="text-xs text-gray-400 dark:text-gray-500 mb-2">
          Share links to your portfolio, website, or Google Drive (one per line)
        </p>
        <textarea
          value={portfolioLinks}
          onChange={(e) => setPortfolioLinks(e.target.value)}
          rows={3}
          placeholder="https://..."
          className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-neutral-700 bg-gray-50 dark:bg-neutral-800 text-gray-900 dark:text-white placeholder-gray-400 text-sm focus:ring-2 focus:ring-rose-500 focus:border-transparent outline-none resize-none"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
          Professional Certifications or Training
        </label>
        <textarea
          value={certifications}
          onChange={(e) => setCertifications(e.target.value)}
          rows={3}
          placeholder="List any certifications or training you have completed..."
          className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-neutral-700 bg-gray-50 dark:bg-neutral-800 text-gray-900 dark:text-white placeholder-gray-400 text-sm focus:ring-2 focus:ring-rose-500 focus:border-transparent outline-none resize-none"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
          Social Media Profiles / Website
        </label>
        <textarea
          value={socialProfiles}
          onChange={(e) => setSocialProfiles(e.target.value)}
          rows={2}
          placeholder="Instagram, Facebook, YouTube, personal website..."
          className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-neutral-700 bg-gray-50 dark:bg-neutral-800 text-gray-900 dark:text-white placeholder-gray-400 text-sm focus:ring-2 focus:ring-rose-500 focus:border-transparent outline-none resize-none"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
          Availability for Community Events & Collaborations *
        </label>
        <textarea
          value={availability}
          onChange={(e) => setAvailability(e.target.value)}
          rows={3}
          placeholder="Describe your general availability — days, times, willingness for travel, etc."
          className={`w-full px-4 py-3 rounded-xl border ${
            fieldErrors.availability
              ? "border-red-400 dark:border-red-500"
              : "border-gray-200 dark:border-neutral-700"
          } bg-gray-50 dark:bg-neutral-800 text-gray-900 dark:text-white placeholder-gray-400 text-sm focus:ring-2 focus:ring-rose-500 focus:border-transparent outline-none resize-none`}
        />
        {fieldErrors.availability && (
          <p className="text-xs text-red-500 mt-1">{fieldErrors.availability}</p>
        )}
      </div>

      {error && (
        <p className="text-sm text-red-500 dark:text-red-400">{error}</p>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="w-full inline-flex items-center justify-center gap-2 py-3.5 bg-gradient-to-r from-rose-500 to-pink-600 text-white font-bold rounded-xl hover:from-rose-600 hover:to-pink-700 transition-all shadow-lg shadow-rose-200/50 dark:shadow-rose-900/30 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
      >
        {submitting ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Submitting...
          </>
        ) : (
          <>
            <Send className="w-4 h-4" />
            Submit Application
          </>
        )}
      </button>
    </form>
  );
}
