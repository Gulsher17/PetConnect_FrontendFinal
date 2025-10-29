import React from "react";

type ChipMultiProps = {
  options: string[];
  value: string[];
  onChange: (next: string[]) => void;
  className?: string;
};

function Chip({ active, children, onClick }: { active: boolean; children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={[
        "px-3 py-1.5 rounded-full text-sm border transition",
        active
          ? "bg-[var(--pc-primary-light)] text-[var(--pc-primary)] border-[var(--pc-primary-light)]"
          : "bg-white text-gray-700 border-gray-200 hover:border-gray-300"
      ].join(" ")}
    >
      {children}
    </button>
  );
}

export function ChipMulti({ options, value, onChange, className }: ChipMultiProps) {
  const toggle = (opt: string) => {
    if (value.includes(opt)) onChange(value.filter(v => v !== opt));
    else onChange([...value, opt]);
  };

  return (
    <div className={["flex flex-wrap gap-2", className ?? ""].join(" ")}>
      {options.map((opt) => (
        <Chip key={opt} active={value.includes(opt)} onClick={() => toggle(opt)}>
          {opt}
        </Chip>
      ))}
    </div>
  );
}
