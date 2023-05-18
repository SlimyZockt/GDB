import { createSignal } from 'solid-js'
import { Header } from './Header'
import { Sheet } from './Sheet'
import type { Sheet as SheetT } from './stores/data'

let sheet: SheetT

function App() {
    return (
        <div>
            <Header />
            {/* <Sheet sheet={sheet}/> */}
        </div>
    )
}

export default App
