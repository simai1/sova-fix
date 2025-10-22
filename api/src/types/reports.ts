export interface ReportInidicators {
    totalCountRequests?: boolean;
    closingSpeedOfRequests?: boolean;
    percentOfTotalCountRequest?: boolean;
    budget?: boolean;
    budgetPlan?: boolean;
    percentOfBudgetPlan?: boolean;
}

export interface AdditionalParametrsI {
    isResult: boolean;
    dynamicsTypes?: ('week' | 'month' | 'year')[];
    reportType: number;
    dateStart?: string | null
    dateEnd?: string | null
}

export interface RelatedDataI {
    legalEntity?: string;
    unit?: string;
    object?: string;
    legalEntityId?: string;
    unitId?: string;
    objectId?: string;
    status?: string;
    statusId?: string;
    urgency?: string;
    urgencyId?: string;
    builder?: string;
}

export interface UnifiedContractor {
contractorId: string;
    contractor: string;
    type: 'internal' | 'external' | 'manager';
}

export interface UnifiedBuilder {
    builderId: string;
    builder: string;
    type: 'internal' | 'external' | 'manager';
}