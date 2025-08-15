import { createApi } from "@reduxjs/toolkit/query/react";
import fetchMainBaseQuery from "../../store/rtkquery";
import {
    CreateDirectoryCategoryPayload,
    DeleteDirectoryCategoryPayload,
    GetAllBuildersResponse,
    GetAllCutomersResponse,
    GetDirectoryCategoryResponse,
    UpdateDirectoryCategoryPayload,
} from "./types";

export const directoryCategoryApi = createApi({
    reducerPath: "directoryCategoryApi",
    baseQuery: fetchMainBaseQuery("/directoryCategory"),
    endpoints: (builder) => ({
        getAllDirectoryCategory: builder.query<
            GetDirectoryCategoryResponse[],
            void
        >({
            query: () => ({
                url: "/",
                method: "GET",
            }),
        }),
        createDirectoryCategory: builder.mutation<
            GetDirectoryCategoryResponse,
            CreateDirectoryCategoryPayload
        >({
            query: (body) => ({
                url: "/",
                method: "POST",
                body,
            }),
        }),
        updateDirectoryCategory: builder.mutation<
            GetDirectoryCategoryResponse,
            UpdateDirectoryCategoryPayload
        >({
            query: ({ body, params }) => ({
                url: "/",
                method: "PATCH",
                params,
                body,
            }),
        }),
        deleteDirectoryCategory: builder.mutation<
            void,
            DeleteDirectoryCategoryPayload
        >({
            query: (params) => ({
                url: "/",
                method: "DELETE",
                params,
            }),
        }),
        getAllBuilders: builder.query<GetAllBuildersResponse, void>({
            query: () => ({
                url: "/all_builders",
                method: "GET",
            }),
        }),
        getAllCustomers: builder.query<GetAllCutomersResponse, void>({
            query: () => ({
                url: "/all_customers",
                method: "GET",
            }),
        }),
    }),
});

export const {
    useGetAllDirectoryCategoryQuery,
    useCreateDirectoryCategoryMutation,
    useUpdateDirectoryCategoryMutation,
    useDeleteDirectoryCategoryMutation,
    useGetAllBuildersQuery,
    useGetAllCustomersQuery,
} = directoryCategoryApi;
