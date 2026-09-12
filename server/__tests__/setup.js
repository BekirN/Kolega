// Globalno okruženje za testove: osiguraj JWT tajne da potpisivanje/verifikacija radi bez .env-a.
process.env.NODE_ENV = 'test'
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test_jwt_secret'
process.env.JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'test_refresh_secret'
