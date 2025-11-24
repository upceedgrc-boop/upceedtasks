"use client";

import clsx from "clsx";
import { STATUS_MAP } from "@/lib/constants";

type Props = {
  value: string;
};

export function StatusBadge({ value }: Props) {
  const status = STATUS_MAP[value] ?? { label: value, color: "bg-slate-200 text-slate-700" };

  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold",
        status.color
      )}
    >
      {status.label}
    </span>
  );
}

