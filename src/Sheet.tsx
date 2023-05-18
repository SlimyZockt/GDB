import {
    createSolidTable,
    flexRender,
    getCoreRowModel,
} from '@tanstack/solid-table'
import { createSignal, For } from 'solid-js'
import { sheets, type Sheet } from './stores/data'

export function Sheet(props: { sheet: Sheet }) {
    const table = createSolidTable({
        get data() {
            return props.sheet.rows.map((s) => s.data)
        },
        columns: Object.create(props.sheet.columnDef),
        getCoreRowModel: getCoreRowModel(),
    })

    return (
        <table class="overflow-x-auto">
            <thead>
                <For each={table.getHeaderGroups()}>
                    {(headerGroup) => (
                        <tr class="hover felx">
                            <For each={headerGroup.headers}>
                                {(header) => (
                                    <th class="w-0">
                                        {header.isPlaceholder
                                            ? null
                                            : flexRender(
                                                  header.column.columnDef
                                                      .header,
                                                  header.getContext()
                                              )}
                                    </th>
                                )}
                            </For>
                        </tr>
                    )}
                </For>
            </thead>
            <tbody>
                <For each={table.getRowModel().rows}>
                    {(row) => (
                        <tr>
                            <For each={row.getVisibleCells()}>
                                {(cell) => (
                                    <td>
                                        {flexRender(
                                            cell.column.columnDef.cell,
                                            cell.getContext()
                                        )}
                                    </td>
                                )}
                            </For>
                            <td>
                                <button
                                    class="btn btn-error max-w-max"
                                    onclick={(_) => 'deleteRow(i)'}
                                >
                                    {' '}
                                    X{' '}
                                </button>
                            </td>
                        </tr>
                    )}
                </For>
            </tbody>
        </table>
    )
}
