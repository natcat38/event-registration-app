import type { Request, Response } from 'express';
import { AppError } from '../utils/errors';
import { errorHandler } from './errorHandler';

function mockRes() {
  const res = { status: jest.fn(), json: jest.fn() };
  res.status.mockReturnValue(res);
  return res as unknown as Response & { status: jest.Mock; json: jest.Mock };
}
const req = {} as Request;
const next = jest.fn();

describe('errorHandler', () => {
  it('maps AppError to its status, message and field errors', () => {
    const res = mockRes();
    errorHandler(new AppError(421, 'Bad', { name: ['taken'] }), req, res, next);
    expect(res.status).toHaveBeenCalledWith(421);
    expect(res.json).toHaveBeenCalledWith({ message: 'Bad', errors: { name: ['taken'] } });
  });

  it('turns any 4xx-tagged library error into 421, even without expose', () => {
    const res = mockRes();
    errorHandler(Object.assign(new URIError('bad %'), { status: 400 }), req, res, next);
    expect(res.status).toHaveBeenCalledWith(421);
  });

  it('returns a generic 500 with no internals for anything else', () => {
    const res = mockRes();
    errorHandler(new Error('secret sql'), req, res, next);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(JSON.stringify(res.json.mock.calls[0][0])).not.toContain('secret');
  });
});
