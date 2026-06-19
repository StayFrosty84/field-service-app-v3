// Fake-but-realistic data for the "Preview sample Bill of Sale" button in Settings.
// Lets the user see their branding + layout before doing a real job.
export function sampleBillData() {
  return {
    account: {
      name: 'Acme Bakery LLC',
      address: '12 Main St, Springfield',
      phone: '(555) 010-1234',
      email: 'orders@acmebakery.example',
    },
    contact: {
      name: 'Jordan Rivera',
      role: 'Kitchen Manager',
      phone: '(555) 222-3333',
      email: 'jordan@acmebakery.example',
    },
    workOrder: {
      location: { text: '12 Main St — rear kitchen' },
      issue:
        'Convection oven not reaching temperature. Replaced thermostat, recalibrated burner, and verified hold at 350°F.',
      serviceDate: Date.now(),
    },
    lineItems: [
      { description: 'Oven thermostat (OEM part #TS-220)', qty: 1, unitPrice: 145 },
      { description: 'Service labor (1.5 hrs @ $90/hr)', qty: 1.5, unitPrice: 90 },
      { description: 'Trip / diagnostic fee', qty: 1, unitPrice: 65 },
    ],
    taxRate: 8,
  };
}
