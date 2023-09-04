import { Component, createSignal } from 'solid-js';
import { Sheet, setSheets, sheets } from './stores/data';

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
				<form method="dialog" class="modal-box">
					<h3 class="font-bold text-lg text-center">
						Are sure you want to delete the Sheet '{props.sheetId}'?
					</h3>
					<br></br>
					<div class="flex justify-center w-full gap-2">
						<button class="btn btn-accent btn-sm">No</button>
						<button
							class="btn btn-error btn-sm"
							onClick={() => {
								setSheets((sheets) => [
									...sheets.filter(
										(sheet) =>
											sheet.uuid !== props.sheetUUID
									),
								]);
								console.log(sheets);
								console.log(sheets[0]);

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
				<form method="dialog" class="modal-backdrop">
					<button>close</button>
				</form>
			</dialog>
		</div>
	);
}
