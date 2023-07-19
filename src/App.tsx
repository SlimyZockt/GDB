import {
	Show,
	createEffect,
	createMemo,
	createSignal,
	untrack,
} from 'solid-js';
import { Header } from './Header';
import { Sheet } from './Sheet';
import {
	sheets,
	currentSheet,
	stuff,
	setSheets,
	setCurrentSheet,
} from './stores/data';
import { Footer } from './Footer';
import { SheetDisplay } from './SheetDisplay';

function App() {
	return (
		<div class="min-h-screen grid grid-rows-[auto_1fr_auto]">
			<Header />
			<div
				class={`${
					currentSheet.uuid.length === 0
						? 'hero bg-base'
						: 'grid grid-rows-[auto_1fr]'
				}`}
			>
				{/* {JSON.stringify(currentSheet())} */}
				{currentSheet.uuid.length > 0 ? (
					<>
						<SheetDisplay />
						<Sheet sheet={currentSheet} />
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
