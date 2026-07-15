import assert from 'node:assert/strict';
import test from 'node:test';

import {
  shouldRedirectStatusToAuthorization,
  shouldRedirectToAuthorization,
} from '../src/utils/authRedirectPolicy.js';

test('redirects an unauthorized response outside auth pages', () => {
  assert.equal(shouldRedirectToAuthorization({ response: { status: 401 } }, '/'), true);
});

test('does not redirect a forbidden response', () => {
  assert.equal(shouldRedirectToAuthorization({ response: { status: 403 } }, '/'), false);
});

test('does not redirect while already on an auth page', () => {
  assert.equal(
    shouldRedirectToAuthorization({ response: { status: 401 } }, '/Authorization'),
    false,
  );
});

test('does not redirect errors without an HTTP response', () => {
  assert.equal(shouldRedirectToAuthorization(new Error('network unavailable'), '/'), false);
});

test('redirects only an unauthorized RTK Query status', () => {
  assert.equal(shouldRedirectStatusToAuthorization(401, '/customer'), true);
  assert.equal(shouldRedirectStatusToAuthorization(403, '/customer'), false);
  assert.equal(shouldRedirectStatusToAuthorization(500, '/customer'), false);
});

test('does not duplicate the redirect already handled by the Axios interceptor', () => {
  assert.equal(
    shouldRedirectToAuthorization(
      { response: { status: 401 }, config: { _retry: true } },
      '/customer',
    ),
    false,
  );
});
