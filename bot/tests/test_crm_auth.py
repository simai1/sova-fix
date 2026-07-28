import importlib
import os
import unittest
from unittest.mock import Mock, patch


class CrmAuthTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.env = patch.dict(
            os.environ,
            {
                'MASTER_API_KEY': 'unit-test-master-key',
                'API_URL': 'http://127.0.0.1:3000',
            },
        )
        cls.env.start()

        import config
        from util import crm

        crm.http.close()
        cls.config = importlib.reload(config)
        cls.crm = importlib.reload(crm)

    @classmethod
    def tearDownClass(cls):
        cls.crm.http.close()
        cls.env.stop()
        cls.config = importlib.reload(cls.config)
        cls.crm = importlib.reload(cls.crm)

    def test_shared_session_sends_master_key(self):
        self.assertEqual(self.crm.http.headers.get('master-api-key'), 'unit-test-master-key')

    def test_web_user_lookup_uses_shared_session(self):
        response = Mock(status_code=200)
        response.json.return_value = {'login': 'customer@test.local'}

        with patch.object(self.crm.http, 'get', return_value=response) as get:
            result = self.crm.get_web_user_by_tg_id(123)

        self.assertEqual(result, {'login': 'customer@test.local'})
        get.assert_called_once_with('http://127.0.0.1:3000/users/123')


class CrmAccessRequestTest(unittest.IsolatedAsyncioTestCase):
    """register_crm_access отдаёт http-статус, чтобы бот показал внятную причину отказа."""

    @classmethod
    def setUpClass(cls):
        cls.env = patch.dict(os.environ, {'API_URL': 'http://127.0.0.1:3000'})
        cls.env.start()

        import config
        from util import crm

        crm.http.close()
        cls.config = importlib.reload(config)
        cls.crm = importlib.reload(crm)

    @classmethod
    def tearDownClass(cls):
        cls.crm.http.close()
        cls.env.stop()
        cls.config = importlib.reload(cls.config)
        cls.crm = importlib.reload(cls.crm)

    async def test_returns_success_with_status(self):
        with patch.object(self.crm.http, 'post', return_value=Mock(status_code=200)) as post:
            result = await self.crm.register_crm_access('user@test.local', 123)

        self.assertEqual(result, (True, 200))
        post.assert_called_once_with(
            'http://127.0.0.1:3000/auth/registerCustomerCrm',
            json={'login': 'user@test.local', 'user_id': 123},
        )

    async def test_returns_status_on_failure(self):
        with patch.object(self.crm.http, 'post', return_value=Mock(status_code=409)):
            result = await self.crm.register_crm_access('user@test.local', 123)

        self.assertEqual(result, (False, 409))

    async def test_returns_none_status_on_network_error(self):
        with patch.object(self.crm.http, 'post', side_effect=RuntimeError('нет сети')):
            result = await self.crm.register_crm_access('user@test.local', 123)

        self.assertEqual(result, (False, None))


if __name__ == '__main__':
    unittest.main()
