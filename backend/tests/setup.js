process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-at-least-32-chars-long-1234';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-at-least-32-chars-5678';
process.env.JWT_ACCESS_EXPIRES = '15m';
process.env.JWT_REFRESH_EXPIRES = '30d';
process.env.MONGODB_URI = 'mongodb://127.0.0.1:27017/medisync-test';
process.env.MONGOMS_MAX_START_TIMEOUT = '60000';

if (typeof jest !== 'undefined') {
  jest.setTimeout(60000);
}

afterEach(async () => {
  try {
    const { __testNotifications } = await import('../src/jobs/queues.js');
    if (__testNotifications) {
      __testNotifications.length = 0;
    }
  } catch {
    // Ignore queue import errors if not yet loaded
  }
});
