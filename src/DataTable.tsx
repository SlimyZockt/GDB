import { For, JSX, Show, createEffect } from 'solid-js';
import { Dynamic } from 'solid-js/web';
import { Column, Row, Sheet, TypeData } from './stores/data';

export function Table(props: {
	sheet: Sheet;
	onSheetChanged: (sheet: Sheet) => void;
}) {
	// const [columns, setColumns] = createStore(Array.from(sheet.columns));

	createEffect(() => {
		extendDataOnColumnChange(props.sheet);
		props.onSheetChanged(props.sheet);
	});

	const extendDataOnColumnChange = (sheet: Sheet) => {
		sheet.rows.map((r) => {
			let col_keys = sheet.columns.map((c) => c.uuid);

			for (let key of col_keys) {
				if (key in r.data === false) {
					r.data[key] = undefined;
				}
			}

			return {
				...r,
			};
		});
	};

	const getColumnType = (columns: Column[], columns_key: string) => {
		let col = columns.find((c) => c.uuid == columns_key);
		if (col === undefined) return 'Int';
		return col.type;
	};

	const deleteRow = (id: number) => {
		let newRow = props.sheet.rows
			.filter((row) => row.id !== id)
			.map((row, i) => ({ ...row, id: i }));
		// props.sheet.rows = newRow;
		// let new_sheet = sheets.filter((s) => s.uuid !== props.sheet?.uuid);
		// setSheets([...new_sheet, props.sheet]);
		props.sheet.rows = newRow;
	};

	return (
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
														props.sheet.columns,
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

		props.sheet.rows = [...props.sheet.rows, ...new_rows];
	};

	return (
		<button class="btn" onClick={addRow}>
			{props.children}
		</button>
	);
}
