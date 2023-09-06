import { Component, createSignal } from 'solid-js';
import { Table, setSheets, sheets } from './stores/data';

export function DeleteSheetDialog(props: {
	sheetUUID: string;
	sheetId: string;
	onSheetDeleted: (newSheet: Sheet) => void;
}) {
	const [dialogRef, setDialogRef] = createSignal<HTMLDialogElement>();

	return (
		<div>
			<button
				class="btn btn-sm btn-error"
				onClick={() => dialogRef()?.showModal()}
			>
				delete Sheet
			</button>
			<dialog class="modal" ref={setDialogRef}>
				<div class="modal-box">
					<h3 class="font-bold text-lg text-center">
						Are sure you want to delete the Sheet '{props.sheetId}'?
					</h3>
					<br></br>
					<div class="modal-action">
						<form method="dialog" class="gap-2">
							<div class="flex gap-2">
								<button class="btn btn-sm btn-primary">
									No
								</button>
								<button
									class="btn btn-error btn-sm "
									onClick={() => {
										setSheets((sheets) => [
											...sheets.filter(
												(sheet) =>
													sheet.uuid !==
													props.sheetUUID
											),
										]);

										props.onSheetDeleted(
											sheets.length === 0
												? {
														uuid: '',
														id: '',
														rows: [],
														columns: [],
												  }
												: sheets[0]
										);
									}}
								>
									Yes
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
