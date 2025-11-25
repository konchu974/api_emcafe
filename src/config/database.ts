import { DataSource } from 'typeorm';
import dotenv from 'dotenv';

dotenv.config();

const AppDataSource = new DataSource({
  type: 'mysql',
  host: 'caboose.proxy.rlwy.net',
  port: 26663,
  username: 'root',
  password: 'ICSKMyDWkTsVEOLwYCiFCdUbiRJxLHOV',
  database: 'railway',
  extra: {
    allowPublicKeyRetrieval: true,
    ssl: false // si pas de SSL
  },
  entities: ['src/entities/**/*.ts'],
  synchronize: true,
});
