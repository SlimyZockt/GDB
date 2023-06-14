import { createEffect, createSignal, untrack } from 'solid-js';
import { z } from 'zod';

import {
	sheets,
	setSheets,
	setCurrentSheet,
	Sheet,
	currentSheet,
} from './stores/data';

export function SheetCreator() {
	const [sheetName, setSheetName] = createSignal('');
	const [nameIsValid, setNameIsValid] = createSignal(false);

	createEffect(() => {
		validateSheetName(sheetName());
	});

	const validateSheetName = (name: string) => {
		// if (sheets === undefined || sheets.length === 1) return;
		if (
			sheets.find((s) => s.id === name) !== undefined ||
			name.length === 0
		) {
			setNameIsValid(false);
			return;
		}
		setNameIsValid(true);
	};

	const createSheet = () => {
		const NAME = untrack(sheetName);
		if (sheets.find((s) => s.id === NAME) !== undefined) return;

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

		setSheets((sheets) => {
			let new_sheets = [...sheets, NEW_SHEET];
			new_sheets = new_sheets.map((s) => {
				return s.uuid === currentSheet.uuid
					? JSON.parse(JSON.stringify(currentSheet))
					: s;
			});

			return new_sheets;
		});
		// console.log(sheets);
		// console.log(sheets);

		setCurrentSheet(NEW_SHEET);
		setSheetName('');
	};

	return (
		<>
			<input
				type="checkbox"
				id="sheet-creation-popup"
				class="modal-toggle"
			/>
			<div class="modal">
				<div class="modal-box relative">
					<label
						for="sheet-creation-popup"
						class="btn btn-sm btn-circle absolute right-2 top-2"
					>
						✕
					</label>
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
							oninput={(e) => setSheetName(e.currentTarget.value)}
						/>
					</label>
					<br />
					<button
						class="btn btn-primary min-w-full"
						class:btn-disabled={!nameIsValid()}
						onClick={createSheet}
					>
						Create
					</button>
				</div>
			</div>
		</>
	);
}
