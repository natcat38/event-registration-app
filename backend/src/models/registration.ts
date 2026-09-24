import {
  DataTypes,
  Model,
  type CreationOptional,
  type InferAttributes,
  type InferCreationAttributes,
} from 'sequelize';
import { sequelize } from './sequelize';

export class Registration extends Model<
  InferAttributes<Registration>,
  InferCreationAttributes<Registration>
> {
  declare uuid: CreationOptional<string>;
  declare eventUuid: string;
  declare emailAddress: string;
  declare registrationNo: number;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
}

Registration.init(
  {
    uuid: { type: DataTypes.CHAR(36), primaryKey: true, defaultValue: DataTypes.UUIDV4 },
    eventUuid: { type: DataTypes.CHAR(36), allowNull: false },
    emailAddress: { type: DataTypes.STRING(254), allowNull: false },
    registrationNo: { type: DataTypes.INTEGER, allowNull: false },
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
  },
  { sequelize, modelName: 'Registration', tableName: 'registrations' },
);
