"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, Save, CheckCircle, Droplets, Sun, AlertTriangle, Palette, Tag } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useTranslations } from "next-intl";

const SKIN_TYPES = [
  { value: "oily", label: "Oily" },
  { value: "dry", label: "Dry" },
  { value: "combination", label: "Combination" },
  { value: "sensitive", label: "Sensitive" },
  { value: "normal", label: "Normal" },
];

const skinTypeKeys: Record<string, string> = {
  oily: "skinTypeOily",
  dry: "skinTypeDry",
  combination: "skinTypeCombination",
  sensitive: "skinTypeSensitive",
  normal: "skinTypeNormal",
};

const SKIN_CONCERNS = [
  "Acne", "Aging", "Dark Circles", "Dullness", "Hyperpigmentation",
  "Large Pores", "Oiliness", "Redness", "Texture", "Uneven Tone",
];

const concernKeys: Record<string, string> = {
  Acne: "concernAcne",
  Aging: "concernAging",
  "Dark Circles": "concernDarkCircles",
  Dullness: "concernDullness",
  Hyperpigmentation: "concernHyperpigmentation",
  "Large Pores": "concernLargePores",
  Oiliness: "concernOiliness",
  Redness: "concernRedness",
  Texture: "concernTexture",
  "Uneven Tone": "concernUnevenTone",
};

const UNDERTONES = [
  { value: "warm", label: "Warm" },
  { value: "cool", label: "Cool" },
  { value: "neutral", label: "Neutral" },
  { value: "olive", label: "Olive" },
];

const undertoneKeys: Record<string, string> = {
  warm: "undertoneWarm",
  cool: "undertoneCool",
  neutral: "undertoneNeutral",
  olive: "undertoneOlive",
};

const STYLE_OPTIONS = [
  "Natural / No-Makeup", "Soft Glam", "Full Glam", "Bridal",
  "Editorial", "Avant-Garde", "Hijab Styling", "Airbrush",
  "SFX / Creative", "Boho", "Classic Red Lip", "Smokey Eye",
  "Dewy Skin", "Matte Finish", "Cut Crease", "Graphic Liner",
];

const styleKeys: Record<string, string> = {
  "Natural / No-Makeup": "styleNatural",
  "Soft Glam": "styleSoftGlam",
  "Full Glam": "styleFullGlam",
  "Bridal": "styleBridal",
  "Editorial": "styleEditorial",
  "Avant-Garde": "styleAvantGarde",
  "Hijab Styling": "styleHijab",
  "Airbrush": "styleAirbrush",
  "SFX / Creative": "styleSFX",
  "Boho": "styleBoho",
  "Classic Red Lip": "styleClassicRed",
  "Smokey Eye": "styleSmokeyEye",
  "Dewy Skin": "styleDewySkin",
  "Matte Finish": "styleMatteFinish",
  "Cut Crease": "styleCutCrease",
  "Graphic Liner": "styleGraphicLiner",
};

export default function BeautyProfilePage() {
  const t = useTranslations("beautyProfile");
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<"skin" | "preferences">("skin");

  const [skinType, setSkinType] = useState("");
  const [skinConcerns, setSkinConcerns] = useState<string[]>([]);
  const [undertone, setUndertone] = useState("");
  const [allergies, setAllergies] = useState<string[]>([]);
  const [allergyInput, setAllergyInput] = useState("");

  const [preferredStyles, setPreferredStyles] = useState<string[]>([]);
  const [makeupNotes, setMakeupNotes] = useState("");

  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
      return;
    }
    if (!user) return;

    fetch(`/api/beauty-profile?userId=${user.id}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.skinProfile) {
          setSkinType(data.skinProfile.skinType || "");
          setSkinConcerns(data.skinProfile.skinConcerns || []);
          setUndertone(data.skinProfile.undertone || "");
          setAllergies(data.skinProfile.allergies || []);
        }
        if (data.preferences) {
          setPreferredStyles(data.preferences.preferredStyles || []);
          setMakeupNotes(data.preferences.makeupNotes || "");
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [user, authLoading, router]);

  const toggleConcern = (concern: string) => {
    setSkinConcerns((prev) =>
      prev.includes(concern) ? prev.filter((c) => c !== concern) : [...prev, concern],
    );
  };

  const toggleStyle = (style: string) => {
    setPreferredStyles((prev) =>
      prev.includes(style) ? prev.filter((s) => s !== style) : [...prev, style],
    );
  };

  const addAllergy = () => {
    const trimmed = allergyInput.trim();
    if (trimmed && !allergies.includes(trimmed)) {
      setAllergies((prev) => [...prev, trimmed]);
    }
    setAllergyInput("");
  };

  const removeAllergy = (allergy: string) => {
    setAllergies((prev) => prev.filter((a) => a !== allergy));
  };

  const handleSave = async () => {
    if (!user) return;

    await Promise.all([
      fetch(`/api/beauty-profile?userId=${user.id}&action=skin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ skinType, skinConcerns, undertone, allergies }),
      }),
      fetch(`/api/beauty-profile?userId=${user.id}&action=preferences`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ preferredStyles, makeupNotes }),
      }),
    ]);

    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  if (authLoading || loading || !user) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-rose-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] py-12 px-4 sm:px-6 lg:px-8 bg-gray-50/50 dark:bg-neutral-950">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <Sparkles className="w-6 h-6 text-rose-500" />
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{t('heading')}</h1>
          {saved && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-50 dark:bg-green-950/50 text-green-600 dark:text-green-400 text-xs font-semibold rounded-full animate-fade-in">
              <CheckCircle className="w-3.5 h-3.5" /> {t('saved')}
            </span>
          )}
        </div>

        <div className="flex gap-1 mb-8 bg-white dark:bg-neutral-900 rounded-2xl p-1.5 border border-gray-200 dark:border-neutral-800 shadow-sm">
          <button
            onClick={() => setActiveTab("skin")}
            className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold transition-all ${
              activeTab === "skin"
                ? "bg-gradient-to-r from-rose-500 to-pink-600 text-white shadow-md"
                : "text-gray-600 dark:text-gray-400 hover:text-rose-600 dark:hover:text-rose-400"
            }`}
          >
            <Droplets className="w-4 h-4" /> {t('skinProfile')}
          </button>
          <button
            onClick={() => setActiveTab("preferences")}
            className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold transition-all ${
              activeTab === "preferences"
                ? "bg-gradient-to-r from-rose-500 to-pink-600 text-white shadow-md"
                : "text-gray-600 dark:text-gray-400 hover:text-rose-600 dark:hover:text-rose-400"
            }`}
          >
            <Palette className="w-4 h-4" /> {t('stylePreferences')}
          </button>
        </div>

        <div className="bg-white dark:bg-neutral-900 rounded-3xl border border-gray-200 dark:border-neutral-800 p-8 shadow-sm">
          {activeTab === "skin" && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  {t('skinType')}
                </label>
                <div className="flex flex-wrap gap-2">
                  {SKIN_TYPES.map((type) => (
                    <button
                      key={type.value}
                      onClick={() => setSkinType(type.value)}
                      className={`px-4 py-2 rounded-xl text-sm font-medium border transition-all ${
                        skinType === type.value
                          ? "bg-rose-50 dark:bg-rose-950/50 border-rose-300 dark:border-rose-700 text-rose-600 dark:text-rose-400"
                          : "border-gray-200 dark:border-neutral-700 text-gray-600 dark:text-gray-400 hover:border-rose-200 dark:hover:border-rose-800"
                      }`}
                    >
                      {t(skinTypeKeys[type.value])}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  {t('skinConcerns')}
                </label>
                <div className="flex flex-wrap gap-2">
                  {SKIN_CONCERNS.map((concern) => (
                    <button
                      key={concern}
                      onClick={() => toggleConcern(concern)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                        skinConcerns.includes(concern)
                          ? "bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-400"
                          : "border-gray-200 dark:border-neutral-700 text-gray-500 dark:text-gray-400 hover:border-amber-200 dark:hover:border-amber-800"
                      }`}
                    >
                      <Sun className="w-3 h-3 inline mr-1" />
                      {t(concernKeys[concern])}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  {t('undertone')}
                </label>
                <div className="flex flex-wrap gap-2">
                  {UNDERTONES.map((u) => (
                    <button
                      key={u.value}
                      onClick={() => setUndertone(u.value)}
                      className={`px-4 py-2 rounded-xl text-sm font-medium border transition-all ${
                        undertone === u.value
                          ? "bg-rose-50 dark:bg-rose-950/50 border-rose-300 dark:border-rose-700 text-rose-600 dark:text-rose-400"
                          : "border-gray-200 dark:border-neutral-700 text-gray-600 dark:text-gray-400 hover:border-rose-200 dark:hover:border-rose-800"
                      }`}
                    >
                      {t(undertoneKeys[u.value])}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  <AlertTriangle className="w-4 h-4 inline mr-1.5 text-red-400" />
                  {t('allergies')}
                </label>
                <div className="flex flex-wrap gap-2 mb-3">
                  {allergies.map((allergy) => (
                    <span
                      key={allergy}
                      className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800"
                    >
                      {allergy}
                      <button onClick={() => removeAllergy(allergy)} className="ml-1 hover:text-red-800">&times;</button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={allergyInput}
                    onChange={(e) => setAllergyInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addAllergy())}
                    placeholder={t('allergyPlaceholder')}
                    className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-neutral-700 bg-gray-50 dark:bg-neutral-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-rose-500 outline-none"
                  />
                  <button
                    onClick={addAllergy}
                    className="px-4 py-2.5 bg-gray-100 dark:bg-neutral-800 text-gray-600 dark:text-gray-300 font-medium rounded-xl hover:bg-gray-200 dark:hover:bg-neutral-700 text-sm border border-gray-200 dark:border-neutral-700"
                  >
                    {t('add')}
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === "preferences" && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  <Tag className="w-4 h-4 inline mr-1.5 text-rose-400" />
                  {t('preferredStyles')}
                </label>
                <div className="flex flex-wrap gap-2">
                  {STYLE_OPTIONS.map((style) => (
                    <button
                      key={style}
                      onClick={() => toggleStyle(style)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                        preferredStyles.includes(style)
                          ? "bg-rose-50 dark:bg-rose-950/50 border-rose-300 dark:border-rose-700 text-rose-600 dark:text-rose-400"
                          : "border-gray-200 dark:border-neutral-700 text-gray-500 dark:text-gray-400 hover:border-rose-200 dark:hover:border-rose-800"
                      }`}
                    >
                      {t(styleKeys[style])}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  {t('makeupNotes')}
                </label>
                <textarea
                  rows={4}
                  value={makeupNotes}
                  onChange={(e) => setMakeupNotes(e.target.value)}
                  placeholder={t('notesPlaceholder')}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-neutral-700 bg-gray-50 dark:bg-neutral-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-rose-500 outline-none resize-none"
                />
              </div>
            </div>
          )}

          <div className="pt-6 mt-6 border-t border-gray-100 dark:border-neutral-800">
            <button
              onClick={handleSave}
              className="px-6 py-3 bg-gradient-to-r from-rose-500 to-pink-600 text-white font-bold rounded-xl hover:from-rose-600 hover:to-pink-700 transition-all shadow-lg shadow-rose-200/50 dark:shadow-rose-900/30 text-sm flex items-center gap-2"
            >
              <Save className="w-4 h-4" /> {t('saveProfile')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
