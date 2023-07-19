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
	setCurrentSheet,
	SheetTypes,
	currentSheet,
	Column,
} from './stores/data';

import { Key } from '@solid-primitives/keyed';
import { createStore } from 'solid-js/store';
import { Dynamic } from 'solid-js/web';

export function Sheet(props: { sheet: Sheet }) {
	// const [columns, setColumns] = createStore(Array.from(sheet.columns));

	createEffect(() => {
		extendDataOnColumnChange(props.sheet.columns);
	});

	createEffect(() => {
		console.log(props.sheet.rows);
	});

	const extendDataOnColumnChange = (columns: Column[]) => {
		setCurrentSheet('rows', (rows) =>
			rows.map((r) => {
				let col_keys = columns.map((c) => c.uuid);

				for (let key of col_keys) {
					if (key in r.data === false) {
						r.data[key] = undefined;
					}
				}

				return {
					...r,
				};
			})
		);
	};

	const getColumnType = (columns: Column[], columns_key: string) => {
		let col = columns.find((c) => c.uuid == columns_key);
		if (col === undefined) return 'Int';
		return col.type;
	};

	const deleteRow = (id: number) => {
		let sheet = currentSheet;
		if (sheet === undefined) return;
		let newRow = sheet.rows
			.filter((row) => row.id !== id)
			.map((row, i) => ({ ...row, id: i }));
		// props.sheet.rows = newRow;
		// let new_sheet = sheets.filter((s) => s.uuid !== props.sheet?.uuid);
		// setSheets([...new_sheet, props.sheet]);
		setCurrentSheet((s) => ({ ...s, rows: newRow }));
	};

	return (
		<div class="min-h-full grid grid-rows-[1fr_auto]">
			<div class=" overflow-x-auto">
				<table class="table w-full table-zebra">
					<thead>
						<tr class="hover felx">
							<th class="w-0">
								<label> id </label>
							</th>
							<For each={props.sheet.columns}>
								{(c) => (
									<th>
										<TableHeader>{c.name}</TableHeader>
									</th>
								)}
							</For>
							<Show when={props.sheet.rows.length > 0 === true}>
								<th class="w-0" />
							</Show>
						</tr>
					</thead>
					<tbody>
						<For each={props.sheet.rows}>
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
																props.sheet
																	.columns,
																key
															)
														].getInputField
													}
													settings={
														props.sheet.columns.find(
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
			<div>{JSON.stringify(props.sheet.rows)}</div>
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
		const NEW_ROW = currentSheet.columns.map((column) => {
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

		setCurrentSheet('rows', (r) => [...r, ...new_rows]);
	};

	return (
		<button class="btn" onClick={addRow}>
			{props.children}
		</button>
	);
}
