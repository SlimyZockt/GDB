import {
	For,
	Index,
	JSX,
	Show,
	createEffect,
	createSignal,
	splitProps,
	untrack,
} from 'solid-js';

import {
	DataTypes,
	TypeData,
	type Sheet,
	Row,
	sheets,
	setSheets,
	SheetTypes,
	Column,
} from './stores/data';

import { Dynamic } from 'solid-js/web';

export function Table(props: {
	sheet: Sheet;
	onSheetChanged: (sheet: Sheet) => void;
}) {
	const [data, setData] = createSignal(props.sheet);

	createEffect(() => {
		extendDataOnColumnChange(data().columns);
		props.onSheetChanged(data());
	});

	const extendDataOnColumnChange = (columns: Column[]) => {
		setData(data => {
			data.rows.map((r) => {
				let col_keys = columns.map((c) => c.uuid);

				for (let key of col_keys) {
					if (key in r.data === false) {
						r.data[key] = undefined;
					}
				}

				return {
					...r,
				};
			});
			return data;
		}
		);
	};

	const getColumnType = (columns: Column[], columns_key: string) => {
		let col = columns.find((c) => c.uuid == columns_key);
		if (col === undefined) return 'Int';
		return col.type;
	};

	const deleteRow = (id: number) => {
		let newRow = data()
			.rows.filter((row) => row.id !== id)
			.map((row, i) => ({ ...row, id: i }));
		// data().rows = newRow;
		// let new_sheet = sheets.filter((s) => s.uuid !== data()?.uuid);
		// setSheets([...new_sheet, data()]);
		data().rows = newRow;
	};

	const updateRows = (newRows: Row[]) =>
		setData((sheet) => ({ ...sheet, rows: newRows }));

	return (
		<div class="min-h-full grid grid-rows-[1fr_auto]">
			<div class=" overflow-x-auto">
				<table class="table w-full table-zebra">
					<thead>
						<tr class="hover felx">
							<th class="w-0">
								<label> id </label>
							</th>
							<For each={data().columns}>
								{(c) => (
									<th>
										<TableHeader>{c.name}</TableHeader>
									</th>
								)}
							</For>
							<Show when={data().rows.length > 0 === true}>
								<th class="w-0" />
							</Show>
						</tr>
					</thead>
					<tbody>
						<For each={data().rows}>
							{(row, id) => (
								<tr>
									<td>
										<p>{id()}</p>
									</td>
									<For each={Object.keys(row.data)}>
										{(key) => (
											<td>
												<Dynamic
													component={
														TypeData[
															getColumnType(
																data().columns,
																key
															)
														].getInputField
													}
													settings={
														data().columns.find(
															(c) => c.uuid == key
														)?.settingData
													}
													row={row}
													colUUID={key}
												/>
											</td>
										)}
									</For>
									<td>
										<button
											class="btn btn-error max-w-max"
											onclick={() => deleteRow(id())}
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
				<CreateRowBtn
					sheet={data()}
					count={1}
					onRowCreated={updateRows}
				>
					Add Row
				</CreateRowBtn>
				<CreateRowBtn
					sheet={data()}
					count={5}
					onRowCreated={updateRows}
				>
					Add 5 Rows
				</CreateRowBtn>
				<CreateRowBtn
					sheet={data()}
					count={10}
					onRowCreated={updateRows}
				>
					Add 10 Rows
				</CreateRowBtn>
				<br />
			</div>
			<div>{JSON.stringify(data().rows)}</div>
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
	onRowCreated: (newRows: Row[]) => void;
	count: number;
	children: JSX.Element | string;
}) {
	const addRow = () => {
		const NEW_ROW = props.sheet.columns.map((column) => {
			return [column.uuid, undefined] as const;
		});

		let new_rows: Row[] = [];

		if (NEW_ROW.length === 0) return;

		const data = Object.fromEntries(NEW_ROW);

		for (let index = 0; index < props.count; index++) {
			let newUuid = crypto.randomUUID();
			while (
				props.sheet.rows.find((v) => v.uuid === newUuid) !== undefined
			) {
				newUuid = crypto.randomUUID();
			}
			const row: Row = {
				id: props.sheet.rows.length + new_rows.length,
				uuid: newUuid,
				data: { ...data },
			};
			new_rows.push({ ...row });
		}

		props.onRowCreated([...props.sheet.rows, ...new_rows]);
	};

	return (
		<button class="btn" onClick={addRow}>
			{props.children}
		</button>
	);
}
