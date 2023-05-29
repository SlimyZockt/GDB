import { For, Show, createEffect } from 'solid-js';
import structuredClone from '@ungap/structured-clone';
import {
	Sheet,
	currentSheet,
	setCurrentSheet,
	setSheets,
	sheets,
} from './stores/data';
import { Store, createMutable } from 'solid-js/store';

export function SheetDisplay() {
	const updateTable = (sheetUUID: string) => {
        let t = sheets.find((s) => s.uuid === sheetUUID);
		let newSheet = JSON.parse(JSON.stringify(t));
		if (newSheet === undefined) return;
		setCurrentSheet(newSheet);
	};

	return (
		<div class="tabs bg-neutral flex justify-center max-h-fit">
			<For each={JSON.parse(JSON.stringify(sheets)).sort((a, b) => a.id.localeCompare(b.id))}>
				{(sheet) => (
					<button
						class="tab tab-bordered"
						class:tab-active={sheet.uuid === currentSheet().uuid}
						onClick={() => updateTable(sheet.uuid)}
					>
						{sheet.id}
					</button>
				)}
			</For>
		</div>
	);
}
