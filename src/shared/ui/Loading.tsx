export interface LoadingProps {
  label?: string;
}

/** Placeholder loading sederhana yang dipakai lintas panel/kartu. */
export function Loading({ label = 'Loading...' }: LoadingProps) {
  return <div className="text-center p-8 text-secondary">{label}</div>;
}
