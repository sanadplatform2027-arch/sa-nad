import logoAsset from "@/assets/sanad-logo.png.asset.json";

export function BrandLogo({ className = "h-9 w-9", alt = "شعار منصة سند" }: { className?: string; alt?: string }) {
  return <img src={logoAsset.url} alt={alt} className={`object-contain ${className}`} />;
}
