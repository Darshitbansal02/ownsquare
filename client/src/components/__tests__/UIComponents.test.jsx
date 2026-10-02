import { describe, it, expect } from 'vitest';
import React from 'react';
import { Button } from '../ui/Button.jsx';
import { Card, KpiCard } from '../ui/Card.jsx';
import { FundingBar } from '../ui/FundingBar.jsx';
import { FormField } from '../ui/FormField.jsx';
import { DataTable } from '../ui/DataTable.jsx';
import { AllocationDonut } from '../charts/AllocationDonut.jsx';
import { PropertyCard } from '../property/PropertyCard.jsx';
import { formatINR, formatCompactINR, formatDateIN } from '../../utils/formatINR.js';

describe('Shared UI Components Suite (Deepti Ownership)', () => {
  it('should export all shared UI and chart components', () => {
    expect(Button).toBeDefined();
    expect(Card).toBeDefined();
    expect(KpiCard).toBeDefined();
    expect(FundingBar).toBeDefined();
    expect(FormField).toBeDefined();
    expect(DataTable).toBeDefined();
    expect(AllocationDonut).toBeDefined();
    expect(PropertyCard).toBeDefined();
  });

  it('should correctly format currency in Indian numbering notation', () => {
    expect(formatINR(1000000000)).toBe('₹1,00,00,000'); // ₹1 Crore
    expect(formatINR(20000000)).toBe('₹2,00,000'); // ₹2 Lakh
    expect(formatINR(1000000)).toBe('₹10,000'); // ₹10,000
    expect(formatINR(0)).toBe('₹0');
  });

  it('should format compact INR strings properly', () => {
    expect(formatCompactINR(1400000000)).toBe('₹1.4 Cr');
    expect(formatCompactINR(50000000)).toBe('₹5 L');
    expect(formatCompactINR(1000000)).toBe('₹10 K');
  });

  it('should format Indian dates properly', () => {
    const formatted = formatDateIN('2026-10-01T06:30:00.000Z');
    expect(formatted).not.toBe('—');
  });
});
