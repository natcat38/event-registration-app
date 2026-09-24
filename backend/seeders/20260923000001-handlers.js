'use strict';

// Fixed uuids so the README can list working handler ids. see docs/adr/0007
const HANDLERS = [
  { uuid: 'd39cf190-3b3b-42e1-ba29-aa1675f25a06', name: 'Alice Tan' },
  { uuid: 'c7260cb9-2e26-49f7-8c54-e62f889930d8', name: 'Bala Krishnan' },
  { uuid: 'c0e08739-c750-4984-90a7-6837d371c838', name: 'Chen Wei Ming' },
  { uuid: '8f8de11b-16d0-4fb3-b9dc-085eae531d6e', name: 'Divya Nair' },
  { uuid: '4aa935bb-8405-4c1c-80e7-109a07b74efb', name: 'Erin Goh' },
];

module.exports = {
  async up(queryInterface) {
    const now = new Date();
    // ignoreDuplicates makes a second db:seed a no-op instead of a duplicate-key error.
    await queryInterface.bulkInsert(
      'handlers',
      HANDLERS.map((h) => ({ ...h, createdAt: now, updatedAt: now })),
      { ignoreDuplicates: true },
    );
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('handlers', { uuid: HANDLERS.map((h) => h.uuid) });
  },
};
