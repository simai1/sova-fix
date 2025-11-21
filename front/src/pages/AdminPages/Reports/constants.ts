import { DefaultOptionType } from "antd/es/select";
import { IndicatorI, IndicatorsFormInstance, ParametrI, ReportType } from "./types";

export const PARAMETRS_LIST: ParametrI[] = [
    {
        label: "Подразделение",
        name: "unit",
    },
    {
        label: "Объект",
        name: "object",
    },
    {
        label: "Исполнитель",
        name: "contractor",
    },
    {
        label: "Подрядчик",
        name: "builder",
    },
    {
        label: "Статус",
        name: "status",
    },
    {
        label: "Срочность",
        name: "urgency",
    },
    {
        label: "Юридическое лицо",
        name: "legalEntity",
    },
];

export const INDICATOR_LIST: IndicatorI[] = [
    {
        label: "Общее число заявок",
        name: "totalCountRequests",
    },
    {
        label: "Скорость закрытия заявок",
        name: "closingSpeedOfRequests",
    },
    {
        label: "% заявок от общего числа",
        name: "percentOfTotalCountRequest",
    },
    {
        label: "Бюджет",
        name: "budget",
    },
    {
        label: "План по бюджету",
        name: "budgetPlan",
    },
    {
        label: "% от плана бюджет",
        name: "percentOfBudgetPlan",
    },
];

export const REPORT_TYPES: DefaultOptionType[] = [
    {
        value: "table",
        label: "Таблица",
    },
    {
        value: "chart",
        label: "График",
    },
    {
        value: "pie",
        label: "Круговая диаграмма",
    },
];

export const INDICATOR_LOCALE: Record<keyof IndicatorsFormInstance, string> = {
    closingSpeedOfRequests: "Скорость закрытия заявок",
    totalCountRequests: "Общее число заявок",
    percentOfBudgetPlan: "% от плана бюджет",
    budgetPlan: "План по бюджету",
    budget: "Бюджет",
    percentOfTotalCountRequest: "% заявок от общего числа",
};


export const REPORT_TYPE_TEXT: Record<ReportType, string> = {
    chart: 'графика',
    pie: 'круговой диаграммы',
    table: 'таблицы'
}