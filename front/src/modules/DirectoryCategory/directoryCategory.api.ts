import { createApi } from "@reduxjs/toolkit/query/react";
import fetchMainBaseQuery from "../../store/rtkquery";


export const directoryCategoryApi = createApi({
    reducerPath: 'directoryCategoryApi',
    baseQuery: fetchMainBaseQuery('/'),
    endpoints: (builder) => ({
        
    })
})