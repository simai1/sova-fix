import json

from aiogram import Bot
from aiogram.types import InlineKeyboardButton as IKB, InlineKeyboardMarkup as IKM
from common.keyboard import to_start_btn, to_start_kb
from data import const
from util import logger, crm


# Локальный словарь UI-наименований статусов — Title-Case ровно как в
# front/src/components/Lk/StatusChip.tsx::STATUS_LABELS и в backend
# api/src/config/notificationLabels.ts. Зеркалирование TG ↔ push: юзер
# должен видеть одни и те же слова. crm.get_status_name() ходит на API
# и тянет name из таблицы Status (там хранится lowercase для legacy-логики),
# поэтому в push-уведомлении используем именно этот словарь.
STATUS_UI_LABELS: dict[int, str] = {
    1: "Новая",
    2: "В работе",
    3: "Выполнена",
    4: "Неактуальна",
    5: "Выезд без выполнения",
}


def _get_status_ui_label(status_number: int) -> str:
    return STATUS_UI_LABELS.get(status_number, f"Статус {status_number}")


async def get_simple_notification_text(event: str, msg: dict):
    match event:
        case "STATUS_UPDATE":
            rr_number = await crm.get_repair_request_number(msg["requestId"])
            status_label = _get_status_ui_label(msg['newStatus'])
            return (
                f"<b>Изменение статуса заявки</b>\n"
                f"Заявка № {rr_number} — статус «{status_label}»."
            )
        case "URGENCY_UPDATE":
            rr_number = await crm.get_repair_request_number(msg["requestId"])
            return (
                f"<b>Изменение срочности заявки</b>\n"
                f"Срочность заявки № {rr_number} — «{msg['newUrgency']}»."
            )
        case "COMMENT_UPDATE":
            rr_number = await crm.get_repair_request_number(msg["requestId"])
            return (
                f"<b>Новый комментарий по заявке</b>\n"
                f"По заявке № {rr_number} добавлен комментарий. "
                f"Откройте заявку, чтобы увидеть детали."
            )
        case "REQUEST_CREATE":
            rr_number = await crm.get_repair_request_number(msg["requestId"])
            return (
                f"<b>Новая заявка</b>\n"
                f"Создана заявка № {rr_number}."
            )
        case "TGUSER_CREATE":
            user = await crm.get_user_by_id(msg['userId'])
            return (
                f"<b>Заявка на регистрацию</b>\n"
                f"Поступила новая заявка на регистрацию.\n"
                f"<i>Имя: <b>{user['name']}</b>\n"
                f"Роль: <b>{crm.roles.get_rus(user['role'])}</b></i>"
            )
        case "TGUSER_CONFIRM":
            return (
                f"<b>Регистрация подтверждена</b>\n"
                f"Учётная запись активирована — можно войти в личный кабинет."
            )
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

    notified_users = set()

    if customer_id is not None and event != "REQUEST_CREATE":
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
