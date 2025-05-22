import asyncio
from typing import Callable
import json

from aiogram.exceptions import TelegramNetworkError
from aiogram.fsm.context import FSMContext
from aiogram.types import InlineKeyboardMarkup as IKM, BufferedInputFile
from aiogram.types import Message, FSInputFile
from aiogram.utils.media_group import MediaGroupBuilder
from aiogram.exceptions import TelegramBadRequest

from common.keyboard import to_start_kb
from common.text import repair_request_text
from handler import pagination
from util import logger, crm


async def you_cant_do_that(message: Message) -> None:
    await message.answer('Вы не можете этого сделать')


async def to_start_msg(message: Message) -> None:
    await message.answer("Вернуться на главную?", reply_markup=to_start_kb())


async def add_media_to_album(media_filename: str, caption: str, album: MediaGroupBuilder) -> None:
    try:
        # Очищаем имя файла от кавычек и скобок, которые могут быть в JSON
        clean_filename = media_filename.strip('"[]\'')
        
        logger.debug(f"Обрабатываем файл: исходное имя='{media_filename}', очищенное='{clean_filename}'")
        
        # Получаем расширение файла
        if '.' in clean_filename:
            file_ext = clean_filename.split('.')[-1].lower().strip()
            # Убедимся, что расширение не содержит лишних символов
            if not file_ext.isalnum():
                logger.warn(f"Обнаружено некорректное расширение файла: {file_ext}, очищаем")
                file_ext = ''.join(c for c in file_ext if c.isalnum())
        else:
            logger.warn(f"Файл без расширения: {clean_filename}, используем jpg по умолчанию")
            file_ext = "jpg"
        
        logger.debug(f"Расширение файла: {file_ext}")
        
        if file_ext in ["jpg", "jpeg", "png", "gif"]:
            media_type = "photo"
        elif file_ext in ["mp4", "10", "mov", "avi"]:
            media_type = "video"
        else:
            logger.warn(f"Неизвестное расширение файла: {file_ext}, используем photo по умолчанию")
            media_type = "photo"

        file = await crm.get_static_content(clean_filename)
        
        if file is None:
            logger.error(f"Не удалось получить содержимое файла: {clean_filename}")
            return

        input_file = BufferedInputFile(file=file, filename=f"{caption}.{file_ext}")

        album.add(type=media_type, media=input_file, caption=f"<i>{caption}</i>")
        
    except Exception as e:
        logger.error(f"Ошибка при добавлении медиа в альбом: {str(e)}, файл: {media_filename}")


async def send_repair_request(message: Message, repair_request: dict, kb: IKM | None = None) -> None:
    user_id = message.chat.id
    
    text = repair_request_text(repair_request)

    file_filename = repair_request['fileName']
    rr_check_filename = repair_request['checkPhoto']
    rr_comment_attachment_filename = repair_request['commentAttachment']

    try:
        album = MediaGroupBuilder()

        if file_filename is not None:
            # Проверяем, является ли file_filename строкой в формате JSON-массива
            if file_filename.startswith('[') and file_filename.endswith(']'):
                try:
                    # Пробуем распарсить как JSON-массив
                    file_list = json.loads(file_filename)
                    if isinstance(file_list, list):
                        logger.info(f"Обнаружена группа из {len(file_list)} файлов: {file_list}")
                        for file_item in file_list:
                            await add_media_to_album(
                                media_filename=file_item,
                                caption="Описание проблемы",
                                album=album
                            )
                    else:
                        logger.warn(f"JSON не является массивом: {file_filename}")
                        await add_media_to_album(
                            media_filename=file_filename,
                            caption="Описание проблемы",
                            album=album
                        )
                except json.JSONDecodeError as e:
                    logger.error(f"Ошибка парсинга JSON в fileName: {str(e)}, значение: {file_filename}")
                    # Если не удалось распарсить как JSON, обрабатываем как обычный файл
                    await add_media_to_album(
                        media_filename=file_filename,
                        caption="Описание проблемы",
                        album=album
                    )
            else:
                # Обычный одиночный файл
                await add_media_to_album(
                    media_filename=file_filename,
                    caption="Описание проблемы",
                    album=album
                )

        if rr_check_filename is not None:
            await add_media_to_album(
                media_filename=rr_check_filename,
                caption="Чек",
                album=album
            )

        if rr_comment_attachment_filename is not None:
            # Если это JSON-массив файлов
            if rr_comment_attachment_filename.startswith('[') and rr_comment_attachment_filename.endswith(']'):
                try:
                    files = json.loads(rr_comment_attachment_filename)
                    for file_item in files:
                        await add_media_to_album(
                            media_filename=file_item,
                            caption="Вложение комментария",
                            album=album
                        )
                except Exception as e:
                    logger.error(f"Ошибка парсинга commentAttachment: {e}, значение: {rr_comment_attachment_filename}")
                    await add_media_to_album(
                        media_filename=rr_comment_attachment_filename,
                        caption="Вложение комментария",
                        album=album
                    )
                else:
                    await add_media_to_album(
                        media_filename=rr_comment_attachment_filename,
                        caption="Вложение комментария",
                        album=album
                )

        try:
            if album._media:
                await message.answer_media_group(album.build())
        except TelegramBadRequest:
            await message.answer("<i>не удалось загрузить фото</i>")
            logger.error("TelegramBadRequest: file must be non-empty", f"{album.build()}")
        
        await message.answer(text, reply_markup=kb)

    except TelegramNetworkError as e:
        logger.error(f"TelegramNetworkError: {str(e)}, photo: {file_filename}, check: {rr_check_filename}, comment_attachment: {rr_comment_attachment_filename}")
        return
    except Exception as e:
        logger.error(f"Ошибка при отправке заявки: {str(e)}, заявка ID: {repair_request.get('id', 'неизвестно')}")
        await message.answer(f"<i>Ошибка при загрузке данных заявки</i>")
        await message.answer(text, reply_markup=kb)
        return


async def send_several_requests(repair_requests: list, message: Message, state: FSMContext, send_func: Callable) -> None:
    page = await pagination.get_page_in_state(state)

    bound_ = page * pagination.requests_per_page
    _bound = bound_ + pagination.requests_per_page

    for rr in repair_requests[bound_:_bound]:
        await send_func(message, rr)
        await asyncio.sleep(0.2)


async def page0_show_many_requests(
        message: Message,
        state: FSMContext,
        repair_requests: list[dict],
        send_many_func: Callable,
        prefix: str,
        params: str = ""
) -> None:
    if not repair_requests:
        match prefix:
            case "it":
                no_rr_text = "В маршрутном листе пока что нет заявок"
            case _:
                no_rr_text = "Здесь пока что нет заявок"

        await message.answer(no_rr_text, reply_markup=to_start_kb())

    await pagination.set_page_in_state(state, 0)
    await send_many_func(repair_requests, message, state)
    await pagination.send_next_button_if_needed(len(repair_requests), message, state, prefix=prefix, params=params)
