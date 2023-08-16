import { For, Show, createEffect } from 'solid-js';
import {
	Table,
	currentSheet,
	setCurrentSheet,
	setSheets,
	sheets,
} from './stores/data';

export function SheetDisplay() {

	const updateTable = (sheetUUID: string) => {
    	const TEMP_SHEET = sheets.find((s) => s.uuid === sheetUUID);
		if (TEMP_SHEET === undefined) return;
		const NEXT_SHEET: Sheet = JSON.parse(JSON.stringify(TEMP_SHEET));

		setSheets((sheets) => {
			let new_sheets = sheets.map((s) => {
				return s.uuid === currentSheet.uuid
					? (JSON.parse(JSON.stringify(currentSheet)) as Sheet)
					: s;
			});

			return new_sheets;
		});

		setCurrentSheet(NEXT_SHEET);
	};

	const sortedSheetsNames =  (sheets: Sheet[]) => {
		let names: {id: string, uuid: string}[] = [];
		for (let sheet of sheets) {
			names.push({id: sheet.id, uuid: sheet.uuid})
		}
		return names.sort((a, b) => a.id.localeCompare(b.id));
	}

	return (
		<div class="tabs bg-neutral flex justify-center max-h-fit">
			<For each={sortedSheetsNames(sheets)}>
				{(sheet) => (
					<button
						class="tab tab-bordered"
						class:tab-active={sheet.uuid === currentSheet.uuid}
						onClick={() => updateTable(sheet.uuid)}
					>
						{sheet.id}
					</button>
				)}
			</For>
		</div>
	);
}
