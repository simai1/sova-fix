import { createApi } from "@reduxjs/toolkit/query/react";
import fetchMainBaseQuery from "../../store/rtkquery";
import { GetDirectoryCategoryResponse } from "./types";


export const directoryCategoryApi = createApi({
    reducerPath: 'directoryCategoryApi',
    baseQuery: fetchMainBaseQuery('/directoryCategory'),
    endpoints: (builder) => ({
        getAllDirectoryCategory: builder.query<GetDirectoryCategoryResponse[], void>({
            query: () => ({
                url: '/',
                method: "GET"
            })
        })
    })
})

export const {
    useGetAllDirectoryCategoryQuery,
} = directoryCategoryApi