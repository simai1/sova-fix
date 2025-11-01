import { FC } from "react";
import { useAppSelector } from "../../../../../hooks/store";
import {
    additionalParametrsSelector,
    tableReportDataSelector,
} from "../../selectors";
import {
    flexRender,
    getCoreRowModel,
    useReactTable,
} from "@tanstack/react-table";
import { getReportTableColumns } from "./utils";
import styles from "./styles.module.scss";
import { type ReportTable as ReportTableI } from "../../types";

const ReportTable: FC = () => {
    const tableReportData = useAppSelector(tableReportDataSelector);
    const { isResult } = useAppSelector(additionalParametrsSelector);

    const table = useReactTable({
        data: tableReportData,
        columns: getReportTableColumns(tableReportData),
        getCoreRowModel: getCoreRowModel(),
    });
    return (
        <table className={styles.table}>
            <thead>
                {table.getHeaderGroups().map((headerGroup) => (
                    <tr key={headerGroup.id}>
                        {headerGroup.headers.map((header) => (
                            <th key={header.id}>
                                {header.isPlaceholder
                                    ? null
                                    : flexRender(
                                          header.column.columnDef.header,
                                          header.getContext()
                                      )}
                            </th>
                        ))}
                    </tr>
                ))}
            </thead>
            <tbody>
                {table.getRowModel().rows.map((row) => {
                    const firstKey = Object.keys(
                        row.original
                    )[0] as keyof ReportTableI;
                    const isTotalRow =
                        Object.values(row.original).some(
                            (v) => v === "Итого"
                        ) || row.original[firstKey] === "Итого";

                    return (
                        <tr
                            key={row.id}
                            className={`${isResult ? styles.trTable : ""} ${
                                isTotalRow ? styles.totalRow : ""
                            }`}
                        >
                            {row.getVisibleCells().map((cell) => (
                                <td
                                    key={cell.id}
                                    style={{
                                        textAlign:
                                            cell.column.columnDef.meta?.align ||
                                            "left",
                                    }}
                                >
                                    {flexRender(
                                        cell.column.columnDef.cell,
                                        cell.getContext()
                                    )}
                                </td>
                            ))}
                        </tr>
                    );
                })}
            </tbody>
        </table>
    );
};

export default ReportTable;
