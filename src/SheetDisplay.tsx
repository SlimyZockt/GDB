import { For } from 'solid-js';
import {
	Sheet,
	sheets,
} from './stores/data';

export function SheetDisplay(
	props: {
		onsSheetSwitched: (newSheetUUID: string) => void;
		selectedSheetUUID: string
	}
) {
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
						class:tab-active={sheet.uuid === props.selectedSheetUUID}
						onClick={() =>
							props.onsSheetSwitched(sheet.uuid)
						}
					>
						{sheet.id}
					</button>
				)}
			</For>
		</div>
	);
}
