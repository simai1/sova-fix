from aiogram import Bot

notification_texts = {
    "STATUS_UPDATE": "Уведомление STATUS_UPDATE\nrequestId: {request_id}",
    "URGENCY_UPDATE": "Уведомление URGENCY_UPDATE\nrequestId: {request_id}",
    "COMMENT_UPDATE": "Уведомление COMMENT_UPDATE\nrequestId: {request_id}"
}


def send_notification_from_websocket_message(bot: Bot, websocket_message: dict) -> None:
    msg = websocket_message["msg"]

    customer_id: str | None = msg['customer']
    contractor_id: str | None = msg['contractor']

    # if customer_id is not None:
    #     customer_tg_id =

    # chat_id =

    event = websocket_message["event"]
    text = notification_texts[event].format(request_id=msg["requestId"])

    print(f"SEND MESSAGE:\n{text}\ncustomer_id={customer_id}, contractor_id={contractor_id}")
    # await bot.send_message(chat_id, text)
