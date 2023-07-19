import { For, JSX, Show, createEffect, createSignal, untrack } from 'solid-js';
import {
	Column,
	DataTypes,
	SettingsData,
	SheetTypes,
	TypeData,
	currentSheet,
	setCurrentSheet,
	setSheets,
	setStuff,
	sheets,
	stuff,
} from './stores/data';
import { ColumnDef } from '@tanstack/solid-table';
import { Dynamic } from 'solid-js/web';

export function ColumnCreator() {
	const [columnName, setColumnName] = createSignal('');
	const [type, setType] = createSignal<keyof SheetTypes>('Int');
	const [setting, setSetting] =createSignal<SheetTypes[keyof SheetTypes]['_settingType']>(undefined);
	const [isValid, setIsValid] = createSignal<'Error' | 'Valid'>('Valid');

	const availableTypes = Object.keys(TypeData) as Array<
		keyof typeof TypeData
	>;

	const verifyName = (name: string) => {
		let sheet = currentSheet;

		if (sheet === undefined) return false;
		if (name.length === 0) return false;
		if (name.endsWith(' ')) return false;
		if (name.startsWith(' ')) return false;

		return sheet.columns.find((c) => c.name === name) === undefined;
	};

	const getSettingJSX = (props: { type: keyof typeof TypeData }) => {
		const [data, setData] = createSignal(TypeData[props.type]);

		createEffect(() => {
			setData(TypeData[props.type]);
		});

		const test = (v: SettingsData | 'Error') => {
			if (v === 'Error') {
				setIsValid(v);
				setSetting(undefined);
			} else {
				setIsValid('Valid');
				setSetting(v);
			}
		};

		const DefaultSetting = {
			Float: {
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
			Int: {
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
		};

		return (
			<Show
				when={
					'getSettingsField' in data() &&
					data().getSettingsField !== undefined
				}
			>
				<>
					<h2 class="font-bold">Settings</h2>
					<br />
					<Dynamic
						component={data().getSettingsField}
						settingData={undefined}
						onSettingsChanged={test}
					/>
				</>
			</Show>
		);
	};

	const createColumn = () => {
		let sheet = currentSheet;

		const NAME = untrack(columnName);
		const TYPE = untrack(type);
		const SETTING = untrack(setting);

		if (sheet === undefined) return;

		let newUuid = crypto.randomUUID();
		while (sheet.columns.find((v) => v.uuid == newUuid) !== undefined) {
			newUuid = crypto.randomUUID();
		}

		const newColumn: Column = {
			uuid: newUuid,
			name: NAME,
			type: TYPE,
			settingData: SETTING,
		};

		setCurrentSheet('columns', (c) => [...c, newColumn]);
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
							oninput={(e) => {
								console.log(e.currentTarget.value);
								setType(
									e.currentTarget
										.value as keyof typeof TypeData
								);
							}}
						>
							<For each={availableTypes}>
								{(i) => {
									return <option>{i}</option>;
								}}
							</For>
						</select>
					</label>
					<br />
					<div>
						<Dynamic component={getSettingJSX} type={type()} />
					</div>
					<br />
					<button
						class={`btn btn-primary ${
							verifyName(columnName()) && isValid() === 'Valid'
								? ''
								: 'btn-disabled'
						}`}
						disabled={
							!verifyName(columnName()) && isValid() === 'Error'
						}
						onClick={createColumn}
					>
						Create Column
					</button>
				</div>
			</div>
		</>
	);
}
