import { createColumnHelper } from '@tanstack/react-table';
import { saveAs } from 'file-saver';
import * as XLSX from 'xlsx';

import { ReportTable } from '../../types';

const columnsNames: Record<keyof ReportTable, string> = {
  builder: 'Подрядчик',
  contractor: 'Исполнитель',
  legalEntity: 'Юридическое лицо',
  object: 'Объект',
  status: 'Статус',
  unit: 'Подразделение',
  urgency: 'Срочность',
  totalCountRequests: 'Заявки',
  closingSpeedOfRequests: 'Скорость закрытия заявок',
  percentOfTotalCountRequest: '% заявок от общего числа',
  budgetPlan: 'План по бюджету',
  budget: 'Бюджет',
  percentOfBudgetPlan: '% от плана бюджет',
};

const columnsDynamicsNames: Record<keyof ReportTable, string> = {
  builder: 'подрячиков',
  contractor: 'исполнителей',
  legalEntity: 'юридических лиц',
  object: 'объекта',
  status: 'статуса',
  unit: 'подразделения',
  urgency: 'срочности',
  totalCountRequests: 'заявок',
  closingSpeedOfRequests: 'скорости закрытия заявок',
  percentOfTotalCountRequest: '% заявок от общего числа',
  budgetPlan: 'плана на бюджет',
  budget: 'бюджета',
  percentOfBudgetPlan: '% от плана бюджет',
};

const dynamicsLabels: Record<string, string> = {
  week: 'неделя',
  month: 'месяц',
  year: 'год',
};

// Список ключей, которые считаются числовыми (для выравнивания вправо)
const numericKeys: (keyof ReportTable)[] = [
  'totalCountRequests',
  'closingSpeedOfRequests',
  'percentOfTotalCountRequest',
  'budgetPlan',
  'budget',
  'percentOfBudgetPlan',
];

export const isRowEmpty = (row: ReportTable) => {
  // получаем только те ключи, которые реально есть в строке
  const presentNumericKeys = numericKeys.filter((key) => key in row);

  // если нет числовых ключей — строку считаем НЕ пустой
  if (presentNumericKeys.length === 0) return false;

  // проверяем все существующие числовые поля
  return presentNumericKeys.every((key) => {
    const value = row[key];
    return typeof value === 'number' && value === 0;
  });
};

export const getReportTableColumns = (data: ReportTable[]) => {
  const columnHelper = createColumnHelper<ReportTable>();

  const firstRow = data[0];
  if (!firstRow) return [];

  const formatNumber = (value: number, isPercent = false) => {
    if (isNaN(value)) return '0';
    const formatted = new Intl.NumberFormat('ru-RU', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 1,
    }).format(value);
    return isPercent ? `${formatted}%` : formatted;
  };

  const columns: any[] = [];

  for (const key of Object.keys(firstRow) as (keyof ReportTable)[]) {
    if (!(key in columnsNames)) continue;

    const isPercent = key === 'percentOfTotalCountRequest' || key === 'percentOfBudgetPlan';

    const isNumeric = numericKeys.includes(key);

    columns.push(
      columnHelper.accessor(key, {
        header: () => columnsNames[key],
        cell: (info) => {
          const value = info.getValue();

          if (value === '-') return '';
          if (value === null || value === undefined || value === '') return '0';

          const numericValue = Number(value);
          if (isNaN(numericValue)) return String(value);

          return formatNumber(numericValue, isPercent);
        },
        meta: {
          align: isNumeric ? 'right' : 'left',
        },
      }),
    );

    // Динамические поля
    for (const dynKey of Object.keys(dynamicsLabels)) {
      const dynField = dynKey
        ? `${key}${dynKey?.[0]?.toUpperCase() ?? ''}${dynKey?.slice(1) ?? ''}Dynamics`
        : `${key}Dynamics`;

      if (!(dynField in firstRow)) continue;

      columns.push(
        columnHelper.accessor(dynField as keyof ReportTable, {
          header: () => `Динамика ${columnsDynamicsNames[key]} (${dynamicsLabels[dynKey]})`,
          cell: (info) => {
            const value = info.getValue();
            if (value === null || value === undefined) return '';
            const num = Number(value);
            if (isNaN(num)) return '';
            const formatted = formatNumber(num, true);
            return formatted;
          },
          meta: {
            align: 'right',
          },
        }),
      );
    }
  }

  return columns;
};

export const exportToExcel = (data: ReportTable[], fileName?: string) => {
  if (!data.length) return;

  const firstRow = data[0];
  if (!firstRow) return;

  // --- Собираем все ключи: основные + динамичные
  const allKeys: { key: string; label: string }[] = [];

  for (const key of Object.keys(columnsNames) as (keyof ReportTable)[]) {
    if (!(key in firstRow)) continue;
    allKeys.push({ key, label: columnsNames[key] });

    for (const dynKey of Object.keys(dynamicsLabels)) {
      const dynField = `${key}${(dynKey[0] ?? '').toUpperCase()}${dynKey.slice(1)}Dynamics`;
      if (dynField in firstRow) {
        allKeys.push({
          key: dynField,
          label: `Динамика ${columnsDynamicsNames[key]} (${dynamicsLabels[dynKey]})`,
        });
      }
    }
  }

  // --- Формируем данные для XLSX
  const formatted = data.map((row) =>
    allKeys.reduce(
      (acc, { key, label }) => {
        const value = row[key as keyof ReportTable];
        acc[label] = value ?? '';
        return acc;
      },
      {} as Record<string, any>,
    ),
  );

  const headers = allKeys.map(({ label }) => label);

  // --- Создание листа
  const ws = XLSX.utils.json_to_sheet(formatted, { header: headers });

  // --- Автоматическая ширина колонок
  const colWidths = headers.map((header) => {
    // минимальная ширина — длина заголовка
    let maxLength = header.length;

    for (const row of formatted) {
      const cellValue = row[header];
      if (cellValue != null) {
        const len = String(cellValue).length;
        if (len > maxLength) maxLength = len;
      }
    }

    // небольшое увеличение для читаемости
    return { wch: Math.min(Math.max(maxLength + 2, 10), 50) };
  });

  ws['!cols'] = colWidths;

  // --- Книга и сохранение
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Отчёт');

  const now = new Date();
  const dateStr = now.toLocaleDateString('ru-RU').replace(/\./g, '-');
  const safeFileName = fileName ?? `Отчёт_${dateStr}.xlsx`;

  const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([excelBuffer], { type: 'application/octet-stream' });
  saveAs(blob, safeFileName);
};
