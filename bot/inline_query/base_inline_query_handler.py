from datetime import datetime
from typing import List
from uuid import uuid4

from aiogram import Router
from aiogram.enums import ParseMode
from aiogram.types import InlineQuery, InlineQueryResultArticle, InputTextMessageContent

import config as cf
from data import const
from util import logger, crm
from util.verification import verify_user

router = Router(name=__name__)


def get_not_found_article() -> InlineQueryResultArticle:
    return InlineQueryResultArticle(
        id=str(uuid4()),
        title="Ничего нет",
        description="Ничего не удалось найти",
        input_message_content=InputTextMessageContent(
            message_text=f"{datetime.now(tz=cf.TIMEZONE).strftime(logger.Defaults.DT_FORMAT)}"
        ),
    )


@router.inline_query()
async def base_inline_query_handler(inline_query: InlineQuery) -> None:
    query = inline_query.query.split()
    user_id = inline_query.from_user.id

    user_data = await crm.get_user(user_id)

    if user_data is None:
        return

    if len(query) < 1:
        return

    # pattern: "%command %[params]"
    command = query[0]
    params = query[1:]

    match command:
        case "rr":
            items = await iq_articles_for_rrs(user_data, params)
        case _:
            return

    await inline_query.answer(
        results=items,
        cache_time=1
    )


async def iq_articles_for_rrs(user_data: dict, iq_params: list[str]) -> list[InlineQueryResultArticle]:
    rrs = await crm.get_rrs_for_user(user_data)
    items = await make_articles_for_rrs(rrs, content_filter="".join(iq_params))
    return items


async def make_articles_for_rrs(rr_list: list, content_filter: str = "") -> list[InlineQueryResultArticle]:
    items = []
    content_filter = content_filter.lower().strip().replace(" ", "")

    for rr in rr_list[::-1]:
        item = InlineQueryResultArticle(
            id=str(uuid4()),
            title=f"Заявка №{rr['number']}",
            description=f"{rr['object']}\n- {rr['problemDescription'].replace('\n', ' ')}",
            input_message_content=InputTextMessageContent(
                message_text=f"/rr {rr['number']}",
            parse_mode=ParseMode.HTML
            ),
        )
        if not content_filter:
            items.append(item)
            continue

        if content_filter.isdigit():
            if content_filter == str(rr['number']):
                items.append(item)
            continue

        if (content_filter.startswith("#") or content_filter.startswith("№")) and content_filter[1:] == str(rr['number']):
            items.append(item)
            continue

        if content_filter.startswith('status=') and len(content_filter) >= 8 and rr['status'] == int(content_filter[7]):
            items.append(item)
            continue

        status = const.statuses_ru_locale[rr['status']]
        info = f"{rr['number']}{rr['unit']}{rr['object']}{rr['problemDescription']}{status}{rr['urgency']}"

        if content_filter in info.strip().lower().replace(" ", ""):
            items.append(item)

    if len(items) == 0:
        return [get_not_found_article()]

    return items
