// backend/src/server.ts


import app from './app';
import { sequelize } from './models/index';

const PORT = process.env.PORT || 3000;

sequelize
    .sync({ force: false })
    .then(() => {
        console.log('Database synced successfully');
        app.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`);
        });
    })
    .catch(err => {
        console.error('Database sync failed:', err);
    });