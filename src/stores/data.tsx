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
import { set, z } from 'zod';
import { dialog } from '@tauri-apps/api';

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
					value={props.value}
					isInt={false}
					class="min-w-full"
					max={props.settings?.max}
					min={props.settings?.min}
					step={
						props.settings !== undefined &&
						props.settings.step !== undefined
							? props.settings.step
							: 'any'
					}
				/>
			);
		},
		getSettingsField: getNumericSettings('Float'),
		defaultValue: 0,
	},
	Int: {
		getSettingsField: getNumericSettings('Int'),
		getInputField: (props) => {
			return (
				<NumberInput
					onValueChanged={(v) => {
						props.onValueChanged(v);
					}}
					value={props.value}
					isInt={true}
					class="min-w-full"
					max={props.settings?.max}
					min={props.settings?.min}
					step={
						props.settings === undefined ||
						props.settings.step === undefined
							? 'any'
							: props.settings.step
					}
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

			const updateState = (newState: string, id: number) => {
				if (props.settingData === undefined) return;

				props.settingData.possibleValues[id] = newState;

				if (props.onSettingsChanged === undefined) return;
				props.onSettingsChanged({
					possibleValues: props.settingData.possibleValues,
				});
				if (!isValid(props.settingData.possibleValues)) {
					props.onSettingsChanged('Error');
				}
			};

			const isCurrentStateValid = (states: string[], state: string) =>
				states.filter((s) => s === state).length > 1;

			return (
				<div>
					<div class="border-base-content border-[1px] min-w-full bg-base-200 p-1 rounded-md">
						<Index each={props.settingData?.possibleValues}>
							{(value, i) => (
								<label class="input-group p-1">
									<input
										type="text"
										class={`input flex-1 ${
											props.settingData !== undefined &&
											isCurrentStateValid(
												props.settingData
													?.possibleValues,
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
										onClick={(_) => {
											const values =
												props.settingData?.possibleValues.filter(
													(_, id) => id !== i
												);
											if (
												values === undefined ||
												props.onSettingsChanged ===
													undefined
											)
												return;
											props.onSettingsChanged({
												possibleValues: values,
											});

											if (!isValid(values)) {
												props.onSettingsChanged(
													'Error'
												);
											}
										}}
									>
										X
									</button>
								</label>
							)}
						</Index>
					</div>
					<button
						class="btn min-w-full"
						onClick={() => {
							console.log(props.settingData);
							console.log(props.onSettingsChanged);

							if (props.onSettingsChanged === undefined) return;

							if (props.settingData === undefined) {
								props.onSettingsChanged({
									possibleValues: [`newEnum1`],
								});
								return;
							}

							props.onSettingsChanged({
								possibleValues: [
									...props.settingData.possibleValues,
									`newEnum${
										props.settingData.possibleValues
											.length + 1
									}`,
								],
							});

							if (!isValid(props.settingData.possibleValues)) {
								props.onSettingsChanged('Error');
							}
						}}
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

			const openFile = async (isTauri: boolean) => {
				if (!isTauri) {
					var input = document.createElement('input');
					input.type = 'file';
					if (props.settings !== undefined) {
						input.accept = props.settings.Filenames.join(',');
					}

					input.oninput = (e) => {
						// getting a hold of the file reference
						const EVENT = e as InputEvent & {
							currentTarget: HTMLInputElement;
							target: HTMLInputElement;
						};
						var files = EVENT.currentTarget.files;

						if (files === null) return;
						var file = files.item(0);
						let url = '';
						if (file !== undefined && file !== null) {
							url = URL.createObjectURL(file);
						}
						props.onValueChanged(url);
					};
					input.click();
				}

				if (isTauri) {
					let extensions: string[] = [];

					if (props.settings !== undefined) {
						extensions = props.settings?.Filenames.map((f) =>
							f.startsWith('.') ? f.slice(1) : f
						);
					}

					const filePath = await dialog.open({
						multiple: false,
						filters: [
							{
								name: 'GearDB Files',
								extensions: extensions,
							},
						],
					});

					if (typeof filePath !== 'string') return;

					props.onValueChanged(filePath);
				}
			};

			return (
				<button
					class="file-input file-input-bordered w-full min-w-full"
					onClick={(_) => openFile(window.__TAURI__ !== undefined)}
					value={props.value}
				> 
					{props.value === "" ? "select file" : `"...${props.value.slice(props.value.lastIndexOf("\\"))}"`}
				</button>
			);
		},
		getSettingsField(props) {
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

			const updateState = (newState: string, id: number) => {
				if (props.settingData === undefined) return;

				props.settingData.Filenames[id] = newState;

				if (props.onSettingsChanged === undefined) return;
				props.onSettingsChanged({
					Filenames: props.settingData.Filenames,
				});
				if (!isValid(props.settingData.Filenames)) {
					props.onSettingsChanged('Error');
				}
			};

			const isCurrentStateValid = (states: string[], state: string) =>
				states.filter((s) => s === state).length > 1;

			return (
				<div>
					<div class="border-base-content border-[1px] min-w-full bg-base-200 p-1 rounded-md">
						<Index each={props.settingData?.Filenames}>
							{(value, i) => (
								<label class="input-group p-1">
									<input
										type="text"
										class={`input flex-1 ${
											props.settingData !== undefined &&
											isCurrentStateValid(
												props.settingData.Filenames,
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
										onClick={(_) => {
											const values =
												props.settingData?.Filenames.filter(
													(_, id) => id !== i
												);
											if (
												values === undefined ||
												props.onSettingsChanged ===
													undefined
											) {
												return;
											}
											props.onSettingsChanged({
												Filenames: values,
											});
											if (!isValid(values)) {
												props.onSettingsChanged(
													'Error'
												);
											}
										}}
									>
										X
									</button>
								</label>
							)}
						</Index>
					</div>
					<button
						class="btn min-w-full"
						onClick={() => {
							if (props.onSettingsChanged === undefined) return;

							if (props.settingData === undefined) {
								props.onSettingsChanged({
									Filenames: [`.1`],
								});
								return;
							}

							props.onSettingsChanged({
								Filenames: [
									...props.settingData.Filenames,
									`.${
										props.settingData.Filenames.length + 1
									}`,
								],
							});

							if (!isValid(props.settingData.Filenames)) {
								props.onSettingsChanged('Error');
							}
						}}
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
					class="select select-bordered select-ghost min-w-full bg-base-100"
					onInput={(v) => props.onValueChanged(v.currentTarget.value)}
				>
					<For
						each={[''].concat(
							props.sheet.rows.map((r) => r.id.toString())
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
					class="select select-bordered select-ghost min-w-full"
					onInput={(v) => props.onValueChanged(v.currentTarget.value)}
				>
					<For each={[''].concat(sheets.map((s) => s.id))}>
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

function NumberSettingInput(props: {
	label: string;
	state?: number;
	onStateChanged?: (state: number | undefined) => void;
	isInt: boolean;
	min?: number;
}) {
	const [active, setActive] = createSignal(
		props.state === undefined ? false : true
	);

	return (
		<label class="input-group">
			<span>{props.label}</span>

			<NumberInput
				onValueChanged={(v) => {
					if (props.onStateChanged !== undefined) {
						props.onStateChanged(active() ? v : undefined);
					}
				}}
				value={props.state === undefined ? 0 : props.state}
				isInt={props.isInt}
				disabled={!active()}
				class={`input input-bordered flex-1 bg-base-200 ${
					!active() ? 'input-disabled text-base-content' : ''
				}`}
				min={props.min}
				step="any"
			/>
			<span>
				<input
					type="checkbox"
					class={'checkbox'}
					checked={active()}
					onInput={(v) => {
						setActive(v.currentTarget.checked);
						if (props.onStateChanged === undefined) return;
						props.onStateChanged(
							v.currentTarget.checked ? props.state : undefined
						);
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
		return (
			<div class="grid gap-3">
				<NumberSettingInput
					label="max:"
					isInt={type === 'Int' ? true : false}
					state={props.settingData?.max}
					onStateChanged={(v) => {
						if (props.onSettingsChanged === undefined) return;
						props.onSettingsChanged({
							...props.settingData,
							max: v,
						});
					}}
				/>
				<NumberSettingInput
					label="min:"
					state={props.settingData?.min}
					isInt={type === 'Int' ? true : false}
					onStateChanged={(v) => {
						if (props.onSettingsChanged === undefined) return;
						props.onSettingsChanged({
							...props.settingData,
							min: v,
						});
					}}
				/>
				<NumberSettingInput
					label="step:"
					state={props.settingData?.step}
					isInt={type === 'Int' ? true : false}
					onStateChanged={(v) => {
						if (props.onSettingsChanged === undefined) return;
						props.onSettingsChanged({
							...props.settingData,
							step: v,
						});
					}}
					min={0}
				/>
			</div>
		);
	};
}

function NumberInput(props: {
	value: number;
	step?: number | 'any';
	max?: number;
	min?: number;
	isInt?: boolean;
	disabled?: boolean;
	class?: string;
	onValueChanged: (value: number) => void;
}) {
	const [schema, setSchema] = createSignal(z.number().safe());

	const updateSchema = (settings: {
		max: number | undefined;
		min: number | undefined;
		step: number | 'any' | undefined;
	}) => {
		let validator = z.number().safe();

		if (props.isInt) {
			validator = validator.int();
		}

		if (settings.step !== undefined && settings.step !== 'any') {
			validator = validator.step(settings.step);
		}

		if (settings.max !== undefined) {
			validator = validator.max(settings.max);
		}
		if (settings.min !== undefined) {
			validator = validator.min(settings.min);
		}

		return validator;
	};

	const updateOldValue = (
		validatedValue: z.SafeParseReturnType<number, number>,
		settings: {
			max: number | undefined;
			min: number | undefined;
			step: number | 'any' | undefined;
		}
	) => {
		if (validatedValue.success === true) return;

		const ISSUES = validatedValue.error.issues.map((x) => x.code);

		if (ISSUES.includes(z.ZodIssueCode.too_small)) {
			props.onValueChanged(
				settings.min === undefined
					? Number.MIN_SAFE_INTEGER
					: settings.min
			);
		}

		if (ISSUES.includes(z.ZodIssueCode.too_big)) {
			props.onValueChanged(
				settings.max === undefined
					? Number.MAX_SAFE_INTEGER
					: settings.max
			);
		}
		if (ISSUES.includes(z.ZodIssueCode.not_multiple_of)) {
			console.log(props.value);

			let newValue = props.value;

			if (settings.step !== undefined && settings.step !== 'any') {
				if (props.value === 0 && 1 / props.value === -Infinity) {
					newValue = -settings.step;
				}

				newValue = props.value - (props.value % settings.step);
			}

			props.onValueChanged(newValue);
		}
	};

	createEffect(() => {
		((settings: {
			max: number | undefined;
			min: number | undefined;
			step: number | 'any' | undefined;
		}) => {
			let newSchema = updateSchema(settings);

			updateOldValue(newSchema.safeParse(props.value), settings);

			setSchema(newSchema);
		})({
			max: props.max,
			min: props.min,
			step: props.step,
		});
	});

	const onValueChanged = (
		newValue: string,
		settings: {
			max: number | undefined;
			min: number | undefined;
			step: number | 'any' | undefined;
		}
	) => {
		let validated = schema().safeParse(Number(newValue));

		if (
			validated.success === true &&
			!newValue.includes('.') &&
			!newValue.includes(' ') &&
			newValue.length !== 0
		) {
			props.onValueChanged(validated.data);
			console.log(validated.data);
		} else if (newValue === '0-') {
			props.onValueChanged(
				settings.step !== undefined && settings.step !== 'any'
					? -settings.step
					: -1
			);
		} else if (newValue.length === 0 || newValue === '-') {
			props.onValueChanged(0);
		} else {
			const OLD_VALID_NUM = props.value;
			props.onValueChanged(OLD_VALID_NUM);
		}

		updateOldValue(validated, settings);
	};

	return (
		<input
			type="text"
			class={`input input-bordered ${props.class}`}
			onInput={(e) =>
				onValueChanged(e.currentTarget.value, {
					max: props.max,
					min: props.min,
					step: props.step,
				})
			}
			value={props.value}
			disabled={props.disabled}
		/>
	);
}
