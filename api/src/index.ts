import * as dotenv from 'dotenv';
dotenv.config({ path: `./.env.${process.env.NODE_ENV}.local` });
import app from './app';
import dbUtils from './utils/db';

const PORT = process.env.PORT || 3000;

(async function initDb() {
    try {
        await dbUtils.initializeDbModels();
        // if (process.env.NODE_ENV === 'development') {
        // }
    } catch (e) {
        console.log(e);
        console.log('COULD NOT CONNECT TO THE DB, retrying in 5 seconds');
        setTimeout(initDb, 5000);
    }
})();

console.log(`Node env: ${process.env.NODE_ENV}`);
app.listen(PORT, () => console.log(`Listen on :${PORT}`));

// const exitHandler = () => {
//     if (server) {
//         server.close(() => {
//             console.log('Server closed');
//             process.exit(1);
//         });
//     } else {
//         process.exit(1);
//     }
// };
//
// const unexpectedErrorHandler = (error: unknown) => {
//     console.log(error);
//     exitHandler();
// };
//
// process.on('uncaughtException', unexpectedErrorHandler);
// process.on('unhandledRejection', unexpectedErrorHandler);
