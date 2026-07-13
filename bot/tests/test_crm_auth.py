import os
import unittest
from unittest.mock import Mock, patch

os.environ['MASTER_API_KEY'] = 'unit-test-master-key'
os.environ.setdefault('API_URL', 'http://127.0.0.1:3000')

from util import crm


class CrmAuthTest(unittest.TestCase):
    def test_shared_session_sends_master_key(self):
        self.assertEqual(crm.http.headers.get('master-api-key'), 'unit-test-master-key')

    def test_web_user_lookup_uses_shared_session(self):
        response = Mock(status_code=200)
        response.json.return_value = {'login': 'customer@test.local'}

        with patch.object(crm.http, 'get', return_value=response) as get:
            result = crm.get_web_user_by_tg_id(123)

        self.assertEqual(result, {'login': 'customer@test.local'})
        get.assert_called_once_with('http://127.0.0.1:3000/users/123')


if __name__ == '__main__':
    unittest.main()
