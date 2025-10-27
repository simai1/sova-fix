import "@tanstack/react-table";

declare module "@tanstack/react-table" {
  interface ColumnMeta<TData extends object, TValue> {
    align?: "left" | "center" | "right";
    className?: string;
  }
}
