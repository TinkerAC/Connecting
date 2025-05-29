// backend/src/server.ts


import app from './app';
import {sequelize} from './models/index';
import {config} from "./utils/loadConfig";

const PORT = config.app.port || 3000

sequelize
    .sync({force: false})
    .then(() => {
        console.log('Database synced successfully');
        app.listen(PORT, () => {
            console.log(`Server is listening on Port:${PORT}`)
        });
    })
    .catch(err => {
        console.error('Database sync failed:', err);
    });