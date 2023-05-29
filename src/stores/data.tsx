import type { ColumnDef } from '@tanstack/solid-table';
import { createStore } from 'solid-js/store';
import { For, JSX, createSignal, createEffect } from 'solid-js';

import './InputStyle.css';

export const [currentSheet, setCurrentSheet] = createSignal<Sheet>();
export const [sheets, setSheets] = createStore<Sheet[]>([]);
export const [stuff, setStuff] = createSignal(false);

createEffect(() => {
	if (currentSheet() === undefined) return;
	let new_sheet = sheets.filter((s) => s.uuid !== currentSheet().uuid);
	setSheets([...new_sheet, currentSheet()]);
})


type BaseTypes = SheetTypes[keyof SheetTypes]['defaultValue'];

export type ColumnTypes = keyof SheetTypes;

export type Column = {
	uuid: string;
	name: string;
	type: ColumnTypes;
	settingData?: SettingsData;
};

type List = Column[];
type UniqueProperty = Column[];

export type DataTypes = BaseTypes | List | UniqueProperty;

export type Row = {
	id: number;
	uuid: string;
	data: {
		[key: string]: DataTypes;
	};
};

export type TypeSetting = {
	readonly name: string;
	readonly inputType: 'number' | 'text' | 'enum';
	readonly active: boolean;
};

export type Settings = { [x in ColumnTypes]?: TypeSetting[] };
export type SettingsData = {
	[x: string]: number | string | boolean | string[];
};

export type Sheet = {
	uuid: string;
	id: string;
	rows: Row[];
	columns: Column[];
	columnDef: ColumnDef<{ [key: string]: DataTypes }>[];
};

type StringLiteral<T> = T extends string
	? string extends T
		? never
		: T
	: never;

type SettingsProps = Record<
	any,
	{
		value: any;
		active: boolean;
	}
>;

type Type<T, X extends string> = {
	[x in StringLiteral<X>]: {
		getSettingsField?: (
			props: Record<
				any,
				{
					value: any;
					active: boolean;
				}
			>,
			onSettingsChanged?: (
				value: Record<
					any,
					{
						value: any;
						active: boolean;
					}
				>
			) => void
		) => JSX.Element;
		getInputField: (
			settings: Record<
				any,
				{
					value: any;
					active: boolean;
				}
			> | undefined,
			rowUUID: string,
			colUUID: string,
		) => JSX.Element;
		displayName?: string;
		defaultValue: T;
	};
};

export type SheetTypes = Type<string, 'Text'> &
	Type<number, 'Int'> &
	Type<number, 'Float'> &
	Type<{ r: number; g: number; b: number }, 'ColorRGB'> &
	Type<{ sheetUUID: string; sheetID: string }, 'SheetReference'> &
	Type<
		{ sheetUUID: string; sheetID: string; rowUUID: string; rowId: string },
		'LineReference'
	> &
	Type<string, 'ImagePath'> &
	Type<string, 'FilePath'> &
	Type<Date, 'Date'> &
	Type<string[], 'Enum'> &
	Type<boolean, 'Boolean'>;

export const TypeData: SheetTypes = {
	Float: {
		defaultValue: 0,
		getInputField: () => {
			return (
				<input
					type="number"
					placeholder="0"
					class="input input-bordered"
				/>
			);
		},
		getSettingsField: getNumericSettings,
	},
	Int: {
		defaultValue: 0,
		getSettingsField: getNumericSettings,
		getInputField: () => {
			return (
				<input
					type="number"
					placeholder="0"
					class="input input-bordered"
				/>
			);
		},
	},
	Text: {
		defaultValue: '',
		getInputField: () => {
			return (
				<input
					type="text"
					placeholder=""
					class="input input-bordered"
				/>
			);
		},
	},
	ColorRGB: {
		// validation: z.object({ r: z.number(), g: z.number(), b: z.number() }),
		defaultValue: {
			r: 0,
			g: 0,
			b: 0,
		},
		getInputField: (_, rowUUID, colUUID) => {
			const [colorHEX, setColorHEX] = createSignal('#000000');

			const HEX2RGB = (hexColor: string) => {
				return {
					r: Number.parseInt(hexColor.slice(1, 3), 16),
					g: Number.parseInt(hexColor.slice(3, 5), 16),
					b: Number.parseInt(hexColor.slice(5, 7), 16),
				};
			};


			createEffect(() => {
				setCurrentSheet((s) => {
					let row = s.rows.find(r => r.uuid === rowUUID);
					if (row === undefined) return;
					row.data[colUUID] = HEX2RGB(colorHEX())
					return s;
				})
			})

			return (
				<label
					class={`flex items-start h-12 w-12 p-0 border-base-content border rounded-full`}
					style={`background-color: ${colorHEX()}`}
				>
					<input
						type="color"
						class="invisible"
						onInput={(e) => setColorHEX(e.currentTarget.value)}
					/>
				</label>
			);
		},
	},
	Date: {
		defaultValue: new Date(),
		getInputField: () => {
			return <input type="date" class="input input-bordered" />;
		},
	},
	Enum: {
		defaultValue: [],
		getInputField: () => {
			return (
				<select>
					<For each={['']}>{(v) => <option>v</option>}</For>
				</select>
			);
		},
	},
	FilePath: {
		defaultValue: '',
		getInputField: () => {
			return <input type="file" class="input input-bordered" />;
		},
	},
	ImagePath: {
		defaultValue: '',
		getInputField: () => {
			return <input type="file" class="input input-bordered" />;
		},
	},
	LineReference: {
		defaultValue: {
			sheetUUID: '',
			sheetID: '',
			rowUUID: '',
			rowId: '',
		},
		getInputField: () => {
			return (
				<select>
					<For each={['']}>{(v) => <option>v</option>}</For>
				</select>
			);
		},
	},
	SheetReference: {
		defaultValue: {
			sheetUUID: '',
			sheetID: '',
		},
		getInputField: () => {
			return (
				<select>
					<For each={['']}>{(v) => <option>v</option>}</For>
				</select>
			);
		},
	},
	Boolean: {
		defaultValue: false,
		getInputField: () => {
			return <input type="checkbox" class="input input-bordered" />;
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

function getNumericSettings(
	props: Record<'max' | 'min' | 'step', { active: boolean; value: number }>,
	onSettingsChanged?: (
		value: Record<
			'max' | 'min' | 'step',
			{ active: boolean; value: number }
		>
	) => void
): JSX.Element {
	const [state, setState] =
		createSignal<
			Record<'max' | 'min' | 'step', { active: boolean; value: number }>
		>(props);

	createEffect(() => {
		if (onSettingsChanged !== undefined) {
			onSettingsChanged(state());
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
