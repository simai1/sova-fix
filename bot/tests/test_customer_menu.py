import unittest
from unittest.mock import AsyncMock, patch

from command.customer import customer_menu


class FakeFromUser:
    id = 123


class FakeMessage:
    from_user = FakeFromUser()

    def __init__(self):
        self.answer_photo = AsyncMock()


class CustomerMenuTest(unittest.IsolatedAsyncioTestCase):
    async def test_menu_renders_after_crm_lookup(self):
        message = FakeMessage()

        with patch.object(customer_menu.crm, 'get_web_user_by_tg_id', return_value=None):
            await customer_menu.send_customer_menu(message)

        message.answer_photo.assert_awaited_once()


if __name__ == '__main__':
    unittest.main()
