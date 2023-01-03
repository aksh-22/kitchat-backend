export class Keys {
  MONGO_URI: string = null;
  JWT_SECRET_KEY: string = null;
  JWT_EXPIRATION_TIME: string = null;
  ONE_SIGNAL_REST_API_KEY: string = null;
  ONE_SIGNAL_APP_ID: string = null;

  constructor() {
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      require('dotenv').config();
    } catch (error) {}
    this.prepareKeys();
  }

  prepareKeys() {
    // this.MONGO_URI =
    //   process.env.NODE_ENV === `test`
    //     ? process.env.MONGO_URI_TEST
    //     : process.env.MONGO_URI;
    this.MONGO_URI = process.env.MONGO_URI;
    this.ONE_SIGNAL_APP_ID = process.env.ONE_SIGNAL_APP_ID;
    this.ONE_SIGNAL_REST_API_KEY = process.env.ONE_SIGNAL_REST_API_KEY;
  }
}
