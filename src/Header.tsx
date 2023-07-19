import { currentSheet } from './stores/data';

export function Header() {
	return (
		<div class="navbar bg-base-300">
			<div class="flex-1">
				<h1 class="text-2xl text-center">CentBase</h1>
			</div>
			<div class="flex-none">
				<ul class="flex justify-around gap-2">
					<li>
						<label class="btn btn-outline btn-neutral">
							Save File
						</label>
					</li>
					<li>
						<label class="btn btn-outline btn-neutral">
							Open File
						</label>
					</li>
					<li>
						<label
							for={`${
								currentSheet.uuid.length === 0
									? ''
									: 'column-creation-popup'
							}`}
							class={`btn  ${
								currentSheet.uuid.length === 0
									? 'btn-disabled'
									: 'btn-outline btn-accent '
							}`}
						>
							new Column
						</label>
					</li>
					<li>
						<label
							class="btn btn-accent btn-outline"
							for="sheet-creation-popup"
						>
							new Sheet
						</label>
					</li>
				</ul>
			</div>
		</div>
	);
}
