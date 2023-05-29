import {
	TableOptions,
	createSolidTable,
	flexRender,
	getCoreRowModel,
} from '@tanstack/solid-table';
import { For, JSX, Show, createEffect, createSignal, splitProps } from 'solid-js';
import {
	DataTypes,
	TypeData,
	type Sheet,
	Row,
	sheets,
	setSheets,
	setCurrentSheet,
} from './stores/data';

export function Sheet(props: { sheet: Sheet }) {


	const [rowCount, setRowCount] = createSignal(0);

	const [table, setTable] = createSignal(
		createSolidTable({
			get data() {
				return props.sheet.rows.map((s) => s.data);
			},
			columns: Object.create(props.sheet.columnDef),
			getCoreRowModel: getCoreRowModel(),
		})
	);

	const deleteRow = (id: number) => {
		if (props.sheet === undefined) return;
		let newRow = props.sheet.rows.filter((row) => row.id !== id);
		newRow.forEach((row, i) => {
			row.id = i;
		});
		props.sheet.rows = newRow;

		let new_sheet = sheets.filter((s) => s.uuid !== props.sheet?.uuid);
		// setSheets([...new_sheet, props.sheet]);
		setCurrentSheet(Object.assign({}, props.sheet));

		setRowCount(c => c - 1);
	};

	createEffect(() => {
		setTable(
			createSolidTable({
				get data() {
					return props.sheet.rows.map((s) => s.data);
				},
				columns: Object.create(props.sheet.columnDef),
				getCoreRowModel: getCoreRowModel(),
			})
		);
		// console.log(columns());
		console.log(table().getHeaderGroups());
	});

	return (
		<div class="min-h-full grid grid-rows-[1fr_auto]">
			<div class=" overflow-x-auto">
				<table class="table w-full table-zebra">
					{/* {JSON.stringify(props.sheet)} */}
					<thead>
						<For each={table().getHeaderGroups()}>
							{(headerGroup) => (
								<tr class="hover felx">
									<For each={headerGroup.headers}>
										{(header) => (
											<th colSpan={header.colSpan}>
												{header.isPlaceholder ? null : (
													<TableHeader>
														{flexRender(
															header.column
																.columnDef
																.header,
															header.getContext()
														)}
													</TableHeader>
												)}
											</th>
										)}
									</For>
									<Show
										when={
											props.sheet.rows.length > 0 === true
										}
									>
										<th class="w-0" />
									</Show>
								</tr>
							)}
						</For>
					</thead>
					<tbody>
						<For each={table().getRowModel().rows}>
							{(row, id) => (
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
											onclick={(_) => deleteRow(id())}
										>
											X
										</button>
									</td>
								</tr>
							)}
						</For>
					</tbody>
				</table>
			</div>
			<div class="m-1 inline-grid grid-cols-[1fr_auto_auto_auto_1fr] gap-3 pb-3">
				<br />
				<CreateRowBtn sheet={props.sheet} count={1}>
					Add Row
				</CreateRowBtn>
				<CreateRowBtn sheet={props.sheet} count={5}>
					Add 5 Rows
				</CreateRowBtn>
				<CreateRowBtn sheet={props.sheet} count={10}>
					Add 10 Rows
				</CreateRowBtn>
				<br />
			</div>
		</div>
	);
}

function TableHeader({
	children,
}: {
	children: string | JSX.Element | JSX.Element[];
}) {
	return (
		<label
			for="column-creation-popup"
			class="btn min-w-max w-full flex justify-between"
		>
			<p>{children}</p>
			<p class="px-1">⚙️</p>
		</label>
	);
}

function CreateRowBtn(props: {
	sheet: Sheet;
	count: number;
	children: JSX.Element | string;
}) {

	const addRow = () => {
		const ROW = props.sheet.columns.map((column) => {
			return [column.name, TypeData[column.type].defaultValue] as const;
		});

		console.log(ROW);

		if (ROW.length === 0) return;

		const data = Object.fromEntries(ROW);

		for (let index = 0; index < props.count; index++) {
			let newUuid = crypto.randomUUID();
			while (
				props.sheet.rows.find((v) => v.uuid === newUuid) !== undefined
			) {
				newUuid = crypto.randomUUID();
			}
			const row: Row = {
				id: props.sheet.rows.length,
				uuid: newUuid,
				data: data,
			};
			props.sheet.rows.push(row);
		}

		// let new_sheet = sheets.filter((s) => s.uuid !== props.sheet?.uuid);
		// setSheets([...new_sheet, props.sheet]);
		setCurrentSheet(Object.assign({}, props.sheet));
		// updateSheets(sheet);

	};

	return (
		<button class="btn" onClick={addRow}>
			{props.children}
		</button>
	);
}
