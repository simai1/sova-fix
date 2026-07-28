import unittest
from unittest.mock import AsyncMock, patch

from command.contractor import contractor_menu


class FakeFromUser:
    id = 456


class FakeMessage:
    from_user = FakeFromUser()

    def __init__(self):
        self.answer_photo = AsyncMock()


def crm_callbacks(message: FakeMessage) -> list[str]:
    """Достаёт callback_data всех кнопок отрисованной клавиатуры."""
    reply_markup = message.answer_photo.call_args.kwargs['reply_markup']
    return [button.callback_data for row in reply_markup.inline_keyboard for button in row]


class ContractorMenuTest(unittest.IsolatedAsyncioTestCase):
    async def test_offers_crm_access_when_no_web_account(self):
        message = FakeMessage()

        with patch.object(contractor_menu.crm, 'get_web_user_by_tg_id', return_value=None):
            await contractor_menu.send_contractor_menu(message)

        message.answer_photo.assert_awaited_once()
        callbacks = crm_callbacks(message)
        self.assertIn('get_crm_access', callbacks)
        self.assertNotIn('open_crm', callbacks)

    async def test_offers_open_crm_when_web_account_exists(self):
        message = FakeMessage()

        with patch.object(
            contractor_menu.crm,
            'get_web_user_by_tg_id',
            return_value={'login': 'contractor@test.local'},
        ):
            await contractor_menu.send_contractor_menu(message)

        callbacks = crm_callbacks(message)
        self.assertIn('open_crm', callbacks)
        self.assertNotIn('get_crm_access', callbacks)

    async def test_keeps_existing_contractor_buttons(self):
        message = FakeMessage()

        with patch.object(contractor_menu.crm, 'get_web_user_by_tg_id', return_value=None):
            await contractor_menu.send_contractor_menu(message)

        callbacks = crm_callbacks(message)
        self.assertIn('contractor_itinerary', callbacks)
        self.assertIn('show_requests_without_check', callbacks)

    async def test_menu_survives_crm_lookup_failure(self):
        message = FakeMessage()

        with patch.object(
            contractor_menu.crm,
            'get_web_user_by_tg_id',
            side_effect=RuntimeError('API недоступен'),
        ):
            await contractor_menu.send_contractor_menu(message)

        message.answer_photo.assert_awaited_once()
        self.assertIn('get_crm_access', crm_callbacks(message))


if __name__ == '__main__':
    unittest.main()
