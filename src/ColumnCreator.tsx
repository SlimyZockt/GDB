import { For, JSX, Show, createEffect, createSignal, untrack } from 'solid-js';
import {
	Column,
	DataTypes,
	TypeData,
	currentSheet,
	setCurrentSheet,
	setSheets,
	setStuff,
	sheets,
	stuff,
} from './stores/data';
import { ColumnDef } from '@tanstack/solid-table';

export function ColumnCreator() {
	const [columnName, setColumnName] = createSignal('');
	const [type, setType] = createSignal<keyof typeof TypeData>('Int');

	const availableTypes = Object.keys(TypeData) as Array<
		keyof typeof TypeData
	>;

	const verifyName = (name: string) =>{
		let sheet = currentSheet();

		if (sheet === undefined) return false;
		if (name.length === 0) return false;
		if (name.endsWith(" ")) return false;
		if (name.startsWith(" ")) return false;

		return sheet.columns.find((c) => c.name === name) === undefined;
	}

	const getSettingJSX = (data: (typeof TypeData)[keyof typeof TypeData]) => {
		if (!('getSettingsField' in data)) return;
		if (data.getSettingsField === undefined) return;
		return (
			<>
				<h2 class="font-bold">Settings</h2>
				<br />
				{data.getSettingsField(
					{
						max: {
							active: false,
							value: 0,
						},
						min: {
							active: false,
							value: 0,
						},
						step: {
							active: false,
							value: 0,
						},
					},
					(v) => console.table(v)
				)}
			</>
		);
	};

	const createColumn = () => {
		let sheet = untrack(currentSheet);

		const NAME = untrack(columnName);
		const TYPE = untrack(type);

		if (sheet === undefined) return;

		let newUuid = crypto.randomUUID();
		while (sheet.columns.find((v) => v.uuid == newUuid) !== undefined) {
			newUuid = crypto.randomUUID();
		}

		const newColumnDef: ColumnDef<{ [key: string]: DataTypes }> = {
			accessorKey: NAME,
			id: newUuid,
			header: NAME,
			cell: (info) => TypeData[TYPE].getInputField,
		};

		sheet.columnDef.push(newColumnDef);

		const newColumn: Column = {
			uuid: newUuid,
			name: NAME,
			type: type(),
		};

		sheet.columns.push(newColumn);

		// let new_sheet = sheets.filter((s) => s.uuid !== sheet?.uuid);
		// setSheets([...new_sheet, sheet]);
		setCurrentSheet(Object.assign({}, sheet));
		setColumnName('');
	};

	return (
		<>
			<input
				type="checkbox"
				id="column-creation-popup"
				class="modal-toggle"
			/>
			<div class="modal">
				<div class="modal-box relative">
					<label
						for="column-creation-popup"
						class="btn btn-sm btn-circle absolute right-2 top-2"
					>
						✕
					</label>
					<h3 class="font-bold text-lg">Column Creation</h3>
					<br />
					<label class="input-group" for="column-name">
						<span>Column Name:</span>
						<input
							id="column-name"
							type="text"
							placeholder="New Column"
							class="input input-bordered flex-1 bg-base-200"
							value={columnName()}
							onInput={(v) =>
								setColumnName(v.currentTarget.value)
							}
						/>
					</label>
					<br />
					<label class="input-group" for="column-type">
						<span>Column Type:</span>
						<select
							id="column-type"
							class="select select-bordered select-ghost flex-1 bg-base-200"
							value={type()}
							oninput={(v) =>
								setType(
									v.currentTarget
										.value as keyof typeof TypeData
								)
							}
						>
							<For each={availableTypes}>
								{(i) => {
									return <option>{i}</option>;
								}}
							</For>
						</select>
					</label>
					<br />
					<div>{getSettingJSX(TypeData[type()])}</div>
					<br />
					<button
						class={`btn btn-primary ${
							verifyName(columnName()) ? '' : 'btn-disabled'
						}`}
						onClick={createColumn}
					>
						Create Column
					</button>
				</div>
			</div>
		</>
	);
}

