import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

import CustomerCreateRequest from './CreateRequest';

import AddRequestModal from '@/components/AddRequestModal/AddRequestModal';

vi.mock('@/API/rtkQuery/lk.api', () => ({
  useCreateRequestMutation: () => [vi.fn(), { isLoading: false }],
  useGetMeQuery: () => ({
    data: {
      user: { id: 'customer-1', login: 'customer', name: 'Заказчик', role: 'CUSTOMER' },
      contractor: null,
      objectIds: ['1', '2', '3', '4'],
    },
    isLoading: false,
  }),
  useGetMyObjectsQuery: () => ({
    data: [
      { id: '3', name: 'Якорь' },
      { id: '2', name: 'Воронеж' },
      { id: '1', name: 'Арбат' },
      { id: '4', name: 'Боровое' },
    ],
    isLoading: false,
  }),
  useGetSettingByNameQuery: () => ({ data: { value: false } }),
  useGetUrgenciesQuery: () => ({ data: [], isLoading: false }),
}));

vi.mock('@/API/rtkQuery/requests.api', () => ({
  useGetAllUnitsQuery: () => ({ data: [{ id: 'unit-1', name: 'Подразделение' }] }),
  useLazyGetAllObjectsQuery: () => [
    vi.fn(),
    {
      data: [
        { id: '3', name: 'Якорь' },
        { id: '2', name: 'Воронеж' },
        { id: '1', name: 'Арбат' },
        { id: '4', name: 'Боровое' },
      ],
      isFetching: false,
    },
  ],
}));

beforeAll(() => {
  Object.defineProperty(Element.prototype, 'scrollIntoView', {
    configurable: true,
    value: () => undefined,
  });
});

afterEach(cleanup);

const expectedOrder = ['Арбат', 'Боровое', 'Воронеж', 'Якорь'];

describe('request object selection', () => {
  it('gives the Customer an ordered prefix-searchable object list', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <CustomerCreateRequest />
      </MemoryRouter>,
    );

    const input = screen.getByRole('combobox', { name: 'Объект' });
    await user.click(input);
    expect(screen.getAllByRole('option').map((option) => option.textContent)).toEqual(
      expectedOrder,
    );

    await user.type(input, 'ВОРО');
    expect(screen.getAllByRole('option').map((option) => option.textContent)).toEqual(['Воронеж']);
  });

  it('gives the Manager an ordered prefix-searchable object list', async () => {
    const user = userEvent.setup();
    render(<AddRequestModal handleClose={vi.fn()} />);

    const input = await screen.findByRole('combobox', { name: 'Объект' });
    await user.click(input);
    expect(screen.getAllByRole('option').map((option) => option.textContent)).toEqual(
      expectedOrder,
    );

    await user.type(input, 'БОРО');
    expect(screen.getAllByRole('option').map((option) => option.textContent)).toEqual(['Боровое']);
  });
});
