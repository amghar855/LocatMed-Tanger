import type { ReactNode } from "react";

type Props = {
  title: string;
  description: string;
  actions?: ReactNode;
};

export function PatientPageHeader({ title, description, actions }: Props) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div>
        <h1 className="font-heading text-xl font-semibold tracking-tight text-slate-900 md:text-2xl">
          {title}
        </h1>
        <p className="mt-0.5 text-sm text-slate-500">{description}</p>
      </div>
      {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
    </div>
  );
}
