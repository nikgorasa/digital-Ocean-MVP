export interface CancelPolicyTier {
  Index: string;
  FromDate: string;
  ChargeType: string;
  CancellationCharge: number;
}

export function formatCancelPolicy(
  policies: CancelPolicyTier[],
  checkIn: string,
  formatCurrency: (n: number) => string
): string[] {
  if (!policies.length) return ["Non-refundable"];

  const sorted = [...policies].sort(
    (a, b) => new Date(b.FromDate).getTime() - new Date(a.FromDate).getTime()
  );

  const checkInDate = new Date(checkIn);
  const now = new Date();
  const daysUntilCheckIn = Math.ceil(
    (checkInDate.getTime() - now.getTime()) / 86400000
  );

  const lines: string[] = [];

  for (let i = 0; i < sorted.length; i++) {
    const policy = sorted[i];
    const daysBefore = Math.max(
      0,
      Math.ceil(
        (checkInDate.getTime() - new Date(policy.FromDate).getTime()) / 86400000
      )
    );
    const nextDays =
      i < sorted.length - 1
        ? Math.max(
            0,
            Math.ceil(
              (checkInDate.getTime() - new Date(sorted[i + 1].FromDate).getTime()) /
                86400000
            )
          )
        : null;

    const window =
      nextDays !== null
        ? `${daysBefore}\u2013${nextDays} days before check-in`
        : `Within ${daysBefore} days of check-in`;

    const charge =
      policy.ChargeType === "Flat"
        ? `${formatCurrency(policy.CancellationCharge)} charge`
        : `${policy.CancellationCharge}% charge`;

    lines.push(`${window}: ${charge}`);
  }

  const lastDays = Math.max(
    0,
    Math.ceil(
      (checkInDate.getTime() - new Date(sorted[sorted.length - 1].FromDate).getTime()) /
        86400000
    )
  );
  if (lastDays > 0) {
    lines.push(`More than ${lastDays} days before check-in: Free cancellation`);
  }

  return lines;
}

export function getCancellationSummary(
  policies: CancelPolicyTier[],
  checkIn: string
): string {
  if (!policies.length) return "Non-refundable";

  const checkInDate = new Date(checkIn);
  const now = new Date();
  const daysUntilCheckIn = Math.ceil(
    (checkInDate.getTime() - now.getTime()) / 86400000
  );

  const sorted = [...policies].sort(
    (a, b) => new Date(a.FromDate).getTime() - new Date(b.FromDate).getTime()
  );

  const applicable = sorted.find(
    (p) =>
      daysUntilCheckIn <=
      Math.ceil(
        (checkInDate.getTime() - new Date(p.FromDate).getTime()) / 86400000
      )
  );

  if (!applicable) return "Free cancellation";

  if (applicable.CancellationCharge === 100) return "Non-refundable";
  if (applicable.CancellationCharge === 0) return "Free cancellation";

  return `${applicable.CancellationCharge}% cancellation fee`;
}
