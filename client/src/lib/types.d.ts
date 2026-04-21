import type { DataTableColumnMeta } from '@/models/data-table'
import '@tanstack/react-table'
import type { RowData } from '@tanstack/react-table'
import 'axios'

declare module 'axios' {
    interface AxiosRequestConfig {
        _retry?: boolean
    }
}

declare module '@tanstack/react-table' {
    // eslint-disable-next-line @typescript-eslint/no-empty-object-type
    interface ColumnMeta<
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        TData extends RowData,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        TValue,
    > extends DataTableColumnMeta {}
}
