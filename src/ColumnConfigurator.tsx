import { Component, JSX, createSignal } from 'solid-js';
import { Column, SettingsData, TypeData } from './stores/data';
import { Dynamic } from 'solid-js/web';

export function ColumnConfigurator(props: {
	children: JSX.Element;
	btnClass: string;
	column: Column;
	onSettingChanged: (newSettings: SettingsData) => void;
	onColumnDeleted: (columnUUID: string) => void;
}) {
	const [dialogRef, setDialogRef] = createSignal<HTMLDialogElement>();

	const [settings, setSettings] = createSignal(props.column.settingData);

	return (
		<div class="flex">
			<button
				class={props.btnClass}
				onClick={() => dialogRef()?.showModal()}
			>
				{props.children}
			</button>
			<dialog class="modal" ref={setDialogRef}>
				<div class="modal-box">
					<form method="dialog">
						<button class="btn btn-sm btn-circle btn-ghost absolute right-2 top-2">
							✕
						</button>
					</form>
					<h3 class="font-bold text-lg ">Sheet JSON</h3>
					<br></br>
					<div class="w-full gap-2">
						<Dynamic
							component={
								TypeData[props.column.type].getSettingsField
							}
							settingData={settings()}
							onSettingsChanged={(s: SettingsData | 'Error') => {
								if (s === 'Error') return;
								setSettings(s);
							}}
						/>
					</div>
					<div class="modal-action">
						<form method="dialog" class="flex-1">
							<div class="flex gap-2 min-w-full justify-between">
								<button
									class="btn btn-error"
									onClick={() => {props.onColumnDeleted(props.column.uuid)}}
								>
									delete Column
								</button>
								<button
									class="btn btn-primary"
									onClick={() =>
										props.onSettingChanged(settings())
									}
								>
									save
								</button>
							</div>
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
