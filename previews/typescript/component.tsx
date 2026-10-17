import { useState } from "react";

interface Account<T extends string> {
  readonly id: T;
  displayName: string;
  active: boolean;
}

const DEFAULT_ACCOUNT: Account<"nova"> = {
  id: "nova",
  displayName: "Nova",
  active: true,
};

export async function loadAccount<T extends string>(
  account: Account<T>,
): Promise<Account<T> | null> {
  const response = await fetch(`/api/accounts/${account.id}`);
  if (!response.ok) return null;
  return (await response.json()) as Account<T>;
}

export function AccountCard({ account = DEFAULT_ACCOUNT }: { account?: Account<string> }) {
  const [enabled, setEnabled] = useState(account.active);
  return (
    <button aria-pressed={enabled} data-account={account.id} onClick={() => setEnabled(!enabled)}>
      {account.displayName}
    </button>
  );
}
