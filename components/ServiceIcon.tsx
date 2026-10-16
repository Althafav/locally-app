import {
  AirVent, Bug, Container, Hammer, PaintRoller, Sparkles, Sprout, TreePalm, WashingMachine, Wrench, Zap, Cylinder,
  type LucideIcon,
} from "lucide-react";

/** Maps ServiceCategory.icon keys to icons. Add a key here when adding a category. */
const ICONS: Record<string, LucideIcon> = {
  cleaning: Sparkles,
  electrician: Zap,
  plumber: Wrench,
  ac: AirVent,
  appliance: WashingMachine,
  painting: PaintRoller,
  carpentry: Hammer,
  pest: Bug,
  coconut: TreePalm,
  well: Cylinder,
  gardening: Sprout,
  tank: Container,
};

export function ServiceIcon({ icon, className, strokeWidth = 1.75 }: { icon: string; className?: string; strokeWidth?: number }) {
  const Icon = ICONS[icon] ?? Sparkles;
  return <Icon className={className} strokeWidth={strokeWidth} aria-hidden />;
}
