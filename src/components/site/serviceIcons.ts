import type { ComponentType, SVGProps } from 'react';
import {
  EngineIcon,
  BrakeIcon,
  TyreIcon,
  BoltIcon,
  SuspensionIcon,
  WrenchIcon,
  PaintIcon,
  SparkleIcon,
  BatteryBoltIcon,
} from './Icons';

export type IconType = ComponentType<SVGProps<SVGSVGElement>>;

export const SERVICE_ICONS: Record<string, IconType> = {
  'engine-diagnostics': EngineIcon,
  brakes: BrakeIcon,
  'tyres-alignment': TyreIcon,
  'ac-electrical': BoltIcon,
  'suspension-steering': SuspensionIcon,
  'general-service': WrenchIcon,
  'body-paint': PaintIcon,
  'detailing-interior': SparkleIcon,
  'car-battery-jump-start': BatteryBoltIcon,
  'jump-start': BatteryBoltIcon,
};

export const DEFAULT_SERVICE_ICON: IconType = WrenchIcon;

export function iconForService(id: string): IconType {
  return SERVICE_ICONS[id] || DEFAULT_SERVICE_ICON;
}
