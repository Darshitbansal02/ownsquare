import { describe, it, expect } from 'vitest';
import React from 'react';
import { AdminPortal } from '../index.jsx';
import { AdminDashboard } from '../AdminDashboard.jsx';
import { AdminProperties } from '../AdminProperties.jsx';
import { AdminPropertySale } from '../AdminPropertySale.jsx';
import { AdminUsers } from '../AdminUsers.jsx';
import { AdminKyc } from '../AdminKyc.jsx';
import { AdminWithdrawals } from '../AdminWithdrawals.jsx';
import { AdminSettings } from '../AdminSettings.jsx';

describe('Admin Frontend Pages Suite (Darshit Ownership)', () => {
  it('should export all required Admin components', () => {
    expect(AdminPortal).toBeDefined();
    expect(AdminDashboard).toBeDefined();
    expect(AdminProperties).toBeDefined();
    expect(AdminPropertySale).toBeDefined();
    expect(AdminUsers).toBeDefined();
    expect(AdminKyc).toBeDefined();
    expect(AdminWithdrawals).toBeDefined();
    expect(AdminSettings).toBeDefined();
  });
});
