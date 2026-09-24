const ENV_KEYS = ['PORT', 'DB_PORT', 'RATE_LIMIT_ENABLED', 'NODE_ENV'] as const;
const savedEnv: Record<string, string | undefined> = {};

function loadConfig(): typeof import('./config').config {
  let loaded: typeof import('./config').config;
  jest.isolateModules(() => {
    loaded = jest.requireActual('./config').config;
  });
  return loaded!;
}

beforeEach(() => {
  for (const key of ENV_KEYS) savedEnv[key] = process.env[key];
});

afterEach(() => {
  for (const key of ENV_KEYS) {
    if (savedEnv[key] === undefined) delete process.env[key];
    else process.env[key] = savedEnv[key];
  }
});

describe('config PORT', () => {
  it.each(['', 'abc', '0', '70000'])('throws naming PORT for "%s"', (raw) => {
    process.env.PORT = raw;
    expect(() => loadConfig()).toThrow(/PORT/);
  });

  it('parses a valid port', () => {
    process.env.PORT = '8080';
    expect(loadConfig().port).toBe(8080);
  });

  it('defaults to 8000 when unset, unless the .env supplies its own PORT', () => {
    delete process.env.PORT;
    // dotenv never overrides an already-set var; a repo .env may set PORT itself.
    expect(loadConfig().port).toBe(8000);
  });
});

describe('config DB_PORT', () => {
  it('defaults to 3306', () => {
    delete process.env.DB_PORT;
    process.env.PORT = '8000';
    expect(loadConfig().db.port).toBe(3306);
  });
});

describe('config rateLimitEnabled', () => {
  it('is true only for the literal string "true"', () => {
    process.env.PORT = '8000';
    process.env.RATE_LIMIT_ENABLED = 'true';
    expect(loadConfig().rateLimitEnabled).toBe(true);
  });

  it.each(['false', 'TRUE', '1', ''])('is false for "%s"', (raw) => {
    process.env.PORT = '8000';
    process.env.RATE_LIMIT_ENABLED = raw;
    expect(loadConfig().rateLimitEnabled).toBe(false);
  });
});

describe('config isTest', () => {
  it('is true under jest', () => {
    process.env.PORT = '8000';
    expect(loadConfig().isTest).toBe(true);
  });
});
