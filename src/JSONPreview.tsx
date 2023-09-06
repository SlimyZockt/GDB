import { Component, JSX, createSignal } from "solid-js";
import { Sheet } from "./stores/data";

export function JSONPreview(props: {sheet: Sheet}): JSX.Element {
	const [dialogRef, setDialogRef] = createSignal<HTMLDialogElement>();

	return (
		<div>
			<button
				class="btn btn-sm btn-outline"
				onClick={() => dialogRef()?.showModal()}
			>
				Show sheet JSON
			</button>
			<dialog class="modal" ref={setDialogRef}>
				<div class="modal-box">
					<h3 class="font-bold text-lg text-center">Sheet JSON</h3>
					<br></br>
					<div class="flex justify-center w-full gap-2">
						{JSON.stringify(props.sheet)}
					</div>
					<div class="modal-action">
						<form method="dialog">
							<button class="btn">Close</button>
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