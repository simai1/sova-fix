import { ReactNode } from "react";
import { ReportType } from "../types";
import ReportTable from "./ReportTable/ReportTable";
import ChartContainer from "./Chart/Chart.container";
import PieContainer from "./Pie/Pie.container";

export const reportWorkZoneType: Record<ReportType, ReactNode> = {
    table: <ReportTable />,
    chart: <ChartContainer />,
    pie: <PieContainer />
};
