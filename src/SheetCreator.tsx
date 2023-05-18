import { createEffect, createSignal } from 'solid-js';
import { z } from 'zod';

import { sheets, setSheet, setCurrentSheetUUID } from './stores/data';

export function SheetCreator() {
	const [sheetName, setSheetName] = createSignal('');
	const [nameIsValid, setNameIsValid] = createSignal(false);

	createEffect(() => {
		validateSheetName(sheetName());
	});

	const validateSheetName = (name: string) => {
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
		if (sheets.find((s) => s.id === sheetName()) !== undefined) return;

		let uuid = crypto.randomUUID();

		while (sheets.find((s) => s.uuid === uuid) !== undefined) {
			uuid = crypto.randomUUID();
		}

		setCurrentSheetUUID(uuid);
		setSheet((s) => [
			...s,
			{
				uuid,
				id: sheetName(),
				rows: [],
				columns: [],
				columnDef: [],
			},
		]);

		setSheetName('');
		console.log(sheets);
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
