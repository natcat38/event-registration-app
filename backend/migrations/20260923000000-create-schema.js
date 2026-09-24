'use strict';

// see docs/adr/0007: uuids are fixed-width ascii_bin; searched or unique text columns pin their collation.
const UUID = 'CHAR(36) CHARACTER SET ascii COLLATE ascii_bin';
const TEXT = (n) => `VARCHAR(${n}) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci`;

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('handlers', {
      uuid: { type: UUID, primaryKey: true, allowNull: false },
      name: { type: TEXT(255), allowNull: false },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false },
    });

    await queryInterface.createTable('events', {
      uuid: { type: UUID, primaryKey: true, allowNull: false },
      name: { type: TEXT(255), allowNull: false, unique: true },
      dateTime: { type: Sequelize.DATE(3), allowNull: false },
      postalCode: { type: Sequelize.CHAR(6), allowNull: false },
      address: { type: TEXT(500), allowNull: false },
      deadline: { type: Sequelize.DATE(3), allowNull: false },
      capacity: { type: Sequelize.INTEGER, allowNull: false },
      registrationCount: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
      handlerUuid: { type: UUID, allowNull: false, references: { model: 'handlers', key: 'uuid' } },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false },
    });
    await queryInterface.addIndex('events', ['handlerUuid'], { name: 'idx_events_handler_uuid' });

    await queryInterface.createTable('registrations', {
      uuid: { type: UUID, primaryKey: true, allowNull: false },
      eventUuid: { type: UUID, allowNull: false, references: { model: 'events', key: 'uuid' } },
      emailAddress: { type: TEXT(254), allowNull: false },
      registrationNo: { type: Sequelize.INTEGER, allowNull: false },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false },
    });
    await queryInterface.addIndex('registrations', ['eventUuid', 'emailAddress'], {
      name: 'uniq_event_email',
      unique: true,
    });
    await queryInterface.addIndex('registrations', ['eventUuid', 'registrationNo'], {
      name: 'uniq_event_registration_no',
      unique: true,
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('registrations');
    await queryInterface.dropTable('events');
    await queryInterface.dropTable('handlers');
  },
};
