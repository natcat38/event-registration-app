import { DatabaseError } from 'sequelize';
import { withDeadlockRetry } from './sequelize';

function deadlockError(): DatabaseError {
  const original = Object.assign(new Error('Deadlock found'), { code: 'ER_LOCK_DEADLOCK' });
  return new DatabaseError(original);
}

function otherDbError(): DatabaseError {
  const original = Object.assign(new Error('syntax error'), { code: 'ER_PARSE_ERROR' });
  return new DatabaseError(original);
}

describe('withDeadlockRetry', () => {
  it('retries exactly once on a deadlock and returns the retry result', async () => {
    const fn = jest.fn().mockRejectedValueOnce(deadlockError()).mockResolvedValueOnce('ok');

    await expect(withDeadlockRetry(fn)).resolves.toBe('ok');
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('rethrows a non-deadlock error without retrying', async () => {
    const boom = otherDbError();
    const fn = jest.fn().mockRejectedValueOnce(boom);

    await expect(withDeadlockRetry(fn)).rejects.toBe(boom);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('gives up after the second deadlock', async () => {
    const second = deadlockError();
    const fn = jest.fn().mockRejectedValueOnce(deadlockError()).mockRejectedValueOnce(second);

    await expect(withDeadlockRetry(fn)).rejects.toBe(second);
    expect(fn).toHaveBeenCalledTimes(2);
  });
});
