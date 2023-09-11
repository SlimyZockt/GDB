import { Component, createSignal } from 'solid-js';
import { Sheet, setSheets, sheets } from './stores/data';

export function NewFileDialog(props: {
 	hasSaved: boolean;
	isTauri: boolean;
	onConfirmedSavingFile: (isSavingOldFile: boolean, isTauri: boolean) => void;
}) {
	const [dialogRef, setDialogRef] = createSignal<HTMLDialogElement>();

	return (
		<div class='min-w-full flex'>
			<button
				class="btn btn-sm btn-neutral flex-1"
				onClick={() =>
					props.hasSaved
						? props.onConfirmedSavingFile(false, props.isTauri)
						: dialogRef()?.showModal()
				}
			>
				{props.isTauri ? 'new File' : 'clear Data'}
			</button>
			<dialog class="modal" ref={setDialogRef}>
				<div class="modal-box">
					<h3 class="font-bold text-lg text-center">
						Do you want to save the current File?
					</h3>
					<br></br>
					<div class="modal-action">
						<form method="dialog" class="gap-2">
							<div class="flex gap-2">
								<button
									class="btn btn-sm btn-primary"
									onClick={() =>
										props.onConfirmedSavingFile(
											false,
											props.isTauri
										)
									}
								>
									No
								</button>
								<button
									class="btn btn-error btn-sm "
									onClick={() =>
										props.onConfirmedSavingFile(
											true,
											props.isTauri
										)
									}
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
