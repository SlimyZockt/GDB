import {
	Setter,
	Show,
	createEffect,
	createSignal,
	onMount,
	untrack,
} from 'solid-js';
import { Table } from './Table';
import { setSheets, Sheet, sheets } from './stores/data';
import { Footer } from './Footer';
import { SheetDisplay } from './SheetDisplay';
import { SheetCreator } from './SheetCreator';
import { DeleteSheetDialog } from './DeleteSheetDialog';
import './App';
import { dialog, fs, globalShortcut } from '@tauri-apps/api';
import { JSONPreview } from './JSONPreview';

type SaveData = {
	sheets: Sheet[];
	selectedSheet: string;
	hashCode: number;
};

function hashCode(str: string): number {
	var hash = 0,
		i,
		chr;
	if (str.length === 0) return hash;
	for (i = 0; i < str.length; i++) {
		chr = str.charCodeAt(i);
		hash = (hash << 5) - hash + chr;
		hash |= 0; // Convert to 32bit integer
	}
	return hash;
}

function createSaveData(currentSheet: Sheet): SaveData {
	let currentSheetUUID = currentSheet.uuid;

	setSheets((sheets) => {
		const ID = sheets.findIndex((s) => s.uuid === currentSheetUUID);

		sheets[ID] = currentSheet;
		return { ...sheets };
	});

	return {
		selectedSheet: currentSheetUUID,
		sheets: sheets,
		hashCode: hashCode(JSON.stringify(currentSheet)),
	};
}

function loadSaveData(saveData: SaveData): [Sheet, number] {
	console.log(saveData);

	let sheet = saveData.sheets.find((s) => s.uuid === saveData.selectedSheet);
	setSheets(saveData.sheets);
	if (sheet === undefined) {
		sheet = {
			uuid: '',
			id: '',
			rows: [],
			columns: [],
		};
	}
	return [sheet, saveData.hashCode];
}

function App() {
	const [sheet, setSheet] = createSignal<Sheet>({
		uuid: '',
		id: '',
		rows: [],
		columns: [],
	});

	const [sheetPath, setSheetPath] = createSignal<string>('');
	const [currentHash, setCurrentHash] = createSignal<number>(
		hashCode(JSON.stringify(sheets))
	);
	const [oldHash, setOldHash] = createSignal<number>(
		hashCode(JSON.stringify(sheets))
	);

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

	const openFile = async (platform: 'Web' | 'Tauri') => {
		if (platform === 'Web') {
			var input = document.createElement('input');
			input.type = 'file';
			input.accept = '.gdb';

			input.oninput = (e) => {
				// getting a hold of the file reference
				const EVENT = e as InputEvent & {
					currentTarget: HTMLInputElement;
					target: HTMLInputElement;
				};
				var files = EVENT.currentTarget.files;

				if (files === null) return;
				var file = files[0];

				// setting up the reader
				var reader = new FileReader();
				reader.readAsText(file, 'UTF-8');

				// here we tell the reader what to do when it's done reading...
				reader.onload = (readerEvent) => {
					if (readerEvent.target === null) return;
					var content = readerEvent.target.result; // this is the content!
					if (typeof content !== 'string') return;
					let saveData: SaveData = JSON.parse(content);
					let [sheet, hashCode] = loadSaveData(saveData);
					setSheet(sheet);
					setOldHash(hashCode);
				};
			};
			input.click();
		}

		if (platform === 'Tauri') {
			const filePath = await dialog.open({
				multiple: false,
				filters: [
					{
						name: 'GearDB Files',
						extensions: ['gdb'],
					},
				],
			});

			if (typeof filePath !== 'string') return;
			setSheetPath(filePath);

			const file = await fs.readTextFile(filePath);
			let saveData: SaveData = JSON.parse(file);
			let [sheet, hashCode] = loadSaveData(saveData);
			setSheet(sheet);
			setOldHash(hashCode);
			setCurrentHash(hashCode);
		}
	};

	const saveFile = async (platform: 'Web' | 'Tauri') => {
		const SAVE_DATA = createSaveData(sheet());
		const JSON_DATA = JSON.stringify(SAVE_DATA);

		if (platform === 'Web') {
			let file = new File([JSON_DATA], 'data.gdb', {
				type: 'application/json',
			});

			let url = URL.createObjectURL(file);

			var link = document.createElement('a');
			link.download = 'data';
			link.href = url;
			link.click();

			setOldHash(SAVE_DATA.hashCode);
			setCurrentHash(SAVE_DATA.hashCode);
			return;
		}

		if (platform === 'Tauri') {
			const filePath = await dialog.save({
				defaultPath: './data.gdb',
				filters: [
					{
						name: 'GearDB Files',
						extensions: ['gdb'],
					},
				],
			});

			if (filePath === null) return;
			setSheetPath(filePath);

			setOldHash(SAVE_DATA.hashCode);
			setCurrentHash(SAVE_DATA.hashCode);
			await fs.writeTextFile(filePath, JSON_DATA);
			return;
		}
	};

	const keyPressed = async (event: { keyCode: string; ctrl: boolean }) => {
		if (event.keyCode === 'KeyS' && event.ctrl === true) {
			console.log(sheetPath());

			if (sheetPath() != '') {
				console.log('saved');

				let json = JSON.stringify(createSaveData(sheet()));
				await fs.writeTextFile(sheetPath(), json);
			} else {
				await saveFile('Tauri');
			}
		}
	};

	onMount(() => {
		document.addEventListener('keydown', async (event) => {
			const KEY_EVENT = { keyCode: event.code, ctrl: event.ctrlKey };

			if (window.__TAURI__ === undefined) return;

			await keyPressed(KEY_EVENT);
		});
	});

	return (
		<div class="min-h-screen grid grid-rows-[auto_1fr_auto]">
			<div class="navbar bg-base-300">
				<div class="navbar-start">
					<ul class="menu menu-horizontal gap-2">
						<li>
							<details class="dropdown rounded-xl">
								<summary class="btn btn-sm">
									File
									{oldHash() === currentHash() ? '' : '*'}
								</summary>
								<ul class="dropdown-content menu p-2 shadow z-[1] bg-base-200 rounded-box gap-2">
									<li>
										<div class="flex p-0">
											<button
												class="btn btn-sm btn-neutral flex-1"
												onClick={() =>
													saveFile(
														window.__TAURI__ ===
															undefined
															? 'Web'
															: 'Tauri'
													)
												}
											>
												{window.__TAURI__ ===
												undefined ? (
													<>Download File</>
												) : (
													'New File'
												)}
											</button>
										</div>
									</li>
									<li
										class={`${
											window.__TAURI__ !== undefined
												? 'tooltip tooltip-right'
												: ''
										}`}
										data-tip={
											window.__TAURI__ !== undefined
												? 'Save DB (CTR + S)'
												: ''
										}
									>
										<div class="flex p-0">
											<button
												class="btn btn-sm btn-neutral flex-1"
												onClick={() =>
													saveFile(
														window.__TAURI__ ===
															undefined
															? 'Web'
															: 'Tauri'
													)
												}
											>
												{window.__TAURI__ ===
												undefined ? (
													<>Download File</>
												) : (
													'Save File'
												)}
											</button>
										</div>
									</li>
									<li>
										<div class="flex p-0">
											<button
												class="btn btn-sm btn-neutral flex-1"
												onClick={() =>
													openFile(
														window.__TAURI__ ===
															undefined
															? 'Web'
															: 'Tauri'
													)
												}
											>
												Open File
											</button>
										</div>
									</li>
								</ul>
							</details>
						</li>
						<li></li>
					</ul>
				</div>
				<div class="navbar-center">
					<h1 class="text-2xl text-center">GearDB</h1>
				</div>
				<div class="navbar-end"></div>
			</div>
			<div
				class={`${
					sheet().uuid.length === 0
						? 'hero bg-base'
						: 'grid grid-rows-[auto_1fr] pb-2'
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
								setCurrentHash(
									hashCode(JSON.stringify(sheets))
								);
							}}
						/>
					</>
				) : (
					<div class="hero-content text-center">
						<p class="py-6">no sheet available</p>
					</div>
				)}
			</div>
			<footer class="footer items-center p-3  bg-neutral text-neutral-content">
				<ul class="flex w-full">
					<li class="flex-1">
						<ul class="flex w-full gap-2">
							<li>
								<SheetCreator
									onSheetCreated={(s) => {
										switchSheet(s.uuid);
									}}
									btnClass="btn btn-sm btn-primary"
									btnText="new Sheet"
									sheet={sheet()}
								/>
							</li>
							<Show when={sheet().id !== ''}>
								<li class="">
									<DeleteSheetDialog
										sheetUUID={sheet().uuid}
										sheetId={sheet().id}
										onSheetDeleted={setSheet}
									/>
								</li>
								<li class="flex min-w-max"></li>
							</Show>
						</ul>
					</li>
					<li>
						<Show when={sheet().id !== ''}>
							<JSONPreview sheet={sheet()} />
						</Show>
					</li>
				</ul>
			</footer>
		</div>
	);
}

export default App;
