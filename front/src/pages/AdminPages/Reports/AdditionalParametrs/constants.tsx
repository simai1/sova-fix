import { DefaultOptionType } from 'antd/es/select';

export const periodOptions: DefaultOptionType[] = [
  { value: 'today', label: 'Сегодня' },
  { value: 'currentWeek', label: 'Текущая неделя' },
  { value: 'currentMonth', label: 'Текущий месяц' },
  { value: 'currentYear', label: 'Текущий год' },
  { value: 'yesterday', label: 'Вчера' },
  { value: 'lastWeek', label: 'Прошлая неделя' },
  { value: 'lastMonth', label: 'Прошлый месяц' },
  { value: 'lastYear', label: 'Прошлый год' },
  { value: 'allTime', label: 'Все время' },
];

export const dynamicsTypeOptions = [
  {
    title: 'Неделя',
    value: 'week',
    key: 'week',
  },
  {
    title: 'Месяц',
    value: 'month',
    key: 'month',
  },
  {
    title: 'Год',
    value: 'year',
    key: 'year',
  },
];
