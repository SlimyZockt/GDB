import type { ColumnDef } from '@tanstack/solid-table';
import { createStore } from 'solid-js/store';
import {
	For,
	JSX,
	createSignal,
	createEffect,
	untrack,
	Accessor,
	onMount,
	Index,
	Component,
	Show,
} from 'solid-js';

import './InputStyle.css';
import { Table, extendDataOnColumnChange } from '../Table';
import { z } from 'zod';

export const [sheets, setSheets] = createStore<Sheet[]>([]);
export const [stuff, setStuff] = createSignal(false);

type StringLiteral<T> = T extends string
	? string extends T
		? never
		: T
	: never;

type Type<
	ValueType,
	TypeName extends string,
	SettingType extends { [T in string]: unknown } | undefined
> = {
	readonly [x in StringLiteral<TypeName>]: {
		readonly _valueType?: ValueType; // this is TS Hack,
		readonly _settingType?: SettingType; // this is TS Hack,
		readonly defaultValue: Exclude<ValueType, undefined>;
		getSettingsField?: (props: {
			settingData?: SettingType;
			onSettingsChanged?: (value: SettingType | 'Error') => void;
		}) => JSX.Element;
		readonly getInputField: Component<{
			settings?: SettingType;
			onSettingsChanged: (value: SettingType) => void;
			onValueChanged: (value: ValueType) => void;
			value: ValueType;
			sheet: Sheet;
		}>;
		readonly displayName?: string;
	};
};

export type SheetTypes = Type<string, 'Text', undefined> &
	Type<
		number,
		'Int',
		{
			max?: number;
			min?: number;
			step?: number;
		}
	> &
	Type<
		number,
		'Float',
		{
			max?: number;
			min?: number;
			step?: number;
		}
	> &
	Type<{ r: number; g: number; b: number }, 'ColorRGB', undefined> &
	Type<string, 'SheetReference', undefined> &
	Type<string, 'LineReference', undefined> &
	Type<
		string,
		'FilePath',
		{
			Filenames: string[];
		}
	> &
	Type<Date, 'Date', undefined> &
	Type<
		string,
		'Enum',
		{
			possibleValues: string[];
		}
	> &
	Type<boolean, 'Boolean', undefined> &
	Type<
		Sheet,
		'List',
		{
			columns: Column[];
		}
	> &
	Type<Sheet, 'UniqueProperty', undefined>;

type BaseTypes = SheetTypes[keyof SheetTypes]['_valueType'];

type List = Column[];
type UniqueList = Column[];

export type ColumnTypes = keyof SheetTypes;

export type SettingsData = SheetTypes[keyof SheetTypes]['_settingType'];

export type Column = {
	uuid: string;
	name: string;
	type: ColumnTypes;
	settingData?: SettingsData;
};

export type Row = {
	id: number;
	uuid: string;
	data: {
		[key: string]: DataTypes;
	};
};

export type DataTypes = BaseTypes;

export type Sheet = {
	uuid: string | 'undefined';
	id: string;
	rows: Row[];
	columns: Column[];
};

export const TypeData: SheetTypes = {
	Float: {
		getInputField: (props) => {
			return (
				<NumberInput
					onValueChanged={(v) => props.onValueChanged(v)}
					value={props.value.toString()}
					step="any"
					isInt={false}
					class="min-w-full"
					{...props.settings}
				/>
			);
		},
		getSettingsField: getNumericSettings('Float'),
		defaultValue: 0,
	},
	Int: {
		getSettingsField: getNumericSettings('Int'),
		getInputField: (props) => {

			console.log(props.settings);
			

			return (
				<NumberInput
					onValueChanged={(v) => props.onValueChanged(v)}
					value={props.value.toString()}
					step="any"
					isInt={true}
					class="min-w-full"
					{...props.settings}
				/>
			);
		},
		defaultValue: 0,
	},
	Text: {
		getInputField: (props) => {
			return (
				<input
					type="text"
					placeholder=""
					class="input input-bordered min-w-full"
					onInput={(e) => props.onValueChanged(e.currentTarget.value)}
					value={props.value}
				/>
			);
		},
		defaultValue: '',
	},
	ColorRGB: {
		// validation: z.object({ r: z.number(), g: z.number(), b: z.number() }),
		getInputField: (props) => {
			const rgbToHex = (color: { r: number; g: number; b: number }) =>
				'#' +
				((1 << 24) | (color.r << 16) | (color.g << 8) | color.b)
					.toString(16)
					.slice(1);

			const hexToRgb = (hexColor: string) => {
				return {
					r: Number.parseInt(hexColor.slice(1, 3), 16),
					g: Number.parseInt(hexColor.slice(3, 5), 16),
					b: Number.parseInt(hexColor.slice(5, 7), 16),
				};
			};

			const [colorHEX, setColorHEX] = createSignal(rgbToHex(props.value));

			const onColorChange = (value: string) => {
				setColorHEX(value);
				let rgb = hexToRgb(value);
				props.onValueChanged(rgb);
			};

			return (
				<label
					class={`flex items-start h-12 w-12 p-0 border-base-content border rounded-full`}
					style={`background-color: ${colorHEX()}`}
				>
					<input
						type="color"
						class="invisible"
						onInput={(e) => onColorChange(e.currentTarget.value)}
					/>
				</label>
			);
		},
		defaultValue: {
			r: 0,
			g: 0,
			b: 0,
		},
	},
	Date: {
		getInputField: (props) => {
			return (
				<input
					type="date"
					class="input input-bordered min-w-full"
					value="1999-01-01"
					onInput={(e) =>
						props.onValueChanged(
							e.currentTarget.valueAsDate === null
								? new Date(1999, 1, 1)
								: e.currentTarget.valueAsDate
						)
					}
				/>
			);
		},
		defaultValue: new Date(1999, 1, 1),
	},
	Enum: {
		getInputField: (props) => {
			return (
				<select
					class="select select-bordered select-ghost min-w-full bg-base-200"
					onInput={(v) => props.onValueChanged(v.currentTarget.value)}
				>
					<For each={props.settings?.possibleValues}>
						{(v) => (
							<option selected={v === props.value}> {v} </option>
						)}
					</For>
				</select>
			);
		},
		getSettingsField(props) {
			const [states, setStates] = createSignal(
				props.settingData === undefined
					? (['newEnum1'] as string[])
					: props.settingData.possibleValues
			);

			const updateState = (newState: string, id: number) => {
				setStates((v) => {
					v[id] = newState;
					return [...v];
				});
			};

			const isValid = (states: string[]) => {
				let counts: { [x: string]: number } = {};
				for (const state of states) {
					counts[state] = (counts[state] || 0) + 1;
				}
				for (const key in counts) {
					if (counts[key] > 1) {
						return false;
					}
				}
				return true;
			};

			const isCurrentStateValid = (states: string[], state: string) =>
				states.filter((s) => s === state).length > 1;

			createEffect(() => {
				if (props.onSettingsChanged === undefined) return;
				props.onSettingsChanged(
					isValid(states())
						? {
								possibleValues: states(),
						  }
						: 'Error'
				);
			});

			return (
				<div>
					<div class="border-base-content border-[1px] min-w-full bg-base-200 p-1 rounded-md">
						<Index each={states()}>
							{(value, i) => (
								<label class="input-group p-1">
									<input
										type="text"
										class={`input flex-1 ${
											isCurrentStateValid(
												states(),
												value()
											)
												? 'input-error'
												: ''
										}`}
										value={value()}
										onInput={(e) =>
											updateState(
												e.currentTarget.value,
												i
											)
										}
									/>
									<button
										class="btn btn-error"
										onClick={(_) =>
											setStates((oldStates) =>
												oldStates.filter(
													(_, id) => id !== i
												)
											)
										}
									>
										X
									</button>
								</label>
							)}
						</Index>
					</div>
					<button
						class="btn min-w-full"
						onClick={() =>
							setStates((s) => [
								...s,
								`newEnum${states().length + 1}`,
							])
						}
					>
						Create New Value
					</button>
				</div>
			);
		},
		defaultValue: '',
	},
	FilePath: {
		getInputField: (props) => {
			// TODO: ADD Setting to Save Data

			const onFileChange = async (fileList: FileList | null) => {
				// TODO: ADD Native File Path
				let File = fileList?.item(0);
				let url = '';
				if (File !== undefined && File !== null) {
					url = URL.createObjectURL(File);
				}

				props.onValueChanged(url);
			};

			return (
				<input
					type="file"
					class="file-input file-input-bordered w-full min-w-full"
					onInput={(e) => onFileChange(e.currentTarget.files)}
					value={props.value}
					accept={props.settings?.Filenames?.join(',')}
				/>
			);
		},
		getSettingsField(props) {
			const [fileExtension, setFileExtension] = createSignal(
				props.settingData === undefined
					? ([] as string[])
					: props.settingData.Filenames
			);

			const updateFileExtension = (newState: string, id: number) => {
				setFileExtension((v) => {
					v[id] = newState;
					return [...v];
				});
			};

			const isValid = (states: string[]) => {
				let counts: { [x: string]: number } = {};
				for (const state of states) {
					counts[state] = (counts[state] || 0) + 1;
				}
				for (const key in counts) {
					if (counts[key] > 1) {
						return false;
					}
				}
				return true;
			};

			const isCurrentStateValid = (states: string[], state: string) =>
				states.filter((s) => s === state).length > 1;

			createEffect(() => {
				if (props.onSettingsChanged === undefined) return;
				props.onSettingsChanged(
					isValid(fileExtension())
						? {
								Filenames: fileExtension(),
						  }
						: 'Error'
				);
			});

			return (
				<div class="">
					<h1 class="text-md font-bold">Allowed file extension: </h1>
					<br />
					<div class="min-w-full bg-base-200 p-1 rounded-md">
						<Index each={fileExtension()}>
							{(value, i) => (
								<label class="input-group p-1">
									<input
										type="text"
										class={`input flex-1 ${
											isCurrentStateValid(
												fileExtension(),
												value()
											)
												? 'input-error'
												: ''
										}`}
										value={value()}
										onInput={(e) =>
											updateFileExtension(
												e.currentTarget.value,
												i
											)
										}
									/>
									<button
										class="btn btn-error"
										onClick={(_) =>
											setFileExtension((oldStates) =>
												oldStates.filter(
													(_, id) => id !== i
												)
											)
										}
									>
										X
									</button>
								</label>
							)}
						</Index>
					</div>
					<button
						class="btn min-w-full"
						onClick={() =>
							setFileExtension((s) => [
								...s,
								`.${fileExtension().length + 1}`,
							])
						}
					>
						Add File Extension
					</button>
				</div>
			);
		},
		defaultValue: '',
	},
	LineReference: {
		getInputField: (props) => {
			return (
				<select
					class="select select-bordered select-ghost min-w-full bg-base-200"
					onInput={(v) => props.onValueChanged(v.currentTarget.value)}
				>
					<For
						each={[''].concat(
							props.sheet.rows.map((r)=> r.id.toString())
						)}
					>
						{(v) => (
							<option selected={v === props.value}> {v} </option>
						)}
					</For>
				</select>
			);
		},
		defaultValue: '',
	},
	SheetReference: {
		getInputField: (props) => {
			return (
				<select
					class="select select-bordered select-ghost min-w-full bg-base-200"
					onInput={(v) => props.onValueChanged(v.currentTarget.value)}
				>
					<For each={[""].concat(sheets.map((s) => s.id))}>
						{(v) => (
							<option selected={v === props.value}> {v} </option>
						)}
					</For>
				</select>
			);
		},
		defaultValue: '',
	},
	Boolean: {
		getInputField: (props) => {
			return (
				<input
					type="checkbox"
					class="input input-bordered min-w-full"
					checked={props.value}
					onInput={(v) =>
						props.onValueChanged(v.currentTarget.checked)
					}
				/>
			);
		},
		defaultValue: false,
	},
	List: {
		getInputField: (props) => {
			let uuid = crypto.randomUUID();
			while (sheets.find((s) => s.uuid === uuid) !== undefined) {
				uuid = crypto.randomUUID();
			}

			const [isOpen, setIsOpen] = createSignal(false);

			createEffect(() => {
				setSubSheet((s) => ({
					...s,
					columns:
						props.settings !== undefined &&
						props.settings.columns !== undefined
							? props.settings.columns
							: [],
					rows: extendDataOnColumnChange(
						s,
						props.settings !== undefined &&
							props.settings.columns !== undefined
							? props.settings.columns
							: []
					),
				}));
			});

			let newSubSheet =
				props.value.uuid === 'undefined'
					? ({
							uuid: `${props.sheet.uuid}_${uuid}`,
							id: `${props.sheet.id}_list_${
								props.sheet.columns.filter(
									(c) => c.type === 'List'
								).length
							}`,
							rows: [],
							columns: [],
					  } as Sheet)
					: props.value;

			const [subSheet, setSubSheet] = createSignal(newSubSheet);

			return (
				<div class="collapse border border-base-300 collapse-plus">
					<input
						type="checkbox"
						onInput={(e) => setIsOpen(e.currentTarget.checked)}
					/>
					<div class="collapse-title text-xl font-medium bg-base-300 ">
						<Show when={isOpen()} fallback={<p>[]</p>}>
							<p>...</p>
						</Show>
					</div>
					<div class="collapse-content bg-base-200 ">
						<Table
							sheet={subSheet()}
							onSheetChanged={(s) => {
								props.onSettingsChanged({
									columns: s.columns,
								});
								setSubSheet(s);
								props.onValueChanged(s);
							}}
						/>
					</div>
				</div>
			);
		},
		defaultValue: {
			uuid: 'undefined',
			id: '',
			rows: [],
			columns: [],
		},
	},
	UniqueProperty: {
		getInputField: (props): JSX.Element => {
			let uuid = crypto.randomUUID();
			while (sheets.find((s) => s.uuid === uuid) !== undefined) {
				uuid = crypto.randomUUID();
			}

			const [isOpen, setIsOpen] = createSignal(false);

			let newSubSheet =
				props.value.uuid === 'undefined'
					? ({
							uuid: `${props.sheet.uuid}_${uuid}`,
							id: `${props.sheet.id}_list_${
								props.sheet.columns.filter(
									(c) => c.type === 'List'
								).length
							}`,
							rows: [],
							columns: [],
					  } as Sheet)
					: props.value;

			const [subSheet, setSubSheet] = createSignal(newSubSheet);

			return (
				<div class="collapse border border-base-300 collapse-plus">
					<input
						type="checkbox"
						onInput={(e) => setIsOpen(e.currentTarget.checked)}
					/>
					<div class="collapse-title text-xl font-medium bg-base-300 ">
						<Show when={isOpen()} fallback={<p>[]</p>}>
							<p>...</p>
						</Show>
					</div>
					<div class="collapse-content bg-base-200 ">
						<Table
							sheet={subSheet()}
							onSheetChanged={(s) => {
								setSubSheet(s);
								props.onValueChanged(s);
							}}
						/>
					</div>
				</div>
			);
		},
		defaultValue: {
			uuid: '',
			id: '',
			rows: [],
			columns: [],
		},
	},
};

function NumberSettingInput(prop: {
	label: string;
	state?: number;
	onStateChanged?: (state: number | undefined) => {};
	isInt: boolean;
}) {
	const [active, setActive] = createSignal(false);
	const [value, setValue] = createSignal(0);

	createEffect(() => {
		if (prop.onStateChanged !== undefined) {
			prop.onStateChanged(active() ? value() : undefined);
		}
	});

	return (
		<label class="input-group">
			<span>{prop.label}</span>

			<NumberInput
				onValueChanged={(v) => setValue(v)}
				value={prop.state === undefined ? '0' : prop.state.toString()}
				isInt={prop.isInt}
				disabled={!active()}
				class={`input input-bordered flex-1 bg-base-200 ${
					!active() ? 'input-disabled text-base-content' : ''
				}`}
				step="any"
			/>
			<span>
				<input
					type="checkbox"
					class={'checkbox'}
					checked={prop.state === undefined ? false : true}
					onInput={(v) => {
						setActive(v.currentTarget.checked);
					}}
				/>
			</span>
		</label>
	);
}

function getNumericSettings(type: 'Int' | 'Float') {
	return (props: {
		settingData?: {
			max?: number;
			min?: number;
			step?: number;
		};
		onSettingsChanged?: (value: {
			max?: number;
			min?: number;
			step?: number;
		}) => void;
	}): JSX.Element => {
		const [state, setState] = createSignal(
			props.settingData === undefined ? {} : props.settingData
		);

		createEffect(() => {
			if (props.onSettingsChanged !== undefined) {
				props.onSettingsChanged(state());
			}
		});

		return (
			<div class="grid gap-3">
				<NumberSettingInput
					label="max:"
					isInt={type === 'Int' ? true : false}
					state={state()?.max}
					onStateChanged={(v) =>
						setState((oldState) => {
							return {
								max: v,
								min: oldState.min,
								step: oldState.step,
							};
						})
					}
				/>
				<NumberSettingInput
					label="min:"
					state={state().min}
					isInt={type === 'Int' ? true : false}
					onStateChanged={(v) =>
						setState((oldState) => {
							return {
								max: oldState.max,
								min: v,
								step: oldState.step,
							};
						})
					}
				/>
				<NumberSettingInput
					label="step:"
					state={state().step}
					isInt={type === 'Int' ? true : false}
					onStateChanged={(v) =>
						setState((oldState) => {
							return {
								max: oldState.max,
								min: oldState.min,
								step: v,
							};
						})
					}
				/>
			</div>
		);
	};
}

function unwrapSetting<
	SettingType extends { [T in string]: { active: boolean; value: any } }
>(settings: SettingType) {
	type SettingsKeys = keyof SettingType;

	const KEYS: Array<SettingsKeys> = Object.keys(settings);

	return KEYS.reduce((obj, key) => {
		if (settings[key].active) {
			obj[key] = settings[key].value;
		} else {
			obj[key] = undefined;
		}

		return obj;
	}, {} as { [x in SettingsKeys]?: SettingType[SettingsKeys]['value'] });
}

function NumberInput(props: {
	value: string;
	step?: number | 'any';
	max?: number;
	min?: number;
	isInt?: boolean;
	disabled?: boolean;
	class?: string;
	onValueChanged: (value: number) => void;
}) {
	const [value, setValue] = createSignal<string>(props.value);

	let validator = z.number().safe();

	if (props.isInt) {
		validator = validator.int();
	}

	if (props.step !== undefined && props.step !== 'any') {
		validator = validator.step(props.step);
	}

	if (props.max !== undefined) {
		console.log(props.max);
		
		validator = validator.max(props.max);
	}
	if (props.min !== undefined) {
		validator = validator.min(props.min);
	}

	const onValueChanged = (newValue: string) => {
		let validated = validator.safeParse(Number(newValue));

		if (
			validated.success &&
			!newValue.includes('.') &&
			!newValue.includes(' ') &&
			newValue.length !== 0
		) {
			setValue(newValue);
			props.onValueChanged(validated.data);
		} else if (newValue === '-') {
			// setValue('-');
			props.onValueChanged(0);
		} else if (newValue.length === 0) {
			setValue('');
			props.onValueChanged(0);
		} else {
			const OLD_VALID_NUM = Number(untrack(value));
			setValue((OLD_VALID_NUM - 1).toString());
			setValue(OLD_VALID_NUM.toString());
		}
	};

	return (
		<input
			type="text"
			class={`input input-bordered ${props.class}`}
			onInput={(e) => onValueChanged(e.currentTarget.value)}
			value={value()}
			disabled={props.disabled}
		/>
	);
}
