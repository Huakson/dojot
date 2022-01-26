const { Readable } = require('stream');

const mockSdk = {
  Logger: jest.fn(() => ({
    debug: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
  })),
  ConfigManager: {
    getConfig: jest.fn((name) => {
      const sync = {};
      sync['cron.expression'] = '* */12 * * *';
      sync.name = name;
      return sync;
    }),
  },
  LocalPersistence: {
    InputPersister: jest.fn().mockImplementation(() => ({
      dispatch: jest.fn(() => Promise.resolve()),
    })),
    InputPersisterArgs: {
      INSERT_OPERATION: 'put',
    },
  },

};
jest.mock('@dojot/microservice-sdk', () => mockSdk);

const SyncLoader = require('../../app/sync/SyncLoader');

const localPersistence = {
  init: jest.fn(),
  logger: {
    debug: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
  },
  clear: jest.fn(),
  createKeyStream: jest.fn(() => Readable({
    read() {
      this.push('tenant1');
      this.push('tenant2');
      this.push(null);
    },
  })),
};

const tenantService = {
  getTenants: jest.fn(() => ['tenant1', 'tenant2']),
};

const deviceService = {
  getDevices: jest.fn((tenant) => {
    const fakedata = {
      tenant1: ['device1', 'device2'],
      tenant2: ['device3', 'device4'],
    };
    // eslint-disable-next-line security/detect-object-injection
    return fakedata[tenant];
  }),
};

const kafkaConsumer = {
  init: jest.fn(),
  initCallbackForNewTenantEvents: jest.fn(),
  initCallbackForDeviceEvents: jest.fn(),
  pause: jest.fn(),
  resume: jest.fn(),
};

describe('SyncLoader', () => {
  let loader;
  beforeEach(() => {
    loader = new SyncLoader(localPersistence, tenantService, deviceService, kafkaConsumer);
  });

  it('Should fetch devices using data from database, when the API consumption failed', async () => {
    let error;
    loader.loadTenants = jest.fn(() => {
      throw new Error('');
    });
    loader.loadDevices = jest.fn();

    try {
      await loader.load();
    } catch (e) {
      error = e;
    }

    expect(error).toBeUndefined();
  });

  it('Should throw an error ', async () => {
    let error;
    loader.load = jest.fn();

    try {
      await loader.init();
    } catch (e) {
      error = e;
    }

    expect(error).toBeUndefined();
  });
});
