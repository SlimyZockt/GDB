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
} from 'solid-js';

import './InputStyle.css';
import { Table } from '../Table';
import { z } from 'zod';
import { sign } from 'crypto';

export const [currentSheet, setCurrentSheet] = createStore<Sheet>({
	uuid: '',
	id: '',
	rows: [],
	columns: [],
});
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
	SettingType extends
		| { [T in string]: { active: boolean; value: any } }
		| undefined
> = {
	[x in StringLiteral<TypeName>]: {
		_valueType?: ValueType; // this is TS Hack,
		_settingType?: SettingType; // this is TS Hack,
		getSettingsField?: (props: {
			settingData?: SettingType;
			onSettingsChanged?: (value: SettingType | 'Error') => void;
		}) => JSX.Element;
		getInputField: (props: {
			settings: SettingType | undefined;
			row: Row;
			colUUID: string;
		}) => JSX.Element;
		displayName?: string;
	};
};

export type SheetTypes = Type<string, 'Text', undefined> &
	Type<
		number,
		'Int',
		{
			max: {
				active: boolean;
				value: number;
			};
			min: {
				active: boolean;
				value: number;
			};
			step: {
				active: boolean;
				value: number;
			};
		}
	> &
	Type<
		number,
		'Float',
		{
			max: {
				active: boolean;
				value: number;
			};
			min: {
				active: boolean;
				value: number;
			};
			step: {
				active: boolean;
				value: number;
			};
		}
	> &
	Type<{ r: number; g: number; b: number }, 'ColorRGB', undefined> &
	Type<string, 'SheetReference', undefined> &
	Type<string, 'LineReference', undefined> &
	Type<
		string,
		'FilePath',
		{
			Filenames: {
				value: string[];
				active: boolean;
			};
		}
	> &
	Type<Date, 'Date', undefined> &
	Type<
		string,
		'Enum',
		{
			possibleValues: {
				value: string[];
				active: boolean;
			};
		}
	> &
	Type<boolean, 'Boolean', undefined> &
	Type<Sheet, 'List', undefined> &
	Type<Sheet, 'UniqueProperty', undefined>;

type BaseTypes = SheetTypes[keyof SheetTypes]['_valueType'];

type List = Column[];
type UniqueProperty = Column[];

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

export type DataTypes = BaseTypes | List | UniqueProperty;

export type Sheet = {
	uuid: string;
	id: string;
	rows: Row[];
	columns: Column[];
};

export const TypeData: SheetTypes = {
	Float: {
		getInputField: (props) => {
			let initValue =
				props.row.data[props.colUUID] !== undefined
					? (props.row.data[props.colUUID] as number)
					: 0;

			let settings =
				props.settings === undefined
					? {}
					: unwrapSetting(props.settings);

			const onNumberChange = (number: number) => {
				setCurrentSheet(
					'rows',
					props.row.id,
					'data',
					props.colUUID,
					number
				);
			};

			return (
				<NumberInput
					onValueChanged={(v) => onNumberChange(v)}
					value={initValue.toString()}
					step="any"
					isInt={false}
					class="min-w-full"
					{...settings}
				/>
			);
		},
		getSettingsField: getNumericSettings('Float'),
	},
	Int: {
		getSettingsField: getNumericSettings('Int'),
		getInputField: (props) => {
			let initValue =
				props.row.data[props.colUUID] !== undefined
					? (props.row.data[props.colUUID] as number)
					: 0;

			let settings =
				props.settings === undefined
					? {}
					: unwrapSetting(props.settings);

			const onNumberChange = (number: number) => {
				setCurrentSheet(
					'rows',
					props.row.id,
					'data',
					props.colUUID,
					number
				);
			};

			return (
				<NumberInput
					onValueChanged={(v) => onNumberChange(v)}
					value={initValue.toString()}
					step="any"
					isInt={true}
					class="min-w-full"
					{...settings}
				/>
			);
		},
	},
	Text: {
		getInputField: (props) => {
			let initValue =
				props.row.data[props.colUUID] !== undefined
					? (props.row.data[props.colUUID] as string)
					: '';

			const onTextChange = (text: string) => {
				setCurrentSheet(
					'rows',
					props.row.id,
					'data',
					props.colUUID,
					text
				);
			};

			return (
				<input
					type="text"
					placeholder=""
					class="input input-bordered min-w-full"
					onInput={(e) => onTextChange(e.currentTarget.value)}
					value={initValue}
				/>
			);
		},
	},
	ColorRGB: {
		// validation: z.object({ r: z.number(), g: z.number(), b: z.number() }),
		getInputField: (props) => {
			// const [colorRgb, setColorRgb] = createSignal(initColor);

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

			const initColor =
				props.row.data[props.colUUID] !== undefined
					? (props.row.data[props.colUUID] as {
							r: number;
							g: number;
							b: number;
					  })
					: {
							r: 0,
							g: 0,
							b: 0,
					  };

			const [colorHEX, setColorHEX] = createSignal(rgbToHex(initColor));

			const onColorChange = (value: string) => {
				setColorHEX(value);
				let rgb = hexToRgb(value);
				setCurrentSheet(
					'rows',
					props.row.id,
					'data',
					props.colUUID,
					rgb
				);
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
	},
	Date: {
		getInputField: (props) => {
			let initValue =
				props.row.data[props.colUUID] !== undefined
					? (props.row.data[props.colUUID] as Date)
					: new Date(2023, 1, 1);

			const onDataChange = (date: Date | null) => {
				setCurrentSheet(
					'rows',
					props.row.id,
					'data',
					props.colUUID,
					date === null ? new Date(2023, 1, 1) : date
				);
			};

			onDataChange(initValue);

			return (
				<input
					type="date"
					class="input input-bordered min-w-full"
					value="2023-01-01"
					onInput={(e) => onDataChange(e.currentTarget.valueAsDate)}
				/>
			);
		},
	},
	Enum: {
		getInputField: (props) => {
			let initValue =
				props.row.data[props.colUUID] !== undefined
					? (props.row.data[
							props.colUUID
					  ] as SheetTypes['Enum']['_valueType'])
					: '';

			let settings =
				props.settings === undefined
					? {}
					: unwrapSetting(props.settings);

			const onEnumChange = (text: string) => {
				setCurrentSheet(
					'rows',
					props.row.id,
					'data',
					props.colUUID,
					text
				);
			};

			return (
				<select
					class="select select-bordered select-ghost min-w-full bg-base-200"
					onInput={(v) => onEnumChange(v.currentTarget.value)}
				>
					<For each={settings.possibleValues}>
						{(v) => (
							<option selected={v === initValue}> {v} </option>
						)}
					</For>
				</select>
			);
		},
		getSettingsField(props) {
			const [states, setStates] = createSignal(
				props.settingData === undefined
					? (['newEnum1'] as string[])
					: props.settingData.possibleValues.value
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
								possibleValues: {
									value: states(),
									active: true,
								},
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
	},
	FilePath: {
		getInputField: (props) => {
			// TODO: ADD Setting to Save Data

			let initValue =
				props.row.data[props.colUUID] !== undefined
					? (props.row.data[
							props.colUUID
					  ] as SheetTypes['FilePath']['_valueType'])
					: '';

			const onFileChange = async (fileList: FileList | null) => {
				// TODO: ADD Native File Path
				let File = fileList?.item(0);
				let url = '';
				if (File !== undefined && File !== null) {
					url = URL.createObjectURL(File);
				}
				setCurrentSheet(
					'rows',
					props.row.id,
					'data',
					props.colUUID,
					url
				);
			};

			let settings =
				props.settings === undefined
					? {}
					: unwrapSetting(props.settings);

			return (
				<input
					type="file"
					class="file-input file-input-bordered w-full min-w-full"
					onInput={(e) => onFileChange(e.currentTarget.files)}
					value={initValue}
					accept={settings.Filenames?.join(',')}
				/>
			);
		},
		getSettingsField(props) {
			const [states, setStates] = createSignal(
				props.settingData === undefined
					? ([] as string[])
					: props.settingData.Filenames.value
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
								Filenames: {
									value: states(),
									active: true,
								},
						  }
						: 'Error'
				);
			});

			return (
				<div class="">
					<h1 class="text-md font-bold">Allowed file extension: </h1>
					<br />
					<div class="min-w-full bg-base-200 p-1 rounded-md">
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
	},
	LineReference: {
		getInputField: (props) => {
			let initValue =
				props.row.data[props.colUUID] !== undefined
					? (props.row.data[
							props.colUUID
					  ] as SheetTypes['LineReference']['_valueType'])
					: '';

			let settings =
				props.settings === undefined
					? {}
					: unwrapSetting(props.settings);

			const onEnumChange = (
				text: SheetTypes['LineReference']['_valueType']
			) => {
				setCurrentSheet(
					'rows',
					props.row.id,
					'data',
					props.colUUID,
					text
				);
			};

			return (
				<select
					class="select select-bordered select-ghost min-w-full bg-base-200"
					onInput={(v) => onEnumChange(v.currentTarget.value)}
				>
					<For
						each={Object.keys(currentSheet.rows.map((r) => r.uuid))}
					>
						{(v) => (
							<option selected={v === initValue}> {v} </option>
						)}
					</For>
				</select>
			);
		},
	},
	SheetReference: {
		getInputField: (props) => {
			let initValue =
				props.row.data[props.colUUID] !== undefined
					? (props.row.data[
							props.colUUID
					  ] as SheetTypes['SheetReference']['_valueType'])
					: '';

			let settings =
				props.settings === undefined
					? {}
					: unwrapSetting(props.settings);

			const onEnumChange = (
				text: SheetTypes['SheetReference']['_valueType']
			) => {
				setCurrentSheet(
					'rows',
					props.row.id,
					'data',
					props.colUUID,
					text
				);
			};

			return (
				<select
					class="select select-bordered select-ghost min-w-full bg-base-200"
					onInput={(v) => onEnumChange(v.currentTarget.value)}
				>
					<For
						each={Object.keys(currentSheet.rows.map((r) => r.uuid))}
					>
						{(v) => (
							<option selected={v === initValue}> {v} </option>
						)}
					</For>
				</select>
			);
		},
	},
	Boolean: {
		getInputField: (props) => {
			let initValue =
				props.row.data[props.colUUID] !== undefined
					? (props.row.data[
							props.colUUID
					  ] as SheetTypes['Boolean']['_valueType'])
					: false;

			const onBoolChange = (
				bool: SheetTypes['Boolean']['_valueType']
			) => {
				setCurrentSheet(
					'rows',
					props.row.id,
					'data',
					props.colUUID,
					bool
				);
			};

			return (
				<input
					type="checkbox"
					class="input input-bordered min-w-full"
					checked={initValue}
					onInput={(v) => onBoolChange(v.currentTarget.checked)}
				/>
			);
		},
	},
	List: {
		getInputField: (props) => {
			let uuid = crypto.randomUUID();
			// TODO: change data structure for List
			// sheets.map((s) => s.columns).flat().filter(c => c.type === "List") !== undefined &&

			while (
				sheets.find((s) => s.uuid === uuid) !== undefined
			) {
				uuid = crypto.randomUUID();
			}

			let initValue =
				props.row.data[props.colUUID] !== undefined
					? (props.row.data[props.colUUID] as Exclude<
							SheetTypes['List']['_valueType'],
							undefined
					  >)
					: ({
							uuid: `${currentSheet.uuid}_${currentSheet.uuid}`,
							id: `${currentSheet.id}_list_${
								currentSheet.columns.filter(
									(c) => c.type === 'List'
								).length + 1
							}`,
							rows: [],
							columns: [],
					  } as Sheet);
						

			return <Table sheet={initValue} />;
		},
	},
	UniqueProperty: {
		getInputField: (props): JSX.Element => {
			return (
				<input
					type="checkbox"
					class="input input-bordered min-w-full"
				/>
			);
		},
	},
};

function NumberSettingInput(prop: {
	label: string;
	state?: { value: number; active: boolean };
	onStateChanged?: (state: { value: number; active: boolean }) => {};
	isInt: boolean;
}) {
	const [active, setActive] = createSignal(false);
	const [value, setValue] = createSignal(0);

	createEffect(() => {
		if (prop.onStateChanged !== undefined) {
			prop.onStateChanged({ value: value(), active: active() });
		}
	});

	return (
		<label class="input-group">
			<span>{prop.label}</span>

			<NumberInput
				onValueChanged={(v) => setValue(v)}
				value={
					prop.state === undefined ? '0' : prop.state.value.toString()
				}
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
					checked={
						prop.state === undefined ? false : prop.state.active
					}
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
			max: {
				active: boolean;
				value: number;
			};
			min: {
				active: boolean;
				value: number;
			};
			step: {
				active: boolean;
				value: number;
			};
		};
		onSettingsChanged?: (value: {
			max: {
				active: boolean;
				value: number;
			};
			min: {
				active: boolean;
				value: number;
			};
			step: {
				active: boolean;
				value: number;
			};
		}) => void;
	}): JSX.Element => {
		const [state, setState] = createSignal(
			props.settingData === undefined
				? {
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
				  }
				: props.settingData
		);

		onMount(() => {});

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
					state={state().max}
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
		validator = validator.step(props.max);
	}
	if (props.min !== undefined) {
		validator = validator.step(props.min);
	}

	const onValueChanged = (newValue: string) => {
		let validated = validator.safeParse(Number(newValue));

		if (
			validated.success &&
			!newValue.includes('.') &&
			!newValue.includes(' ') &&
			newValue.length !== 0
		) {
			setValue(validated.data.toString());
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
			step={props.step}
			max={props.max}
			min={props.min}
			disabled={props.disabled}
		/>
	);
}
