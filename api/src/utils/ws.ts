import { aWss } from '../app';
import WebSocket from 'ws';

type WsMsgData = {
    msg: any;
    event: string;
};

const sendMsg = (msg: any) => {
    aWss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(msg));
        }
    });
};

export { sendMsg, WsMsgData };
