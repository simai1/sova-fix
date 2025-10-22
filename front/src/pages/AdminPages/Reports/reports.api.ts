import { createApi } from "@reduxjs/toolkit/query/react";
import fetchMainBaseQuery from "../../../store/rtkquery";
import { GetTableReportDataPayload, GetTableReportDataResponse } from "./types";

export const reportsApi = createApi({
    reducerPath: "reportsApi",
    baseQuery: fetchMainBaseQuery("/reports"),
    endpoints: (builder) => ({
        getTableReportData: builder.query<GetTableReportDataResponse, GetTableReportDataPayload>({
            query: (body) => ({
                url: "/",
                method: "POST",
                body,
            }),
        }),
    }),
});

export const { useLazyGetTableReportDataQuery } = reportsApi;
