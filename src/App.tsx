import { createSignal } from 'solid-js';
import { Table } from './Table';
import { setSheets, Sheet } from './stores/data';
import { Footer } from './Footer';
import { SheetDisplay } from './SheetDisplay';
import { SheetCreator } from './SheetCreator';

function App() {
	const [sheet, setSheet] = createSignal<Sheet>({
		uuid: '',
		id: '',
		rows: [],
		columns: [],
	});

	const switchSheet = (newSheetUUID: string) => {
		setSheets((sheets) => {
			let newSheets = sheets.map((s) => {
				if (s.uuid === sheet().uuid) {
					return sheet();
				}
				return s;
			});

			for (const sheet of sheets) {
				if (sheet.uuid === newSheetUUID) {
					setSheet(sheet);
				}
			}
			return newSheets;
		});
	};

	return (
		<div class="min-h-screen grid grid-rows-[auto_1fr_auto]">
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
							<SheetCreator
								onSheetCreated={(s) => {
									switchSheet(s.uuid);
								}}
								sheet={sheet()}
							/>
						</li>
					</ul>
				</div>
			</div>
			<div
				class={`${
					sheet().uuid.length === 0
						? 'hero bg-base'
						: 'grid grid-rows-[auto_1fr]'
				}`}
			>
				{sheet().uuid.length > 0 ? (
					<>
						<SheetDisplay
							onsSheetSwitched={switchSheet}
							selectedSheetUUID={sheet().uuid}
						/>
						<Table
							sheet={sheet()}
							onSheetChanged={(sheet) => {
								setSheet({ ...sheet });
							}}
						/>
						<div>{JSON.stringify(sheet())}</div>
					</>
				) : (
					<div class="hero-content text-center">
						<p class="py-6">no sheet available</p>
					</div>
				)}
			</div>
			<Footer />
		</div>
	);
}

export default App;
