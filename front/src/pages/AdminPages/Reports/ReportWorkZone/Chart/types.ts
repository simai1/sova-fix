export type ChartComponentProps = {
    chartReportData: ChartItem[];
    isEmptyChart: boolean;
};

export type ChartItem = {
    name: string;
    value: number;
};
