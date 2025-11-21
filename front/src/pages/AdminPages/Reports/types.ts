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
    handleSetFilterDataValues: (fieldName: keyof ReportTable, values: any) => void
    onValuesParametersChange: (changedValues: ParametrsFormInstance) => void
    onValuesIndicatorsChange: (changedValues: IndicatorsFormInstance) => void
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
    filterData: Record<string, any> | null
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

export type GetTableReportDataResponse = {
    resultRows: ReportTable[]
    filterData: any
};

export interface AdditionalParametrsI {
    isResult: boolean;
    dynamicsTypes?: ("week" | "month" | "year")[];
    reportType: ReportType;
    dateStart?: string | null;
    dateEnd?: string | null;
}

export type ReportType = "table" | "chart" | "pie" | "barChart"

export interface ReportInitialState {
    tableReportData: ReportTable[];
    isReloadButtonLoading: boolean;
    additionalParametrs: AdditionalParametrsI;
    filterDataValues: Record<keyof ReportTable, string[]> | null
    filterData: FilterDataI | null
    parameters: ParametrsFormInstance
    indicators: IndicatorsFormInstance

}

export interface AdditionalParametrsForm
    extends Pick<
        AdditionalParametrsI,
        "dynamicsTypes" | "isResult" | "reportType"
    > {
    periodPicker: Dayjs[] | null;
    periodDropdown: string | null;
}

export interface UnitI {
    unit: string;
    unitId: string;
}

export interface ObjectI {
    object: string;
    objectId: string;
}

export interface ContractorI {
    contractor: string;
    contractorId?: string | null;
    extContractorId?: string | null;
    managerId?: string | null;
    isExternal?: boolean;
}

export interface BuilderI {
    builder: string;
    builderId?: string | undefined;
}

export interface StatusI {
    status: string;
    statusId: string;
}

export interface UrgencyI {
    urgency: string;
    urgencyId: string;
}

export interface LegalEntityI {
    legalEntity: string;
    legalEntityId: string;
}

export interface FilterDataI {
    unit?: UnitI[];
    object?: ObjectI[];
    contractor?: ContractorI[];
    builder?: BuilderI[];
    status?: StatusI[];
    urgency?: UrgencyI[];
    legalEntity?: LegalEntityI[];
}

export type SetParameterPayload = {
    type: keyof ParametrsFormInstance;
    value: boolean
}

export type SetIndicatorPayload = {
    type: keyof IndicatorsFormInstance;
    value: boolean
}

export interface UseGraphicDataProps<T> {
    tableData: T[];
    selectedParameter: keyof T | null;
    selectedIndicator: keyof T | null;
}