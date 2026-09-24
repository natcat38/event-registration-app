import {
  DataTypes,
  Model,
  type CreationOptional,
  type InferAttributes,
  type InferCreationAttributes,
  type NonAttribute,
} from 'sequelize';
import type { Handler } from './handler';
import { sequelize } from './sequelize';

export class Event extends Model<InferAttributes<Event>, InferCreationAttributes<Event>> {
  declare uuid: CreationOptional<string>;
  declare name: string;
  declare dateTime: Date;
  declare postalCode: string;
  declare address: string;
  declare deadline: Date;
  declare capacity: number;
  declare registrationCount: CreationOptional<number>;
  declare handlerUuid: string;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
  declare Handler?: NonAttribute<Handler>; // present only when queried with include
}

Event.init(
  {
    uuid: { type: DataTypes.CHAR(36), primaryKey: true, defaultValue: DataTypes.UUIDV4 },
    name: { type: DataTypes.STRING(255), allowNull: false, unique: true },
    dateTime: { type: DataTypes.DATE(3), allowNull: false },
    postalCode: { type: DataTypes.CHAR(6), allowNull: false },
    address: { type: DataTypes.STRING(500), allowNull: false },
    deadline: { type: DataTypes.DATE(3), allowNull: false },
    capacity: { type: DataTypes.INTEGER, allowNull: false },
    registrationCount: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    handlerUuid: { type: DataTypes.CHAR(36), allowNull: false },
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
  },
  { sequelize, modelName: 'Event', tableName: 'events' },
);
