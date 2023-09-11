import { For, Show, createEffect, createSignal, untrack } from 'solid-js';
import { Column, SettingsData, SheetTypes, TypeData } from './stores/data';
import { Dynamic } from 'solid-js/web';

export function ColumnCreator(props: {
	class?: string;
	columns: Column[];
	onColumnChanged: (column: Column[]) => void;
}) {
	const [columnName, setColumnName] = createSignal('');
	const [type, setType] = createSignal<keyof SheetTypes>('Int');
	const [setting, setSetting] =
		createSignal<SheetTypes[keyof SheetTypes]['_settingType']>(undefined);
	const [isValid, setIsValid] = createSignal<'Error' | 'Valid'>('Valid');
	const [dialogRef, setDialogRef] = createSignal<HTMLDialogElement>();

	const availableTypes = Object.keys(TypeData) as Array<
		keyof typeof TypeData
	>;

	const verifyName = (name: string) => {
		if (name.length === 0) return false;
		if (name.endsWith(' ')) return false;
		if (name.startsWith(' ')) return false;

		return props.columns.find((c) => c.name === name) === undefined;
	};

	const updateSettings = (v: SettingsData | 'Error') => {
		if (v === 'Error' || v === undefined || Object.keys(v).length === 0) {
			setIsValid('Error');
		} else {
			setIsValid('Valid');
			setSetting(v);
		}
	};

	const createColumn = () => {
		if (
			'getSettingsField' in TypeData[type()] === false ||
			TypeData[type()].getSettingsField === undefined
		) {
			setIsValid('Valid');
			setSetting(undefined);
		}

		const NAME = untrack(columnName);
		const TYPE = untrack(type);
		const SETTING = untrack(setting);

		let newUuid = crypto.randomUUID();
		while (props.columns.find((v) => v.uuid == newUuid) !== undefined) {
			newUuid = crypto.randomUUID();
		}

		const newColumn: Column = {
			uuid: newUuid,
			name: NAME,
			type: TYPE,
			settingData: SETTING,
		};

		props.onColumnChanged([...props.columns, newColumn]);
	};

	return (
		<div class={props.class}>
			<button
				onClick={() => dialogRef()?.showModal()}
				class="btn btn-primary btn-outline min-w-full"
			>
				new column
			</button>
			<dialog class="modal" ref={setDialogRef}>
				<div class="modal-box">
					<form method="dialog">
						<button class="btn btn-sm btn-circle btn-ghost absolute right-2 top-2">
							✕
						</button>
					</form>
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
						<Show
							when={
								TypeData[type()].getSettingsField !== undefined
							}
						>
							<h2 class="font-bold">Settings</h2>
							<br />
							<Dynamic
								component={TypeData[type()].getSettingsField}
								settingData={setting()}
								onSettingsChanged={updateSettings}
							/>
						</Show>
					</div>
					<br />
					<div class="modal-action">
						<form method="dialog">
							<button
								class={`btn ${
									verifyName(columnName()) &&
									isValid() === 'Valid'
										? 'btn-primary'
										: 'btn-disabled'
								}`}
								disabled={
									!verifyName(columnName()) &&
									isValid() === 'Error'
								}
								onClick={createColumn}
							>
								Create Column
							</button>
						</form>
					</div>
				</div>
				<form method="dialog" class="modal-backdrop">
					<button>close</button>
				</form>
			</dialog>
		</div>
	);
}
