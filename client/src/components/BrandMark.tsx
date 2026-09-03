/** Flight Deck Atelier component: a compact telemetry-ring brand mark with no generic UI decoration. */
type BrandMarkProps = { className?: string; label?: boolean };

export function BrandMark({ className = "", label = true }: BrandMarkProps) {
  return (
    <div className={`brand-mark ${className}`} aria-label="OBIX Config Lab">
      <img src="/assets/obix-logo-mark.png" alt="" className="brand-mark__icon" />
      {label ? (
        <span className="brand-mark__wordmark">
          <strong>OBIX</strong><span>CONFIG<br />DOCTORFPV</span>
        </span>
      ) : null}
    </div>
  );
}
