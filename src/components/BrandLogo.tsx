export function BrandLogo({ className = "h-9 w-9", alt = "شعار منصة سند" }: { className?: string; alt?: string }) {
  return <img src="/sanad-logo.png" alt={alt} className={`object-contain ${className}`} />;
}
