import json
import threading
import time

import websocket
import asyncio

from aiogram import Bot
from notification import send_notification

from util import logger
import config as cf

events = [
    "STATUS_UPDATE",
    "URGENCY_UPDATE",
    "COMMENT_UPDATE"
]

class WebSocketWorker:
    ws: websocket.WebSocketApp
    bot: Bot
    websocket_run_thread: threading.Thread
    should_run: bool = True
    connection_opened: bool = False

    def __init__(self, bot: Bot, loop) -> None:
        self.bot = bot
        self.loop = loop
        self.ws = websocket.WebSocketApp(
            url=cf.WEBSOKET_URL,
            on_open=self.on_open,
            on_message=self.on_message,
            on_close=self.on_close,
            keep_running=False
        )
        self.websocket_run_thread = threading.Thread(
            target=self.websocket_run
        )

    def websocket_run(self) -> None:
        self.ws.run_forever()

    def open_connection(self) -> None:
        logger.info("websocket: Openning connection...")
        self.should_run = True
        self.websocket_run_thread.start()

    def close_connection(self) -> None:
        logger.info("websocket: Closing connection...")
        self.should_run = False
        self.ws.close()
        self.websocket_run_thread.join()

    # events
    def on_open(self, ws) -> None:
        logger.info("websocket: Connection opened")
        self.connection_opened = True

    def on_message(self, ws, message) -> None:
        logger.info(f"websocket: Got new message, event: \"{json.loads(message)['event']}\"")
        coro = send_notification.from_websocket_message(self.bot, message)
        asyncio.run_coroutine_threadsafe(coro, self.loop)

    def on_error(self, ws, error) -> None:
        logger.error(f"websocket: An error occured: {error}")

    def on_close(self, ws, close_status_code, close_msg):
        logger.warn(f"websocket: Connection closed")
        self.connection_opened = False

        while not self.connection_opened and self.should_run:
            logger.info(f"websocket: Try reopening connection in 5 seconds ({cf.WEBSOKET_URL})")

            time.sleep(5)

            if self.websocket_run_thread.is_alive():
                self.ws.close()
                self.ws.run_forever()
            else:
                self.open_connection()

            time.sleep(1)
