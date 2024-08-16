from math import ceil

from aiogram import Router, F
from aiogram.exceptions import TelegramBadRequest
from aiogram.fsm.context import FSMContext
from aiogram.types import CallbackQuery, InlineKeyboardButton as IKB, InlineKeyboardMarkup as IKM, Message

router = Router(name=__name__)


requests_per_page = 3


class PageCallback:
    action: str
    page: int
    prefix: str

    def __init__(self, page: int, action: str, prefix: str):  # action = 'prev' or 'next'
        self.action = action
        self.page = page
        self.prefix = prefix

    def data(self) -> str:
        return f'page_{self.prefix}_{self.action}_{self.page}'

    @staticmethod
    def from_str(string: str):
        prefix, action, page = string.split('_')[1:]
        return PageCallback(int(page), action, prefix)


def make_kb(
        page: int,
        data: list,
        prefix: str,
        additional_buttons: list[list[IKB]] | None = None,
        buttons_per_page: int = 8,
        make_pages: bool = True
) -> IKM:
    max_page = ceil(len(data) / buttons_per_page)

    page = max(0, min(page, max_page - 1))

    prev_btn = IKB(text='<', callback_data=PageCallback(page, 'prev', prefix).data())
    next_btn = IKB(text='>', callback_data=PageCallback(page, 'next', prefix).data())
    page_btn = IKB(text=f'{page+1} / {max_page}', callback_data='null')

    bound = page * buttons_per_page

    texts = data[bound:bound+buttons_per_page]

    buttons = [[IKB(text=texts[i], callback_data=f'{prefix}_{i+bound}')] for i in range(len(texts))]

    if make_pages:
        buttons += [[prev_btn, page_btn, next_btn]]

    if additional_buttons is not None:
        buttons += additional_buttons

    kb = IKM(inline_keyboard=buttons)
    return kb


@router.callback_query(F.data == 'null')
async def null_callback_handler(query: CallbackQuery) -> None:
    await query.answer()


def get_page(query: CallbackQuery) -> int:
    page_callback = PageCallback.from_str(query.data)
    page = page_callback.page
    action = page_callback.action

    if action == 'prev':
        page -= 1
    elif action == 'next':
        page += 1

    return page


@router.callback_query(F.data.startswith('page'))
async def page_action(query: CallbackQuery, state: FSMContext) -> None:
    page = get_page(query)
    data = await state.get_data()
    prefix = PageCallback.from_str(query.data).prefix

    try:
        await query.message.edit_reply_markup(reply_markup=make_kb(page, data['page'], prefix))
    except (TelegramBadRequest, KeyError):
        pass
    await query.answer()


async def remove_page_list(state: FSMContext) -> None:
    await state.update_data(page=None)


async def get_selected(query: CallbackQuery, state: FSMContext) -> str:
    data = await state.get_data()
    index = int(query.data.split('_')[-1])
    return data['page'][index]


async def set_pages_data(data: list[str], state: FSMContext) -> list[str]:
    await state.update_data(page=data)
    _data = await state.get_data()
    return _data['page']


async def get_page_in_state(state: FSMContext) -> int:
    data = await state.get_data()
    return data['page']


async def set_page_in_state(state: FSMContext, page: int = 0) -> None:
    await state.update_data(page=page)


async def next_page_in_state(state: FSMContext) -> None:
    page = await get_page_in_state(state)
    await state.update_data(page=page+1)


async def send_next_button_if_needed(length: int, message: Message, state: FSMContext, prefix: str) -> None:
    page = await get_page_in_state(state)

    next_btn = IKB(text='Далее ➡️', callback_data=f"{prefix}show_more")
    home_btn = IKB(text='На главную ↩️', callback_data='start_remove_kb')

    if length == 0:
        return

    if length <= (page + 1) * requests_per_page:
        kb = IKM(inline_keyboard=[[home_btn]])
        await message.answer('Все ваши заявки находятся в сообщениях выше👆', reply_markup=kb)
    else:
        kb = IKM(inline_keyboard=[
            [next_btn],
            [home_btn]
        ])
        await message.answer('Посмотреть ещё?', reply_markup=kb)
