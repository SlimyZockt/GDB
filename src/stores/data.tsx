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
} from 'solid-js';

import './InputStyle.css';
import { Sheet } from '../Sheet';
import { z } from 'zod';

export const [currentSheet, setCurrentSheet] = createStore<Sheet>({
	uuid: '',
	id: '',
	rows: [],
	columns: [],
});
export const [sheets, setSheets] = createStore<Sheet[]>([]);
export const [stuff, setStuff] = createSignal(false);

// Important! creates always a Side effect
// createEffect(() => {
// 	let sheet = currentSheet;
// 	if (sheet === undefined) return;
// 	let new_sheet = sheets.filter((s) => s.uuid !== (sheet as Sheet).uuid);
// 	setSheets([...new_sheet, sheet]);
// });

// export type TypeSetting = {
// 	readonly name: string;
// 	readonly inputType: 'number' | 'text' | 'enum';
// 	readonly active: boolean;
// };

// export type Settings = { [x in ColumnTypes]?: TypeSetting[] };

// export type SettingsData = {
// 	[x: string]: number | string | boolean | string[];
// };

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
			settingData: SettingType;
			onSettingsChanged?: (value: SettingType) => void;
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
	Type<string, 'ImagePath', undefined> &
	Type<string, 'FilePath', undefined> &
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
	Type<Column[], 'List', undefined> &
	Type<Column[], 'UniqueProperty', undefined>;

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

			let validator = z.number();
			if ('step' in settings && settings.step !== undefined) {
				validator = validator.step(settings.step);
			}
			if ('max' in settings && settings.max !== undefined) {
				validator = validator.max(settings.max);
			}
			if ('min' in settings && settings.min !== undefined) {
				validator = validator.min(settings.min);
			}

			const onNumberChange = (number: string) => {
				validator.safeParse(number);
				setCurrentSheet(
					'rows',
					props.row.id,
					'data',
					props.colUUID,
					number
				);
			};

			return (
				<input
					type="number"
					placeholder="0"
					class="input input-bordered min-w-full"
					onInput={(e) => onNumberChange(e.currentTarget.value)}
					value={initValue}
					step="any"
					{...settings}
				/>
			);
		},
		getSettingsField: getNumericSettings,
	},
	Int: {
		getSettingsField: getNumericSettings,
		getInputField: (props) => {
			let initValue =
				props.row.data[props.colUUID] !== undefined
					? (props.row.data[props.colUUID] as string)
					: 0;

			let settings =
				props.settings === undefined
					? {}
					: unwrapSetting(props.settings);

			let validator = z.number().int();
			if ('step' in settings && settings.step !== undefined) {
				validator = validator.step(settings.step);
			}
			if ('max' in settings && settings.max !== undefined) {
				validator = validator.max(settings.max);
			}
			if ('min' in settings && settings.min !== undefined) {
				validator = validator.min(settings.min);
			}

			const onNumberChange = (number: string) => {
				validator.safeParse(number);
				setCurrentSheet(
					'rows',
					props.row.id,
					'data',
					props.colUUID,
					number
				);
			};

			return (
				<input
					type="number"
					placeholder="0"
					class="input input-bordered min-w-full"
					onInput={(e) => onNumberChange(e.currentTarget.value)}
					value={initValue}
					step={1}
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

			console.log(new Date(2023, 1, 1));
			console.log(initValue);

			const onDataChange = (date: Date | null) => {
				console.log(date);

				setCurrentSheet(
					'rows',
					props.row.id,
					'data',
					props.colUUID,
					date === null ? undefined : date
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
					<For each={settings?.possibleValues}>
						{(v) => (
							<option selected={v === initValue}> {v} </option>
						)}
					</For>
				</select>
			);
		},
	},
	FilePath: {
		getInputField: (props) => {
			let initValue =
				props.row.data[props.colUUID] !== undefined
					? (props.row.data[
							props.colUUID
					  ] as SheetTypes['FilePath']['_valueType'])
					: '';

			const onFileChange = (path: string) => {
				setCurrentSheet(
					'rows',
					props.row.id,
					'data',
					props.colUUID,
					path
				);
			};

			return (
				<input
					type="file"
					class="input input-bordered min-w-full"
					onInput={(e) => onFileChange(e.currentTarget.value)}
					value={initValue}
				/>
			);
		},
	},
	ImagePath: {
		getInputField: (props) => {
			let initValue =
				props.row.data[props.colUUID] !== undefined
					? (props.row.data[
							props.colUUID
					  ] as SheetTypes['ImagePath']['_valueType'])
					: '';

			const onFileChange = (path: string) => {
				setCurrentSheet(
					'rows',
					props.row.id,
					'data',
					props.colUUID,
					path
				);
			};

			return (
				<input
					type="file"
					class="input input-bordered min-w-full"
					onInput={(e) => onFileChange(e.currentTarget.value)}
					value={initValue}
				/>
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
			return (
				<input
					type="checkbox"
					class="input input-bordered min-w-full"
				/>
			);
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
			<input
				type="number"
				value={prop.state === undefined ? 0 : prop.state.value}
				class={`input input-bordered flex-1 bg-base-200 ${
					!active() ? 'input-disabled text-base-content' : ''
				}`}
				disabled={!active()}
				onInput={(v) => {
					setValue(v.currentTarget.valueAsNumber);
				}}
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

function getNumericSettings(props: {
	settingData: {
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
}): JSX.Element {
	const [state, setState] = createSignal(props.settingData);

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
}

function unwrapSetting<
	SettingType extends { [T in string]: { active: boolean; value: any } }
>(settings: SettingType) {
	type Settings = typeof settings;
	type SettingsKeys = keyof Settings;
	const KEYS =
		settings === undefined
			? ([''] as const)
			: (Object.keys(settings) as Array<SettingsKeys>);
	return (KEYS as string[]).reduce((obj, key) => {
		if (
			settings === undefined ||
			key === '' ||
			settings[key].active === false
		)
			return obj;
		obj[key as SettingsKeys] = settings[key as SettingsKeys].value;
		return obj;
	}, {} as { [x in SettingsKeys]?: Settings[SettingsKeys]['value'] });
}
