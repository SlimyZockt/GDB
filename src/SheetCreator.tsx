import { createSignal, untrack } from 'solid-js';

import { sheets, setSheets, Sheet } from './stores/data';

export function SheetCreator(props: { sheet: Sheet; onSheetCreated: (sheet: Sheet) => void, btnClass: string, btnText: string}) {
	const [sheetName, setSheetName] = createSignal('');
	const [nameIsValid, setNameIsValid] = createSignal(false);
	const [dialogRef, setDialogRef] = createSignal<HTMLDialogElement>();

	const validateSheetName = (name: string) => {
		if (
			sheets.find((s) => s.id === name) !== undefined ||
			name.length === 0
		) {
			return false;
		}
		return true;
	};

	const createSheet = () => {
		const NAME = untrack(sheetName);
		if (!nameIsValid()) return;

		let uuid = crypto.randomUUID();

		while (sheets.find((s) => s.uuid === uuid) !== undefined) {
			uuid = crypto.randomUUID();
		}

		const NEW_SHEET: Sheet = {
			uuid: uuid,
			id: NAME,
			rows: [],
			columns: [],
		};

		setSheets((sheets) => [...sheets, NEW_SHEET]);

		props.onSheetCreated(NEW_SHEET);
		setSheetName('');
	};

	return (
		<div class="p-0 flex ">
			<button
				onClick={() => dialogRef()?.showModal()}
				class={`${props.btnClass} flex-1 `}
			>
				{props.btnText}
			</button>
			<dialog class="modal" ref={setDialogRef}>
				<form method="dialog" class="modal-box">
					<input
						type="checkbox"
						id="sheet-creation-popup"
						class="modal-toggle"
					/>
					<button class="btn btn-sm btn-circle absolute right-2 top-2">
						✕
					</button>
					<h3 class="font-bold text-lg">Sheet Creation</h3>
					<br />
					<label class="input-group" for="column-name">
						<span>Sheet Name:</span>
						<input
							id="column-name"
							type="text"
							placeholder="New Sheet"
							class="input input-bordered flex-1"
							value={sheetName()}
							oninput={(e) => {
								setNameIsValid(
									validateSheetName(e.currentTarget.value)
								);
								setSheetName(e.currentTarget.value);
							}}
						/>
					</label>
					<br />
					<button
						class={`btn min-w-full ${
							nameIsValid() ? 'btn-primary ' : 'btn-disabled'
						}`}
						disabled={!nameIsValid()}
						onClick={createSheet}
					>
						Create
					</button>
				</form>
				<form method="dialog" class="modal-backdrop">
					<button>close</button>
				</form>
			</dialog>
		</div>
	);
}
