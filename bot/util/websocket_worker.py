import threading

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


def on_open(ws) -> None:
    logger.info("websocket: Connection opened")


def on_message(ws, message, bot: Bot) -> None:
    # logger.info(f"websocket: Received message: {message}")

    # loop = asyncio.get_running_loop()
    # asyncio.run_coroutine_threadsafe(
    #     send_notification.send_notification_from_websocket_message(bot, message),
    #     loop
    # )

    asyncio.run(
        send_notification.send_notification_from_websocket_message(bot, message)
    )


def on_error(ws, error) -> None:
    logger.info(f"websocket: An error occured: {error}")


def on_close(ws, close_status_code, close_msg):
    logger.info(f"websocket: Connection closed")


class WebSocketWorker:
    ws: websocket.WebSocketApp
    websocket_run_thread: threading.Thread

    def __init__(self, bot: Bot) -> None:
        self.ws = websocket.WebSocketApp(
            url=cf.WEBSOKET_URL,
            on_open=on_open,
            on_message=lambda _ws, message: on_message(_ws, message, bot),
            on_close=on_close
        )
        self.websocket_run_thread = threading.Thread(
            target=self.ws.run_forever
        )

    def open_connection(self) -> None:
        self.websocket_run_thread.start()

    def close_connection(self) -> None:
        self.ws.close()
        self.websocket_run_thread.join()


