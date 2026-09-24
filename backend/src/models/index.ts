import { Event } from './event';
import { Handler } from './handler';
import { Registration } from './registration';
import { sequelize, withDeadlockRetry } from './sequelize';

Handler.hasMany(Event, { foreignKey: 'handlerUuid' });
Event.belongsTo(Handler, { foreignKey: 'handlerUuid' });
Event.hasMany(Registration, { foreignKey: 'eventUuid' });
Registration.belongsTo(Event, { foreignKey: 'eventUuid' });

export { Event, Handler, Registration, sequelize, withDeadlockRetry };
