import { FormInstance } from "antd";
import { Dayjs } from "dayjs";

export interface ReportsComponentProps {
    parametrsForm: FormInstance<ParametrsFormInstance>;
    indicatorsForm: FormInstance<IndicatorsFormInstance>;
    isEmptyReport: boolean;
    isLoadingTableData: boolean;
    isDisabledIndicators: (name: string) => boolean;
    handleReloadTableData: () => void;
    handleResetFilters: () => void;
}

export interface ParametrI {
    name: string;
    label: string;
}

export type IndicatorI = ParametrI;

export interface ParametrsFormInstance {
    unit: boolean;
    object: boolean;
    contractor: boolean;
    builder: boolean;
    status: boolean;
    urgency: boolean;
    legalEntity: boolean;
}

export interface IndicatorsFormInstance {
    totalCountRequests: boolean;
    closingSpeedOfRequests: boolean;
    percentOfTotalCountRequest: boolean;
    budget: boolean;
    budgetPlan: boolean;
    percentOfBudgetPlan: boolean;
}

export interface ReportParametrs {
    unit: boolean;
    object: boolean;
    contractor: boolean;
    builder: boolean;
    status: boolean;
    urgency: boolean;
    legalEntity: boolean;
}

export interface ReportInidicators {
    totalCountRequests: boolean;
    closingSpeedOfRequests: boolean;
    percentOfTotalCountRequest: boolean;
    budget: boolean;
    budgetPlan: boolean;
    percentOfBudgetPlan: boolean;
}

export interface GetTableReportDataPayload {
    parametrs: ReportParametrs;
    indicators: ReportInidicators;
    additionalParametrs: AdditionalParametrsI;
}

export interface ReportTable {
    builder?: string;
    contractor?: string;
    legalEntity?: string;
    object?: string;
    status?: string;
    unit?: string;
    urgency?: string;
    totalCountRequests?: number | IndicatorWithDynamicsI;
    percentOfTotalCountRequest?: number | IndicatorWithDynamicsI;
    budget?: number | IndicatorWithDynamicsI;
    budgetPlan?: number | IndicatorWithDynamicsI;
    percentOfBudgetPlan?: number | IndicatorWithDynamicsI;
    closingSpeedOfRequests?: number | IndicatorWithDynamicsI;
}

export interface IndicatorWithDynamicsI {
    value: number;
    dynamics: number;
}

export type GetTableReportDataResponse = ReportTable[];

export interface AdditionalParametrsI {
    isResult: boolean;
    dynamicsTypes?: ("week" | "month" | "year")[];
    reportType: number;
    dateStart?: string | null;
    dateEnd?: string | null;
}

export interface ReportInitialState {
    tableReportData: ReportTable[];
    isReloadButtonLoading: boolean;
    additionalParametrs: AdditionalParametrsI;
}

export interface AdditionalParametrsForm
    extends Pick<
        AdditionalParametrsI,
        "dynamicsTypes" | "isResult" | "reportType"
    > {
    periodPicker: Dayjs[] | null;
    periodDropdown: string | null;
}
