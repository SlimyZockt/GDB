import { Component, For, JSX, Show, createEffect, untrack } from 'solid-js';

import {
	DataTypes,
	TypeData,
	type Sheet,
	Row,
	SheetTypes,
	Column,
} from './stores/data';

import { ColumnCreator } from './ColumnCreator';
import { Dynamic } from 'solid-js/web';
import { ColumnConfigurator } from './ColumnConfigurator';

export function extendDataOnColumnChange(
	sheet: Sheet,
	columns: Column[]
): Row[] {
	return sheet.rows.map((r) => {
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
}

export function Table(props: {
	sheet: Sheet;
	onSheetChanged: (sheet: Sheet) => void;
}) {
	const getColumnType = (columns: Column[], columns_key: string) => {
		let col = columns.find((c) => c.uuid == columns_key);
		if (col === undefined) return 'Int';
		return col.type;
	};

	const deleteRow = (id: number) => {
		let newRows = props.sheet.rows
			.filter((row) => row.id !== id)
			.map((row, i) => ({ ...row, id: i }));

		props.onSheetChanged({ ...props.sheet, rows: newRows });
	};

	const updateRows = (newRows: Row[]) => {
		props.onSheetChanged({ ...props.sheet, rows: newRows });
	};

	const updateSettings = (
		key: string,
		settings: SheetTypes[keyof SheetTypes]['_settingType']
	) =>
		props.onSheetChanged({
			...props.sheet,
			columns: props.sheet.columns.map((col) => {
				if (col.uuid === key) {
					col.settingData = settings;
				}
				return col;
			}),
		});

	return (
		<div class="min-h-full grid grid-rows-[1fr_auto]">
			<div class=" overflow-x-auto">
				<table class="table table-zebra">
					<thead>
						<tr>
							<th colSpan={1} class="whitespace-nowrap w-[0.1%]">
								ID
							</th>
							<For each={props.sheet.columns}>
								{(c, id) => (
									<th colSpan={1}>
										<ColumnConfigurator
											btnClass="btn min-w-max w-full flex justify-between"
											column={c}
											onSettingChanged={(newSettings) => {
												let col = props.sheet.columns;
												col[id()].settingData =
													newSettings;

												props.onSheetChanged({
													...props.sheet,
													columns: col,
												});
											}}
										>
											<div class="flex min-w-full">
												<p class="flex-1 text-left">
													{c.name}
												</p>
												<p class="float-right">⚙️</p>
											</div>
										</ColumnConfigurator>
									</th>
								)}
							</For>
							<Show when={props.sheet.rows.length > 0 === true}>
								<th
									colSpan={1}
									class="whitespace-nowrap w-[0.1%]"
								></th>
							</Show>
						</tr>
					</thead>
					<tbody>
						<For each={props.sheet.rows}>
							{(row, id) => (
								<tr>
									<th>
										<p>{id()}</p>
									</th>
									<For each={Object.keys(row.data)}>
										{(key) => (
											<td>
												<Cell
													index={id()}
													typeData={
														TypeData[
															getColumnType(
																props.sheet
																	.columns,
																key
															)
														]
													}
													data={props.sheet}
													key={key}
													settings={
														props.sheet.columns.find(
															(c) => c.uuid == key
														)?.settingData as any
													}
													onValueChanged={(
														newValue
													) => {
														let newRows =
															props.sheet.rows;
														newRows[id()].data[
															key
														] = newValue;
														props.onSheetChanged({
															...props.sheet,
															rows: newRows,
														});
													}}
													onSettingsChanged={(
														settings
													) => {
														updateSettings(
															key,
															settings
														);
													}}
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
			<div class="m-1 inline-grid grid-cols-[1fr_auto_auto_auto_auto_1fr] gap-3">
				<br />
				<ColumnCreator
					columns={props.sheet.columns}
					onColumnChanged={(c) => {
						console.log(c);

						props.onSheetChanged({
							...props.sheet,
							columns: c,
							rows: extendDataOnColumnChange(props.sheet, c),
						});
					}}
				/>
				<CreateRowBtn
					sheet={props.sheet}
					count={1}
					onRowCreated={updateRows}
				>
					Add Row
				</CreateRowBtn>
				<CreateRowBtn
					sheet={props.sheet}
					count={5}
					onRowCreated={updateRows}
				>
					Add 5 Rows
				</CreateRowBtn>
				<CreateRowBtn
					sheet={props.sheet}
					count={10}
					onRowCreated={updateRows}
				>
					Add 10 Rows
				</CreateRowBtn>
				<br />
			</div>
		</div>
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

function Cell(props: {
	typeData: SheetTypes[keyof SheetTypes];
	index: number;
	data: Sheet;
	key: string;
	settings: SheetTypes[keyof SheetTypes]['_settingType'];
	onValueChanged: (value: SheetTypes[keyof SheetTypes]['_valueType']) => void;
	onSettingsChanged: (
		value: SheetTypes[keyof SheetTypes]['_settingType']
	) => void;
}) {
	return (
		<div>
			<Dynamic
				component={props.typeData.getInputField}
				settings={props.settings as any}
				value={
					props.data.rows[props.index].data[props.key] === undefined
						? props.typeData.defaultValue
						: (props.data.rows[props.index].data[
								props.key
						  ] as Exclude<
								undefined,
								SheetTypes[keyof SheetTypes]['_valueType']
						  >)
				}
				sheet={props.data}
				onSettingsChanged={props.onSettingsChanged}
				onValueChanged={props.onValueChanged}
			/>
		</div>
	);
}
