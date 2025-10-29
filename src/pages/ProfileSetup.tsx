// src/pages/ProfileSetup.tsx
import { useEffect, useMemo, useState } from "react";
import NavBar from "../components/layout/NavBar";
import Footer from "../components/layout/Footer";
import { useAuth } from "../features/auth/useAuth";
import { http } from "../lib/http";
import { useNavigate } from "react-router-dom";
import { ChipMulti } from "../components/ui/chipSelector";

const base = import.meta.env.VITE_FILE_BASE_URL;

export default function ProfileSetup() {
  const { token, user, setTokenAndLoad } = useAuth();
  const navigate = useNavigate();

  const initials = user?.name
    ? user.name.split(" ").map((n) => n[0]).join("").toUpperCase()
    : "U";

  // ✅ Avatar URL Handling (supports string OR object)
  const avatarUrl =
    typeof user?.avatar === "string"
      ? `${base}/${user.avatar}`
      : user?.avatar?.url
      ?`${base}/${user.avatar.url}`
      : null;

  // --- Step state (wizard)
  const [step, setStep] = useState(0);

  // --- Form state (prefill from user)
  const [name, setName] = useState(user?.name ?? "");
  const [location, setLocation] = useState(user?.location ?? "");
  const [homeType, setHomeType] = useState(user?.lifestyle?.homeType ?? "");
  const [activityLevel, setActivityLevel] = useState(
    user?.lifestyle?.activityLevel ?? ""
  );
  const [personalityTraits, setPersonalityTraits] = useState<string[]>(
    user?.lifestyle?.personalityTraits ?? []
  );
  const [allergies, setAllergies] = useState<string[]>(
    user?.lifestyle?.allergies ?? []
  );

  const [err, setErr] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // ✅ Avatar Upload Handler
  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return;

    const form = new FormData();
    form.append("avatar", e.target.files[0]);

    try {
      await http.post("/users/upload-avatar", form);
      await setTokenAndLoad(localStorage.getItem("access_token")!); // refresh user
    } catch (err) {
      console.error(err);
      alert("Failed to upload avatar");
    }
  };

  // ✅ Redirect if not logged in
  useEffect(() => {
    if (!token) navigate("/login");
  }, [token, navigate]);

  const canNext = useMemo(() => {
    if (step === 0) return !!name && !!location;
    return true; // other steps optional
  }, [step, name, location]);

  // ✅ Submit Profile Update
  const onSubmitAll = async () => {
    if (!token) return;
    setSubmitting(true);
    setErr(null);

    try {
      await http.patch("/users/profile", {
        name,
        location,
        lifestyle: {
          ...(user?.lifestyle ?? {}),
          activityLevel: activityLevel || undefined,
          homeType: homeType || undefined,
          personalityTraits: personalityTraits.length ? personalityTraits : undefined,
          allergies: allergies.length ? allergies : undefined,
        },
      });

      await setTokenAndLoad(token); // refresh
      navigate("/browse", { replace: true });
    } catch {
      setErr("Failed to save profile");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <NavBar />

      {/* ✅ Avatar Upload */}
      <div className="max-w-4xl mx-auto px-6 mt-6 flex items-center gap-4">
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt="avatar"
            className="h-16 w-16 rounded-full object-cover border"
          />
        ) : (
          <div className="h-16 w-16 rounded-full bg-gray-200 flex items-center justify-center font-bold text-lg text-gray-600">
            {initials}
          </div>
        )}

        <label className="pc-btn pc-btn-outline cursor-pointer">
          Upload Avatar
          <input type="file" accept="image/*" hidden onChange={handleAvatarUpload} />
        </label>
      </div>

      <main className="flex-grow">
        {/* Header */}
        <section className="max-w-4xl mx-auto px-6 pt-10 pb-4">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-[var(--pc-primary)]">
            Complete your profile
          </h1>
          <p className="text-gray-600 mt-2">
            Tell us about you so we can match you with the right pets.
          </p>

          {/* Progress */}
          <div className="flex items-center gap-3 mt-6">
            <StepDot index={0} active={step === 0} done={step > 0} label="About You" />
            <Bar />
            <StepDot index={1} active={step === 1} done={step > 1} label="Your Home" />
            <Bar />
            <StepDot index={2} active={step === 2} done={false} label="Lifestyle" />
          </div>
        </section>

        {/* Form Steps */}
        <section className="max-w-4xl mx-auto px-6 pb-16">
          {err && (
            <div className="bg-red-100 text-red-700 border border-red-200 rounded-xl p-3 mb-4">
              {err}
            </div>
          )}

          {/* Step 0 */}
          {step === 0 && (
            <Card title="About You">
              <div className="grid sm:grid-cols-2 gap-5">
                <FormInput label="Full Name" value={name} setValue={setName} />
                <FormInput label="City / Location" value={location} setValue={setLocation} />
              </div>
              <WizardNav canNext={canNext} onNext={() => setStep(1)} />
            </Card>
          )}

          {/* Step 1 */}
          {step === 1 && (
            <Card title="Your Home">
              <Select
                label="Home Type"
                value={homeType}
                setValue={setHomeType}
                options={["apartment", "house", "house_with_yard", "condo", "farm", "other"]}
              />
              <WizardNav onBack={() => setStep(0)} canNext={canNext} onNext={() => setStep(2)} />
            </Card>
          )}

          {/* Step 2 */}
          {step === 2 && (
            <Card title="Your Lifestyle">
              <Select
                label="Activity Level"
                value={activityLevel}
                setValue={setActivityLevel}
                options={["high", "medium", "low"]}
              />

              <Multi label="Personality Traits" value={personalityTraits} setValue={setPersonalityTraits}
                options={[
                  "calm",
                  "patient",
                  "active",
                  "experienced with dogs",
                  "experienced with cats",
                  "first-time adopter",
                  "fenced yard",
                  "kids at home",
                ]}
              />

              <Multi label="Allergies" value={allergies} setValue={setAllergies}
                options={["dogs", "cats", "fur", "saliva", "none"]}
              />

              <WizardNav
                onBack={() => setStep(1)}
                canNext={!submitting}
                onNext={onSubmitAll}
                nextLabel={submitting ? "Saving…" : "Save & Continue"}
              />
            </Card>
          )}
        </section>
      </main>
      <Footer />
    </div>
  );
}

/* ✅ UI Helpers — Untouched, just cleaner */

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="pc-card p-6 sm:p-8 fade-scale mt-6">
      <h2 className="text-2xl font-bold" style={{ color: "var(--pc-deep)" }}>
        {title}
      </h2>
      <div className="mt-6">{children}</div>
    </div>
  );
}

const FormInput = ({ label, value, setValue }: any) => (
  <div>
    <label className="text-sm font-medium text-gray-700">{label}</label>
    <input
      className="w-full border rounded-xl p-3 mt-1"
      value={value}
      onChange={(e) => setValue(e.target.value)}
      required
    />
  </div>
);

const Select = ({ label, value, setValue, options }: any) => (
  <div className="mb-6">
    <label className="text-sm font-medium text-gray-700">{label}</label>
    <select
      className="w-full border rounded-xl p-3 mt-1 bg-white"
      value={value}
      onChange={(e) => setValue(e.target.value)}
    >
      <option value="">Select…</option>
      {options.map((o: string) => (
        <option key={o} value={o}>
          {o}
        </option>
      ))}
    </select>
  </div>
);

const Multi = ({ label, value, setValue, options }: any) => (
  <div className="mt-6">
    <label className="text-sm font-medium text-gray-700">{label}</label>
    <ChipMulti className="mt-2" options={options} value={value} onChange={setValue} />
  </div>
);

function WizardNav({ onBack, onNext, canNext, nextLabel = "Next" }: any) {
  return (
    <div className="mt-8 flex items-center justify-between">
      {onBack ? (
        <button type="button" className="pc-btn pc-btn-outline" onClick={onBack}>
          Back
        </button>
      ) : (
        <div></div>
      )}

      <button
        type="button"
        className="pc-btn pc-btn-primary"
        onClick={onNext}
        disabled={!canNext}
      >
        {nextLabel}
      </button>
    </div>
  );
}

function StepDot({ index, active, done, label }: any) {
  return (
    <div className="flex items-center gap-2">
      <div
        className={[
          "h-9 w-9 rounded-full flex items-center justify-center text-sm font-semibold border",
          active
            ? "bg-[var(--pc-primary-light)] text-[var(--pc-primary)] border-[var(--pc-primary-light)]"
            : done
            ? "bg-[var(--pc-primary)] text-white border-[var(--pc-primary)]"
            : "bg-white text-gray-600 border-gray-300",
        ].join(" ")}
        title={label}
      >
        {index + 1}
      </div>
      <span className="hidden sm:inline text-sm text-gray-600">{label}</span>
    </div>
  );
}

const Bar = () => <div className="h-[2px] w-10 sm:w-16 bg-gray-300 rounded" />;
