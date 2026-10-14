import { describe, it, expect } from 'vitest';
import {
  CAR_BRANDS_DATA,
  ALL_CAR_BRANDS,
  OTHER_OPTION,
  getModelsForBrand,
} from './carBrandsData';

describe('Car Brands & Models Data (carBrandsData)', () => {
  it('contains a rich list of car brands with over 70 manufacturers', () => {
    expect(CAR_BRANDS_DATA.length).toBeGreaterThanOrEqual(75);
    expect(ALL_CAR_BRANDS).toContain('Mercedes-Benz');
    expect(ALL_CAR_BRANDS).toContain('BMW');
    expect(ALL_CAR_BRANDS).toContain('Audi');
    expect(ALL_CAR_BRANDS).toContain('Porsche');
    expect(ALL_CAR_BRANDS).toContain('Maruti Suzuki');
    expect(ALL_CAR_BRANDS).toContain('Chrysler');
    expect(ALL_CAR_BRANDS).toContain('Datsun');
    expect(ALL_CAR_BRANDS).toContain('Daewoo');
    expect(ALL_CAR_BRANDS).toContain('GMC');
    expect(ALL_CAR_BRANDS).toContain('RAM');
    expect(ALL_CAR_BRANDS).toContain('Opel');
    expect(ALL_CAR_BRANDS).toContain('SsangYong / KG Mobility');
    expect(ALL_CAR_BRANDS).toContain('Maybach');
    expect(ALL_CAR_BRANDS).toContain('Cupra / SEAT');
    expect(ALL_CAR_BRANDS).toContain('Smart');
    expect(ALL_CAR_BRANDS).toContain('Rivian');
    expect(ALL_CAR_BRANDS).toContain('Lucid');
    expect(ALL_CAR_BRANDS).toContain('Alpine');
    expect(ALL_CAR_BRANDS).toContain('VinFast');
    expect(ALL_CAR_BRANDS).toContain('Saab');
    expect(ALL_CAR_BRANDS).toContain('Rover');
    expect(ALL_CAR_BRANDS).toContain('Lancia');
    expect(ALL_CAR_BRANDS).toContain('Morgan');
    expect(ALL_CAR_BRANDS).toContain('Caterham');
    expect(ALL_CAR_BRANDS).toContain('Fisker');
    expect(ALL_CAR_BRANDS).toContain('Vauxhall');
    expect(ALL_CAR_BRANDS).toContain(OTHER_OPTION);
  });

  it('guarantees unique brand names', () => {
    const brandNames = CAR_BRANDS_DATA.map((b) => b.name);
    const unique = new Set(brandNames);
    expect(unique.size).toBe(brandNames.length);
  });

  it('provides complete classic-to-modern models for Maruti Suzuki including SX4', () => {
    const models = getModelsForBrand('Maruti Suzuki');
    expect(models).toContain('SX4');
    expect(models).toContain('Swift');
    expect(models).toContain('Baleno');
    expect(models).toContain('Brezza / Vitara Brezza');
    expect(models).toContain('Grand Vitara');
    expect(models).toContain('Fronx');
    expect(models).toContain('Jimny');
    expect(models).toContain('Dzire / Swift Dzire');
    expect(models).toContain('Ertiga');
    expect(models).toContain('Ciaz');
    expect(models).toContain('Alto / Alto 800');
    expect(models).toContain('Alto K10');
    expect(models).toContain('WagonR / WagonR Stingray');
    expect(models).toContain('Invicto (Zeta+ / Alpha+ Strong Hybrid MPV)');
    expect(models).toContain('XL6');
    expect(models).toContain('800 (SS80, Standard, DX, 5-Speed Classic 1983-2014)');
    expect(models).toContain('Gypsy (Classic 4x4 MG410, MG410W, MG413W King 1.3)');
    expect(models).toContain('Esteem (Classic LX, VX, AX 1.3L All-Aluminium)');
    expect(models).toContain('Omni (Classic Van Flat Roof / High Roof)');
    expect(models).toContain(OTHER_OPTION);

    // Also resolves by aliases
    expect(getModelsForBrand('maruti')).toEqual(models);
    expect(getModelsForBrand('suzuki')).toEqual(models);
    expect(getModelsForBrand('maruti-suzuki')).toEqual(models);
  });

  it('provides models for vintage and classic Indian brands', () => {
    const hmModels = getModelsForBrand('Hindustan Motors');
    expect(hmModels.some((m) => m.includes('Ambassador'))).toBe(true);
    expect(hmModels.some((m) => m.includes('Contessa'))).toBe(true);

    const premierModels = getModelsForBrand('Premier');
    expect(premierModels.some((m) => m.includes('Padmini'))).toBe(true);
    expect(premierModels.some((m) => m.includes('118 NE'))).toBe(true);

    const datsunModels = getModelsForBrand('Datsun');
    expect(datsunModels.some((m) => m.includes('GO'))).toBe(true);
    expect(datsunModels.some((m) => m.includes('Redi-GO'))).toBe(true);
    expect(datsunModels.some((m) => m.includes('240Z'))).toBe(true);

    const daewooModels = getModelsForBrand('Daewoo');
    expect(daewooModels.some((m) => m.includes('Matiz'))).toBe(true);
    expect(daewooModels.some((m) => m.includes('Cielo'))).toBe(true);
  });

  it('provides models for a known luxury brand including OTHER_OPTION', () => {
    const mbModels = getModelsForBrand('Mercedes-Benz');
    expect(mbModels.length).toBeGreaterThan(5);
    expect(mbModels).toContain('C-Class / C 43 / C 63 AMG');
    expect(mbModels).toContain('E-Class / E 53 / E 63 AMG');
    expect(mbModels).toContain(OTHER_OPTION);

    const bmwModels = getModelsForBrand('BMW');
    expect(bmwModels).toContain('M3 Competition');
    expect(bmwModels).toContain(OTHER_OPTION);
  });

  it('handles case-insensitivity when looking up models', () => {
    const porscheLower = getModelsForBrand('porsche');
    expect(porscheLower).toContain('911 Carrera / Carrera S / GTS');
    expect(porscheLower).toContain(OTHER_OPTION);
  });

  it('returns [OTHER_OPTION] for "Other", unlisted brands, or empty string', () => {
    expect(getModelsForBrand(OTHER_OPTION)).toEqual([OTHER_OPTION]);
    expect(getModelsForBrand('')).toEqual([OTHER_OPTION]);
    expect(getModelsForBrand('NonExistentMotorsXYZ')).toEqual([OTHER_OPTION]);
    expect(getModelsForBrand('UnknownBrandXYZ')).toEqual([OTHER_OPTION]);
  });
});
