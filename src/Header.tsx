export function Header() {
	return (
		<div class="navbar bg-base-300">
			<div class="flex-1">
				<h1 class="text-2xl text-center">CentBase</h1>
			</div>
			<div class="flex-none">
				<ul class="menu menu-horizontal px-1 justify-around ">
					<li>
						<label class="btn mx-1">Save File</label>
					</li>
					<li>
						<label class="btn mx-1">Open File</label>
					</li>
					<li>
						<label
							class="btn mx-1 btn-accent text-neutral"
							for="sheet-creation-popup"
						>
							new Sheet
						</label>
					</li>
					<li>
						<label
							for="column-creation-popup"
							class="btn-accent text-neutral mx-1 btn"
						>
							new Column
						</label>
					</li>
				</ul>
			</div>
		</div>
	);
}
