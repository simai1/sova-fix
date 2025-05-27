import json

from aiogram import Bot
from aiogram.types import InlineKeyboardButton as IKB, InlineKeyboardMarkup as IKM
from common.keyboard import to_start_btn, to_start_kb
from data import const
from util import logger, crm

notification_texts = \
{
    "STATUS_UPDATE":
    {
        2:  # в работе
        {
            "CUSTOMER": "Ваша заявка №{number} передана в работу исполнителю!",
            "CONTRACTOR": ""
        },
        3:  # выполнена
        {
            "customer": "Ваша заявка №{number} выполнена, пожалуйста, проверьте качество выполнения ремонта!",
            "contractor": ""
        }
    },
    "URGENCY_UPDATE":
    {
        "customer": "",
        "contractor": ""
    },
    "COMMENT_UPDATE":
    {
        "customer": "",
        "contractor": ""
    },
}


def get_status_update_text(new_status: int, role: int, request_number: int):
    string = notification_texts["STATUS_UPDATE"][new_status][crm.roles.get_str(role)]

    if string is None:
        return None

    return string.format(number=request_number)


def get_urgency_update_text(role: int, request_number: int):
    string = notification_texts["URGENCY_UPDATE"][crm.roles.get_str(role)]

    if string is None:
        return None

    return string.format(number=request_number)


async def get_simple_notification_text(event: str, msg: dict):
    match event:
        case "STATUS_UPDATE":
            rr_number = await crm.get_repair_request_number(msg["requestId"])
            return f"<b>❗️ИЗМЕНЕНИЕ СТАТУСА ЗАЯВКИ❗️</b>\nСтатус заявки №{rr_number} был изменён на \"{const.statuses_ru_locale[msg['newStatus']]}\""
        case "URGENCY_UPDATE":
            rr_number = await crm.get_repair_request_number(msg["requestId"])
            return f"<b>❗ИЗМЕНЕНИЕ СРОЧНОСТИ ЗАЯВКИ❗️</b>\nСрочность завки №{rr_number} была изменена на \"{msg['newUrgency']}\""
        case "COMMENT_UPDATE":
            rr_number = await crm.get_repair_request_number(msg["requestId"])
            return f"<b>❗ИЗМЕНЕНИЕ КОММЕНТАРИЯ ЗАЯВКИ❗️</b>\nКомментарий заявки №{rr_number} был изменён.\nОткройте заявку, чтобы увидеть изменения"
        case "REQUEST_CREATE":
            rr_number = await crm.get_repair_request_number(msg["requestId"])
            return f"<b>❗НОВАЯ ЗАЯВКА❗️</b>\nЗаказчиком была добавлена новая заявка №{rr_number}"
        case "TGUSER_CREATE":
            user = await crm.get_user_by_id(msg['userId'])
            return f"<b>❗ЗАЯВКА НА РЕГИСТРАЦИЮ❗️</b>\nНовая заявка на регистрацию!\n<i>Имя: <b>{user['name']}</b>\nРоль: <b>{crm.roles.get_rus(user['role'])}</b></i>"
        case "TGUSER_CONFIRM":
            return f"<b>❗ЗАЯВКА НА РЕГИСТРАЦИЮ ОДОБРЕНА❗️</b>\nВаша заявка на регистрацию одобрена.\nНаслаждайтесь использованием нашего бота!"
        case _:
            return None


def get_simple_notification_kb(event: str, msg: dict, role: int):
    match event:
        case "TGUSER_CREATE":
            return None
        case "TGUSER_CONFIRM":
            return to_start_kb()
        case _:
            kb = get_send_one_rr_kb(msg["requestId"], role)
            return kb


async def from_websocket_message(bot: Bot, message_string: str) -> None:

    message_dict = json.loads(message_string)

    msg = message_dict["msg"]
    event = message_dict["event"]
    
    
    request_id = msg.get("requestId")
    if request_id:
        request_info = await crm.get_repair_request(request_id)
        if request_info:
            msg["requestInfo"] = request_info

    if "customer" in msg.keys() and msg['customer'] is not None:
        if str(msg['customer']).isdigit():
            customer_id = int(msg["customer"])
        else:
            customer_id = await crm.get_tg_id_by_id(msg["customer"])
    else:
        customer_id = None


    if "contractor" in msg.keys() and msg['contractor'] is not None:
        if str(msg['contractor']).isdigit():
            contractor_id = int(msg["contractor"])
        else:
            contractor_id = await crm.get_tg_id_by_id(msg["contractor"])
    else:
        contractor_id = None
        
    if "tgUser" in msg.keys() and msg['tgUser'] is not None:
        if str(msg['tgUser']).isdigit():
            tg_user_id = int(msg['tgUser'])
        else:
            user = await crm.get_user_by_id(msg['tgUser'])
            tg_user_id = int(user['tgId']) if user and 'tgId' in user else None
            
    else:
        tg_user_id = None

    admin_ids = await crm.get_all_manager_tg_ids()

    text = await get_simple_notification_text(event, msg)
    
    # Отслеживаем кому уже отправили уведомление для избежания дублирования
    notified_users = set()

    if customer_id is not None:
        kb = get_simple_notification_kb(event, msg, crm.roles.CUSTOMER)
        await bot.send_message(customer_id, text, reply_markup=kb)
        notified_users.add(customer_id)
        logger.info("sent notification to customer", f"\'{event}\'")

    if contractor_id is not None and contractor_id not in notified_users:
        kb = get_simple_notification_kb(event, msg, crm.roles.CONTRACTOR)
        await bot.send_message(contractor_id, text, reply_markup=kb)
        notified_users.add(contractor_id)
        logger.info("sent notification to contractor", f"\'{event}\'")

    if tg_user_id is not None and tg_user_id not in notified_users:
        kb = get_simple_notification_kb(event, msg, crm.roles.USER)
        await bot.send_message(tg_user_id, text, reply_markup=kb)
        notified_users.add(tg_user_id)
        logger.info("sent notification to tgUser", f"\'{event}\'")

    if event == "TGUSER_CONFIRM":
        return

    if admin_ids:
        kb = get_simple_notification_kb(event, msg, crm.roles.ADMIN)
        for admin_id in admin_ids:
            if admin_id not in notified_users:
                await bot.send_message(admin_id, text, reply_markup=kb)
                notified_users.add(admin_id)
        logger.info("sent notification to admins", f"\'{event}\'")


def get_send_one_rr_kb(request_id: str, role: int) -> IKM:
    return IKM(inline_keyboard=[
        [IKB(text="Посмотреть заявку ▶️", callback_data=f"send1rr:{request_id}:{role}")],
        [to_start_btn()]
    ])
