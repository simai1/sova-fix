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


if __name__ == '__main__':
    unittest.main()
