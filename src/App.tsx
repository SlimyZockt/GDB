import { Show, createEffect, createMemo, createSignal, untrack } from 'solid-js'
import { Header } from './Header'
import { Sheet } from './Sheet'
import { sheets, currentSheet, stuff } from './stores/data';
import { Footer } from './Footer'
import { SheetDisplay } from './SheetDisplay';


function App() {

    return (
		<div class="min-h-screen grid grid-rows-[auto_1fr_auto]">
			<Header />
			<div
				class={`bg-base-200 ${
					sheets.length == 0 ? 'hero' : 'grid grid-rows-[auto_1fr]'
				}`}
			>
				{/* {JSON.stringify(currentSheet())} */}
				{currentSheet() !== undefined ? (
					<>
						<SheetDisplay />
						<Sheet sheet={currentSheet()} />
					</>
				) : (
					<p class="text-center text-base text-base-content ">
						no sheet available
					</p>
				)}
			</div>
			<Footer />
		</div>
	);
}

export default App
